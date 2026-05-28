-- ============================================================
-- Migration 013 — Friends + DMs
-- Adapted to existing schema: uses public.users (not profiles) and
-- role='admin' (not is_admin boolean).
-- Safe to re-run.
-- ============================================================
SET search_path = public, extensions;

-- ---- 1. Enum (idempotent via DO block) ----
DO $$ BEGIN
    CREATE TYPE public.friend_status AS ENUM ('pending', 'accepted', 'declined', 'blocked');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ---- 2. Friendships table ----
CREATE TABLE IF NOT EXISTS public.friendships (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requester_id  UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    recipient_id  UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    status        public.friend_status NOT NULL DEFAULT 'pending',
    intro_message TEXT,
    met_context   JSONB,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    responded_at  TIMESTAMPTZ,
    CONSTRAINT no_self_friend CHECK (requester_id <> recipient_id),
    CONSTRAINT friendships_unique_pair UNIQUE (requester_id, recipient_id)
);

CREATE INDEX IF NOT EXISTS idx_friendships_recipient ON public.friendships(recipient_id, status);
CREATE INDEX IF NOT EXISTS idx_friendships_requester ON public.friendships(requester_id, status);

-- ---- 3. DM messages between friends ----
CREATE TABLE IF NOT EXISTS public.dm_messages (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    friendship_id UUID NOT NULL REFERENCES public.friendships(id) ON DELETE CASCADE,
    sender_id     UUID NOT NULL REFERENCES public.users(id),
    content       TEXT NOT NULL,
    reply_to      UUID REFERENCES public.dm_messages(id) ON DELETE SET NULL,
    attachments   JSONB,
    read_at       TIMESTAMPTZ,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dm_messages_friendship_created
    ON public.dm_messages(friendship_id, created_at DESC);

-- Bump last_dm_at on friendship for sorting the list
CREATE OR REPLACE FUNCTION public.bump_friendship_last_message() RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.friendships SET responded_at = NEW.created_at WHERE id = NEW.friendship_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_bump_friendship_last_message ON public.dm_messages;
CREATE TRIGGER trg_bump_friendship_last_message
    AFTER INSERT ON public.dm_messages
    FOR EACH ROW EXECUTE FUNCTION public.bump_friendship_last_message();

-- ---- 4. New users.allow_friend_requests ----
ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS allow_friend_requests BOOLEAN NOT NULL DEFAULT TRUE;

-- ---- 5. RLS ----
ALTER TABLE public.friendships  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dm_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS friendships_select_own ON public.friendships;
CREATE POLICY friendships_select_own ON public.friendships
    FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = recipient_id OR public.is_admin());

DROP POLICY IF EXISTS friendships_insert_own ON public.friendships;
CREATE POLICY friendships_insert_own ON public.friendships
    FOR INSERT WITH CHECK (
        auth.uid() = requester_id
        -- recipient must allow friend requests OR be an admin
        AND EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = recipient_id
              AND (u.allow_friend_requests = TRUE OR u.role = 'admin')
        )
        -- requester not banned
        AND NOT EXISTS (
            SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.is_banned = TRUE
        )
        -- max 10 pending outgoing requests
        AND (
            SELECT COUNT(*) FROM public.friendships
            WHERE requester_id = auth.uid() AND status = 'pending'
        ) < 10
        -- 7-day cooldown after a decline
        AND NOT EXISTS (
            SELECT 1 FROM public.friendships f
            WHERE f.requester_id = auth.uid()
              AND f.recipient_id = friendships.recipient_id
              AND f.status = 'declined'
              AND f.responded_at > NOW() - INTERVAL '7 days'
        )
    );

DROP POLICY IF EXISTS friendships_update_recipient ON public.friendships;
CREATE POLICY friendships_update_recipient ON public.friendships
    FOR UPDATE USING (auth.uid() = recipient_id AND status = 'pending');

DROP POLICY IF EXISTS friendships_delete_own ON public.friendships;
CREATE POLICY friendships_delete_own ON public.friendships
    FOR DELETE USING (auth.uid() = requester_id AND status = 'pending');
    -- requesters can cancel their own pending requests; accepted friendships
    -- can be removed via an "unfriend" RPC if you want (not implemented here)

DROP POLICY IF EXISTS dm_select_friends ON public.dm_messages;
CREATE POLICY dm_select_friends ON public.dm_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.friendships f
            WHERE f.id = friendship_id
              AND f.status = 'accepted'
              AND (auth.uid() = f.requester_id OR auth.uid() = f.recipient_id)
        )
    );

DROP POLICY IF EXISTS dm_insert_friends ON public.dm_messages;
CREATE POLICY dm_insert_friends ON public.dm_messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id
        AND NOT EXISTS (
            SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.is_banned = TRUE
        )
        AND EXISTS (
            SELECT 1 FROM public.friendships f
            WHERE f.id = friendship_id
              AND f.status = 'accepted'
              AND (auth.uid() = f.requester_id OR auth.uid() = f.recipient_id)
        )
    );

DROP POLICY IF EXISTS dm_update_read ON public.dm_messages;
CREATE POLICY dm_update_read ON public.dm_messages
    FOR UPDATE USING (
        sender_id <> auth.uid()  -- only the receiver can mark as read
        AND EXISTS (
            SELECT 1 FROM public.friendships f
            WHERE f.id = friendship_id
              AND (auth.uid() = f.requester_id OR auth.uid() = f.recipient_id)
        )
    );

-- ---- 6. Auto-friend admins on new user row ----
CREATE OR REPLACE FUNCTION public.auto_friend_admins() RETURNS TRIGGER AS $$
BEGIN
    -- New non-admin gets friended to every admin (admin = requester for tidy initiating side)
    IF NEW.role <> 'admin' THEN
        INSERT INTO public.friendships (requester_id, recipient_id, status, met_context, responded_at)
        SELECT a.id, NEW.id, 'accepted',
               jsonb_build_object('kind', 'system', 'note', 'auto-friended on signup'),
               NOW()
        FROM public.users a
        WHERE a.role = 'admin' AND a.id <> NEW.id
        ON CONFLICT (requester_id, recipient_id) DO NOTHING;
    ELSE
        -- New admin gets friended to every existing student
        INSERT INTO public.friendships (requester_id, recipient_id, status, met_context, responded_at)
        SELECT NEW.id, s.id, 'accepted',
               jsonb_build_object('kind', 'system', 'note', 'auto-friended on admin promotion'),
               NOW()
        FROM public.users s
        WHERE s.role <> 'admin' AND s.id <> NEW.id
        ON CONFLICT (requester_id, recipient_id) DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_auto_friend_admins ON public.users;
CREATE TRIGGER trg_auto_friend_admins
    AFTER INSERT ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.auto_friend_admins();

-- ---- 7. Backfill: pair every existing admin with every existing student ----
INSERT INTO public.friendships (requester_id, recipient_id, status, met_context, responded_at)
SELECT a.id, s.id, 'accepted',
       jsonb_build_object('kind', 'system', 'note', 'auto-friended (backfill)'),
       NOW()
FROM public.users a
CROSS JOIN public.users s
WHERE a.role = 'admin' AND s.role <> 'admin' AND a.id <> s.id
ON CONFLICT (requester_id, recipient_id) DO NOTHING;

-- ---- 8. View: friend list with last DM preview + unread count ----
CREATE OR REPLACE VIEW public.v_my_friends AS
SELECT
    f.id AS friendship_id,
    f.status,
    f.created_at,
    f.responded_at,
    f.intro_message,
    f.met_context,
    -- "the other person" relative to the viewer
    CASE WHEN f.requester_id = auth.uid() THEN f.recipient_id ELSE f.requester_id END AS peer_id,
    u.anon_name AS peer_handle,
    u.role AS peer_role,
    u.avatar_url AS peer_avatar,
    CASE WHEN f.requester_id = auth.uid() THEN 'outgoing' ELSE 'incoming' END AS direction,
    -- last message
    (SELECT content FROM public.dm_messages m
     WHERE m.friendship_id = f.id ORDER BY m.created_at DESC LIMIT 1) AS last_message,
    (SELECT created_at FROM public.dm_messages m
     WHERE m.friendship_id = f.id ORDER BY m.created_at DESC LIMIT 1) AS last_message_at,
    -- unread count (messages from peer with no read_at)
    (SELECT COUNT(*)::INT FROM public.dm_messages m
     WHERE m.friendship_id = f.id
       AND m.sender_id <> auth.uid()
       AND m.read_at IS NULL) AS unread_count
FROM public.friendships f
JOIN public.users u ON u.id = CASE WHEN f.requester_id = auth.uid() THEN f.recipient_id ELSE f.requester_id END
WHERE auth.uid() = f.requester_id OR auth.uid() = f.recipient_id;

GRANT SELECT ON public.v_my_friends TO authenticated;

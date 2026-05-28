-- ============================================================
-- Migration 014 — Feed + Communities (WhatsApp-style hubs)
-- ============================================================
-- Goals:
--   • Preserve ALL existing community_rooms and chats (community_id stays NULL)
--   • Add a new `communities` parent layer that GROUPS rooms (Discord-style)
--   • Add `posts` (Reddit-style) scoped to topic OR room
--   • Add `comments`, post_votes, comment_votes, poll_options, poll_votes
--   • Make every change additive + idempotent — safe to re-run.
-- ============================================================
SET search_path = public, extensions;

-- ============== 1) COMMUNITIES ==============
CREATE TABLE IF NOT EXISTS public.communities (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug          TEXT UNIQUE NOT NULL,
    name          TEXT NOT NULL,
    description   TEXT,
    emoji         TEXT DEFAULT '👥',
    banner_color  TEXT DEFAULT '#00D09C',
    visibility    TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'invite_only')),
    verified      BOOLEAN DEFAULT FALSE,
    owner_id      UUID NOT NULL REFERENCES public.users(id),
    member_count  INT DEFAULT 0,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_communities_visibility ON public.communities(visibility);
CREATE INDEX IF NOT EXISTS idx_communities_owner      ON public.communities(owner_id);


-- ============== 2) ATTACH ROOMS TO COMMUNITIES (additive only) ==============
-- Existing rooms keep community_id = NULL → they remain "standalone" and visible
-- exactly as they did before this migration. NEW rooms can be nested under a community.
ALTER TABLE public.community_rooms
    ADD COLUMN IF NOT EXISTS community_id     UUID REFERENCES public.communities(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS is_announcements BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS sort_order       INT DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_rooms_community ON public.community_rooms(community_id);

-- Replace the global unique(slug) with two partial uniques:
--   • Standalone rooms (community_id IS NULL): slug must be globally unique
--   • Nested rooms: slug must be unique WITHIN a community
DO $$
DECLARE
    cname TEXT;
BEGIN
    -- Drop any pre-existing unique constraint on community_rooms.slug regardless of its name
    FOR cname IN
        SELECT conname FROM pg_constraint
        WHERE conrelid = 'public.community_rooms'::regclass
          AND contype = 'u'
          AND pg_get_constraintdef(oid) ILIKE '%(slug)%'
    LOOP
        EXECUTE format('ALTER TABLE public.community_rooms DROP CONSTRAINT %I', cname);
    END LOOP;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_room_in_community
    ON public.community_rooms(community_id, slug)
    WHERE community_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uniq_standalone_room_slug
    ON public.community_rooms(slug)
    WHERE community_id IS NULL;


-- ============== 3) COMMUNITY MEMBERS ==============
CREATE TABLE IF NOT EXISTS public.community_members (
    community_id      UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
    user_id           UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    role              TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'mod', 'member')),
    joined_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notification_pref TEXT DEFAULT 'mentions' CHECK (notification_pref IN ('all', 'mentions', 'none')),
    PRIMARY KEY (community_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_members_user ON public.community_members(user_id);


-- ============== 4) POSTS (Reddit-style) ==============
DO $$ BEGIN
    CREATE TYPE public.post_kind AS ENUM ('discussion', 'poll');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.posts (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kind          public.post_kind NOT NULL DEFAULT 'discussion',
    author_id     UUID NOT NULL REFERENCES public.users(id),
    topic_id      UUID REFERENCES public.topics(id) ON DELETE CASCADE,
    room_id       UUID REFERENCES public.community_rooms(id) ON DELETE CASCADE,
    title         TEXT NOT NULL,
    body          TEXT,
    is_pinned     BOOLEAN DEFAULT FALSE,
    is_locked     BOOLEAN DEFAULT FALSE,
    is_deleted    BOOLEAN DEFAULT FALSE,
    comment_count INT DEFAULT 0,
    upvote_count  INT DEFAULT 0,
    hot_score     NUMERIC DEFAULT 0,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT exactly_one_scope CHECK (
        (topic_id IS NOT NULL AND room_id IS NULL) OR
        (topic_id IS NULL AND room_id IS NOT NULL)
    )
);
CREATE INDEX IF NOT EXISTS idx_posts_topic_created ON public.posts(topic_id, created_at DESC) WHERE topic_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_posts_room_created  ON public.posts(room_id, created_at DESC)  WHERE room_id  IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_posts_upvote        ON public.posts(upvote_count DESC);
CREATE INDEX IF NOT EXISTS idx_posts_author        ON public.posts(author_id);


-- ============== 5) POLLS (schema only — UI deferred) ==============
CREATE TABLE IF NOT EXISTS public.poll_options (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id    UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    label      TEXT NOT NULL,
    sort_order INT DEFAULT 0,
    vote_count INT DEFAULT 0
);
CREATE TABLE IF NOT EXISTS public.poll_votes (
    post_id   UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    option_id UUID REFERENCES public.poll_options(id) ON DELETE CASCADE,
    user_id   UUID REFERENCES public.users(id) ON DELETE CASCADE,
    voted_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (post_id, user_id)
);


-- ============== 6) VOTES ==============
CREATE TABLE IF NOT EXISTS public.post_votes (
    post_id  UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id  UUID REFERENCES public.users(id) ON DELETE CASCADE,
    value    SMALLINT NOT NULL CHECK (value IN (-1, 0, 1)),
    voted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (post_id, user_id)
);


-- ============== 7) COMMENTS ==============
CREATE TABLE IF NOT EXISTS public.comments (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id      UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    parent_id    UUID REFERENCES public.comments(id) ON DELETE CASCADE,
    author_id    UUID NOT NULL REFERENCES public.users(id),
    body         TEXT NOT NULL,
    upvote_count INT DEFAULT 0,
    is_deleted   BOOLEAN DEFAULT FALSE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_comments_post_created ON public.comments(post_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.comment_votes (
    comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
    user_id    UUID REFERENCES public.users(id) ON DELETE CASCADE,
    value      SMALLINT NOT NULL CHECK (value IN (-1, 0, 1)),
    voted_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (comment_id, user_id)
);


-- ============== 8) TRIGGERS ==============

-- 8a. On community insert → auto-create #announcements + #general rooms, owner as 'owner' member
CREATE OR REPLACE FUNCTION public.create_default_community_rooms() RETURNS TRIGGER AS $$
DECLARE
    has_emoji      BOOLEAN := FALSE;
    has_color      BOOLEAN := FALSE;
    has_status     BOOLEAN := FALSE;
    has_is_active  BOOLEAN := FALSE;
    has_created_by BOOLEAN := FALSE;
BEGIN
    -- Determine which optional columns exist on community_rooms (defensive — some legacy installs may differ)
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='community_rooms' AND column_name='emoji')      INTO has_emoji;
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='community_rooms' AND column_name='color')      INTO has_color;
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='community_rooms' AND column_name='status')     INTO has_status;
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='community_rooms' AND column_name='is_active')  INTO has_is_active;
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='community_rooms' AND column_name='created_by') INTO has_created_by;

    INSERT INTO public.community_members (community_id, user_id, role)
    VALUES (NEW.id, NEW.owner_id, 'owner')
    ON CONFLICT (community_id, user_id) DO NOTHING;

    -- Insert #announcements
    EXECUTE format(
        'INSERT INTO public.community_rooms (community_id, slug, name, is_announcements, sort_order%s%s%s%s) VALUES ($1, $2, $3, TRUE, 0%s%s%s%s) ON CONFLICT DO NOTHING',
        CASE WHEN has_emoji      THEN ', emoji'      ELSE '' END,
        CASE WHEN has_color      THEN ', color'      ELSE '' END,
        CASE WHEN has_status     THEN ', status'     ELSE '' END,
        CASE WHEN has_is_active  THEN ', is_active'  ELSE '' END,
        CASE WHEN has_emoji      THEN ', ''📣'''      ELSE '' END,
        CASE WHEN has_color      THEN format(', %L', NEW.banner_color) ELSE '' END,
        CASE WHEN has_status     THEN ', ''approved''' ELSE '' END,
        CASE WHEN has_is_active  THEN ', TRUE'        ELSE '' END
    ) USING NEW.id, 'announcements', '📣 Announcements';

    -- Insert #general
    EXECUTE format(
        'INSERT INTO public.community_rooms (community_id, slug, name, is_announcements, sort_order%s%s%s%s) VALUES ($1, $2, $3, FALSE, 1%s%s%s%s) ON CONFLICT DO NOTHING',
        CASE WHEN has_emoji      THEN ', emoji'      ELSE '' END,
        CASE WHEN has_color      THEN ', color'      ELSE '' END,
        CASE WHEN has_status     THEN ', status'     ELSE '' END,
        CASE WHEN has_is_active  THEN ', is_active'  ELSE '' END,
        CASE WHEN has_emoji      THEN ', ''💬'''      ELSE '' END,
        CASE WHEN has_color      THEN format(', %L', NEW.banner_color) ELSE '' END,
        CASE WHEN has_status     THEN ', ''approved''' ELSE '' END,
        CASE WHEN has_is_active  THEN ', TRUE'        ELSE '' END
    ) USING NEW.id, 'general', '#general';

    -- Set created_by where supported (separate UPDATE to keep INSERT format simple)
    IF has_created_by THEN
        UPDATE public.community_rooms SET created_by = NEW.owner_id
        WHERE community_id = NEW.id AND created_by IS NULL;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_create_default_community_rooms ON public.communities;
CREATE TRIGGER trg_create_default_community_rooms
    AFTER INSERT ON public.communities
    FOR EACH ROW EXECUTE FUNCTION public.create_default_community_rooms();

-- 8b. Maintain communities.member_count from community_members
CREATE OR REPLACE FUNCTION public.bump_community_member_count() RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.communities SET member_count = member_count + 1 WHERE id = NEW.community_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.communities SET member_count = GREATEST(0, member_count - 1) WHERE id = OLD.community_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_bump_member_count_ins ON public.community_members;
CREATE TRIGGER trg_bump_member_count_ins
    AFTER INSERT ON public.community_members
    FOR EACH ROW EXECUTE FUNCTION public.bump_community_member_count();

DROP TRIGGER IF EXISTS trg_bump_member_count_del ON public.community_members;
CREATE TRIGGER trg_bump_member_count_del
    AFTER DELETE ON public.community_members
    FOR EACH ROW EXECUTE FUNCTION public.bump_community_member_count();

-- 8c. Maintain posts.comment_count
CREATE OR REPLACE FUNCTION public.bump_post_comment_count() RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.posts SET comment_count = comment_count + 1, updated_at = NOW()
        WHERE id = NEW.post_id;
    ELSIF TG_OP = 'UPDATE' AND OLD.is_deleted = FALSE AND NEW.is_deleted = TRUE THEN
        UPDATE public.posts SET comment_count = GREATEST(0, comment_count - 1)
        WHERE id = NEW.post_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_bump_comment_count ON public.comments;
CREATE TRIGGER trg_bump_comment_count
    AFTER INSERT OR UPDATE OF is_deleted ON public.comments
    FOR EACH ROW EXECUTE FUNCTION public.bump_post_comment_count();

-- 8d. Recompute upvote_count on posts + comments from votes
CREATE OR REPLACE FUNCTION public.recompute_post_upvotes(p_post_id UUID) RETURNS VOID AS $$
BEGIN
    UPDATE public.posts
    SET upvote_count = COALESCE((SELECT SUM(value)::INT FROM public.post_votes WHERE post_id = p_post_id), 0)
    WHERE id = p_post_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.handle_post_vote() RETURNS TRIGGER AS $$
BEGIN
    PERFORM public.recompute_post_upvotes(COALESCE(NEW.post_id, OLD.post_id));
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_post_vote ON public.post_votes;
CREATE TRIGGER trg_post_vote
    AFTER INSERT OR UPDATE OR DELETE ON public.post_votes
    FOR EACH ROW EXECUTE FUNCTION public.handle_post_vote();

CREATE OR REPLACE FUNCTION public.recompute_comment_upvotes(p_comment_id UUID) RETURNS VOID AS $$
BEGIN
    UPDATE public.comments
    SET upvote_count = COALESCE((SELECT SUM(value)::INT FROM public.comment_votes WHERE comment_id = p_comment_id), 0)
    WHERE id = p_comment_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.handle_comment_vote() RETURNS TRIGGER AS $$
BEGIN
    PERFORM public.recompute_comment_upvotes(COALESCE(NEW.comment_id, OLD.comment_id));
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_comment_vote ON public.comment_votes;
CREATE TRIGGER trg_comment_vote
    AFTER INSERT OR UPDATE OR DELETE ON public.comment_votes
    FOR EACH ROW EXECUTE FUNCTION public.handle_comment_vote();


-- ============== 9) RLS ==============
ALTER TABLE public.communities       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_votes        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_votes     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_options      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_votes        ENABLE ROW LEVEL SECURITY;

-- Communities: anyone reads public; members read invite_only; admins read everything
DROP POLICY IF EXISTS communities_read ON public.communities;
CREATE POLICY communities_read ON public.communities FOR SELECT USING (
    visibility = 'public' OR
    EXISTS (SELECT 1 FROM public.community_members m WHERE m.community_id = communities.id AND m.user_id = auth.uid()) OR
    public.is_admin()
);
DROP POLICY IF EXISTS communities_insert ON public.communities;
CREATE POLICY communities_insert ON public.communities FOR INSERT WITH CHECK (
    auth.uid() = owner_id AND
    NOT EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.is_banned = TRUE)
);
DROP POLICY IF EXISTS communities_update_owner ON public.communities;
CREATE POLICY communities_update_owner ON public.communities FOR UPDATE USING (
    auth.uid() = owner_id OR public.is_admin()
);

-- Members: read if member of THAT community OR community is public; insert self; delete self (non-owner)
DROP POLICY IF EXISTS community_members_read ON public.community_members;
CREATE POLICY community_members_read ON public.community_members FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.community_members m WHERE m.community_id = community_members.community_id AND m.user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.communities c WHERE c.id = community_members.community_id AND c.visibility = 'public') OR
    public.is_admin()
);
DROP POLICY IF EXISTS community_members_join ON public.community_members;
CREATE POLICY community_members_join ON public.community_members FOR INSERT WITH CHECK (
    user_id = auth.uid() AND role = 'member' AND
    EXISTS (SELECT 1 FROM public.communities c WHERE c.id = community_id AND c.visibility = 'public')
);
DROP POLICY IF EXISTS community_members_leave ON public.community_members;
CREATE POLICY community_members_leave ON public.community_members FOR DELETE USING (
    user_id = auth.uid() AND role <> 'owner'
);

-- Posts: read undeleted topic posts; room posts only if standalone OR community-public OR member
DROP POLICY IF EXISTS posts_read ON public.posts;
CREATE POLICY posts_read ON public.posts FOR SELECT USING (
    NOT is_deleted AND (
        topic_id IS NOT NULL OR
        (room_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.community_rooms r
            LEFT JOIN public.communities c ON c.id = r.community_id
            WHERE r.id = posts.room_id
              AND (
                r.community_id IS NULL
                OR c.visibility = 'public'
                OR EXISTS (SELECT 1 FROM public.community_members m
                           WHERE m.community_id = c.id AND m.user_id = auth.uid())
              )
        ))
    )
);

DROP POLICY IF EXISTS posts_insert ON public.posts;
CREATE POLICY posts_insert ON public.posts FOR INSERT WITH CHECK (
    auth.uid() = author_id
    AND NOT EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.is_banned = TRUE)
    AND (
        topic_id IS NOT NULL
        OR (room_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.community_rooms r
            WHERE r.id = posts.room_id AND (
                r.community_id IS NULL
                OR EXISTS (
                    SELECT 1 FROM public.community_members m
                    WHERE m.community_id = r.community_id AND m.user_id = auth.uid()
                      AND (NOT r.is_announcements OR m.role IN ('owner', 'mod'))
                )
            )
        ))
    )
);

DROP POLICY IF EXISTS posts_update_own ON public.posts;
CREATE POLICY posts_update_own ON public.posts FOR UPDATE USING (
    auth.uid() = author_id OR public.is_admin()
);

DROP POLICY IF EXISTS post_votes_all ON public.post_votes;
CREATE POLICY post_votes_all ON public.post_votes FOR ALL USING (
    user_id = auth.uid()
) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS comments_read ON public.comments;
CREATE POLICY comments_read ON public.comments FOR SELECT USING (
    NOT is_deleted AND EXISTS (
        SELECT 1 FROM public.posts p WHERE p.id = comments.post_id AND NOT p.is_deleted
    )
);
DROP POLICY IF EXISTS comments_insert ON public.comments;
CREATE POLICY comments_insert ON public.comments FOR INSERT WITH CHECK (
    auth.uid() = author_id
    AND NOT EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.is_banned = TRUE)
    AND EXISTS (SELECT 1 FROM public.posts p WHERE p.id = comments.post_id AND NOT p.is_locked AND NOT p.is_deleted)
);
DROP POLICY IF EXISTS comments_update_own ON public.comments;
CREATE POLICY comments_update_own ON public.comments FOR UPDATE USING (
    auth.uid() = author_id OR public.is_admin()
);

DROP POLICY IF EXISTS comment_votes_all ON public.comment_votes;
CREATE POLICY comment_votes_all ON public.comment_votes FOR ALL USING (
    user_id = auth.uid()
) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS poll_options_read ON public.poll_options;
CREATE POLICY poll_options_read ON public.poll_options FOR SELECT USING (true);

DROP POLICY IF EXISTS poll_votes_all ON public.poll_votes;
CREATE POLICY poll_votes_all ON public.poll_votes FOR ALL USING (
    user_id = auth.uid()
) WITH CHECK (user_id = auth.uid());


-- ============== 10) VIEWS ==============

-- Feed posts with author + topic + community + my_vote
DROP VIEW IF EXISTS public.v_feed_posts;
CREATE VIEW public.v_feed_posts AS
SELECT
    p.id,
    p.kind,
    p.title,
    p.body,
    p.author_id,
    u.anon_name AS author_handle,
    u.role AS author_role,
    p.topic_id,
    t.slug AS topic_slug,
    t.label AS topic_label,
    t.color AS topic_color,
    p.room_id,
    r.slug AS room_slug,
    r.name AS room_name,
    r.community_id,
    c.slug AS community_slug,
    c.name AS community_name,
    p.is_pinned,
    p.is_locked,
    p.comment_count,
    p.upvote_count,
    p.created_at,
    p.updated_at,
    COALESCE((SELECT value FROM public.post_votes pv WHERE pv.post_id = p.id AND pv.user_id = auth.uid()), 0) AS my_vote
FROM public.posts p
LEFT JOIN public.users u  ON u.id = p.author_id
LEFT JOIN public.topics t ON t.id = p.topic_id
LEFT JOIN public.community_rooms r ON r.id = p.room_id
LEFT JOIN public.communities c     ON c.id = r.community_id
WHERE p.is_deleted = FALSE;

GRANT SELECT ON public.v_feed_posts TO authenticated;

-- Communities I'm in
DROP VIEW IF EXISTS public.v_my_communities;
CREATE VIEW public.v_my_communities AS
SELECT
    c.id, c.slug, c.name, c.description, c.emoji, c.banner_color,
    c.visibility, c.verified, c.member_count, c.created_at,
    m.role AS my_role,
    m.joined_at
FROM public.communities c
JOIN public.community_members m ON m.community_id = c.id
WHERE m.user_id = auth.uid();

GRANT SELECT ON public.v_my_communities TO authenticated;


-- ============== 11) REALTIME ==============
-- Make feed surfaces live without extra round-trips
DO $$
BEGIN
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;         EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;      EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.post_votes;    EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.comment_votes; EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.communities;   EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

-- ============================================================
-- Migration 006 — Admin moderation powers (pin, ban, deactivate)
-- Safe to re-run.
-- ============================================================
SET search_path = public, extensions;

-- Pin messages
ALTER TABLE public.community_messages
    ADD COLUMN IF NOT EXISTS is_pinned    BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS pinned_at    TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS pinned_by    UUID REFERENCES public.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_comm_msgs_pinned
    ON public.community_messages(room_id, is_pinned)
    WHERE is_pinned = TRUE AND is_deleted = FALSE;

-- Track WHO deleted a message
ALTER TABLE public.community_messages
    ADD COLUMN IF NOT EXISTS deleted_at  TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS deleted_by  UUID REFERENCES public.users(id) ON DELETE SET NULL;

-- ============================================================
-- Audit trail for admin moderation actions
-- ============================================================
CREATE TABLE IF NOT EXISTS public.moderation_actions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id        UUID NOT NULL REFERENCES public.users(id),
    action          VARCHAR(40) NOT NULL,
        -- e.g. 'pin_message', 'unpin_message', 'delete_message',
        --      'ban_user', 'unban_user', 'deactivate_room', 'reactivate_room'
    target_user_id  UUID REFERENCES public.users(id) ON DELETE SET NULL,
    target_room_id  UUID REFERENCES public.community_rooms(id) ON DELETE SET NULL,
    target_message_id UUID,
    reason          TEXT,
    metadata        JSONB,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_modactions_actor ON public.moderation_actions(actor_id);
CREATE INDEX IF NOT EXISTS idx_modactions_user  ON public.moderation_actions(target_user_id);
CREATE INDEX IF NOT EXISTS idx_modactions_room  ON public.moderation_actions(target_room_id);
CREATE INDEX IF NOT EXISTS idx_modactions_date  ON public.moderation_actions(created_at DESC);

ALTER TABLE public.moderation_actions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS modactions_admin_select ON public.moderation_actions;
CREATE POLICY modactions_admin_select ON public.moderation_actions
    FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS modactions_admin_insert ON public.moderation_actions;
CREATE POLICY modactions_admin_insert ON public.moderation_actions
    FOR INSERT WITH CHECK (public.is_admin() AND actor_id = auth.uid());

-- ============================================================
-- Update RLS on community_messages so admins can UPDATE
-- (pin, unpin, soft-delete) — existing msgs_comm_admin_update covers this
-- but we make it explicit and also block banned users from inserting.
-- ============================================================
DROP POLICY IF EXISTS msgs_comm_insert ON public.community_messages;
CREATE POLICY msgs_comm_insert ON public.community_messages
    FOR INSERT WITH CHECK (
        user_id = auth.uid()
        AND NOT EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND is_banned = TRUE
        )
    );

-- Banned users also can't send 1-on-1 chat reports / etc.
-- (Existing reports policy is fine — reports are how we report banned behavior.)

-- ============================================================
-- Update RLS on community_rooms to allow admins to deactivate
-- ============================================================
-- rooms_admin_update from migration 005 already allows ALL updates by admins.
-- No change needed here.

-- ============================================================
-- View: pinned messages per room (helper for room detail page)
-- ============================================================
CREATE OR REPLACE VIEW public.v_pinned_messages AS
SELECT id, room_id, user_id, handle, body, is_pinned, pinned_at, pinned_by, created_at
FROM public.community_messages
WHERE is_pinned = TRUE AND is_deleted = FALSE
ORDER BY pinned_at DESC;

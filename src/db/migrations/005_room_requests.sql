-- ============================================================
-- Migration 005 — Student-created rooms with admin approval
-- Safe to re-run.
-- ============================================================
SET search_path = public, extensions;

-- Add request fields to community_rooms
ALTER TABLE public.community_rooms
    ADD COLUMN IF NOT EXISTS created_by   UUID REFERENCES public.users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS status       VARCHAR(20) NOT NULL DEFAULT 'approved'
        CHECK (status IN ('pending', 'approved', 'rejected')),
    ADD COLUMN IF NOT EXISTS requested_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS reviewed_at  TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS reviewed_by  UUID REFERENCES public.users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS reject_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_rooms_status ON public.community_rooms(status);
CREATE INDEX IF NOT EXISTS idx_rooms_created_by ON public.community_rooms(created_by);

-- Make sure the 6 seeded rooms stay approved (in case they got defaulted weird)
UPDATE public.community_rooms SET status = 'approved' WHERE status IS NULL;

-- ============================================================
-- RLS: allow any authenticated user to insert a 'pending' room,
-- but only admins can update status / approve / reject.
-- ============================================================
DROP POLICY IF EXISTS rooms_select ON public.community_rooms;
CREATE POLICY rooms_select ON public.community_rooms
    FOR SELECT USING (
        auth.uid() IS NOT NULL AND (
            status = 'approved'
            OR created_by = auth.uid()
            OR public.is_admin()
        )
    );

DROP POLICY IF EXISTS rooms_insert_own ON public.community_rooms;
CREATE POLICY rooms_insert_own ON public.community_rooms
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL
        AND created_by = auth.uid()
        AND status = 'pending'  -- non-admins can only create pending requests
    );

DROP POLICY IF EXISTS rooms_admin_update ON public.community_rooms;
CREATE POLICY rooms_admin_update ON public.community_rooms
    FOR UPDATE USING (public.is_admin());

-- ============================================================
-- Rebuild v_room_stats to only count approved rooms
-- (and exclude pending/rejected from public discovery)
-- Must DROP first because we're changing the column shape.
-- ============================================================
DROP VIEW IF EXISTS public.v_room_stats;
CREATE VIEW public.v_room_stats AS
SELECT
    r.id,
    r.slug,
    r.name,
    r.description,
    r.emoji,
    r.color,
    r.tagline,
    r.host_alias,
    r.is_active,
    r.status,
    r.created_by,
    (SELECT COUNT(DISTINCT user_id) FROM public.community_messages
     WHERE room_id = r.id AND created_at > NOW() - INTERVAL '30 minutes') AS active_count,
    (SELECT COUNT(DISTINCT user_id) FROM public.community_handles
     WHERE room_id = r.id) AS member_count,
    (SELECT created_at FROM public.community_messages
     WHERE room_id = r.id AND is_deleted = FALSE
     ORDER BY created_at DESC LIMIT 1) AS last_message_at
FROM public.community_rooms r
WHERE r.is_active = TRUE AND r.status = 'approved'
ORDER BY active_count DESC, r.created_at ASC;

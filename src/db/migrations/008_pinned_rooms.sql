-- ============================================================
-- Migration 008 — Pinned rooms (admin can pin to top)
-- Safe to re-run.
--
-- NOTE: Supabase SQL Editor wraps each "Run" in a transaction. If any
-- statement below errors, EVERYTHING in this file rolls back. The view
-- DROP/CREATE is the most likely to fail (column reshape). Run each
-- section independently if you hit issues.
-- ============================================================
SET search_path = public, extensions;

-- ---- 1. Add columns (safe) ----
ALTER TABLE public.community_rooms
    ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS pinned_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS pinned_by UUID REFERENCES public.users(id) ON DELETE SET NULL;

-- ---- 2. RLS: allow admin direct-create (do this FIRST so even if the view
--           rebuild below fails, the policy is already updated) ----
DROP POLICY IF EXISTS rooms_insert_own ON public.community_rooms;
CREATE POLICY rooms_insert_own ON public.community_rooms
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL
        AND created_by = auth.uid()
        AND (
            status = 'pending'      -- regular users: pending only
            OR public.is_admin()    -- admins: any status (typically 'approved')
        )
    );

CREATE INDEX IF NOT EXISTS idx_rooms_is_pinned
    ON public.community_rooms(is_pinned)
    WHERE is_pinned = TRUE;

-- Drop and rebuild v_room_stats (column shape change)
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
    r.is_pinned,
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
ORDER BY r.is_pinned DESC, active_count DESC, r.created_at ASC;

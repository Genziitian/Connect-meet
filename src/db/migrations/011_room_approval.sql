-- ============================================================
-- Migration 011 — Room approval-to-join + report-room policy
-- Safe to re-run.
-- ============================================================
SET search_path = public, extensions;

-- ---- 1. Flag on rooms: does joining require admin approval? ----
ALTER TABLE public.community_rooms
    ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN NOT NULL DEFAULT FALSE;

-- ---- 2. Join requests table ----
CREATE TABLE IF NOT EXISTS public.community_join_requests (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id        UUID NOT NULL REFERENCES public.community_rooms(id) ON DELETE CASCADE,
    user_id        UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    status         VARCHAR(20) NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending', 'approved', 'rejected')),
    message        TEXT,
    requested_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    reviewed_at    TIMESTAMP WITH TIME ZONE,
    reviewed_by    UUID REFERENCES public.users(id) ON DELETE SET NULL,
    reject_reason  TEXT,
    UNIQUE (room_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_join_requests_room   ON public.community_join_requests(room_id);
CREATE INDEX IF NOT EXISTS idx_join_requests_user   ON public.community_join_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_join_requests_status ON public.community_join_requests(status);

ALTER TABLE public.community_join_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS join_req_select_own ON public.community_join_requests;
CREATE POLICY join_req_select_own ON public.community_join_requests
    FOR SELECT USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS join_req_insert_own ON public.community_join_requests;
CREATE POLICY join_req_insert_own ON public.community_join_requests
    FOR INSERT WITH CHECK (user_id = auth.uid() AND status = 'pending');

DROP POLICY IF EXISTS join_req_admin_update ON public.community_join_requests;
CREATE POLICY join_req_admin_update ON public.community_join_requests
    FOR UPDATE USING (public.is_admin());

-- ---- 3. Modify assign_room_handle to refuse if room needs approval + no approved request ----
CREATE OR REPLACE FUNCTION public.assign_room_handle(p_user_id UUID, p_room_id UUID)
RETURNS VARCHAR(40) AS $$
DECLARE
    existing      VARCHAR(40);
    candidate     VARCHAR(40);
    adjective     TEXT;
    num           INT;
    attempts      INT := 0;
    needs_approval BOOLEAN;
    is_approved   BOOLEAN;
BEGIN
    -- already in this room? return existing handle
    SELECT handle INTO existing
    FROM public.community_handles
    WHERE user_id = p_user_id AND room_id = p_room_id;

    IF existing IS NOT NULL THEN
        RETURN existing;
    END IF;

    -- Check if room requires approval
    SELECT requires_approval INTO needs_approval
    FROM public.community_rooms WHERE id = p_room_id;

    IF needs_approval THEN
        -- Allow only if approved request exists, OR caller is admin
        SELECT EXISTS (
            SELECT 1 FROM public.community_join_requests
            WHERE room_id = p_room_id AND user_id = p_user_id AND status = 'approved'
        ) OR EXISTS (
            SELECT 1 FROM public.users WHERE id = p_user_id AND role = 'admin'
        ) INTO is_approved;

        IF NOT is_approved THEN
            RAISE EXCEPTION 'APPROVAL_REQUIRED' USING ERRCODE = 'P0001';
        END IF;
    END IF;

    -- Generate a unique random handle
    LOOP
        adjective := (ARRAY[
            'Vortex','Pixel','Kismet','Raven','Marigold','Lumen','Nova','Tide',
            'Echo','Cipher','Drift','Sable','Onyx','Aero','Lyric','Phase','Quill',
            'Riff','Sage','Cleric','Mosaic','Glint','Halo','Vesper'
        ])[floor(random() * 24 + 1)];
        num := floor(random() * 99 + 1)::INT;
        candidate := adjective || '-' || lpad(num::text, 2, '0');

        BEGIN
            INSERT INTO public.community_handles (user_id, room_id, handle)
            VALUES (p_user_id, p_room_id, candidate);
            RETURN candidate;
        EXCEPTION
            WHEN unique_violation THEN
                attempts := attempts + 1;
                EXIT WHEN attempts > 10;
        END;
    END LOOP;

    -- Fallback
    candidate := 'Anon-' || substr(md5(random()::text), 1, 4);
    INSERT INTO public.community_handles (user_id, room_id, handle)
    VALUES (p_user_id, p_room_id, candidate);
    RETURN candidate;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ---- 4. Allow regular users to log a "report_room" action ----
DROP POLICY IF EXISTS modactions_user_report ON public.moderation_actions;
CREATE POLICY modactions_user_report ON public.moderation_actions
    FOR INSERT WITH CHECK (
        actor_id = auth.uid()
        AND action IN ('report_room', 'report_message')
    );

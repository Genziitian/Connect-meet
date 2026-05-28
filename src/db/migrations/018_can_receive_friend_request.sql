-- ============================================================
-- Migration 018 — can_receive_friend_request(uuid) helper
-- ============================================================
-- The friendships_insert RLS policy refuses generically, so the client
-- can't distinguish "recipient turned requests off" from the other
-- reject reasons. This SECURITY DEFINER function lets the client probe
-- only the one boolean field without exposing the whole users row.
-- Safe to re-run.
-- ============================================================
SET search_path = public, extensions;

CREATE OR REPLACE FUNCTION public.can_receive_friend_request(p_user_id UUID) RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER STABLE AS $$
    SELECT COALESCE(
        (SELECT (u.allow_friend_requests = TRUE OR u.role = 'admin')
         FROM public.users u
         WHERE u.id = p_user_id),
        FALSE
    );
$$;

GRANT EXECUTE ON FUNCTION public.can_receive_friend_request(UUID) TO authenticated;

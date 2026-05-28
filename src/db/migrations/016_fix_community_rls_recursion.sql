-- ============================================================
-- Migration 016 — Fix infinite recursion in community_members RLS
-- ============================================================
-- Bug: community_members_read had `EXISTS (SELECT FROM community_members ...)`
-- inside its USING clause. Postgres applies RLS on the inner query too, so the
-- same policy re-fires forever. Triggered when inserting a post (posts_insert
-- → reads community_members → recurses).
--
-- Fix: SECURITY DEFINER helpers that bypass RLS, used in all policies that
-- need to know "is current user a member of community X / what's their role".
-- Safe to re-run.
-- ============================================================
SET search_path = public, extensions;

-- ============== Helpers ==============
CREATE OR REPLACE FUNCTION public.is_community_member(p_community_id UUID) RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER STABLE AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.community_members
        WHERE community_id = p_community_id AND user_id = auth.uid()
    );
$$;
GRANT EXECUTE ON FUNCTION public.is_community_member(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.my_community_role(p_community_id UUID) RETURNS TEXT
LANGUAGE sql SECURITY DEFINER STABLE AS $$
    SELECT role::TEXT FROM public.community_members
    WHERE community_id = p_community_id AND user_id = auth.uid()
    LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.my_community_role(UUID) TO authenticated;


-- ============== Rewrite community_members_read (THE recursion source) ==============
DROP POLICY IF EXISTS community_members_read ON public.community_members;
CREATE POLICY community_members_read ON public.community_members FOR SELECT USING (
    user_id = auth.uid()
    OR public.is_community_member(community_members.community_id)
    OR EXISTS (
        SELECT 1 FROM public.communities c
        WHERE c.id = community_members.community_id AND c.visibility = 'public'
    )
    OR public.is_admin()
);


-- ============== Rewrite communities_read to use helper ==============
DROP POLICY IF EXISTS communities_read ON public.communities;
CREATE POLICY communities_read ON public.communities FOR SELECT USING (
    visibility = 'public'
    OR public.is_community_member(communities.id)
    OR public.is_admin()
);


-- ============== Rewrite posts_read ==============
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
                OR public.is_community_member(c.id)
              )
        ))
    )
);


-- ============== Rewrite posts_insert ==============
DROP POLICY IF EXISTS posts_insert ON public.posts;
CREATE POLICY posts_insert ON public.posts FOR INSERT WITH CHECK (
    auth.uid() = author_id
    AND NOT EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.is_banned = TRUE)
    AND (
        topic_id IS NOT NULL
        OR (room_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.community_rooms r
            WHERE r.id = posts.room_id
              AND (
                r.community_id IS NULL
                OR (
                    public.is_community_member(r.community_id)
                    AND (NOT r.is_announcements OR public.my_community_role(r.community_id) IN ('owner', 'mod'))
                )
              )
        ))
    )
);

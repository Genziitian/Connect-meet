-- ============================================================
-- Migration 017 — Fix silent RLS no-ops in count triggers
-- ============================================================
-- Bug: bump_post_comment_count, recompute_post_upvotes,
-- recompute_comment_upvotes ran with the commenter/voter's permissions.
-- The posts_update_own / comments_update_own policies restricted UPDATE to
-- the row's author, so when a NON-author commented or voted, the trigger's
-- UPDATE silently affected 0 rows → counts stayed at 0.
--
-- Fix: SECURITY DEFINER on the trigger functions so they bypass RLS.
-- Also backfills the now-wrong counts on existing rows.
-- Safe to re-run.
-- ============================================================
SET search_path = public, extensions;

-- ============== Re-create trigger functions as SECURITY DEFINER ==============

CREATE OR REPLACE FUNCTION public.bump_post_comment_count() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.posts
        SET comment_count = comment_count + 1, updated_at = NOW()
        WHERE id = NEW.post_id;
    ELSIF TG_OP = 'UPDATE' AND OLD.is_deleted = FALSE AND NEW.is_deleted = TRUE THEN
        UPDATE public.posts
        SET comment_count = GREATEST(0, comment_count - 1)
        WHERE id = NEW.post_id;
    END IF;
    RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.recompute_post_upvotes(p_post_id UUID) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    UPDATE public.posts
    SET upvote_count = COALESCE(
        (SELECT SUM(value)::INT FROM public.post_votes WHERE post_id = p_post_id),
        0
    )
    WHERE id = p_post_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_post_vote() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    PERFORM public.recompute_post_upvotes(COALESCE(NEW.post_id, OLD.post_id));
    RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.recompute_comment_upvotes(p_comment_id UUID) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    UPDATE public.comments
    SET upvote_count = COALESCE(
        (SELECT SUM(value)::INT FROM public.comment_votes WHERE comment_id = p_comment_id),
        0
    )
    WHERE id = p_comment_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_comment_vote() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    PERFORM public.recompute_comment_upvotes(COALESCE(NEW.comment_id, OLD.comment_id));
    RETURN NULL;
END;
$$;


-- ============== Backfill the wrong counts on existing rows ==============

UPDATE public.posts p
SET comment_count = sub.cnt
FROM (
    SELECT post_id, COUNT(*)::INT AS cnt
    FROM public.comments
    WHERE is_deleted = FALSE
    GROUP BY post_id
) sub
WHERE p.id = sub.post_id AND p.comment_count <> sub.cnt;

-- Set posts with no comments to 0 (covers comment_count drift in the other direction)
UPDATE public.posts p
SET comment_count = 0
WHERE comment_count <> 0
  AND NOT EXISTS (SELECT 1 FROM public.comments c WHERE c.post_id = p.id AND c.is_deleted = FALSE);

UPDATE public.posts p
SET upvote_count = sub.s
FROM (
    SELECT post_id, COALESCE(SUM(value), 0)::INT AS s
    FROM public.post_votes
    GROUP BY post_id
) sub
WHERE p.id = sub.post_id AND p.upvote_count <> sub.s;

UPDATE public.comments c
SET upvote_count = sub.s
FROM (
    SELECT comment_id, COALESCE(SUM(value), 0)::INT AS s
    FROM public.comment_votes
    GROUP BY comment_id
) sub
WHERE c.id = sub.comment_id AND c.upvote_count <> sub.s;

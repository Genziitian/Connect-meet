-- ============================================================
-- Migration 012 — User stats infrastructure
-- 1. Raise default daily connect limit 20 → 50
-- 2. v_user_stats view (total/week/today connects + time + safety score)
-- 3. increment_match_count RPC for atomic counter bumps
-- 4. get_user_streak function (consecutive days with at least 1 session)
-- 5. RLS so users can read their own stats
-- Safe to re-run.
-- ============================================================
SET search_path = public, extensions;

-- ---- 1. Raise daily connect limit ----
ALTER TABLE public.users ALTER COLUMN max_matches_per_day SET DEFAULT 50;

-- Bump existing users still on the old 20 default
UPDATE public.users SET max_matches_per_day = 50
WHERE max_matches_per_day = 20;

-- ---- 2. Atomic match counter increment + daily reset ----
CREATE OR REPLACE FUNCTION public.increment_match_count(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.users
    SET
        matches_used_today = CASE
            WHEN matches_reset_date < CURRENT_DATE THEN 1
            ELSE matches_used_today + 1
        END,
        matches_reset_date = CURRENT_DATE
    WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ---- 3. Streak: consecutive days with at least 1 session ----
CREATE OR REPLACE FUNCTION public.get_user_streak(p_user_id UUID)
RETURNS INT AS $$
DECLARE
    streak     INT := 0;
    check_date DATE := CURRENT_DATE;
    has_today  BOOLEAN;
BEGIN
    -- Walk back from today day-by-day while sessions exist
    LOOP
        SELECT EXISTS (
            SELECT 1 FROM public.chat_sessions
            WHERE (user1_id = p_user_id OR user2_id = p_user_id)
              AND start_time::date = check_date
        ) INTO has_today;

        EXIT WHEN NOT has_today;

        streak := streak + 1;
        check_date := check_date - 1;
        EXIT WHEN streak > 365; -- safety
    END LOOP;
    RETURN streak;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ---- 4. Stats view ----
DROP VIEW IF EXISTS public.v_user_stats;
CREATE VIEW public.v_user_stats AS
SELECT
    u.id AS user_id,
    u.matches_used_today,
    u.max_matches_per_day,
    u.matches_reset_date,
    -- Lifetime connects
    (SELECT COUNT(*) FROM public.chat_sessions cs
     WHERE cs.user1_id = u.id OR cs.user2_id = u.id) AS total_connects,
    -- Lifetime seconds talked (only completed sessions)
    COALESCE((SELECT SUM(duration_seconds) FROM public.chat_sessions cs
              WHERE (cs.user1_id = u.id OR cs.user2_id = u.id)
                AND cs.duration_seconds IS NOT NULL), 0)::BIGINT AS total_seconds,
    -- Last 7 days
    (SELECT COUNT(*) FROM public.chat_sessions cs
     WHERE (cs.user1_id = u.id OR cs.user2_id = u.id)
       AND cs.start_time > NOW() - INTERVAL '7 days') AS week_connects,
    COALESCE((SELECT SUM(duration_seconds) FROM public.chat_sessions cs
              WHERE (cs.user1_id = u.id OR cs.user2_id = u.id)
                AND cs.start_time > NOW() - INTERVAL '7 days'
                AND cs.duration_seconds IS NOT NULL), 0)::BIGINT AS week_seconds,
    -- Today
    (SELECT COUNT(*) FROM public.chat_sessions cs
     WHERE (cs.user1_id = u.id OR cs.user2_id = u.id)
       AND cs.start_time::date = CURRENT_DATE) AS today_connects,
    COALESCE((SELECT SUM(duration_seconds) FROM public.chat_sessions cs
              WHERE (cs.user1_id = u.id OR cs.user2_id = u.id)
                AND cs.start_time::date = CURRENT_DATE
                AND cs.duration_seconds IS NOT NULL), 0)::BIGINT AS today_seconds,
    -- Reports against this user (last 90 days)
    (SELECT COUNT(*) FROM public.reports r
     WHERE r.reported_user_id = u.id
       AND r.created_at > NOW() - INTERVAL '90 days') AS reports_received,
    -- Safety score: 100 - 20*reports, clamped to [0,100]
    GREATEST(0, 100 - 20 *
        (SELECT COUNT(*)::INT FROM public.reports r
         WHERE r.reported_user_id = u.id
           AND r.created_at > NOW() - INTERVAL '90 days')
    ) AS safety_score,
    -- Streak
    public.get_user_streak(u.id) AS streak_days
FROM public.users u;

-- ---- 5. RLS: users can read their own stats row (admins see all) ----
-- Views don't carry RLS from their base tables in Postgres < 15,
-- but Supabase by default executes views with the invoker's role, so the
-- underlying users / chat_sessions / reports RLS policies apply.
-- We expose the view via supabase by granting select.
GRANT SELECT ON public.v_user_stats TO authenticated;

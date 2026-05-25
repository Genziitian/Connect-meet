-- ============================================================
-- Migration 003 — Anon names + Topics
-- Safe to re-run.
-- ============================================================
SET search_path = public, extensions;

-- ============================================================
-- 1. ADD anon_name to users (e.g., "Anon-743")
-- ============================================================
ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS anon_name VARCHAR(40);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_anon_name ON public.users(anon_name);

-- Backfill anon_name for any existing users that don't have one
UPDATE public.users
SET anon_name = 'Anon-' || lpad((floor(random() * 9000) + 1000)::int::text, 4, '0')
WHERE anon_name IS NULL;

-- Trigger: auto-assign anon_name when a row in public.users is created
CREATE OR REPLACE FUNCTION public.assign_anon_name() RETURNS TRIGGER AS $$
DECLARE
    candidate VARCHAR(40);
    attempts  INT := 0;
BEGIN
    IF NEW.anon_name IS NULL THEN
        LOOP
            candidate := 'Anon-' || lpad((floor(random() * 9000) + 1000)::int::text, 4, '0');
            BEGIN
                NEW.anon_name := candidate;
                EXIT WHEN NOT EXISTS (SELECT 1 FROM public.users WHERE anon_name = candidate);
            EXCEPTION WHEN OTHERS THEN NULL;
            END;
            attempts := attempts + 1;
            EXIT WHEN attempts > 10;
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_assign_anon_name ON public.users;
CREATE TRIGGER trg_assign_anon_name
    BEFORE INSERT ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.assign_anon_name();

-- ============================================================
-- 2. TOPICS (e.g., #Calculus, #Anime, #JEE)
-- ============================================================
DROP TABLE IF EXISTS public.user_topics CASCADE;
DROP TABLE IF EXISTS public.topics CASCADE;

CREATE TABLE public.topics (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug        VARCHAR(50) UNIQUE NOT NULL,
    label       VARCHAR(80) NOT NULL,
    emoji       VARCHAR(10),
    color       VARCHAR(20),
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Seed default topics
INSERT INTO public.topics (slug, label, emoji, color) VALUES
    ('calculus',     'Calculus & DSA',   '∫',   'green'),
    ('jee',          'JEE Prep',         '🎯',  'red'),
    ('anime',        'Anime & Manga',    '🍙',  'red'),
    ('music',        'Music & Lo-fi',    '🎵',  'purple'),
    ('startup',      'Startup Ideas',    '🚀',  'orange'),
    ('gym',          'Gym & Fitness',    '💪',  'orange'),
    ('latenight',    'Late-night talks', '🌙',  'purple'),
    ('placements',   'Placements',       '💼',  'green'),
    ('coding',       'Coding & DSA',     '💻',  'green'),
    ('chill',        'Chill talk',       '✨',  'purple')
ON CONFLICT (slug) DO NOTHING;

CREATE TABLE public.user_topics (
    user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    topic_id    UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, topic_id)
);

CREATE INDEX idx_user_topics_user ON public.user_topics(user_id);
CREATE INDEX idx_user_topics_topic ON public.user_topics(topic_id);

-- ============================================================
-- 3. RECENT CONNECTS view (drives the "Recent Connects" widget)
-- ============================================================
CREATE OR REPLACE VIEW public.v_recent_connects AS
SELECT
    cs.session_id,
    cs.start_time,
    cs.end_time,
    cs.mode,
    cs.matched_topic,
    cs.user1_id,
    cs.user2_id,
    u1.anon_name AS user1_anon,
    u2.anon_name AS user2_anon,
    u1.avatar_url AS user1_avatar,
    u2.avatar_url AS user2_avatar
FROM public.chat_sessions cs
LEFT JOIN public.users u1 ON cs.user1_id = u1.id
LEFT JOIN public.users u2 ON cs.user2_id = u2.id
ORDER BY cs.start_time DESC;

-- ============================================================
-- 4. RLS POLICIES
-- ============================================================
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_topics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS topics_select ON public.topics;
CREATE POLICY topics_select ON public.topics
    FOR SELECT USING (true);  -- public read

DROP POLICY IF EXISTS user_topics_select_own ON public.user_topics;
CREATE POLICY user_topics_select_own ON public.user_topics
    FOR SELECT USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS user_topics_insert_own ON public.user_topics;
CREATE POLICY user_topics_insert_own ON public.user_topics
    FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS user_topics_delete_own ON public.user_topics;
CREATE POLICY user_topics_delete_own ON public.user_topics
    FOR DELETE USING (user_id = auth.uid());

-- ============================================================
-- 5. UPDATE: allow user to update their anon name (display only)
-- ============================================================
-- Already covered by existing users_update_own policy

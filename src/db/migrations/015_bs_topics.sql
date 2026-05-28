-- ============================================================
-- Migration 015 — Replace Feed topics with IITM BS-degree set
-- ============================================================
-- Behavior:
--   • Deactivates every existing topic (is_active = FALSE) so they fall out of
--     the Feed filter chips and Connect topic dropdown — but existing posts
--     pointing to them stay intact (FKs preserved).
--   • Upserts the 6 BS-degree topics: BS Degree, Qualifier, General,
--     Foundation, Diploma, Paradox.
-- Safe to re-run.
-- ============================================================
SET search_path = public, extensions;

-- 1) Deactivate all existing topics
UPDATE public.topics SET is_active = FALSE WHERE is_active = TRUE;

-- 2) Upsert the BS-degree set
INSERT INTO public.topics (slug, label, emoji, color, is_active) VALUES
    ('bs-degree',  'BS Degree',  '🎓', 'green',  TRUE),
    ('qualifier',  'Qualifier',  '🎯', 'red',    TRUE),
    ('general',    'General',    '💬', 'purple', TRUE),
    ('foundation', 'Foundation', '📚', 'orange', TRUE),
    ('diploma',    'Diploma',    '📜', 'green',  TRUE),
    ('paradox',    'Paradox',    '🌀', 'purple', TRUE)
ON CONFLICT (slug) DO UPDATE SET
    label     = EXCLUDED.label,
    emoji     = EXCLUDED.emoji,
    color     = EXCLUDED.color,
    is_active = TRUE;

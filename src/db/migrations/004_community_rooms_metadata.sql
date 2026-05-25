-- ============================================================
-- Migration 004 — Community rooms: emoji + color + tagline + seed all 6 rooms
-- Safe to re-run.
-- ============================================================
SET search_path = public, extensions;

-- Add metadata columns to community_rooms
ALTER TABLE public.community_rooms
    ADD COLUMN IF NOT EXISTS emoji      VARCHAR(8),
    ADD COLUMN IF NOT EXISTS color      VARCHAR(20),
    ADD COLUMN IF NOT EXISTS tagline    VARCHAR(80),
    ADD COLUMN IF NOT EXISTS host_alias VARCHAR(40);

-- Seed / update the 6 rooms from the design
INSERT INTO public.community_rooms (slug, name, description, emoji, color, tagline, host_alias)
VALUES
    ('late-night-lounge', 'Late Night Lounge', '11pm — 2am · chill talks, study breaks, vent posts.', '🌙', '#B794F6', '#chill #vents #lofi', 'Marigold-21'),
    ('anime-manga',       'Anime & Manga Club', 'Currently dissecting Frieren ep 14. Spoilers OK.',    '🍙', '#FF6B6B', '#anime #manga',        'Blueberry-09'),
    ('jee-bs-survivors',  'JEE — BS Survivors',  'For 1st years adjusting to the BS grind.',           '🎯', '#00D09C', '#jee #bs #1stYear',    'Vortex-88'),
    ('music-lofi',        'Music & Lo-fi',       'Share tracks, ask for recs, study to.',              '🎧', '#FB923C', '#music #lofi #playlist','Lumen-44'),
    ('gym-bros-sis',      'Gym Bros & Sis',      'PRs, programs, no judgment zone.',                   '💪', '#FBBF24', '#fitness #gym #prs',   'Kismet-7'),
    ('startup-talk',      'Startup Talk',        'Pitch, critique, find co-founders.',                 '🚀', '#00D09C', '#startup #ideas #vc',  'Pixel-12')
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    emoji = EXCLUDED.emoji,
    color = EXCLUDED.color,
    tagline = EXCLUDED.tagline,
    host_alias = EXCLUDED.host_alias;

-- Drop the older placeholder rooms from migration 002 (they don't match the design)
DELETE FROM public.community_rooms WHERE slug IN ('lobby', 'jee-prep', 'placements');

-- ============================================================
-- Random handle generator for a (user, room) pair
-- Returns a name like "Vortex-88" — unique per room
-- ============================================================
CREATE OR REPLACE FUNCTION public.assign_room_handle(p_user_id UUID, p_room_id UUID)
RETURNS VARCHAR(40) AS $$
DECLARE
    existing  VARCHAR(40);
    candidate VARCHAR(40);
    adjective TEXT;
    noun      TEXT;
    num       INT;
    attempts  INT := 0;
BEGIN
    SELECT handle INTO existing
    FROM public.community_handles
    WHERE user_id = p_user_id AND room_id = p_room_id;

    IF existing IS NOT NULL THEN
        RETURN existing;
    END IF;

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

    -- Fallback if 10 random attempts collide
    candidate := 'Anon-' || substr(md5(random()::text), 1, 4);
    INSERT INTO public.community_handles (user_id, room_id, handle)
    VALUES (p_user_id, p_room_id, candidate);
    RETURN candidate;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- View: per-room online count + last message preview
-- ============================================================
CREATE OR REPLACE VIEW public.v_room_stats AS
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
    (SELECT COUNT(DISTINCT user_id) FROM public.community_messages
     WHERE room_id = r.id AND created_at > NOW() - INTERVAL '30 minutes') AS active_count,
    (SELECT COUNT(DISTINCT user_id) FROM public.community_handles
     WHERE room_id = r.id) AS member_count,
    (SELECT created_at FROM public.community_messages
     WHERE room_id = r.id AND is_deleted = FALSE
     ORDER BY created_at DESC LIMIT 1) AS last_message_at
FROM public.community_rooms r
WHERE r.is_active = TRUE
ORDER BY active_count DESC, r.created_at ASC;

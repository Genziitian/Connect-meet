-- ============================================================
-- Migration 002 — Support Tickets + Community Rooms
-- Safe to re-run.
-- ============================================================

SET search_path = public, extensions;

-- Roles for the users table (admin / user)
ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'user'
        CHECK (role IN ('user', 'admin', 'moderator'));

CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

-- ============================================================
-- SUPPORT TICKETS
-- ============================================================
DROP TABLE IF EXISTS public.ticket_messages CASCADE;
DROP TABLE IF EXISTS public.support_tickets CASCADE;

CREATE TABLE public.support_tickets (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    subject         VARCHAR(200) NOT NULL,
    category        VARCHAR(50) NOT NULL DEFAULT 'general'
                      CHECK (category IN ('general', 'bug', 'abuse', 'payment', 'feature', 'other')),
    status          VARCHAR(20) NOT NULL DEFAULT 'open'
                      CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    priority        VARCHAR(10) NOT NULL DEFAULT 'normal'
                      CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    assigned_to     UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    resolved_at     TIMESTAMP WITH TIME ZONE,
    last_message_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tickets_user ON public.support_tickets(user_id);
CREATE INDEX idx_tickets_status ON public.support_tickets(status);
CREATE INDEX idx_tickets_assigned ON public.support_tickets(assigned_to);
CREATE INDEX idx_tickets_last_msg ON public.support_tickets(last_message_at DESC);

CREATE TABLE public.ticket_messages (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id       UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
    sender_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    sender_role     VARCHAR(20) NOT NULL CHECK (sender_role IN ('user', 'admin')),
    body            TEXT NOT NULL,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    read_by_user    BOOLEAN NOT NULL DEFAULT FALSE,
    read_by_admin   BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_ticket_msgs_ticket ON public.ticket_messages(ticket_id, created_at);

-- Update ticket's last_message_at whenever a new message comes in
CREATE OR REPLACE FUNCTION public.bump_ticket_last_message() RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.support_tickets
    SET last_message_at = NEW.created_at,
        updated_at = NEW.created_at
    WHERE id = NEW.ticket_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_bump_ticket_last_message ON public.ticket_messages;
CREATE TRIGGER trg_bump_ticket_last_message
    AFTER INSERT ON public.ticket_messages
    FOR EACH ROW EXECUTE FUNCTION public.bump_ticket_last_message();

-- ============================================================
-- COMMUNITY ROOMS (open chats — any signed-in student can join)
-- ============================================================
DROP TABLE IF EXISTS public.community_messages CASCADE;
DROP TABLE IF EXISTS public.community_handles CASCADE;
DROP TABLE IF EXISTS public.community_rooms CASCADE;

CREATE TABLE public.community_rooms (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug            VARCHAR(60) UNIQUE NOT NULL,
    name            VARCHAR(120) NOT NULL,
    description     TEXT,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Seed a default lobby room
INSERT INTO public.community_rooms (slug, name, description)
VALUES
    ('lobby', 'IITian Lobby', 'Open chat for all students. Be respectful.'),
    ('jee-prep', 'JEE Prep', 'Tips, doubts, resources for JEE aspirants.'),
    ('placements', 'Placements', 'Interview experiences and placement chat.')
ON CONFLICT (slug) DO NOTHING;

-- Random handle assigned to a user inside a specific room
CREATE TABLE public.community_handles (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    room_id         UUID NOT NULL REFERENCES public.community_rooms(id) ON DELETE CASCADE,
    handle          VARCHAR(40) NOT NULL,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, room_id),
    UNIQUE(room_id, handle)
);

CREATE INDEX idx_handles_user ON public.community_handles(user_id);
CREATE INDEX idx_handles_room ON public.community_handles(room_id);

CREATE TABLE public.community_messages (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id         UUID NOT NULL REFERENCES public.community_rooms(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    handle          VARCHAR(40) NOT NULL,
    body            TEXT NOT NULL,
    is_deleted      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_comm_msgs_room ON public.community_messages(room_id, created_at DESC);
CREATE INDEX idx_comm_msgs_user ON public.community_messages(user_id);

-- ============================================================
-- ANALYTICS — daily roll-up of platform activity (for admin dashboard)
-- ============================================================
DROP TABLE IF EXISTS public.daily_activity CASCADE;
CREATE TABLE public.daily_activity (
    activity_date   DATE PRIMARY KEY,
    sessions_count  INT NOT NULL DEFAULT 0,
    total_users     INT NOT NULL DEFAULT 0,
    new_signups     INT NOT NULL DEFAULT 0,
    reports_count   INT NOT NULL DEFAULT 0,
    tickets_count   INT NOT NULL DEFAULT 0,
    peak_concurrent INT NOT NULL DEFAULT 0,
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ============================================================
-- RLS POLICIES
-- ============================================================
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_handles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_activity ENABLE ROW LEVEL SECURITY;

-- Helper: is the current request from an admin?
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND role = 'admin'
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Tickets: users see/edit their own; admins see all
DROP POLICY IF EXISTS tickets_user_select ON public.support_tickets;
CREATE POLICY tickets_user_select ON public.support_tickets
    FOR SELECT USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS tickets_user_insert ON public.support_tickets;
CREATE POLICY tickets_user_insert ON public.support_tickets
    FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS tickets_admin_update ON public.support_tickets;
CREATE POLICY tickets_admin_update ON public.support_tickets
    FOR UPDATE USING (public.is_admin() OR user_id = auth.uid());

-- Ticket messages: visible to the ticket owner + admins
DROP POLICY IF EXISTS msgs_select ON public.ticket_messages;
CREATE POLICY msgs_select ON public.ticket_messages
    FOR SELECT USING (
        public.is_admin() OR EXISTS (
            SELECT 1 FROM public.support_tickets t
            WHERE t.id = ticket_messages.ticket_id AND t.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS msgs_insert ON public.ticket_messages;
CREATE POLICY msgs_insert ON public.ticket_messages
    FOR INSERT WITH CHECK (
        sender_id = auth.uid() AND (
            public.is_admin() OR EXISTS (
                SELECT 1 FROM public.support_tickets t
                WHERE t.id = ticket_messages.ticket_id AND t.user_id = auth.uid()
            )
        )
    );

-- Community rooms: readable by all authenticated users
DROP POLICY IF EXISTS rooms_select ON public.community_rooms;
CREATE POLICY rooms_select ON public.community_rooms
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Community handles: users see their own + can insert their own
DROP POLICY IF EXISTS handles_select_own ON public.community_handles;
CREATE POLICY handles_select_own ON public.community_handles
    FOR SELECT USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS handles_insert_own ON public.community_handles;
CREATE POLICY handles_insert_own ON public.community_handles
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Community messages: any authenticated user can read non-deleted; insert their own
DROP POLICY IF EXISTS msgs_comm_select ON public.community_messages;
CREATE POLICY msgs_comm_select ON public.community_messages
    FOR SELECT USING (auth.uid() IS NOT NULL AND (is_deleted = FALSE OR public.is_admin()));

DROP POLICY IF EXISTS msgs_comm_insert ON public.community_messages;
CREATE POLICY msgs_comm_insert ON public.community_messages
    FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS msgs_comm_admin_update ON public.community_messages;
CREATE POLICY msgs_comm_admin_update ON public.community_messages
    FOR UPDATE USING (public.is_admin());

-- Daily activity: admin-only
DROP POLICY IF EXISTS daily_activity_admin ON public.daily_activity;
CREATE POLICY daily_activity_admin ON public.daily_activity
    FOR SELECT USING (public.is_admin());

-- ============================================================
-- Grant admin role to bootstrap email
-- ============================================================
-- Replace with your admin email or run via SQL editor after signup
UPDATE public.users SET role = 'admin'
WHERE email = 'sriram.2024b@vitstudent.ac.in';

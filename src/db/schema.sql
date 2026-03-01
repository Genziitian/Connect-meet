-- ============================================================
-- GenZ IITian Connect — PostgreSQL Database Schema
-- Compliant with: DPDP Act 2023, IT Act 2000, IT Rules 2021
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. USERS TABLE
-- ============================================================
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email           VARCHAR(255) UNIQUE NOT NULL,
    display_name    VARCHAR(100),
    avatar_url      TEXT,
    phone           VARCHAR(20),
    
    -- Plan & Verification
    plan_type       VARCHAR(20) NOT NULL DEFAULT 'free' CHECK (plan_type IN ('free', 'pro', 'premium')),
    is_verified     BOOLEAN NOT NULL DEFAULT FALSE,
    is_banned       BOOLEAN NOT NULL DEFAULT FALSE,
    ban_reason      TEXT,
    ban_expires_at  TIMESTAMP WITH TIME ZONE,
    
    -- DPDP Act 2023 Compliance
    age_verified    BOOLEAN NOT NULL DEFAULT FALSE,
    consent_given   BOOLEAN NOT NULL DEFAULT FALSE,
    consent_version VARCHAR(10) DEFAULT '1.0',
    consent_given_at TIMESTAMP WITH TIME ZONE,
    
    -- Rate limiting
    matches_used_today  INTEGER NOT NULL DEFAULT 0,
    matches_reset_date  DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Device fingerprint (for abuse prevention)
    device_fingerprint_hash VARCHAR(64),
    
    -- Timestamps
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    last_active_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMP WITH TIME ZONE  -- Soft delete
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_plan_type ON users(plan_type);
CREATE INDEX idx_users_is_banned ON users(is_banned);
CREATE INDEX idx_users_last_active ON users(last_active_at);

-- ============================================================
-- 2. SUBSCRIPTIONS TABLE
-- ============================================================
CREATE TABLE subscriptions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_type       VARCHAR(20) NOT NULL CHECK (plan_type IN ('free', 'pro', 'premium')),
    
    -- Billing
    amount          DECIMAL(10, 2) NOT NULL DEFAULT 0,
    currency        VARCHAR(3) NOT NULL DEFAULT 'INR',
    payment_method  VARCHAR(50),
    payment_gateway VARCHAR(50),
    gateway_subscription_id VARCHAR(255),
    
    -- Duration
    start_date      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    end_date        TIMESTAMP WITH TIME ZONE,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    auto_renew      BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Timestamps
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    cancelled_at    TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_active ON subscriptions(is_active);

-- ============================================================
-- 3. CHAT SESSIONS TABLE (Safety Logging — IT Rules 2021)
-- NOTE: We log metadata only, NEVER chat content
-- ============================================================
CREATE TABLE chat_sessions (
    session_id      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user1_id        UUID NOT NULL REFERENCES users(id),
    user2_id        UUID NOT NULL REFERENCES users(id),
    
    -- Session details
    mode            VARCHAR(10) NOT NULL DEFAULT 'text' CHECK (mode IN ('text', 'video')),
    start_time      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    end_time        TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,
    
    -- Safety logging (IT Rules 2021 compliance)
    ip_hash_user1   VARCHAR(64),  -- One-way hash, NOT the actual IP
    ip_hash_user2   VARCHAR(64),
    reported_flag   BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Matching info
    match_type      VARCHAR(20) DEFAULT 'random',  -- 'random', 'topic', 'course'
    matched_topic   VARCHAR(100),
    
    -- Auto-purge after 90 days
    expires_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '90 days'
);

CREATE INDEX idx_sessions_user1 ON chat_sessions(user1_id);
CREATE INDEX idx_sessions_user2 ON chat_sessions(user2_id);
CREATE INDEX idx_sessions_reported ON chat_sessions(reported_flag);
CREATE INDEX idx_sessions_start ON chat_sessions(start_time);
CREATE INDEX idx_sessions_expires ON chat_sessions(expires_at);

-- ============================================================
-- 4. REPORTS TABLE (IT Rules 2021 — Grievance Mechanism)
-- ============================================================
CREATE TABLE reports (
    report_id       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id      UUID REFERENCES chat_sessions(session_id),
    reported_user_id UUID NOT NULL REFERENCES users(id),
    reporter_user_id UUID NOT NULL REFERENCES users(id),
    
    -- Report details
    reason          VARCHAR(50) NOT NULL CHECK (reason IN (
        'harassment', 'nudity', 'spam', 'hate_speech', 
        'impersonation', 'underage', 'other'
    )),
    description     TEXT,
    
    -- Status
    status          VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending', 'reviewing', 'action_taken', 'dismissed'
    )),
    reviewed_by     VARCHAR(255),
    review_notes    TEXT,
    action_taken    VARCHAR(100),
    
    -- Timestamps
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    reviewed_at     TIMESTAMP WITH TIME ZONE,
    
    -- Retain for 180 days
    expires_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '180 days'
);

CREATE INDEX idx_reports_reported_user ON reports(reported_user_id);
CREATE INDEX idx_reports_reporter ON reports(reporter_user_id);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_session ON reports(session_id);

-- ============================================================
-- 5. CONSENT LOG (DPDP Act 2023 Compliance)
-- ============================================================
CREATE TABLE consent_log (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    consent_type    VARCHAR(50) NOT NULL,  -- 'data_processing', 'age_verification', 'community_rules'
    consent_version VARCHAR(10) NOT NULL DEFAULT '1.0',
    given           BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Metadata
    ip_hash         VARCHAR(64),
    user_agent      TEXT,
    
    -- Timestamps
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    withdrawn_at    TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_consent_user ON consent_log(user_id);

-- ============================================================
-- 6. DATA DELETION REQUESTS (DPDP Act 2023)
-- ============================================================
CREATE TABLE data_deletion_requests (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID REFERENCES users(id),
    email           VARCHAR(255) NOT NULL,
    reason          TEXT,
    
    -- Processing
    status          VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending', 'processing', 'completed', 'failed'
    )),
    requested_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    processed_at    TIMESTAMP WITH TIME ZONE,
    scheduled_date  TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '30 days',
    
    -- Audit
    processed_by    VARCHAR(255),
    notes           TEXT
);

CREATE INDEX idx_deletion_status ON data_deletion_requests(status);

-- ============================================================
-- 7. BLOCKED USERS
-- ============================================================
CREATE TABLE blocked_users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    blocked_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    UNIQUE(user_id, blocked_user_id)
);

CREATE INDEX idx_blocked_user ON blocked_users(user_id);

-- ============================================================
-- 8. AUDIT LOG (IT Act 2000 Compliance)
-- ============================================================
CREATE TABLE audit_log (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID REFERENCES users(id),
    action          VARCHAR(100) NOT NULL,
    resource_type   VARCHAR(50),
    resource_id     VARCHAR(255),
    ip_hash         VARCHAR(64),
    metadata        JSONB,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Retain for 1 year
    expires_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '1 year'
);

CREATE INDEX idx_audit_user ON audit_log(user_id);
CREATE INDEX idx_audit_action ON audit_log(action);
CREATE INDEX idx_audit_created ON audit_log(created_at);

-- ============================================================
-- AUTOMATIC DATA CLEANUP (Cron Job)
-- ============================================================

-- Function to clean expired data
CREATE OR REPLACE FUNCTION cleanup_expired_data() RETURNS void AS $$
BEGIN
    -- Delete expired sessions (90 days)
    DELETE FROM chat_sessions WHERE expires_at < NOW();
    
    -- Delete expired reports (180 days)
    DELETE FROM reports WHERE expires_at < NOW();
    
    -- Delete expired audit logs (1 year)
    DELETE FROM audit_log WHERE expires_at < NOW();
    
    -- Process pending deletion requests
    UPDATE data_deletion_requests
    SET status = 'processing'
    WHERE status = 'pending' AND scheduled_date <= NOW();
    
    -- Reset daily match counters
    UPDATE users
    SET matches_used_today = 0, matches_reset_date = CURRENT_DATE
    WHERE matches_reset_date < CURRENT_DATE;
    
    RAISE NOTICE 'Data cleanup completed at %', NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- ROW-LEVEL SECURITY (Additional safety)
-- ============================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Users can only view/edit their own data
CREATE POLICY users_self_access ON users
    FOR ALL
    USING (id = current_setting('app.current_user_id')::UUID);

-- Users can only view their own sessions
CREATE POLICY sessions_participant_access ON chat_sessions
    FOR SELECT
    USING (
        user1_id = current_setting('app.current_user_id')::UUID
        OR user2_id = current_setting('app.current_user_id')::UUID
    );

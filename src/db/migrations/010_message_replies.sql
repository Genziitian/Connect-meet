-- ============================================================
-- Migration 010 — Reply to message + admin room rename
-- Safe to re-run.
-- ============================================================
SET search_path = public, extensions;

ALTER TABLE public.community_messages
    ADD COLUMN IF NOT EXISTS reply_to_id      UUID REFERENCES public.community_messages(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS reply_to_handle  VARCHAR(40),
    ADD COLUMN IF NOT EXISTS reply_to_excerpt VARCHAR(200);

CREATE INDEX IF NOT EXISTS idx_comm_msgs_reply ON public.community_messages(reply_to_id);

-- Make sure realtime broadcasts the new columns too (no-op if already in publication)
-- (Replication publishes the whole row, so no extra step needed.)

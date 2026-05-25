-- ============================================================
-- Migration 007 — Image attachments on community messages
-- Safe to re-run.
-- ============================================================
SET search_path = public, extensions;

ALTER TABLE public.community_messages
    ADD COLUMN IF NOT EXISTS image_url TEXT;

-- ============================================================
-- Storage bucket for community images
-- (Run this manually in Supabase Dashboard if the SQL fails:
--  Storage → New Bucket → name: "community-images" → public)
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('community-images', 'community-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS — any authenticated user can upload their own image,
-- everyone can read (it's a public bucket but we still add policies).
DROP POLICY IF EXISTS community_images_insert ON storage.objects;
CREATE POLICY community_images_insert ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'community-images'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

DROP POLICY IF EXISTS community_images_select ON storage.objects;
CREATE POLICY community_images_select ON storage.objects
    FOR SELECT
    USING (bucket_id = 'community-images');

DROP POLICY IF EXISTS community_images_delete ON storage.objects;
CREATE POLICY community_images_delete ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'community-images'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- ============================================================================
-- Migration: Time Capsule Messages
-- ============================================================================
-- Allows family members to create time-locked messages for future delivery.
-- Messages remain sealed until the delivery date, then unlock with notification.

-- 1) Create time-capsule-media storage bucket (private, server-signed uploads)
-- ============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'time-capsule-media',
  'time-capsule-media',
  false,
  52428800, -- 50 MB max
  ARRAY[
    'audio/webm',
    'audio/mp4',
    'audio/mpeg',
    'audio/ogg',
    'audio/wav',
    'video/webm',
    'video/mp4',
    'video/quicktime',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp'
  ]::text[]
)
ON CONFLICT (id) DO UPDATE
SET
  public = false,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY[
    'audio/webm',
    'audio/mp4',
    'audio/mpeg',
    'audio/ogg',
    'audio/wav',
    'video/webm',
    'video/mp4',
    'video/quicktime',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp'
  ]::text[];

-- 2) Table: time_capsules
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.time_capsules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Who created this capsule
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Who this capsule is for (nullable for "to my family" / broadcast)
  recipient_profile_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,

  -- Content
  title TEXT NOT NULL CHECK (char_length(title) >= 1 AND char_length(title) <= 200),
  message TEXT CHECK (char_length(message) <= 10000),

  -- Optional media attachment
  media_type TEXT CHECK (media_type IN (NULL, 'audio', 'video', 'image')),
  media_url TEXT,

  -- Delivery configuration
  scheduled_delivery_date TIMESTAMPTZ NOT NULL CHECK (scheduled_delivery_date > created_at),
  delivery_trigger TEXT NOT NULL DEFAULT 'date' CHECK (delivery_trigger IN ('date', 'after_passing', 'event')),

  -- Delivery status tracking
  delivered_at TIMESTAMPTZ,
  delivery_status TEXT NOT NULL DEFAULT 'scheduled' CHECK (delivery_status IN ('scheduled', 'delivered', 'cancelled')),

  -- Privacy (capsules are always private until delivered)
  privacy_level TEXT NOT NULL DEFAULT 'private' CHECK (privacy_level IN ('private')),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT time_capsules_media_url_required CHECK (
    (media_type IS NULL AND media_url IS NULL) OR
    (media_type IS NOT NULL AND media_url IS NOT NULL)
  )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_time_capsules_created_by
  ON public.time_capsules(created_by, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_time_capsules_recipient
  ON public.time_capsules(recipient_profile_id, delivery_status);

-- Critical index for cron delivery job
CREATE INDEX IF NOT EXISTS idx_time_capsules_delivery_pending
  ON public.time_capsules(scheduled_delivery_date)
  WHERE delivery_status = 'scheduled';

CREATE INDEX IF NOT EXISTS idx_time_capsules_status
  ON public.time_capsules(delivery_status);

-- 3) Updated_at trigger
-- ============================================================================
CREATE OR REPLACE FUNCTION update_time_capsules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS time_capsules_updated_at ON public.time_capsules;
CREATE TRIGGER time_capsules_updated_at
  BEFORE UPDATE ON public.time_capsules
  FOR EACH ROW
  EXECUTE FUNCTION update_time_capsules_updated_at();

-- 4) Enable RLS
-- ============================================================================
ALTER TABLE public.time_capsules ENABLE ROW LEVEL SECURITY;

-- 5) RLS Policies
-- ============================================================================

-- SELECT: Creator can always see, recipient only after delivery
CREATE POLICY "time_capsules_select" ON public.time_capsules
  FOR SELECT TO authenticated
  USING (
    -- Creator can always see their own capsules
    created_by = auth.uid()
    -- Recipient can see after delivery
    OR (
      recipient_profile_id = auth.uid()
      AND delivery_status = 'delivered'
    )
    -- Admins can see everything
    OR current_user_is_admin()
  );

-- INSERT: Only authenticated users can create
CREATE POLICY "time_capsules_insert" ON public.time_capsules
  FOR INSERT TO authenticated
  WITH CHECK (
    created_by = auth.uid()
  );

-- UPDATE: Only creator, only before delivery
CREATE POLICY "time_capsules_update" ON public.time_capsules
  FOR UPDATE TO authenticated
  USING (
    created_by = auth.uid()
    AND delivery_status = 'scheduled'
  )
  WITH CHECK (
    created_by = auth.uid()
    AND delivery_status = 'scheduled'
  );

-- DELETE: Only creator before delivery, or admin
CREATE POLICY "time_capsules_delete" ON public.time_capsules
  FOR DELETE TO authenticated
  USING (
    (created_by = auth.uid() AND delivery_status = 'scheduled')
    OR current_user_is_admin()
  );

-- 6) Storage RLS Policies for time-capsule-media bucket
-- ============================================================================

-- Allow authenticated users to upload to their own folder
CREATE POLICY "time_capsule_media_bucket_insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'time-capsule-media'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to read files (signed URLs handled by server)
CREATE POLICY "time_capsule_media_bucket_select"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'time-capsule-media'
  AND (
    -- Own files
    (storage.foldername(name))[1] = auth.uid()::text
    -- Or admin
    OR current_user_is_admin()
  )
);

-- Allow users to delete their own files
CREATE POLICY "time_capsule_media_bucket_delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'time-capsule-media'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE public.time_capsules IS 'Time-locked messages that unlock on a future date for recipients';
COMMENT ON COLUMN public.time_capsules.recipient_profile_id IS 'The intended recipient; NULL means "to my family" broadcast';
COMMENT ON COLUMN public.time_capsules.delivery_trigger IS 'When to deliver: date (specific date), after_passing (when creator marked deceased), event (future)';
COMMENT ON COLUMN public.time_capsules.delivery_status IS 'scheduled (waiting), delivered (opened), cancelled (deleted before delivery)';
COMMENT ON COLUMN public.time_capsules.media_type IS 'Type of attached media: audio, video, or image';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================

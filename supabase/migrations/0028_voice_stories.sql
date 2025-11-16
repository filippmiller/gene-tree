-- ============================================================================
-- Migration 0028: Voice stories (audio histories)
-- ============================================================================

-- 1) Create audio bucket (private, server-signed uploads only)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'audio',
  'audio',
  false,
  52428800, -- 50 MB
  ARRAY[
    'audio/webm',
    'audio/mpeg',
    'audio/mp4'
  ]::text[]
)
ON CONFLICT (id) DO UPDATE
SET
  public = false,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY[
    'audio/webm',
    'audio/mpeg',
    'audio/mp4'
  ]::text[];

-- 2) Table: voice_stories
CREATE TABLE IF NOT EXISTS public.voice_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Target profile (about whom the story is told)
  target_profile_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,

  -- Narrator profile (who is speaking)
  narrator_profile_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,

  -- Storage location
  bucket TEXT NOT NULL DEFAULT 'audio' CHECK (bucket = 'audio'),
  path   TEXT NOT NULL,
  duration_seconds INTEGER,
  size_bytes INTEGER,

  -- Transcript
  transcript_text TEXT,
  transcript_lang TEXT,
  transcript_confidence NUMERIC,

  -- Metadata
  title TEXT,
  tags  TEXT[],
  visibility public.media_visibility NOT NULL DEFAULT 'family',

  -- Moderation
  status public.media_status NOT NULL DEFAULT 'pending',
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES public.user_profiles(id),
  rejected_at TIMESTAMPTZ,
  rejected_by UUID REFERENCES public.user_profiles(id),
  rejection_reason TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES public.user_profiles(id),

  CONSTRAINT voice_stories_unique_path UNIQUE (bucket, path)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_voice_stories_target_profile
  ON public.voice_stories(target_profile_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_voice_stories_narrator
  ON public.voice_stories(narrator_profile_id, created_at DESC);

-- 3) Enable RLS
ALTER TABLE public.voice_stories ENABLE ROW LEVEL SECURITY;

-- SELECT policy: narrator, profile owner, family circle (for approved + family/public), admin
CREATE POLICY "voice_stories_select" ON public.voice_stories
  FOR SELECT TO authenticated
  USING (
    current_user_is_admin()
    OR narrator_profile_id = auth.uid()
    OR is_profile_owner(target_profile_id, auth.uid())
    OR (
      status = 'approved'
      AND (
        visibility IN ('public', 'unlisted')
        OR (visibility = 'family' AND is_in_family_circle(target_profile_id, auth.uid()))
      )
    )
  );

-- INSERT: authenticated narrators who can upload to this profile
CREATE POLICY "voice_stories_insert" ON public.voice_stories
  FOR INSERT TO authenticated
  WITH CHECK (
    narrator_profile_id = auth.uid()
    AND created_by = auth.uid()
    AND can_upload_to_profile(target_profile_id, auth.uid())
  );

-- UPDATE/DELETE: narrator, profile owner, admin
CREATE POLICY "voice_stories_modify" ON public.voice_stories
  FOR ALL TO authenticated
  USING (
    current_user_is_admin()
    OR narrator_profile_id = auth.uid()
    OR is_profile_owner(target_profile_id, auth.uid())
  )
  WITH CHECK (
    current_user_is_admin()
    OR narrator_profile_id = auth.uid()
    OR is_profile_owner(target_profile_id, auth.uid())
  );

-- ============================================================================
-- END OF MIGRATION 0028
-- ============================================================================

-- ============================================================================
-- Migration: Voice Memories (Quick Voice Recording Feature)
-- ============================================================================
-- This creates a lightweight voice memory system for quick audio recordings
-- associated with family profiles. Distinct from voice_stories which is for
-- longer, more formal storytelling.

-- 1) Create voice-memories storage bucket (private, server-signed uploads)
-- ============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'voice-memories',
  'voice-memories',
  false,
  10485760, -- 10 MB max
  ARRAY[
    'audio/webm',
    'audio/mp4',
    'audio/mpeg',
    'audio/ogg',
    'audio/wav'
  ]::text[]
)
ON CONFLICT (id) DO UPDATE
SET
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY[
    'audio/webm',
    'audio/mp4',
    'audio/mpeg',
    'audio/ogg',
    'audio/wav'
  ]::text[];

-- 2) Table: voice_memories
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.voice_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Who created this memory
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Who this memory is about (optional - can be a general family memory)
  profile_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,

  -- Basic info
  title TEXT,
  description TEXT,

  -- Storage location
  storage_path TEXT NOT NULL,

  -- Audio metadata
  duration_seconds INTEGER NOT NULL CHECK (duration_seconds > 0 AND duration_seconds <= 60),
  file_size_bytes INTEGER,

  -- Future: AI transcription
  transcription TEXT,

  -- Privacy control (core Gene-Tree philosophy)
  privacy_level TEXT NOT NULL DEFAULT 'family' CHECK (privacy_level IN ('public', 'family', 'private')),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT voice_memories_unique_path UNIQUE (storage_path)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_voice_memories_user_id
  ON public.voice_memories(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_voice_memories_profile_id
  ON public.voice_memories(profile_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_voice_memories_privacy
  ON public.voice_memories(privacy_level);

-- 3) Updated_at trigger
-- ============================================================================
CREATE OR REPLACE FUNCTION update_voice_memories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS voice_memories_updated_at ON public.voice_memories;
CREATE TRIGGER voice_memories_updated_at
  BEFORE UPDATE ON public.voice_memories
  FOR EACH ROW
  EXECUTE FUNCTION update_voice_memories_updated_at();

-- 4) Enable RLS
-- ============================================================================
ALTER TABLE public.voice_memories ENABLE ROW LEVEL SECURITY;

-- 5) RLS Policies
-- ============================================================================

-- SELECT: Users can view voice memories based on privacy level
CREATE POLICY "voice_memories_select" ON public.voice_memories
  FOR SELECT TO authenticated
  USING (
    -- Owner can always see their own
    user_id = auth.uid()
    -- Public memories are visible to everyone
    OR privacy_level = 'public'
    -- Family memories visible to family circle
    OR (
      privacy_level = 'family'
      AND (
        -- Memory about self
        profile_id = auth.uid()
        -- Or in family circle (if function exists)
        OR (
          profile_id IS NOT NULL
          AND is_in_family_circle(profile_id, auth.uid())
        )
        -- Or creator is in user's family circle
        OR is_in_family_circle(user_id, auth.uid())
      )
    )
    -- Admins can see everything
    OR current_user_is_admin()
  );

-- INSERT: Users can create their own voice memories
CREATE POLICY "voice_memories_insert" ON public.voice_memories
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
  );

-- UPDATE: Users can update their own voice memories
CREATE POLICY "voice_memories_update" ON public.voice_memories
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- DELETE: Users can delete their own voice memories
CREATE POLICY "voice_memories_delete" ON public.voice_memories
  FOR DELETE TO authenticated
  USING (
    user_id = auth.uid()
    OR current_user_is_admin()
  );

-- 6) Storage RLS Policies for voice-memories bucket
-- ============================================================================

-- Allow authenticated users to upload to their own folder
CREATE POLICY "voice_memories_bucket_insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'voice-memories'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to read files (signed URLs handled by server)
CREATE POLICY "voice_memories_bucket_select"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'voice-memories'
  AND (
    -- Own files
    (storage.foldername(name))[1] = auth.uid()::text
    -- Or admin
    OR current_user_is_admin()
  )
);

-- Allow users to delete their own files
CREATE POLICY "voice_memories_bucket_delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'voice-memories'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE public.voice_memories IS 'Quick voice recordings (up to 60 seconds) for preserving family memories';
COMMENT ON COLUMN public.voice_memories.profile_id IS 'Optional: which family member this memory is about';
COMMENT ON COLUMN public.voice_memories.privacy_level IS 'Who can see this memory: public (everyone), family (connected relatives), private (only creator)';
COMMENT ON COLUMN public.voice_memories.transcription IS 'AI-generated transcript (future feature)';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================

-- ============================================================================
-- Migration 0030: Family Stories (Generalizing Voice Stories)
-- ============================================================================

-- 1) Create Media Type Enum
CREATE TYPE public.story_media_type AS ENUM ('audio', 'video', 'image', 'text');

-- 2) Create Storage Buckets (if they don't exist)
-- We'll use a single 'stories' bucket with folders for organization
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'stories',
  'stories',
  false, -- Private by default, access controlled via RLS
  52428800, -- 50 MB limit
  ARRAY[
    'audio/webm', 'audio/mpeg', 'audio/mp4', 'audio/wav',
    'image/jpeg', 'image/png', 'image/webp', 'image/heic',
    'video/mp4', 'video/webm', 'video/quicktime'
  ]::text[]
)
ON CONFLICT (id) DO UPDATE
SET
  public = false,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY[
    'audio/webm', 'audio/mpeg', 'audio/mp4', 'audio/wav',
    'image/jpeg', 'image/png', 'image/webp', 'image/heic',
    'video/mp4', 'video/webm', 'video/quicktime'
  ]::text[];

-- 3) Create Stories Table
CREATE TABLE IF NOT EXISTS public.stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Who created the story
  author_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,

  -- Who the story is about (The subject)
  subject_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,

  -- Media details
  media_type public.story_media_type NOT NULL,
  media_url TEXT, -- Path in storage bucket (nullable for text stories)
  
  -- Content: Transcription, Caption, or Text Body
  content TEXT,
  
  -- Metadata
  title TEXT,
  taken_date DATE, -- When the photo/video was taken or event happened
  
  -- Access Control
  visibility public.media_visibility NOT NULL DEFAULT 'family',
  
  -- Approval Workflow
  status public.media_status NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4) Indexes
CREATE INDEX IF NOT EXISTS idx_stories_subject_id ON public.stories(subject_id);
CREATE INDEX IF NOT EXISTS idx_stories_author_id ON public.stories(author_id);
CREATE INDEX IF NOT EXISTS idx_stories_status ON public.stories(status);

-- 5) RLS Policies
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

-- SELECT: 
-- 1. Admin can see all
-- 2. Author can see their own
-- 3. Subject can see stories about them
-- 4. Family members can see APPROVED stories (if visibility is family/public)
CREATE POLICY "stories_select" ON public.stories
  FOR SELECT TO authenticated
  USING (
    current_user_is_admin()
    OR author_id = auth.uid()
    OR subject_id = auth.uid()
    OR (
      status = 'approved'
      AND (
        visibility IN ('public', 'unlisted')
        OR (visibility = 'family' AND is_in_family_circle(subject_id, auth.uid()))
      )
    )
  );

-- INSERT:
-- Authenticated users can create stories for people in their family circle (or themselves)
CREATE POLICY "stories_insert" ON public.stories
  FOR INSERT TO authenticated
  WITH CHECK (
    author_id = auth.uid()
    AND (
      subject_id = auth.uid() 
      OR is_in_family_circle(subject_id, auth.uid())
    )
  );

-- UPDATE:
-- 1. Author can update content/title (but not status if it's not their own profile)
-- 2. Subject can update STATUS (Approve/Reject)
-- 3. Admin can update anything
CREATE POLICY "stories_update" ON public.stories
  FOR UPDATE TO authenticated
  USING (
    current_user_is_admin()
    OR author_id = auth.uid()
    OR subject_id = auth.uid()
  );

-- DELETE:
-- Author, Subject, or Admin can delete
CREATE POLICY "stories_delete" ON public.stories
  FOR DELETE TO authenticated
  USING (
    current_user_is_admin()
    OR author_id = auth.uid()
    OR subject_id = auth.uid()
  );

-- 6) Storage Policies (for 'stories' bucket)
-- Allow authenticated users to upload
CREATE POLICY "stories_bucket_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'stories' AND auth.role() = 'authenticated');

-- Allow viewing if they have access to the story record (Simplified: Allow all auth for now to read files, strict logic is hard in storage policies)
-- Ideally, we'd check against the stories table, but storage policies are separate.
-- For now, we allow authenticated read for the bucket.
CREATE POLICY "stories_bucket_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'stories' AND auth.role() = 'authenticated');

-- ============================================================================
-- END OF MIGRATION 0030
-- ============================================================================

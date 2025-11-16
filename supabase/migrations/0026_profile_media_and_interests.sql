-- ============================================================================
-- Migration 0026: Profile media (videos) and interests
-- ============================================================================

-- 1) Extend media_type enum with 'video'
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'media_type' AND e.enumlabel = 'video'
  ) THEN
    ALTER TYPE public.media_type ADD VALUE 'video';
  END IF;
END$$;

-- 2) Allow video MIME types in 'media' bucket (up to existing 25MB limit)
UPDATE storage.buckets
SET allowed_mime_types = (
  CASE
    WHEN allowed_mime_types IS NULL THEN ARRAY['video/mp4','video/webm']::text[]
    ELSE allowed_mime_types || ARRAY['video/mp4','video/webm']::text[]
  END
)
WHERE id = 'media';

-- 3) Profile interests tables

CREATE TABLE IF NOT EXISTS public.profile_interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.profile_interest_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interest_id UUID NOT NULL REFERENCES public.profile_interests(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('photo','link','video')),
  photo_id UUID REFERENCES public.photos(id) ON DELETE SET NULL,
  url TEXT,
  title TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profile_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_interest_items ENABLE ROW LEVEL SECURITY;

-- RLS: owner (profile_id = auth.uid()) or admin can manage interests
CREATE POLICY IF NOT EXISTS "profile_interests_owner_all" ON public.profile_interests
  FOR ALL TO authenticated
  USING (profile_id = auth.uid() OR current_user_is_admin())
  WITH CHECK (profile_id = auth.uid() OR current_user_is_admin());

CREATE POLICY IF NOT EXISTS "profile_interest_items_owner_all" ON public.profile_interest_items
  FOR ALL TO authenticated
  USING (
    current_user_is_admin()
    OR EXISTS (
      SELECT 1 FROM public.profile_interests pi
      WHERE pi.id = profile_interest_items.interest_id
        AND pi.profile_id = auth.uid()
    )
  )
  WITH CHECK (
    current_user_is_admin()
    OR EXISTS (
      SELECT 1 FROM public.profile_interests pi
      WHERE pi.id = profile_interest_items.interest_id
        AND pi.profile_id = auth.uid()
    )
  );

-- ============================================================================
-- END OF MIGRATION 0026
-- ============================================================================

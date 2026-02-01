-- ============================================================================
-- Migration: Photo AI Enhancement Fields
-- Adds support for AI-enhanced photos (colorization, upscaling, restoration)
-- ============================================================================

-- 1) Create AI enhancement type enum
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ai_enhancement_type') THEN
    CREATE TYPE public.ai_enhancement_type AS ENUM (
      'colorization',
      'upscale',
      'restoration',
      'deblur'
    );
  END IF;
END $$;

-- 2) Add AI enhancement columns to photos table
-- ============================================================================

ALTER TABLE public.photos
ADD COLUMN IF NOT EXISTS ai_enhanced BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS ai_enhancement_type public.ai_enhancement_type,
ADD COLUMN IF NOT EXISTS original_photo_id UUID REFERENCES public.photos(id) ON DELETE SET NULL;

-- 3) Add index for AI enhanced photos
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_photos_ai_enhanced
  ON public.photos(ai_enhanced) WHERE ai_enhanced = TRUE;

CREATE INDEX IF NOT EXISTS idx_photos_original_photo
  ON public.photos(original_photo_id) WHERE original_photo_id IS NOT NULL;

-- 4) Add comments
-- ============================================================================

COMMENT ON COLUMN public.photos.ai_enhanced IS 'Whether this photo was enhanced by AI';
COMMENT ON COLUMN public.photos.ai_enhancement_type IS 'Type of AI enhancement applied (colorization, upscale, etc.)';
COMMENT ON COLUMN public.photos.original_photo_id IS 'Reference to the original photo if this is an AI-enhanced version';

-- 5) Relax CHECK constraint on photos table to allow auto-approved AI photos
-- ============================================================================

-- Drop existing check constraints that might conflict
ALTER TABLE public.photos DROP CONSTRAINT IF EXISTS check_approved_fields;
ALTER TABLE public.photos DROP CONSTRAINT IF EXISTS check_rejected_fields;

-- Add updated constraints that allow AI-enhanced photos to be auto-approved without approved_by
-- (AI-enhanced photos inherit approval from original)
ALTER TABLE public.photos ADD CONSTRAINT check_approved_fields CHECK (
  (status = 'approved' AND approved_at IS NOT NULL) OR
  (status != 'approved' AND approved_at IS NULL)
);

ALTER TABLE public.photos ADD CONSTRAINT check_rejected_fields CHECK (
  (status = 'rejected' AND rejected_at IS NOT NULL) OR
  (status != 'rejected' AND rejected_at IS NULL)
);

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================

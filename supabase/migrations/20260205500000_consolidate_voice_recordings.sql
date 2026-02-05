-- ============================================================================
-- Migration: Consolidate Voice Recording Systems
-- ============================================================================
-- Enhances voice_stories to be the single voice recording system.
-- Removes the never-deployed voice_memories table and bucket.
-- ============================================================================

-- 1) Add description field to voice_stories
-- ============================================================================
ALTER TABLE public.voice_stories
ADD COLUMN IF NOT EXISTS description TEXT;

COMMENT ON COLUMN public.voice_stories.description IS 'Optional context or notes about this voice recording';

-- 2) Drop voice_memories table (never deployed, migration file existed but was not applied)
-- ============================================================================
DROP TABLE IF EXISTS public.voice_memories CASCADE;

-- 3) Drop voice-memories storage bucket (if it exists)
-- ============================================================================
DELETE FROM storage.objects WHERE bucket_id = 'voice-memories';
DELETE FROM storage.buckets WHERE id = 'voice-memories';

-- 4) Update comments to reflect consolidated system
-- ============================================================================
COMMENT ON TABLE public.voice_stories IS 'Voice recordings (up to 5 minutes) for preserving family stories. Unified voice recording system.';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================

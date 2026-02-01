-- ============================================================================
-- Migration: Family Milestones System
-- Feature: Track milestones for family members (first steps, graduations, weddings)
-- ============================================================================

-- 1) Enum for milestone types
-- ============================================================================

CREATE TYPE public.milestone_category AS ENUM (
  'baby',        -- First steps, first word, first tooth, etc.
  'education',   -- Graduation, first day of school, etc.
  'career',      -- First job, promotion, retirement
  'relationship', -- Wedding, engagement, anniversary
  'life',        -- Birthday, moving to new home, etc.
  'custom'       -- User-defined milestones
);

-- 2) Main milestones table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Who this milestone is about
  profile_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,

  -- Who created this milestone entry
  created_by UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,

  -- Milestone classification
  milestone_type TEXT NOT NULL, -- e.g., 'first_steps', 'graduation', 'wedding', 'custom'
  category public.milestone_category NOT NULL DEFAULT 'custom',

  -- Content
  title TEXT NOT NULL,
  description TEXT,

  -- When the milestone occurred
  milestone_date DATE NOT NULL,

  -- Media attachments (array of storage paths in 'media' bucket)
  media_urls TEXT[] DEFAULT '{}',

  -- Visibility control
  visibility public.media_visibility NOT NULL DEFAULT 'family',

  -- Anniversary reminder settings
  remind_annually BOOLEAN DEFAULT false,
  reminder_days_before INTEGER DEFAULT 7 CHECK (reminder_days_before >= 0 AND reminder_days_before <= 30),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3) Indexes for performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_milestones_profile_id
  ON public.milestones(profile_id);

CREATE INDEX IF NOT EXISTS idx_milestones_created_by
  ON public.milestones(created_by);

CREATE INDEX IF NOT EXISTS idx_milestones_date
  ON public.milestones(milestone_date DESC);

CREATE INDEX IF NOT EXISTS idx_milestones_category
  ON public.milestones(category);

CREATE INDEX IF NOT EXISTS idx_milestones_type
  ON public.milestones(milestone_type);

-- Index for anniversary reminders (finding upcoming anniversaries)
CREATE INDEX IF NOT EXISTS idx_milestones_remind
  ON public.milestones(remind_annually, milestone_date)
  WHERE remind_annually = true;

-- 4) Trigger for updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_milestones_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_milestones_updated_at ON public.milestones;
CREATE TRIGGER trigger_milestones_updated_at
  BEFORE UPDATE ON public.milestones
  FOR EACH ROW
  EXECUTE FUNCTION update_milestones_updated_at();

-- 5) Row Level Security
-- ============================================================================

ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view milestones for profiles they are related to (family visibility)
-- or public milestones, or their own milestones
CREATE POLICY "milestones_select_policy" ON public.milestones
  FOR SELECT
  USING (
    -- Own milestones (created by or about the user)
    profile_id = auth.uid() OR
    created_by = auth.uid() OR
    -- Public milestones
    visibility = 'public' OR
    -- Family visibility - user is in the family circle
    (visibility = 'family' AND is_in_family_circle(profile_id, auth.uid()))
  );

-- Policy: Users can insert milestones for profiles they are related to
CREATE POLICY "milestones_insert_policy" ON public.milestones
  FOR INSERT
  WITH CHECK (
    -- Can create milestones for self
    profile_id = auth.uid() OR
    -- Can create milestones for family members
    is_in_family_circle(profile_id, auth.uid())
  );

-- Policy: Users can update their own milestones
CREATE POLICY "milestones_update_policy" ON public.milestones
  FOR UPDATE
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Policy: Users can delete their own milestones
CREATE POLICY "milestones_delete_policy" ON public.milestones
  FOR DELETE
  USING (created_by = auth.uid());

-- 6) Comments for documentation
-- ============================================================================

COMMENT ON TABLE public.milestones IS 'Family milestones tracker - first steps, graduations, weddings, etc.';
COMMENT ON COLUMN public.milestones.profile_id IS 'The person this milestone is about';
COMMENT ON COLUMN public.milestones.created_by IS 'The user who recorded this milestone';
COMMENT ON COLUMN public.milestones.milestone_type IS 'Specific type: first_steps, first_word, graduation, wedding, etc.';
COMMENT ON COLUMN public.milestones.category IS 'High-level category for filtering';
COMMENT ON COLUMN public.milestones.media_urls IS 'Array of storage paths in the media bucket';
COMMENT ON COLUMN public.milestones.remind_annually IS 'Whether to send anniversary reminders';
COMMENT ON COLUMN public.milestones.reminder_days_before IS 'Days before anniversary to send reminder';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================

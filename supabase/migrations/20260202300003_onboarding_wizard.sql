-- ============================================================================
-- Migration: Onboarding Wizard Support
-- ============================================================================
-- Add fields to track onboarding completion status
-- ============================================================================

-- 1. Add onboarding tracking fields to user_profiles
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 0;

-- 2. Add comment for documentation
COMMENT ON COLUMN public.user_profiles.onboarding_completed IS 'Whether the user has completed the onboarding wizard';
COMMENT ON COLUMN public.user_profiles.onboarding_completed_at IS 'Timestamp when onboarding was completed';
COMMENT ON COLUMN public.user_profiles.onboarding_step IS 'Current step in onboarding wizard (0-4)';

-- 3. Create index for finding users who haven't completed onboarding
CREATE INDEX IF NOT EXISTS idx_user_profiles_onboarding_incomplete
ON public.user_profiles(onboarding_completed)
WHERE onboarding_completed = false;

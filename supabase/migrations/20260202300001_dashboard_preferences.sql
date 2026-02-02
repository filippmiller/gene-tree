-- ============================================================================
-- Dashboard Preferences - Widget customization for users
-- Created: 2026-02-02
-- Purpose: Allow users to customize their dashboard by showing/hiding widgets
-- ============================================================================

-- Add dashboard_preferences JSONB column to user_profiles
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS dashboard_preferences JSONB DEFAULT '{
  "widgets": {
    "activity_feed": {"visible": true, "order": 0},
    "this_day": {"visible": true, "order": 1},
    "notifications": {"visible": true, "order": 2},
    "quick_actions": {"visible": true, "order": 3},
    "family_stats": {"visible": true, "order": 4},
    "explore_features": {"visible": true, "order": 5}
  },
  "layout": "default"
}'::jsonb;

-- Create index for faster JSONB queries if needed
CREATE INDEX IF NOT EXISTS idx_user_profiles_dashboard_preferences
ON public.user_profiles USING gin (dashboard_preferences);

-- Comment for documentation
COMMENT ON COLUMN public.user_profiles.dashboard_preferences IS
'User dashboard widget preferences including visibility and order';

-- ============================================================================
-- Migration: Online Presence Indicators
-- ============================================================================
-- Adds support for real-time presence tracking via Supabase Realtime
-- Features:
--   - last_seen_at: tracks when user was last active
--   - show_online_status: privacy control for presence visibility
-- ============================================================================

-- 1. Add presence columns to user_profiles
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS show_online_status BOOLEAN DEFAULT true;

-- 2. Create index for efficient presence queries
-- Only index users who have opted to show their online status
CREATE INDEX IF NOT EXISTS idx_user_profiles_presence
ON public.user_profiles(last_seen_at DESC)
WHERE show_online_status = true;

-- 3. Create index for privacy setting lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_show_online_status
ON public.user_profiles(id)
WHERE show_online_status = true;

-- 4. Function to update last_seen_at timestamp
-- Called when user activity is detected
CREATE OR REPLACE FUNCTION public.update_last_seen()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.user_profiles
  SET last_seen_at = NOW()
  WHERE id = auth.uid();
END;
$$;

-- 5. Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.update_last_seen() TO authenticated;

-- 6. Comments for documentation
COMMENT ON COLUMN public.user_profiles.last_seen_at IS 'Timestamp of last user activity for presence tracking';
COMMENT ON COLUMN public.user_profiles.show_online_status IS 'Privacy setting: whether to show online status to family members (default: true)';
COMMENT ON FUNCTION public.update_last_seen() IS 'Updates the last_seen_at timestamp for the authenticated user';

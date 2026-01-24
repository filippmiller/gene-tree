-- Migration 0036: Fix Critical Bugs
-- Fixes 4 critical issues found during testing:
-- 1. RLS policy blocks invitation lookup for unauthenticated users
-- 2. Database constraint blocks deceased relatives
-- 3. is_profile_owner function references non-existent owner_user_id column
-- 4. Ensure get_this_day_events function exists

-- ============================================
-- FIX #1: RLS Policy for Invitation Lookup
-- ============================================
-- Problem: The invite page queries pending_relatives by token, but RLS
-- only allows invited_by = auth.uid(). Unauthenticated users see "not found".
-- Solution: Add policy allowing anyone to view by invitation_token.

-- Drop existing policy if it exists (to avoid conflicts)
DROP POLICY IF EXISTS "Anyone can view invitation by token" ON public.pending_relatives;

-- Add policy for public invitation lookup by token
CREATE POLICY "Anyone can view invitation by token"
  ON public.pending_relatives
  FOR SELECT
  USING (invitation_token IS NOT NULL);

-- ============================================
-- FIX #2: Deceased Relatives Constraint
-- ============================================
-- Problem: email_or_phone_required constraint blocks adding deceased relatives
-- who don't have email/phone (memorial profiles).
-- Solution: Allow deceased relatives to skip contact requirement.
-- Note: is_deceased column already exists from migration 008_deceased_and_dob.sql

-- Drop the old constraint
ALTER TABLE public.pending_relatives
DROP CONSTRAINT IF EXISTS email_or_phone_required;

-- Add the new constraint that accounts for deceased relatives
ALTER TABLE public.pending_relatives
ADD CONSTRAINT email_or_phone_required CHECK (
  is_deceased = true OR email IS NOT NULL OR phone IS NOT NULL
);

-- ============================================
-- FIX #3: is_profile_owner Function
-- ============================================
-- Problem: Function references owner_user_id which doesn't exist in user_profiles.
-- In user_profiles, id IS the user's auth.users id (PRIMARY KEY REFERENCES auth.users(id)).
-- Solution: Fix the function to check profile_id = user_id.

CREATE OR REPLACE FUNCTION public.is_profile_owner(profile_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- In user_profiles, the id IS the auth.users id
  -- So we just check if profile_id equals user_id
  RETURN profile_id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- ============================================
-- FIX #4: Ensure get_this_day_events Function Exists
-- ============================================
-- Problem: Function might not exist if migrations weren't fully applied.
-- Solution: Recreate with CREATE OR REPLACE to ensure it exists.

-- Note: This function was defined in 0033_engagement_phase2.sql
-- We recreate it here to ensure it exists even if that migration had issues

CREATE OR REPLACE FUNCTION get_this_day_events(
  p_user_id UUID,
  p_month INTEGER DEFAULT NULL,
  p_day INTEGER DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  profile_id UUID,
  event_type TEXT,
  event_month INTEGER,
  event_day INTEGER,
  display_title TEXT,
  related_profile_id UUID,
  years_ago INTEGER,
  profile_first_name TEXT,
  profile_last_name TEXT,
  profile_avatar_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    dec.id,
    dec.profile_id,
    dec.event_type,
    dec.event_month,
    dec.event_day,
    dec.display_title,
    dec.related_profile_id,
    dec.years_ago,
    up.first_name,
    up.last_name,
    up.avatar_url
  FROM daily_events_cache dec
  JOIN user_profiles up ON dec.profile_id = up.id
  WHERE dec.event_month = COALESCE(p_month, EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER)
    AND dec.event_day = COALESCE(p_day, EXTRACT(DAY FROM CURRENT_DATE)::INTEGER)
    AND (dec.profile_id = p_user_id OR is_in_family_circle(dec.profile_id, p_user_id))
  ORDER BY
    CASE dec.event_type
      WHEN 'birthday' THEN 1
      WHEN 'anniversary' THEN 2
      WHEN 'death_commemoration' THEN 3
    END,
    dec.display_title;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = public;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON POLICY "Anyone can view invitation by token" ON public.pending_relatives IS
  'Allows unauthenticated users to view invitation pages by token';
COMMENT ON COLUMN public.pending_relatives.is_deceased IS
  'Whether this pending relative is deceased (memorial profile)';

-- ============================================================================
-- Migration 0032: Harden family circle helper function
-- ============================================================================

-- Limit function usage to the caller's own profile (or service role)
CREATE OR REPLACE FUNCTION public.get_family_circle_profile_ids(p_user_id UUID)
RETURNS TABLE(profile_id UUID) AS $$
BEGIN
  IF p_user_id IS NULL THEN
    RETURN;
  END IF;

  IF auth.role() IS DISTINCT FROM 'service_role' AND auth.uid() IS DISTINCT FROM p_user_id THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT up.id AS profile_id
  FROM public.user_profiles up
  WHERE is_in_family_circle(up.id, p_user_id);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.get_family_circle_profile_ids(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_family_circle_profile_ids(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_family_circle_profile_ids(UUID) TO service_role;

-- ============================================================================
-- END OF MIGRATION 0032
-- ============================================================================

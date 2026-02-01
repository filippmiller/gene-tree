-- Migration: Allow Service Role to manage relationships
-- Date: 2025-11-08
-- Description: Adds RLS policy to allow service role key to create relationships for testing

-- Add policy to allow service role to bypass RLS for relationships
CREATE POLICY "Service role can manage all relationships"
  ON public.relationships
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Add policy to allow service role to manage all profiles
CREATE POLICY "Service role can manage all profiles"
  ON public.user_profiles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Add policy to allow service role to manage all invitations
CREATE POLICY "Service role can manage all invitations"
  ON public.invitations
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

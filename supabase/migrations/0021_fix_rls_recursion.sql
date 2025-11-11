-- Fix infinite recursion in user_profiles RLS

-- Drop problematic policy
DROP POLICY IF EXISTS "Admins have full access" ON public.user_profiles;

-- Create non-recursive admin policy using a function
CREATE OR REPLACE FUNCTION public.current_user_is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT role = 'admin' 
    FROM public.user_profiles 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- New admin policy that doesn't cause recursion
CREATE POLICY "Admins have full access"
ON public.user_profiles
FOR ALL
TO authenticated
USING (public.current_user_is_admin())
WITH CHECK (public.current_user_is_admin());

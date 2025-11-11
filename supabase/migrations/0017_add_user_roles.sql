-- ============================================================================
-- Migration: Add user roles (admin/user)
-- ============================================================================

-- 1. Add role column to user_profiles
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user'));

-- 2. Create index for role queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_role 
ON public.user_profiles(role) WHERE role = 'admin';

-- 3. Set specific users as admins (by auth.users email)
UPDATE public.user_profiles
SET role = 'admin'
WHERE id IN (
    SELECT id FROM auth.users 
    WHERE email IN ('filippmiller@gmail.com', 'father@mail.ru')  -- замени father@mail.ru на реальный
);

-- 4. Create function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. RLS Policies for admin access
-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() IN (SELECT id FROM public.user_profiles WHERE role = 'admin')
);

-- Admins can update all profiles
CREATE POLICY "Admins can update all profiles"
ON public.user_profiles
FOR UPDATE
TO authenticated
USING (
  auth.uid() IN (SELECT id FROM public.user_profiles WHERE role = 'admin')
);

-- Admins can delete profiles
CREATE POLICY "Admins can delete profiles"
ON public.user_profiles
FOR DELETE
TO authenticated
USING (
  auth.uid() IN (SELECT id FROM public.user_profiles WHERE role = 'admin')
);

-- 6. Grant execute on is_admin function
GRANT EXECUTE ON FUNCTION public.is_admin TO authenticated;

-- 7. Add comment
COMMENT ON COLUMN public.user_profiles.role IS 
'User role: admin (full access) or user (limited access). Admins can manage all data.';

-- ============================================================================
-- RLS Policy Restoration for Gene Tree (Safe version)
-- Created: 2025-11-11
-- Purpose: Restore proper RLS policies - handles existing policies gracefully
-- ============================================================================

-- === ENABLE RLS ON TABLES ===
ALTER TABLE IF EXISTS public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.photos ENABLE ROW LEVEL SECURITY;

-- === CLEAN UP OLD POLICIES ===
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;

DROP POLICY IF EXISTS "Users can upload photos" ON public.photos;
DROP POLICY IF EXISTS "Users can view photos" ON public.photos;
DROP POLICY IF EXISTS "Users can update photos" ON public.photos;

-- === USER_PROFILES POLICIES ===

CREATE POLICY "Users can view own profile"
ON public.user_profiles FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
ON public.user_profiles FOR UPDATE
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Users can insert own profile"
ON public.user_profiles FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- === PHOTOS POLICIES ===

CREATE POLICY "Users can upload photos"
ON public.photos FOR INSERT
TO authenticated
WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY "Users can view photos"
ON public.photos FOR SELECT
TO authenticated
USING (uploaded_by = auth.uid() OR status = 'approved');

CREATE POLICY "Users can update photos"
ON public.photos FOR UPDATE
TO authenticated
USING (uploaded_by = auth.uid());

-- === STORAGE RLS ===
-- Note: Storage policies are handled via RLS on storage.objects in other migrations

-- === TRIGGER: Auto-create user_profile on signup ===
CREATE OR REPLACE FUNCTION public.ensure_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (
    id,
    first_name,
    last_name
  )
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'first_name', ''),
    COALESCE(new.raw_user_meta_data->>'last_name', '')
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_user_profile();

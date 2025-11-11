-- ============================================================================
-- RLS Policy Restoration for Gene Tree
-- Created: 2025-11-11
-- Purpose: Restore proper RLS policies for tables and storage after refactoring
-- ============================================================================

-- === ENABLE RLS ON TABLES ===
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;

-- === CLEAN UP OLD POLICIES ===
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;

DROP POLICY IF EXISTS "Users can upload photos" ON public.photos;
DROP POLICY IF EXISTS "Users can view photos" ON public.photos;
DROP POLICY IF EXISTS "Users can update photos" ON public.photos;

-- === USER_PROFILES POLICIES ===
-- Владелец = id (совпадает с auth.uid())

-- 1. View own profile
CREATE POLICY "Users can view own profile"
ON public.user_profiles FOR SELECT
TO authenticated
USING (id = auth.uid());

-- 2. Update own profile
CREATE POLICY "Users can update own profile"
ON public.user_profiles FOR UPDATE
TO authenticated
USING (id = auth.uid());

-- 3. Insert own profile (for trigger or manual creation)
CREATE POLICY "Users can insert own profile"
ON public.user_profiles FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- === PHOTOS POLICIES ===
-- uploaded_by contains the user's UUID

-- 1. Upload photos
CREATE POLICY "Users can upload photos"
ON public.photos FOR INSERT
TO authenticated
WITH CHECK (uploaded_by = auth.uid());

-- 2. View own photos OR approved photos
CREATE POLICY "Users can view photos"
ON public.photos FOR SELECT
TO authenticated
USING (uploaded_by = auth.uid() OR status = 'approved');

-- 3. Update own photos
CREATE POLICY "Users can update photos"
ON public.photos FOR UPDATE
TO authenticated
USING (uploaded_by = auth.uid());

-- === STORAGE RLS ===
-- Path structure: {bucket}/{user_id}/filename
-- We check that folder name matches auth.uid()

-- Configure avatars bucket as public
UPDATE storage.buckets SET public = true WHERE id = 'avatars';

-- Clean old storage policies
DELETE FROM storage.policies WHERE bucket_id = 'avatars';

-- Avatars: Users can upload to their own folder
INSERT INTO storage.policies (name, bucket_id, definition, action, role)
VALUES (
  'Users can upload own avatar',
  'avatars',
  '(bucket_id = ''avatars''::text) AND (auth.uid()::text = (storage.foldername(name))[1])',
  'insert',
  'authenticated'
);

-- Avatars: Public read access
INSERT INTO storage.policies (name, bucket_id, definition, action, role)
VALUES (
  'Public read avatars',
  'avatars',
  '(bucket_id = ''avatars''::text)',
  'select',
  'public'
);

-- Avatars: Users can update own avatar
INSERT INTO storage.policies (name, bucket_id, definition, action, role)
VALUES (
  'Users can update own avatar',
  'avatars',
  '(bucket_id = ''avatars''::text) AND (auth.uid()::text = (storage.foldername(name))[1])',
  'update',
  'authenticated'
);

-- Media bucket (private by default)
UPDATE storage.buckets SET public = false WHERE id = 'media';

-- Clean old media policies
DELETE FROM storage.policies WHERE bucket_id = 'media';

-- Media: Users can upload to their own folder
INSERT INTO storage.policies (name, bucket_id, definition, action, role)
VALUES (
  'Users can upload own media',
  'media',
  '(bucket_id = ''media''::text) AND (auth.uid()::text = (storage.foldername(name))[1])',
  'insert',
  'authenticated'
);

-- Media: Owner can view own media
INSERT INTO storage.policies (name, bucket_id, definition, action, role)
VALUES (
  'Owner can view own media',
  'media',
  '(bucket_id = ''media''::text) AND (auth.uid()::text = (storage.foldername(name))[1])',
  'select',
  'authenticated'
);

-- Media: Owner can update own media
INSERT INTO storage.policies (name, bucket_id, definition, action, role)
VALUES (
  'Owner can update own media',
  'media',
  '(bucket_id = ''media''::text) AND (auth.uid()::text = (storage.foldername(name))[1])',
  'update',
  'authenticated'
);

-- === TRIGGER: Auto-create user_profile on signup ===
CREATE OR REPLACE FUNCTION public.ensure_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert user_profiles row when auth.users row is created
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

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_user_profile();

-- === VERIFICATION QUERIES ===
-- Run these manually to verify policies are active:
-- 
-- SELECT * FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_profiles';
-- SELECT * FROM pg_policies WHERE schemaname = 'public' AND tablename = 'photos';
-- SELECT * FROM storage.policies WHERE bucket_id IN ('avatars', 'media');

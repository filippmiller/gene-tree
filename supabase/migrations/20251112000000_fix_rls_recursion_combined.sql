-- ============================================================================
-- Fix RLS Infinite Recursion - Combined Fix
-- Created: 2025-11-12
-- Purpose: Fix recursion in storage + user_profiles policies
-- ============================================================================

-- STEP 1: Drop problematic admin policy on user_profiles
DROP POLICY IF EXISTS "Admins have full access" ON public.user_profiles;

-- STEP 2: Fix current_user_is_admin() function to bypass RLS
CREATE OR REPLACE FUNCTION public.current_user_is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  -- Direct query bypassing RLS (SECURITY DEFINER runs as owner)
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_profiles
    WHERE id = auth.uid() 
      AND role = 'admin'
  );
$$;

-- STEP 3: Drop old storage policies that use current_user_is_admin()
DROP POLICY IF EXISTS "media_select_policy" ON storage.objects;
DROP POLICY IF EXISTS "media_delete_policy" ON storage.objects;
DROP POLICY IF EXISTS "media_insert_policy" ON storage.objects;
DROP POLICY IF EXISTS "media_update_policy" ON storage.objects;

-- STEP 4: Recreate media bucket policies WITHOUT admin checks
CREATE POLICY "media_bucket_insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'media'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "media_bucket_update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'media'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'media'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "media_bucket_delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'media'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "media_bucket_select"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'media'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- NOTE: For admin operations, use service role key which bypasses RLS entirely

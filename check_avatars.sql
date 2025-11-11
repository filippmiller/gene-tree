-- ============================================================================
-- AVATAR STORAGE DIAGNOSTIC QUERIES
-- Run these in Supabase Dashboard → SQL Editor
-- ============================================================================

-- 1. CHECK: How many files in avatars bucket?
-- ============================================================================
SELECT 
  name as file_name,
  id as storage_id,
  created_at,
  metadata->>'size' as size_bytes,
  metadata->>'mimetype' as mime_type
FROM storage.objects
WHERE bucket_id = 'avatars'
ORDER BY created_at DESC;

-- Expected: Should see all 10+ uploads you made


-- 2. CHECK: How many photo records exist?
-- ============================================================================
SELECT 
  id,
  path,
  uploaded_by,
  target_profile_id,
  status,
  visibility,
  created_at
FROM photos
WHERE bucket = 'avatars' AND type = 'avatar'
ORDER BY created_at DESC;

-- Expected: Should match storage.objects count


-- 3. CHECK: What's in YOUR user profile?
-- ============================================================================
-- Replace 'YOUR_USER_ID' with your actual auth.users ID
SELECT 
  id,
  first_name,
  last_name,
  avatar_url,
  current_avatar_id,
  created_at,
  updated_at
FROM user_profiles
WHERE id = 'YOUR_USER_ID';

-- Expected: avatar_url should have a URL, current_avatar_id should have UUID
-- If both NULL → UPDATE is failing!


-- 4. CHECK: Join everything together (full picture)
-- ============================================================================
SELECT 
  up.id as profile_id,
  up.first_name,
  up.avatar_url as profile_avatar_url,
  p.id as photo_id,
  p.path as photo_path,
  p.created_at as photo_uploaded_at,
  so.name as storage_file_name,
  so.created_at as storage_created_at
FROM user_profiles up
LEFT JOIN photos p ON p.id = up.current_avatar_id
LEFT JOIN storage.objects so ON so.name = p.path AND so.bucket_id = 'avatars'
WHERE up.id = 'YOUR_USER_ID';

-- This shows if profile → photo → storage chain is connected


-- ============================================================================
-- CLEANUP: Delete orphaned avatars (files without photo records)
-- ============================================================================

-- 5. FIND: Orphaned files in storage (no matching photo record)
-- ============================================================================
SELECT 
  so.name,
  so.id,
  so.created_at
FROM storage.objects so
WHERE so.bucket_id = 'avatars'
  AND NOT EXISTS (
    SELECT 1 FROM photos p 
    WHERE p.bucket = 'avatars' 
      AND p.path = so.name
  )
ORDER BY so.created_at DESC;

-- These are files that were uploaded but photo record creation failed


-- 6. DELETE: Remove orphaned storage files (BE CAREFUL!)
-- ============================================================================
-- ONLY RUN THIS IF YOU'RE SURE!
-- This deletes files from storage that don't have photo records

-- DELETE FROM storage.objects
-- WHERE bucket_id = 'avatars'
--   AND NOT EXISTS (
--     SELECT 1 FROM photos p 
--     WHERE p.bucket = 'avatars' 
--       AND p.path = storage.objects.name
--   );


-- 7. DELETE: Remove orphaned photo records (no file in storage)
-- ============================================================================
-- ONLY RUN THIS IF YOU'RE SURE!

-- DELETE FROM photos
-- WHERE bucket = 'avatars'
--   AND NOT EXISTS (
--     SELECT 1 FROM storage.objects so
--     WHERE so.bucket_id = 'avatars'
--       AND so.name = photos.path
--   );


-- ============================================================================
-- MANUAL FIX: Set avatar_url manually if needed
-- ============================================================================

-- 8. If you know which file you want as avatar:
-- ============================================================================
-- First, get the latest photo ID for your user:
SELECT id, path, created_at 
FROM photos 
WHERE uploaded_by = 'YOUR_USER_ID' 
  AND type = 'avatar'
ORDER BY created_at DESC 
LIMIT 1;

-- Then manually set it:
-- UPDATE user_profiles
-- SET 
--   current_avatar_id = 'PHOTO_ID_FROM_ABOVE',
--   avatar_url = 'https://YOUR_SUPABASE_URL/storage/v1/object/public/avatars/YOUR_FILE_PATH'
-- WHERE id = 'YOUR_USER_ID';


-- ============================================================================
-- DEBUGGING: Check RLS policies on user_profiles
-- ============================================================================

-- 9. What policies exist on user_profiles?
-- ============================================================================
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'user_profiles';

-- Look for policies that affect UPDATE operations


-- ============================================================================
-- TEST: Can service role update?
-- ============================================================================

-- 10. Test if UPDATE works at all
-- ============================================================================
-- This should work if service role has permission
UPDATE user_profiles
SET avatar_url = 'test_' || now()::text
WHERE id = 'YOUR_USER_ID';

-- If this fails → service role doesn't have permission
-- If this succeeds → API code has a bug


-- ============================================================================
-- QUICK STATS
-- ============================================================================

-- 11. Summary of avatar situation
-- ============================================================================
SELECT 
  'Storage Files' as type,
  COUNT(*) as count
FROM storage.objects
WHERE bucket_id = 'avatars'

UNION ALL

SELECT 
  'Photo Records' as type,
  COUNT(*) as count
FROM photos
WHERE bucket = 'avatars'

UNION ALL

SELECT 
  'Profiles with Avatar' as type,
  COUNT(*) as count
FROM user_profiles
WHERE avatar_url IS NOT NULL;

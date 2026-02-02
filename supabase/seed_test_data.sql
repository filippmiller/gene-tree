-- Smart Invite Guard Test Data
-- Run this in Supabase Dashboard > SQL Editor
-- This creates test scenarios for validating the invite guard feature

-- ============================================
-- CLEANUP (run first if re-seeding)
-- ============================================

-- Delete test pending invites
DELETE FROM pending_relatives WHERE email LIKE '%@genetree.test';

-- Delete test user profiles (auth users must be deleted via Dashboard > Auth)
DELETE FROM user_profiles WHERE id IN (
  SELECT id FROM auth.users WHERE email LIKE '%@genetree.test'
);

-- ============================================
-- IMPORTANT: Create auth users via Supabase Dashboard
-- ============================================
-- Go to: Authentication > Users > Add User
-- Create these users manually:
--
-- 1. test.main@genetree.test (Password: TestPassword123!)
-- 2. test.family@genetree.test (Password: TestPassword123!)
-- 3. test.external@genetree.test (Password: TestPassword123!)
--
-- Then run the queries below to set up profiles and relationships.

-- ============================================
-- After creating auth users, get their IDs:
-- ============================================

-- Run this to see the IDs:
-- SELECT id, email FROM auth.users WHERE email LIKE '%@genetree.test';

-- Replace these with actual UUIDs from the query above:
-- Example:
-- DO $$
-- DECLARE
--   main_user_id UUID := '11111111-1111-1111-1111-111111111111';
--   family_user_id UUID := '22222222-2222-2222-2222-222222222222';
--   external_user_id UUID := '33333333-3333-3333-3333-333333333333';
-- BEGIN
--   -- Create profiles and relationships here
-- END $$;

-- ============================================
-- ALTERNATIVE: Use existing users for testing
-- ============================================

-- If you have an existing account, you can test with:
-- 1. Your own email -> Should return SELF_INVITE
-- 2. A pending invite email (create one below)
-- 3. Another user's email in your family tree

-- Create a pending invite for testing:
-- Replace 'YOUR_USER_ID' with your actual user ID
-- INSERT INTO pending_relatives (
--   invited_by,
--   email,
--   first_name,
--   last_name,
--   relationship_type,
--   status,
--   invitation_token
-- ) VALUES (
--   'YOUR_USER_ID'::uuid,
--   'test.pending@example.com',
--   'Pending',
--   'TestUser',
--   'cousin',
--   'pending',
--   gen_random_uuid()
-- );

-- ============================================
-- VERIFY TEST DATA
-- ============================================

-- Check pending invites:
-- SELECT id, email, first_name, status, invited_by FROM pending_relatives
-- WHERE email LIKE '%test%' OR email LIKE '%example%';

-- Check user profiles:
-- SELECT p.id, p.first_name, p.last_name, u.email
-- FROM user_profiles p
-- JOIN auth.users u ON u.id = p.id
-- WHERE u.email LIKE '%@genetree.test';

-- Check relationships:
-- SELECT * FROM relationships WHERE from_user_id IN (
--   SELECT id FROM auth.users WHERE email LIKE '%@genetree.test'
-- );

-- Delete user from Supabase Auth
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/mbntpsfllwhlnzuzspvp/sql

-- Delete user by email
DELETE FROM auth.users 
WHERE email = 'filippmiller@gmail.com';

-- Or delete by user ID (if you know it)
-- DELETE FROM auth.users 
-- WHERE id = '5fc9fc2e-df22-4c90-a3b7-2b020f36d871';

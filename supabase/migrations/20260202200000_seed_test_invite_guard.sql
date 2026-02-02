-- Smart Invite Guard Test Data Seed
-- Creates test scenarios for validating the invite guard feature
-- This migration is idempotent and can be re-run safely

-- ============================================
-- Create test pending invitation
-- ============================================

-- First, get any existing user to be the inviter
-- We'll use the first user we find
DO $$
DECLARE
  v_inviter_id UUID;
BEGIN
  -- Get first available user
  SELECT id INTO v_inviter_id FROM auth.users LIMIT 1;

  IF v_inviter_id IS NOT NULL THEN
    -- Create a pending invite for testing PENDING_INVITE scenario
    INSERT INTO pending_relatives (
      invited_by,
      email,
      phone,
      first_name,
      last_name,
      relationship_type,
      status,
      invitation_token,
      created_at
    ) VALUES (
      v_inviter_id,
      'test.pending.invite@genetree.test',
      '+15551234567',
      'Pending',
      'TestInvite',
      'cousin',
      'pending',
      gen_random_uuid(),
      NOW() - INTERVAL '2 days'
    )
    ON CONFLICT DO NOTHING;

    -- Create another pending invite (expired)
    INSERT INTO pending_relatives (
      invited_by,
      email,
      first_name,
      last_name,
      relationship_type,
      status,
      invitation_token,
      created_at
    ) VALUES (
      v_inviter_id,
      'test.expired.invite@genetree.test',
      'Expired',
      'TestInvite',
      'aunt',
      'expired',
      gen_random_uuid(),
      NOW() - INTERVAL '30 days'
    )
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Created test pending invites with inviter: %', v_inviter_id;
  ELSE
    RAISE NOTICE 'No users found - skipping test data creation';
  END IF;
END $$;

-- ============================================
-- VERIFICATION QUERIES (for manual testing)
-- ============================================

-- List all test pending invites:
-- SELECT id, email, phone, first_name, last_name, status, invited_by, created_at
-- FROM pending_relatives
-- WHERE email LIKE '%@genetree.test'
-- ORDER BY created_at DESC;

-- List all users (for finding emails to test):
-- SELECT id, email, created_at FROM auth.users ORDER BY created_at DESC LIMIT 10;

-- ============================================
-- TEST SCENARIOS CREATED:
-- ============================================
--
-- 1. PENDING_INVITE:
--    Email: test.pending.invite@genetree.test
--    Phone: +15551234567
--    Status: pending
--
-- 2. EXPIRED_INVITE:
--    Email: test.expired.invite@genetree.test
--    Status: expired
--
-- To test other scenarios:
-- - SELF_INVITE: Use your own email
-- - OK_TO_INVITE: Use any new email like random123@example.com
-- - EXISTING_MEMBER: Use another family member's email
-- - POTENTIAL_BRIDGE: Create another user not in your family

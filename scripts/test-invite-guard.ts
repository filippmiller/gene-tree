/**
 * Test Script: Smart Invite Guard
 *
 * Creates test users and validates all 5 status outcomes:
 * 1. OK_TO_INVITE - New email/phone
 * 2. SELF_INVITE - User's own email
 * 3. EXISTING_MEMBER - Email of family member
 * 4. PENDING_INVITE - Email with pending invitation
 * 5. POTENTIAL_BRIDGE - Email of user outside family tree
 *
 * Run: npx ts-node scripts/test-invite-guard.ts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Test user data
const TEST_USERS = {
  // Main test user (the one making invitations)
  main: {
    email: 'test.main@genetree.test',
    password: 'TestPassword123!',
    firstName: 'Test',
    lastName: 'MainUser',
  },
  // Family member (in same family circle)
  familyMember: {
    email: 'test.family@genetree.test',
    password: 'TestPassword123!',
    firstName: 'Family',
    lastName: 'Member',
  },
  // External user (not in family circle)
  external: {
    email: 'test.external@genetree.test',
    password: 'TestPassword123!',
    firstName: 'External',
    lastName: 'User',
  },
  // Pending invite recipient
  pending: {
    email: 'test.pending@genetree.test',
    firstName: 'Pending',
    lastName: 'Invite',
  },
};

interface TestResult {
  scenario: string;
  expected: string;
  actual: string;
  passed: boolean;
  details?: any;
}

const results: TestResult[] = [];

async function cleanup() {
  console.log('\n🧹 Cleaning up existing test data...');

  // Delete test users by email pattern
  const { data: users } = await supabase.auth.admin.listUsers();
  const testUsers = users?.users?.filter(u => u.email?.includes('@genetree.test')) || [];

  for (const user of testUsers) {
    await supabase.from('user_profiles').delete().eq('id', user.id);
    await supabase.from('pending_relatives').delete().eq('invited_by', user.id);
    await supabase.from('relationships').delete().or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`);
    await supabase.auth.admin.deleteUser(user.id);
    console.log(`  Deleted user: ${user.email}`);
  }

  // Delete pending invites by email
  await supabase.from('pending_relatives').delete().like('email', '%@genetree.test');

  console.log('  Cleanup complete.\n');
}

async function createTestUser(userData: typeof TEST_USERS.main): Promise<string | null> {
  console.log(`  Creating user: ${userData.email}`);

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: userData.email,
    password: userData.password,
    email_confirm: true,
  });

  if (authError) {
    console.error(`  Error creating auth user: ${authError.message}`);
    return null;
  }

  const userId = authData.user.id;

  // Create profile
  const { error: profileError } = await supabase.from('user_profiles').insert({
    id: userId,
    first_name: userData.firstName,
    last_name: userData.lastName,
    is_living: true,
  });

  if (profileError) {
    console.error(`  Error creating profile: ${profileError.message}`);
    return null;
  }

  console.log(`  Created user ${userData.email} with ID: ${userId}`);
  return userId;
}

async function createPendingInvite(invitedBy: string, email: string, firstName: string, lastName: string) {
  console.log(`  Creating pending invite for: ${email}`);

  const { error } = await supabase.from('pending_relatives').insert({
    invited_by: invitedBy,
    email: email,
    first_name: firstName,
    last_name: lastName,
    relationship_type: 'cousin',
    status: 'pending',
    invitation_token: crypto.randomUUID(),
  });

  if (error) {
    console.error(`  Error creating pending invite: ${error.message}`);
    return false;
  }

  console.log(`  Created pending invite for ${email}`);
  return true;
}

async function createFamilyRelationship(fromId: string, toId: string) {
  console.log(`  Creating family relationship...`);

  const { error } = await supabase.from('relationships').insert({
    from_user_id: fromId,
    to_user_id: toId,
    relationship_type: 'sibling',
    is_verified: true,
  });

  if (error) {
    console.error(`  Error creating relationship: ${error.message}`);
    return false;
  }

  console.log(`  Created sibling relationship`);
  return true;
}

async function testInviteGuard(sessionToken: string, email: string | null, phone: string | null): Promise<any> {
  const response = await fetch(`${SUPABASE_URL.replace('54321', '3000')}/api/invitations/check`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `sb-127-auth-token=${sessionToken}`,
    },
    body: JSON.stringify({ email, phone }),
  });

  return response.json();
}

async function signInUser(email: string, password: string): Promise<string | null> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error(`  Sign in error: ${error.message}`);
    return null;
  }

  return data.session?.access_token || null;
}

async function runTests() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('    SMART INVITE GUARD - Integration Tests');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Cleanup first
  await cleanup();

  // Create test users
  console.log('📦 Setting up test data...\n');

  const mainUserId = await createTestUser(TEST_USERS.main);
  const familyMemberId = await createTestUser(TEST_USERS.familyMember);
  const externalUserId = await createTestUser(TEST_USERS.external);

  if (!mainUserId || !familyMemberId || !externalUserId) {
    console.error('❌ Failed to create test users. Aborting.');
    return;
  }

  // Create family relationship between main and familyMember
  await createFamilyRelationship(mainUserId, familyMemberId);

  // Create pending invite
  await createPendingInvite(mainUserId, TEST_USERS.pending.email, TEST_USERS.pending.firstName, TEST_USERS.pending.lastName);

  console.log('\n✅ Test data setup complete.\n');

  // Sign in as main user
  console.log('🔐 Signing in as main test user...');
  const sessionToken = await signInUser(TEST_USERS.main.email, TEST_USERS.main.password);

  if (!sessionToken) {
    console.error('❌ Failed to sign in. Aborting.');
    return;
  }

  console.log('✅ Signed in successfully.\n');

  // Run tests
  console.log('═══════════════════════════════════════════════════════════');
  console.log('    Running Tests');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Test 1: OK_TO_INVITE - New email
  console.log('Test 1: OK_TO_INVITE (new email)');
  try {
    const result = await testInviteGuard(sessionToken, 'brand.new@email.com', null);
    results.push({
      scenario: 'New email (not in system)',
      expected: 'OK_TO_INVITE',
      actual: result.status || result.error || 'ERROR',
      passed: result.status === 'OK_TO_INVITE',
      details: result,
    });
    console.log(`  Result: ${result.status || result.error}`);
  } catch (e) {
    console.log(`  Error: ${e}`);
  }

  // Test 2: SELF_INVITE - Own email
  console.log('\nTest 2: SELF_INVITE (own email)');
  try {
    const result = await testInviteGuard(sessionToken, TEST_USERS.main.email, null);
    results.push({
      scenario: 'Own email (self-invite)',
      expected: 'SELF_INVITE',
      actual: result.status || result.error || 'ERROR',
      passed: result.status === 'SELF_INVITE',
      details: result,
    });
    console.log(`  Result: ${result.status || result.error}`);
  } catch (e) {
    console.log(`  Error: ${e}`);
  }

  // Test 3: EXISTING_MEMBER - Family member's email
  console.log('\nTest 3: EXISTING_MEMBER (family member email)');
  try {
    const result = await testInviteGuard(sessionToken, TEST_USERS.familyMember.email, null);
    results.push({
      scenario: 'Family member email',
      expected: 'EXISTING_MEMBER',
      actual: result.status || result.error || 'ERROR',
      passed: result.status === 'EXISTING_MEMBER',
      details: result,
    });
    console.log(`  Result: ${result.status || result.error}`);
    if (result.existingMember) {
      console.log(`  Found: ${result.existingMember.firstName} ${result.existingMember.lastName}`);
    }
  } catch (e) {
    console.log(`  Error: ${e}`);
  }

  // Test 4: PENDING_INVITE - Email with pending invitation
  console.log('\nTest 4: PENDING_INVITE (pending invitation email)');
  try {
    const result = await testInviteGuard(sessionToken, TEST_USERS.pending.email, null);
    results.push({
      scenario: 'Pending invitation email',
      expected: 'PENDING_INVITE',
      actual: result.status || result.error || 'ERROR',
      passed: result.status === 'PENDING_INVITE',
      details: result,
    });
    console.log(`  Result: ${result.status || result.error}`);
    if (result.pendingInvite) {
      console.log(`  Found: ${result.pendingInvite.firstName} ${result.pendingInvite.lastName}`);
    }
  } catch (e) {
    console.log(`  Error: ${e}`);
  }

  // Test 5: POTENTIAL_BRIDGE - External user's email
  console.log('\nTest 5: POTENTIAL_BRIDGE (external user email)');
  try {
    const result = await testInviteGuard(sessionToken, TEST_USERS.external.email, null);
    results.push({
      scenario: 'External user email (not in family)',
      expected: 'POTENTIAL_BRIDGE',
      actual: result.status || result.error || 'ERROR',
      passed: result.status === 'POTENTIAL_BRIDGE',
      details: result,
    });
    console.log(`  Result: ${result.status || result.error}`);
    if (result.bridgeCandidate) {
      console.log(`  Bridge candidate exists: ${result.bridgeCandidate.exists}`);
    }
  } catch (e) {
    console.log(`  Error: ${e}`);
  }

  // Print summary
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('    Test Results Summary');
  console.log('═══════════════════════════════════════════════════════════\n');

  let passed = 0;
  let failed = 0;

  for (const result of results) {
    const icon = result.passed ? '✅' : '❌';
    console.log(`${icon} ${result.scenario}`);
    console.log(`   Expected: ${result.expected}`);
    console.log(`   Actual:   ${result.actual}`);
    if (result.passed) {
      passed++;
    } else {
      failed++;
      console.log(`   Details:  ${JSON.stringify(result.details)}`);
    }
    console.log('');
  }

  console.log('───────────────────────────────────────────────────────────');
  console.log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed}`);
  console.log('───────────────────────────────────────────────────────────\n');

  if (failed === 0) {
    console.log('🎉 All tests passed!\n');
  } else {
    console.log('⚠️  Some tests failed. Check the details above.\n');
  }

  // Cleanup
  console.log('🧹 Cleaning up test data...');
  await cleanup();
  console.log('Done.\n');
}

// Run
runTests().catch(console.error);

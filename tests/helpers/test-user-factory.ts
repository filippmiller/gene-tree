/**
 * Test User Factory
 *
 * Creates and deletes test users via Supabase Admin API.
 * All test users use the email pattern: e2e-test-{timestamp}-{suffix}@test.gene-tree.app
 * Password: TestPass123!
 *
 * Uses SUPABASE_SERVICE_ROLE_KEY for admin operations.
 */

import { createClient } from '@supabase/supabase-js';

const TEST_PASSWORD = 'TestPass123!';
const TEST_EMAIL_PREFIX = 'e2e-test';
const TEST_EMAIL_DOMAIN = 'test.gene-tree.app';

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing SUPABASE env vars for test-user-factory');
  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function generateTestEmail(suffix?: string): string {
  const timestamp = Date.now();
  const sfx = suffix || Math.random().toString(36).substring(2, 8);
  return `${TEST_EMAIL_PREFIX}-${timestamp}-${sfx}@${TEST_EMAIL_DOMAIN}`;
}

export interface TestUser {
  id: string;
  email: string;
  password: string;
}

/**
 * Create a test user with auto-confirmed email.
 * Optionally creates a user_profiles row.
 */
export async function createTestUser(options?: {
  name?: string;
  email?: string;
  createProfile?: boolean;
}): Promise<TestUser> {
  const admin = getAdminClient();
  const email = options?.email || generateTestEmail();
  const name = options?.name || 'E2E Test User';

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: TEST_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: name },
  });

  if (error) {
    throw new Error(`Failed to create test user: ${error.message}`);
  }

  const userId = data.user.id;

  // Optionally create profile
  if (options?.createProfile !== false) {
    const [firstName, ...lastParts] = name.split(' ');
    const lastName = lastParts.join(' ') || 'User';

    const { error: profileError } = await admin
      .from('user_profiles')
      .upsert({
        id: userId,
        first_name: firstName,
        last_name: lastName,
        onboarding_completed: false,
      });

    if (profileError) {
      console.warn(`Profile creation warning: ${profileError.message}`);
    }
  }

  return { id: userId, email, password: TEST_PASSWORD };
}

/**
 * Create a test user that has completed onboarding.
 */
export async function createOnboardedTestUser(options?: {
  name?: string;
  email?: string;
}): Promise<TestUser> {
  const user = await createTestUser({
    ...options,
    createProfile: true,
  });

  const admin = getAdminClient();

  await admin
    .from('user_profiles')
    .update({ onboarding_completed: true })
    .eq('id', user.id);

  return user;
}

/**
 * Create a deceased relative person (no auth user) linked to an existing user.
 */
export async function createTestRelative(options: {
  ownerId: string;
  firstName: string;
  lastName: string;
  relationship: 'parent' | 'child' | 'spouse' | 'sibling';
  isDeceased?: boolean;
  birthYear?: number;
}): Promise<string> {
  const admin = getAdminClient();

  // user_profiles.id has FK to auth.users(id), so we must create an auth user first
  const email = generateTestEmail(`rel-${options.firstName.toLowerCase()}`);
  const { data: authUser, error: authError } = await admin.auth.admin.createUser({
    email,
    password: TEST_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: `${options.firstName} ${options.lastName}` },
  });

  if (authError) {
    throw new Error(`Failed to create auth user for relative: ${authError.message}`);
  }

  const userId = authUser.user.id;

  // Create/update user profile
  const { error: profileError } = await admin
    .from('user_profiles')
    .upsert({
      id: userId,
      first_name: options.firstName,
      last_name: options.lastName,
      is_living: !(options.isDeceased ?? true),
      birth_date: options.birthYear
        ? `${options.birthYear}-01-01`
        : null,
    });

  if (profileError) {
    throw new Error(`Failed to create profile for relative: ${profileError.message}`);
  }

  // Create relationship (table uses user1_id, user2_id)
  const { error: relError } = await admin
    .from('relationships')
    .insert({
      user1_id: options.ownerId,
      user2_id: userId,
      relationship_type: options.relationship,
    });

  if (relError) {
    console.warn(`Relationship creation warning: ${relError.message}`);
  }

  return userId;
}

/**
 * Create a mock family for a test user (parents, grandparents, sibling).
 * Returns array of created profile IDs.
 */
export async function createTestFamily(ownerId: string): Promise<string[]> {
  const ids: string[] = [];

  // Mother
  ids.push(await createTestRelative({
    ownerId,
    firstName: 'TestMother',
    lastName: 'FamilyE2E',
    relationship: 'parent',
    isDeceased: false,
  }));

  // Father
  ids.push(await createTestRelative({
    ownerId,
    firstName: 'TestFather',
    lastName: 'FamilyE2E',
    relationship: 'parent',
    isDeceased: false,
  }));

  // Sibling
  ids.push(await createTestRelative({
    ownerId,
    firstName: 'TestSibling',
    lastName: 'FamilyE2E',
    relationship: 'sibling',
    isDeceased: false,
  }));

  // Grandmother (deceased)
  ids.push(await createTestRelative({
    ownerId,
    firstName: 'TestGrandma',
    lastName: 'FamilyE2E',
    relationship: 'parent',
    isDeceased: true,
    birthYear: 1940,
  }));

  // Grandfather (deceased)
  ids.push(await createTestRelative({
    ownerId,
    firstName: 'TestGrandpa',
    lastName: 'FamilyE2E',
    relationship: 'parent',
    isDeceased: true,
    birthYear: 1938,
  }));

  return ids;
}

/**
 * Delete a test user and all related data.
 */
export async function deleteTestUser(userId: string): Promise<void> {
  const admin = getAdminClient();

  // Delete relationships (table uses user1_id, user2_id)
  await admin.from('relationships').delete().eq('user1_id', userId);
  await admin.from('relationships').delete().eq('user2_id', userId);

  // Delete stories
  await admin.from('stories').delete().eq('author_id', userId);
  await admin.from('stories').delete().eq('subject_id', userId);

  // Delete voice stories
  await admin.from('voice_stories').delete().eq('author_id', userId);
  await admin.from('voice_stories').delete().eq('subject_id', userId);

  // Delete chat messages
  await admin.from('family_chat_messages').delete().eq('sender_id', userId);

  // Delete invitations
  await admin.from('invitations').delete().eq('inviter_id', userId);
  await admin.from('invitations').delete().eq('invitee_id', userId);

  // Delete profile
  await admin.from('user_profiles').delete().eq('id', userId);

  // Delete profiles added by this user
  await admin.from('user_profiles').delete().eq('added_by', userId);

  // Delete auth user last
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) {
    console.warn(`Failed to delete auth user ${userId}: ${error.message}`);
  }
}

/**
 * Delete a non-auth profile (relative added by someone).
 */
export async function deleteTestProfile(profileId: string): Promise<void> {
  const admin = getAdminClient();

  await admin.from('relationships').delete().eq('user1_id', profileId);
  await admin.from('relationships').delete().eq('user2_id', profileId);
  await admin.from('user_profiles').delete().eq('id', profileId);

  // Also try to delete the auth user (relatives are now auth users)
  await admin.auth.admin.deleteUser(profileId).catch(() => {});
}

export { TEST_PASSWORD, TEST_EMAIL_PREFIX, TEST_EMAIL_DOMAIN };

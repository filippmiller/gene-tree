/**
 * Global Cleanup
 *
 * Finds and deletes all test users (e2e-test-* email prefix)
 * and their associated data from Supabase.
 */

import { createClient } from '@supabase/supabase-js';
import { deleteTestUser, TEST_EMAIL_PREFIX, TEST_EMAIL_DOMAIN } from './test-user-factory';

function getAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing SUPABASE env vars for cleanup');
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Delete all users whose email starts with the test prefix.
 * Called before test suite and in afterAll blocks.
 */
export async function cleanupAllTestUsers(): Promise<number> {
  const admin = getAdmin();

  let deletedCount = 0;
  let page = 1;
  const perPage = 50;

  // Paginate through all users
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) {
      console.error(`Error listing users (page ${page}):`, error.message);
      break;
    }

    if (!data.users || data.users.length === 0) break;

    // Filter test users
    const testUsers = data.users.filter(
      (u) => u.email && u.email.startsWith(TEST_EMAIL_PREFIX) && u.email.endsWith(`@${TEST_EMAIL_DOMAIN}`)
    );

    for (const user of testUsers) {
      try {
        await deleteTestUser(user.id);
        deletedCount++;
      } catch (err) {
        console.warn(`Failed to delete test user ${user.email}:`, err);
      }
    }

    // If we got fewer than perPage, we've reached the end
    if (data.users.length < perPage) break;
    page++;
  }

  // Also clean up orphaned test profiles (added_by test users, no auth)
  const { data: orphanedProfiles } = await admin
    .from('user_profiles')
    .select('id, first_name, last_name')
    .or('first_name.like.Test%,first_name.like.E2E%')
    .like('last_name', '%E2E%');

  if (orphanedProfiles) {
    for (const profile of orphanedProfiles) {
      await admin.from('relationships').delete().eq('user1_id', profile.id);
      await admin.from('relationships').delete().eq('user2_id', profile.id);
      await admin.from('user_profiles').delete().eq('id', profile.id);
      deletedCount++;
    }
  }

  return deletedCount;
}

/**
 * Clean up specific user IDs (used in afterAll blocks).
 */
export async function cleanupUsers(userIds: string[]): Promise<void> {
  for (const id of userIds) {
    try {
      await deleteTestUser(id);
    } catch (err) {
      console.warn(`Cleanup warning for ${id}:`, err);
    }
  }
}

/**
 * Clean up specific profile IDs that are not auth users.
 */
export async function cleanupProfiles(profileIds: string[]): Promise<void> {
  const admin = getAdmin();

  for (const id of profileIds) {
    try {
      await admin.from('relationships').delete().eq('user1_id', id);
      await admin.from('relationships').delete().eq('user2_id', id);
      await admin.from('user_profiles').delete().eq('id', id);
    } catch (err) {
      console.warn(`Profile cleanup warning for ${id}:`, err);
    }
  }
}

/**
 * Test Cleanup API Route
 *
 * POST /api/test/cleanup
 *
 * Deletes all e2e-test-* users and their data.
 * Safety guard: Only works when NODE_ENV !== 'production'.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const TEST_EMAIL_PREFIX = 'e2e-test';
const TEST_EMAIL_DOMAIN = 'test.gene-tree.app';

export async function POST() {
  // Safety guard: never run in production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Test cleanup is disabled in production' },
      { status: 403 }
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { error: 'Missing Supabase configuration' },
      { status: 500 }
    );
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let deletedCount = 0;
  const errors: string[] = [];

  try {
    // Find all test users
    let page = 1;
    const perPage = 50;

    while (true) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage });

      if (error) {
        errors.push(`List users error: ${error.message}`);
        break;
      }

      if (!data.users || data.users.length === 0) break;

      const testUsers = data.users.filter(
        (u) =>
          u.email &&
          u.email.startsWith(TEST_EMAIL_PREFIX) &&
          u.email.endsWith(`@${TEST_EMAIL_DOMAIN}`)
      );

      for (const user of testUsers) {
        try {
          // Clean up related data
          await admin.from('relationships').delete().eq('user_id', user.id);
          await admin.from('relationships').delete().eq('related_user_id', user.id);
          await admin.from('stories').delete().eq('author_id', user.id);
          await admin.from('stories').delete().eq('subject_id', user.id);
          await admin.from('voice_stories').delete().eq('author_id', user.id);
          await admin.from('family_chat_messages').delete().eq('sender_id', user.id);
          await admin.from('invitations').delete().eq('inviter_id', user.id);
          await admin.from('user_profiles').delete().eq('added_by', user.id);
          await admin.from('user_profiles').delete().eq('id', user.id);
          await admin.auth.admin.deleteUser(user.id);
          deletedCount++;
        } catch (err: any) {
          errors.push(`Delete ${user.email}: ${err.message}`);
        }
      }

      if (data.users.length < perPage) break;
      page++;
    }

    return NextResponse.json({
      success: true,
      deleted: deletedCount,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message, deleted: deletedCount },
      { status: 500 }
    );
  }
}

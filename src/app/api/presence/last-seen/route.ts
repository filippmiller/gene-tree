/**
 * Last Seen API
 *
 * GET: Fetch last_seen_at for specified user IDs
 * Only returns data for users who have show_online_status enabled
 */

import { NextResponse, NextRequest } from 'next/server';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';

export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseSSR();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user IDs from query params
    const userIds = request.nextUrl.searchParams.get('ids');

    if (!userIds) {
      return NextResponse.json(
        { error: 'Missing ids parameter' },
        { status: 400 }
      );
    }

    const ids = userIds.split(',').filter(id => id.trim());

    if (ids.length === 0) {
      return NextResponse.json({ users: {} });
    }

    if (ids.length > 100) {
      return NextResponse.json(
        { error: 'Maximum 100 user IDs allowed' },
        { status: 400 }
      );
    }

    // Fetch last_seen_at for users who have visibility enabled
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('id, last_seen_at, show_online_status')
      .in('id', ids)
      .eq('show_online_status', true);

    if (profilesError) {
      console.error('[Last Seen GET] Query error:', profilesError);
      return NextResponse.json(
        { error: 'Failed to fetch presence data' },
        { status: 500 }
      );
    }

    // Build response map
    const users: Record<string, { last_seen_at: string | null; visible: boolean }> = {};

    for (const profile of (profiles ?? []) as Array<{ id: string; last_seen_at: string | null; show_online_status: boolean | null }>) {
      users[profile.id] = {
        last_seen_at: profile.last_seen_at,
        visible: profile.show_online_status ?? true,
      };
    }

    return NextResponse.json({ users });
  } catch (error) {
    console.error('[Last Seen GET] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Presence Settings API
 *
 * GET: Fetch current presence settings
 * PATCH: Update presence settings (show_online_status)
 */

import { NextResponse, NextRequest } from 'next/server';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';

export async function GET() {
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

    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('show_online_status, last_seen_at')
      .eq('id', user.id)
      .single();

    if (profileError) {
      return NextResponse.json(
        { error: 'Failed to fetch presence settings' },
        { status: 500 }
      );
    }

    const typedProfile = profile as { show_online_status: boolean | null; last_seen_at: string | null } | null;

    return NextResponse.json({
      show_online_status: typedProfile?.show_online_status ?? true,
      last_seen_at: typedProfile?.last_seen_at,
    });
  } catch (error) {
    console.error('[Presence Settings GET] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
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

    const body = await request.json();
    const { show_online_status } = body;

    // Validate input
    if (typeof show_online_status !== 'boolean') {
      return NextResponse.json(
        { error: 'show_online_status must be a boolean' },
        { status: 400 }
      );
    }

    // Update profile
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase as any)
      .from('user_profiles')
      .update({ show_online_status })
      .eq('id', user.id);

    if (updateError) {
      console.error('[Presence Settings PATCH] Update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update presence settings' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      show_online_status,
    });
  } catch (error) {
    console.error('[Presence Settings PATCH] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

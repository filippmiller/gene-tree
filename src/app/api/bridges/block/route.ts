import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';
import { getSupabaseAdmin } from '@/lib/supabase/server-admin';

// Type for bridge_blocked_users table (until types are regenerated)
interface BridgeBlockedUser {
  id: string;
  user_id: string;
  blocked_user_id: string;
  reason: string | null;
  created_at: string;
}

/**
 * POST /api/bridges/block
 * Block a user from bridge requests
 */
export async function POST(request: NextRequest) {
  const supabase = await getSupabaseSSR();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { blocked_user_id: string; reason?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { blocked_user_id, reason } = body;

  if (!blocked_user_id) {
    return NextResponse.json({ error: 'blocked_user_id is required' }, { status: 400 });
  }

  if (blocked_user_id === user.id) {
    return NextResponse.json({ error: 'Cannot block yourself' }, { status: 400 });
  }

  const admin = getSupabaseAdmin();

  try {
    // Check if already blocked
    // Using type assertion since migration may not be applied yet
    const { data: existing } = await (admin as any)
      .from('bridge_blocked_users')
      .select('id')
      .eq('user_id', user.id)
      .eq('blocked_user_id', blocked_user_id)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'User is already blocked' }, { status: 409 });
    }

    // Create block
    const { error: insertError } = await (admin as any).from('bridge_blocked_users').insert({
      user_id: user.id,
      blocked_user_id,
      reason: reason || null,
    });

    if (insertError) {
      console.error('[Bridges Block] Insert error:', insertError);
      return NextResponse.json({ error: 'Failed to block user' }, { status: 500 });
    }

    // Also reject any pending requests from the blocked user
    await (admin as any)
      .from('bridge_requests')
      .update({
        status: 'rejected',
        responded_at: new Date().toISOString(),
        response_message: 'Blocked',
      })
      .eq('requester_id', blocked_user_id)
      .eq('target_user_id', user.id)
      .eq('status', 'pending');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Bridges Block] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/bridges/block
 * Unblock a user
 */
export async function DELETE(request: NextRequest) {
  const supabase = await getSupabaseSSR();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const blocked_user_id = searchParams.get('blocked_user_id');

  if (!blocked_user_id) {
    return NextResponse.json({ error: 'blocked_user_id is required' }, { status: 400 });
  }

  const admin = getSupabaseAdmin();

  try {
    const { error: deleteError } = await (admin as any)
      .from('bridge_blocked_users')
      .delete()
      .eq('user_id', user.id)
      .eq('blocked_user_id', blocked_user_id);

    if (deleteError) {
      console.error('[Bridges Block] Delete error:', deleteError);
      return NextResponse.json({ error: 'Failed to unblock user' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Bridges Block] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET /api/bridges/block
 * Get list of blocked users
 */
export async function GET() {
  const supabase = await getSupabaseSSR();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = getSupabaseAdmin();

  try {
    const { data: blocks, error } = await (admin as any)
      .from('bridge_blocked_users')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Bridges Block] Fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch blocks' }, { status: 500 });
    }

    // Get profiles for blocked users
    const typedBlocks = blocks as BridgeBlockedUser[] | null;
    if (typedBlocks && typedBlocks.length > 0) {
      const blockedIds = typedBlocks.map((b: BridgeBlockedUser) => b.blocked_user_id);
      const { data: profiles } = await admin
        .from('user_profiles')
        .select('id, first_name, last_name, avatar_url')
        .in('id', blockedIds);

      const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

      const enriched = typedBlocks.map((b: BridgeBlockedUser) => ({
        ...b,
        blocked_user: profileMap.get(b.blocked_user_id) || null,
      }));

      return NextResponse.json({ blocks: enriched });
    }

    return NextResponse.json({ blocks: [] });
  } catch (error) {
    console.error('[Bridges Block] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

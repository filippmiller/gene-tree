import { NextResponse } from 'next/server';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';
import { getSupabaseAdmin } from '@/lib/supabase/server-admin';
import type { BridgeCountsApiResponse, BridgeRequestCounts } from '@/types/bridge-request';

/**
 * GET /api/bridges/counts
 * Get bridge request counts for dashboard widget
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
    // Using type assertion since migration may not be applied yet
    const { data: counts, error } = await (admin as any).rpc('get_bridge_request_counts', {
      p_user_id: user.id,
    });

    if (error) {
      console.error('[Bridges Counts] Failed to get counts:', error);
      return NextResponse.json({ error: 'Failed to get counts' }, { status: 500 });
    }

    const typedCounts = counts as BridgeRequestCounts | null;
    const response: BridgeCountsApiResponse = {
      counts: typedCounts || { pending_received: 0, pending_sent: 0, potential_matches: 0 },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[Bridges Counts] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

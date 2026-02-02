import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';
import { getSupabaseAdmin } from '@/lib/supabase/server-admin';
import type {
  BridgeRequest,
  BridgeRequestsApiResponse,
  BridgeRequestWithProfiles,
  SendBridgeRequestPayload,
} from '@/types/bridge-request';

/**
 * GET /api/bridges/requests
 * List bridge requests (sent and received)
 * Query params: filter=sent|received|all (default: all)
 */
export async function GET(request: NextRequest) {
  const supabase = await getSupabaseSSR();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const filter = searchParams.get('filter') || 'all';
  const status = searchParams.get('status') || 'all';

  const admin = getSupabaseAdmin();

  try {
    // Build query based on filter
    // Using type assertion since migration may not be applied yet
    let query = (admin as any).from('bridge_requests').select('*');

    if (filter === 'sent') {
      query = query.eq('requester_id', user.id);
    } else if (filter === 'received') {
      query = query.eq('target_user_id', user.id);
    } else {
      // All - requests where user is either requester or target
      query = query.or(`requester_id.eq.${user.id},target_user_id.eq.${user.id}`);
    }

    // Filter by status if specified
    if (status !== 'all') {
      query = query.eq('status', status);
    }

    query = query.order('created_at', { ascending: false });

    const { data: requests, error } = await query as { data: BridgeRequest[] | null; error: any };

    if (error) {
      console.error('[Bridges Requests] Failed to fetch requests:', error);
      return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 });
    }

    if (!requests || requests.length === 0) {
      const response: BridgeRequestsApiResponse = { requests: [] };
      return NextResponse.json(response);
    }

    // Get user profiles for requesters and targets
    const userIds = new Set<string>();
    requests.forEach((r) => {
      userIds.add(r.requester_id);
      userIds.add(r.target_user_id);
    });

    const { data: profiles, error: profileError } = await admin
      .from('user_profiles')
      .select('id, first_name, last_name, avatar_url')
      .in('id', Array.from(userIds));

    if (profileError) {
      console.error('[Bridges Requests] Failed to fetch profiles:', profileError);
    }

    const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

    const enrichedRequests: BridgeRequestWithProfiles[] = requests.map((r) => ({
      ...r,
      requester: profileMap.get(r.requester_id) || undefined,
      target: profileMap.get(r.target_user_id) || undefined,
    }));

    const response: BridgeRequestsApiResponse = { requests: enrichedRequests };
    return NextResponse.json(response);
  } catch (error) {
    console.error('[Bridges Requests] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/bridges/requests
 * Send a new bridge request
 */
export async function POST(request: NextRequest) {
  const supabase = await getSupabaseSSR();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: SendBridgeRequestPayload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { target_user_id, claimed_relationship, common_ancestor_hint, supporting_info } = body;

  // Validate required fields
  if (!target_user_id || !claimed_relationship) {
    return NextResponse.json(
      { error: 'Missing required fields: target_user_id, claimed_relationship' },
      { status: 400 }
    );
  }

  // Prevent self-requests
  if (target_user_id === user.id) {
    return NextResponse.json({ error: 'Cannot send bridge request to yourself' }, { status: 400 });
  }

  const admin = getSupabaseAdmin();

  try {
    // Check if target user exists
    const { data: targetProfile, error: targetError } = await admin
      .from('user_profiles')
      .select('id')
      .eq('id', target_user_id)
      .single();

    if (targetError || !targetProfile) {
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
    }

    // Check if user is blocked by target or has blocked target
    // Using type assertion since migration may not be applied yet
    const { data: blocked } = await (admin as any)
      .from('bridge_blocked_users')
      .select('id')
      .or(`user_id.eq.${user.id},user_id.eq.${target_user_id}`)
      .or(`blocked_user_id.eq.${user.id},blocked_user_id.eq.${target_user_id}`)
      .limit(1);

    if (blocked && blocked.length > 0) {
      return NextResponse.json({ error: 'Cannot send request to this user' }, { status: 403 });
    }

    // Check if there's already a pending request
    const { data: existingRequest } = await (admin as any)
      .from('bridge_requests')
      .select('id, status')
      .or(`requester_id.eq.${user.id},target_user_id.eq.${user.id}`)
      .or(`requester_id.eq.${target_user_id},target_user_id.eq.${target_user_id}`)
      .eq('status', 'pending')
      .limit(1);

    if (existingRequest && existingRequest.length > 0) {
      return NextResponse.json(
        { error: 'A pending request already exists between you and this user' },
        { status: 409 }
      );
    }

    // Create the request
    const { data: newRequest, error: insertError } = await (admin as any)
      .from('bridge_requests')
      .insert({
        requester_id: user.id,
        target_user_id,
        claimed_relationship,
        common_ancestor_hint: common_ancestor_hint || null,
        supporting_info: supporting_info || null,
        status: 'pending',
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      })
      .select()
      .single();

    if (insertError) {
      console.error('[Bridges Requests] Failed to create request:', insertError);
      return NextResponse.json({ error: 'Failed to create bridge request' }, { status: 500 });
    }

    // Create notification for target user
    try {
      // Get requester profile for notification
      const { data: requesterProfile } = await admin
        .from('user_profiles')
        .select('first_name, last_name')
        .eq('id', user.id)
        .single();

      // Create notification
      const { data: notification } = await admin
        .from('notifications')
        .insert({
          event_type: 'BRIDGE_REQUEST_RECEIVED',
          actor_profile_id: user.id,
          primary_profile_id: target_user_id,
          payload: {
            request_id: newRequest.id,
            claimed_relationship,
            first_name: requesterProfile?.first_name,
            last_name: requesterProfile?.last_name,
          },
        })
        .select('id')
        .single();

      if (notification) {
        await admin.from('notification_recipients').insert({
          notification_id: notification.id,
          profile_id: target_user_id,
        });
      }
    } catch (notifError) {
      // Don't fail the request if notification fails
      console.error('[Bridges Requests] Failed to create notification:', notifError);
    }

    return NextResponse.json({ request: newRequest }, { status: 201 });
  } catch (error) {
    console.error('[Bridges Requests] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

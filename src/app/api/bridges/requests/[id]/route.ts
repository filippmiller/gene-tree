import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';
import { getSupabaseAdmin } from '@/lib/supabase/server-admin';
import type { AcceptBridgeRequestPayload, UpdateBridgeRequestPayload, BridgeRequest } from '@/types/bridge-request';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/bridges/requests/[id]
 * Get a single bridge request
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
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
    const { data: bridgeRequest, error } = await (admin as any)
      .from('bridge_requests')
      .select('*')
      .eq('id', id)
      .or(`requester_id.eq.${user.id},target_user_id.eq.${user.id}`)
      .single();

    if (error || !bridgeRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    const typedRequest = bridgeRequest as BridgeRequest;

    // Get profiles
    const { data: profiles } = await admin
      .from('user_profiles')
      .select('id, first_name, last_name, avatar_url')
      .in('id', [typedRequest.requester_id, typedRequest.target_user_id]);

    const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

    return NextResponse.json({
      request: {
        ...typedRequest,
        requester: profileMap.get(typedRequest.requester_id) || null,
        target: profileMap.get(typedRequest.target_user_id) || null,
      },
    });
  } catch (error) {
    console.error('[Bridges Request] GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/bridges/requests/[id]
 * Accept, reject, or withdraw a bridge request
 *
 * Actions:
 * - accept: Target user accepts the request (requires relationship_type)
 * - reject: Target user rejects the request
 * - withdraw: Requester withdraws the request
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const supabase = await getSupabaseSSR();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: AcceptBridgeRequestPayload | UpdateBridgeRequestPayload | { action: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const admin = getSupabaseAdmin();

  try {
    // Get the existing request
    const { data: bridgeRequest, error: fetchError } = await (admin as any)
      .from('bridge_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !bridgeRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    const typedRequest = bridgeRequest as BridgeRequest;

    // Check permissions and status
    if (typedRequest.status !== 'pending') {
      return NextResponse.json({ error: 'Request is not pending' }, { status: 400 });
    }

    const isRequester = typedRequest.requester_id === user.id;
    const isTarget = typedRequest.target_user_id === user.id;

    if (!isRequester && !isTarget) {
      return NextResponse.json({ error: 'Not authorized to modify this request' }, { status: 403 });
    }

    // Handle different actions
    if ('status' in body) {
      const { status, response_message } = body as UpdateBridgeRequestPayload;

      // Validate action permissions
      if (status === 'withdrawn' && !isRequester) {
        return NextResponse.json({ error: 'Only requester can withdraw' }, { status: 403 });
      }
      if (status === 'rejected' && !isTarget) {
        return NextResponse.json({ error: 'Only target can reject' }, { status: 403 });
      }

      const { data: updated, error: updateError } = await (admin as any)
        .from('bridge_requests')
        .update({
          status,
          responded_at: new Date().toISOString(),
          response_message: response_message || null,
        })
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        console.error('[Bridges Request] Update error:', updateError);
        return NextResponse.json({ error: 'Failed to update request' }, { status: 500 });
      }

      return NextResponse.json({ request: updated });
    }

    if ('relationship_type' in body) {
      // Accept the request
      const { relationship_type, response_message } = body as AcceptBridgeRequestPayload;

      if (!isTarget) {
        return NextResponse.json({ error: 'Only target can accept' }, { status: 403 });
      }

      if (!relationship_type) {
        return NextResponse.json({ error: 'relationship_type is required' }, { status: 400 });
      }

      // Use the database function to accept and create relationship
      const { data: result, error: acceptError } = await (admin as any).rpc('accept_bridge_request', {
        p_request_id: id,
        p_relationship_type: relationship_type,
        p_response_message: response_message || null,
      });

      if (acceptError) {
        console.error('[Bridges Request] Accept error:', acceptError);
        return NextResponse.json({ error: 'Failed to accept request' }, { status: 500 });
      }

      // Create notifications for both parties
      try {
        // Notification for requester (their request was accepted)
        const { data: requesterProfile } = await admin
          .from('user_profiles')
          .select('first_name, last_name')
          .eq('id', typedRequest.target_user_id)
          .single();

        const { data: notification } = await admin
          .from('notifications')
          .insert({
            event_type: 'BRIDGE_REQUEST_ACCEPTED',
            actor_profile_id: typedRequest.target_user_id,
            primary_profile_id: typedRequest.requester_id,
            payload: {
              request_id: id,
              relationship_type,
              first_name: requesterProfile?.first_name,
              last_name: requesterProfile?.last_name,
            },
          })
          .select('id')
          .single();

        if (notification) {
          await admin.from('notification_recipients').insert({
            notification_id: notification.id,
            profile_id: typedRequest.requester_id,
          });
        }
      } catch (notifError) {
        console.error('[Bridges Request] Notification error:', notifError);
      }

      // Get the updated request
      const { data: updated } = await (admin as any)
        .from('bridge_requests')
        .select('*')
        .eq('id', id)
        .single();

      return NextResponse.json({
        request: updated,
        result,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('[Bridges Request] PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/bridges/requests/[id]
 * Delete a bridge request (only requester can delete, only if pending)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const supabase = await getSupabaseSSR();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = getSupabaseAdmin();

  try {
    // Check ownership and status
    const { data: bridgeRequest, error: fetchError } = await (admin as any)
      .from('bridge_requests')
      .select('requester_id, status')
      .eq('id', id)
      .single();

    if (fetchError || !bridgeRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    const typedRequest = bridgeRequest as { requester_id: string; status: string };

    if (typedRequest.requester_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized to delete this request' }, { status: 403 });
    }

    if (typedRequest.status !== 'pending') {
      return NextResponse.json({ error: 'Can only delete pending requests' }, { status: 400 });
    }

    const { error: deleteError } = await (admin as any).from('bridge_requests').delete().eq('id', id);

    if (deleteError) {
      console.error('[Bridges Request] Delete error:', deleteError);
      return NextResponse.json({ error: 'Failed to delete request' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Bridges Request] DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

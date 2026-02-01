/**
 * PATCH /api/relatives/connect/[id]
 *
 * Accept, decline, or cancel a connection request.
 *
 * Body:
 * - status: 'accepted' | 'declined' | 'cancelled'
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';
import { getSupabaseAdmin } from '@/lib/supabase/server-admin';
import { updateConnectionRequestStatus } from '@/lib/relatives';
import { logAudit, extractRequestMeta } from '@/lib/audit/logger';
import { createNotification } from '@/lib/notifications';
import type { ConnectionRequest } from '@/lib/relatives/types';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestMeta = extractRequestMeta(request);
  const { id } = await params;

  try {
    const supabase = await getSupabaseSSR();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { status } = body;

    // Validate status
    if (!['accepted', 'declined', 'cancelled'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be accepted, declined, or cancelled' },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Get the request to verify permissions
    // Using type assertion since connection_requests table is new
    const { data: existingRequest, error: fetchError } = await supabaseAdmin
      .from('connection_requests' as 'audit_logs')
      .select('*')
      .eq('id', id)
      .single() as unknown as { data: ConnectionRequest | null; error: Error | null };

    if (fetchError || !existingRequest) {
      return NextResponse.json(
        { error: 'Connection request not found' },
        { status: 404 }
      );
    }

    // Check permissions
    // - Only recipient can accept/decline
    // - Only sender can cancel
    if (status === 'cancelled') {
      if (existingRequest.from_user_id !== user.id) {
        return NextResponse.json(
          { error: 'Only the sender can cancel a request' },
          { status: 403 }
        );
      }
    } else {
      if (existingRequest.to_user_id !== user.id) {
        return NextResponse.json(
          { error: 'Only the recipient can accept or decline a request' },
          { status: 403 }
        );
      }
    }

    // Check if already responded
    if (existingRequest.status !== 'pending') {
      return NextResponse.json(
        { error: `Request has already been ${existingRequest.status}` },
        { status: 400 }
      );
    }

    // Update the request
    const updatedRequest = await updateConnectionRequestStatus(
      supabaseAdmin,
      id,
      status
    );

    if (!updatedRequest) {
      return NextResponse.json(
        { error: 'Failed to update connection request' },
        { status: 500 }
      );
    }

    // If accepted, create a relationship between the users
    if (status === 'accepted') {
      const { error: relationshipError } = await supabaseAdmin
        .from('relationships')
        .insert({
          user1_id: existingRequest.from_user_id,
          user2_id: existingRequest.to_user_id,
          relationship_type: 'discovered_relative',
          source: { type: 'connection_request', request_id: id },
          notes: existingRequest.relationship_description,
        });

      if (relationshipError) {
        console.error('Error creating relationship:', relationshipError);
        // Don't fail the request, just log
      }

      // Notify the sender - using 'relative_added' as a fallback for now
      // since 'connection_request_accepted' is not in the notification types yet
      await createNotification({
        eventType: 'relative_added',
        actorUserId: user.id,
        primaryProfileId: existingRequest.from_user_id,
        payload: {
          request_id: id,
          shared_ancestor_id: existingRequest.shared_ancestor_id,
          type: 'connection_accepted',
        },
      });
    }

    // Log success
    await logAudit({
      action: `connection_request_${status}`,
      entityType: 'connection_requests',
      entityId: id,
      method: 'PATCH',
      path: `/api/relatives/connect/${id}`,
      requestBody: { status },
      responseStatus: 200,
      ...requestMeta,
    });

    return NextResponse.json(updatedRequest);
  } catch (error) {
    console.error('Error in PATCH /api/relatives/connect/[id]:', error);

    await logAudit({
      action: 'connection_request_update_error',
      entityType: 'connection_requests',
      entityId: id,
      method: 'PATCH',
      path: `/api/relatives/connect/${id}`,
      responseStatus: 500,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      ...requestMeta,
    });

    return NextResponse.json(
      { error: 'Failed to update connection request' },
      { status: 500 }
    );
  }
}

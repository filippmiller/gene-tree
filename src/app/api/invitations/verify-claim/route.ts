import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server-admin';
import { logAudit, extractRequestMeta } from '@/lib/audit/logger';
import { createNotification } from '@/lib/notifications';

/**
 * Verify Claim endpoint
 *
 * Handles two actions:
 * 1. 'accept' - Verifies and accepts the invitation with optional corrections
 * 2. 'dispute' - Notifies the inviter that the person claims "this isn't me"
 */
export async function POST(req: NextRequest) {
  const requestMeta = extractRequestMeta(req);

  try {
    const body = await req.json();
    const { token, action, corrections, reason } = body;

    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 400 });
    }

    if (!action || !['accept', 'dispute'].includes(action)) {
      return NextResponse.json({ error: 'Valid action required (accept or dispute)' }, { status: 400 });
    }

    const admin = getSupabaseAdmin();

    // Find invitation by token
    const { data: invitation, error: findError } = await admin
      .from('pending_relatives')
      .select('*')
      .eq('invitation_token', token)
      .eq('status', 'pending')
      .single();

    if (findError || !invitation) {
      await logAudit({
        action: 'verify_claim_not_found',
        method: 'POST',
        path: '/api/invitations/verify-claim',
        requestBody: { token, action },
        responseStatus: 404,
        errorMessage: 'Invitation not found or already processed',
        ...requestMeta,
      });
      return NextResponse.json({ error: 'Invitation not found or already processed' }, { status: 404 });
    }

    // Handle ACCEPT action
    if (action === 'accept') {
      // Prepare update data
      const updateData: Record<string, unknown> = {
        status: 'accepted',
        is_verified: true,
        is_pending: false,
        updated_at: new Date().toISOString(),
        accepted_at: new Date().toISOString(),
      };

      // Apply corrections if provided
      if (corrections) {
        if (corrections.firstName) {
          updateData.first_name = corrections.firstName.trim();
        }
        if (corrections.lastName) {
          updateData.last_name = corrections.lastName.trim();
        }
        if (corrections.dateOfBirth !== undefined) {
          updateData.date_of_birth = corrections.dateOfBirth || null;
        }
      }

      // Update the invitation
      const { error: updateError } = await admin
        .from('pending_relatives')
        .update(updateData)
        .eq('invitation_token', token);

      if (updateError) {
        await logAudit({
          action: 'verify_claim_accept_error',
          method: 'POST',
          path: '/api/invitations/verify-claim',
          requestBody: body,
          responseStatus: 500,
          errorMessage: updateError.message,
          errorStack: JSON.stringify(updateError),
          ...requestMeta,
        });
        return NextResponse.json({ error: 'Failed to accept invitation' }, { status: 500 });
      }

      // Notify the inviter that their invitation was accepted
      try {
        await createNotification({
          eventType: 'relative_added',
          actorUserId: invitation.invited_by,
          primaryProfileId: invitation.invited_by,
          relatedProfileId: invitation.id,
          payload: {
            first_name: corrections?.firstName || invitation.first_name,
            last_name: corrections?.lastName || invitation.last_name,
            relationship_type: invitation.relationship_type,
            accepted: true,
          },
        });
      } catch (notifyError) {
        // Log but don't fail the request
        console.error('[verify-claim] Failed to create acceptance notification:', notifyError);
      }

      await logAudit({
        action: 'verify_claim_accepted',
        entityType: 'pending_relatives',
        entityId: invitation.id,
        method: 'POST',
        path: '/api/invitations/verify-claim',
        requestBody: body,
        responseStatus: 200,
        ...requestMeta,
      });

      return NextResponse.json({
        success: true,
        message: 'Invitation verified and accepted',
        invitation: {
          ...invitation,
          ...(corrections?.firstName && { first_name: corrections.firstName }),
          ...(corrections?.lastName && { last_name: corrections.lastName }),
          ...(corrections?.dateOfBirth !== undefined && { date_of_birth: corrections.dateOfBirth }),
        },
      });
    }

    // Handle DISPUTE action ("This isn't me")
    if (action === 'dispute') {
      // Update invitation status to 'disputed'
      const { error: updateError } = await admin
        .from('pending_relatives')
        .update({
          status: 'rejected',
          updated_at: new Date().toISOString(),
        })
        .eq('invitation_token', token);

      if (updateError) {
        await logAudit({
          action: 'verify_claim_dispute_error',
          method: 'POST',
          path: '/api/invitations/verify-claim',
          requestBody: body,
          responseStatus: 500,
          errorMessage: updateError.message,
          errorStack: JSON.stringify(updateError),
          ...requestMeta,
        });
        return NextResponse.json({ error: 'Failed to process dispute' }, { status: 500 });
      }

      // Notify the inviter about the dispute
      try {
        await createNotification({
          eventType: 'CLAIM_DISPUTED',
          actorUserId: invitation.invited_by, // Actor is the inviter (they'll see it)
          primaryProfileId: invitation.invited_by,
          relatedProfileId: invitation.id,
          payload: {
            first_name: invitation.first_name,
            last_name: invitation.last_name,
            relationship_type: invitation.relationship_type,
            reason: reason || null,
            email: invitation.email || null,
            phone: invitation.phone || null,
          },
        });
      } catch (notifyError) {
        // Log but don't fail the request
        console.error('[verify-claim] Failed to create dispute notification:', notifyError);
      }

      await logAudit({
        action: 'verify_claim_disputed',
        entityType: 'pending_relatives',
        entityId: invitation.id,
        method: 'POST',
        path: '/api/invitations/verify-claim',
        requestBody: { token, action, reason: reason ? '[REDACTED]' : null },
        responseStatus: 200,
        ...requestMeta,
      });

      return NextResponse.json({
        success: true,
        message: 'Dispute recorded and inviter notified',
      });
    }

    // Should never reach here
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    const errorStack = err instanceof Error ? err.stack : undefined;

    await logAudit({
      action: 'verify_claim_exception',
      method: 'POST',
      path: '/api/invitations/verify-claim',
      responseStatus: 500,
      errorMessage,
      errorStack,
      ...requestMeta,
    });

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

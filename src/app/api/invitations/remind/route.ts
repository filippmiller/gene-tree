/**
 * POST /api/invitations/remind
 *
 * Sends a reminder to someone with a pending invitation.
 */
import { NextResponse } from 'next/server';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';
import { getSupabaseAdmin } from '@/lib/supabase/server-admin';
import { logAudit, extractRequestMeta } from '@/lib/audit/logger';

export const dynamic = 'force-dynamic';

interface RemindRequest {
  inviteId: string;
}

export async function POST(request: Request) {
  const requestMeta = extractRequestMeta(request);

  try {
    // 1. Authenticate user
    const supabase = await getSupabaseSSR();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse request body
    const body = (await request.json()) as RemindRequest;
    const { inviteId } = body;

    if (!inviteId) {
      return NextResponse.json(
        { error: 'inviteId is required' },
        { status: 400 }
      );
    }

    // 3. Get the pending invite
    const supabaseAdmin = getSupabaseAdmin();
    const { data: invite, error: inviteError } = await supabaseAdmin
      .from('pending_relatives')
      .select('id, email, phone, first_name, last_name, invited_by, status')
      .eq('id', inviteId)
      .eq('status', 'pending')
      .single();

    if (inviteError || !invite) {
      return NextResponse.json(
        { error: 'Invitation not found or already accepted' },
        { status: 404 }
      );
    }

    // 4. Verify the current user is in the same family tree
    // For now, we allow any authenticated user to send a reminder
    // TODO: Add family tree membership check

    // 5. Send reminder (reuse existing invitation logic)
    // TODO: Implement email/SMS reminder sending
    // For now, just log the action

    await logAudit({
      action: 'invitation_reminder_sent',
      entityType: 'pending_relatives',
      entityId: inviteId,
      method: 'POST',
      path: '/api/invitations/remind',
      requestBody: { inviteId },
      responseStatus: 200,
      ...requestMeta,
    });

    return NextResponse.json({
      success: true,
      message: 'Reminder sent successfully',
      inviteId,
    });
  } catch (error) {
    console.error('[/api/invitations/remind] Error:', error);

    await logAudit({
      action: 'invitation_reminder_error',
      entityType: 'pending_relatives',
      method: 'POST',
      path: '/api/invitations/remind',
      responseStatus: 500,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      ...requestMeta,
    });

    return NextResponse.json(
      { error: 'Failed to send reminder' },
      { status: 500 }
    );
  }
}

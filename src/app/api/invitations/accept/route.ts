import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { logAudit, extractRequestMeta } from '@/lib/audit/logger';

/**
 * Accept invitation endpoint
 * Updates pending_relatives with corrected data and marks as accepted
 */
export async function POST(req: NextRequest) {
  const requestMeta = extractRequestMeta(req);

  try {
    const body = await req.json();
    const { token, firstName, lastName, dateOfBirth } = body;

    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 400 });
    }

    const supabase = await createServerSupabase();

    // Find invitation by token
    const { data: invitation, error: findError } = await supabase
      .from('pending_relatives')
      .select('*')
      .eq('invitation_token', token)
      .eq('status', 'pending')
      .single();

    if (findError || !invitation) {
      await logAudit({
        action: 'invitation_accept_not_found',
        method: 'POST',
        path: '/api/invitations/accept',
        requestBody: { token },
        responseStatus: 404,
        errorMessage: 'Invitation not found',
        ...requestMeta,
      });
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    // Update invitation with corrected data
    const { error: updateError } = await supabase
      .from('pending_relatives')
      .update({
        first_name: firstName,
        last_name: lastName,
        date_of_birth: dateOfBirth || null,
        status: 'accepted',
        updated_at: new Date().toISOString(),
      })
      .eq('invitation_token', token);

    if (updateError) {
      await logAudit({
        action: 'invitation_accept_error',
        method: 'POST',
        path: '/api/invitations/accept',
        requestBody: body,
        responseStatus: 500,
        errorMessage: updateError.message,
        errorStack: JSON.stringify(updateError),
        ...requestMeta,
      });
      return NextResponse.json({ error: 'Failed to accept invitation' }, { status: 500 });
    }

    await logAudit({
      action: 'invitation_accepted',
      entityType: 'pending_relatives',
      entityId: invitation.id,
      method: 'POST',
      path: '/api/invitations/accept',
      requestBody: body,
      responseStatus: 200,
      ...requestMeta,
    });

    return NextResponse.json({ 
      success: true,
      message: 'Invitation accepted',
      invitation: { ...invitation, first_name: firstName, last_name: lastName }
    });
  } catch (err: any) {
    await logAudit({
      action: 'invitation_accept_exception',
      method: 'POST',
      path: '/api/invitations/accept',
      responseStatus: 500,
      errorMessage: err.message,
      errorStack: err.stack,
      ...requestMeta,
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

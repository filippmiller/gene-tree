import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { logAudit, extractRequestMeta } from '@/lib/audit/logger';

/**
 * Reject invitation endpoint
 * Marks pending_relatives as rejected
 */
export async function POST(req: NextRequest) {
  const requestMeta = extractRequestMeta(req);

  try {
    const body = await req.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 400 });
    }

    const supabase = await createServerSupabase();

    // Update invitation status to rejected
    const { data, error } = await supabase
      .from('pending_relatives')
      .update({
        status: 'rejected',
        updated_at: new Date().toISOString(),
      })
      .eq('invitation_token', token)
      .eq('status', 'pending')
      .select()
      .single();

    if (error || !data) {
      await logAudit({
        action: 'invitation_reject_error',
        method: 'POST',
        path: '/api/invitations/reject',
        requestBody: { token },
        responseStatus: 404,
        errorMessage: error?.message || 'Invitation not found',
        ...requestMeta,
      });
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    await logAudit({
      action: 'invitation_rejected',
      entityType: 'pending_relatives',
      entityId: data.id,
      method: 'POST',
      path: '/api/invitations/reject',
      requestBody: body,
      responseStatus: 200,
      ...requestMeta,
    });

    return NextResponse.json({ 
      success: true,
      message: 'Invitation rejected'
    });
  } catch (err: any) {
    await logAudit({
      action: 'invitation_reject_exception',
      method: 'POST',
      path: '/api/invitations/reject',
      responseStatus: 500,
      errorMessage: err.message,
      errorStack: err.stack,
      ...requestMeta,
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

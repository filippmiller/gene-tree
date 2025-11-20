import { NextResponse } from 'next/server';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';
import { getSupabaseAdmin } from '@/lib/supabase/server-admin';
import { logAudit } from '@/lib/audit/logger';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { inviteId } = body;

    if (!inviteId) {
      return NextResponse.json({ error: 'Invite ID is required' }, { status: 400 });
    }

    const supabase = await getSupabaseSSR();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user || !user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Verify invitation exists and belongs to user
    const { data: invite, error: inviteError } = await getSupabaseAdmin()
      .from('pending_relatives')
      .select('*')
      .eq('id', inviteId)
      .eq('email', user.email)
      .eq('status', 'pending')
      .single();

    if (inviteError || !invite) {
      return NextResponse.json({ error: 'Invitation not found or invalid' }, { status: 404 });
    }

    // 2. Decline invitation
    // We can either delete it or mark as rejected. Marking as rejected is safer for history.
    const { error: updateError } = await getSupabaseAdmin()
      .from('pending_relatives')
      .update({
        status: 'rejected',
        // We don't set accepted_at
      })
      .eq('id', inviteId);

    if (updateError) {
      console.error('Error declining invitation:', updateError);
      return NextResponse.json({ error: 'Failed to decline invitation' }, { status: 500 });
    }

    // 3. Log audit
    await logAudit({
      action: 'invitation_declined',
      entityType: 'pending_relatives',
      entityId: inviteId,
      method: 'POST',
      path: '/api/invites/decline',
      requestBody: { inviteId },
      responseStatus: 200
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in POST /api/invites/decline:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

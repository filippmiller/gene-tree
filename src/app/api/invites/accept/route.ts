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
      .eq('email', user.email) // Security check: email must match
      .eq('status', 'pending')
      .single();

    if (inviteError || !invite) {
      return NextResponse.json({ error: 'Invitation not found or invalid' }, { status: 404 });
    }

    // 2. Accept invitation (Transaction-like sequence)
    // Update pending_relatives status
    const { error: updateError } = await getSupabaseAdmin()
      .from('pending_relatives')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString(),
        related_to_user_id: user.id, // Link the person node to this user
        is_verified: true
      })
      .eq('id', inviteId);

    if (updateError) {
      console.error('Error accepting invitation:', updateError);
      return NextResponse.json({ error: 'Failed to accept invitation' }, { status: 500 });
    }

    // 3. Ensure user profile exists (should exist if logged in)
    // We might want to copy data from invite to profile if profile is empty?
    // For now, we assume profile exists.

    // 4. Log audit
    await logAudit({
      action: 'invitation_accepted',
      entityType: 'pending_relatives',
      entityId: inviteId,
      method: 'POST',
      path: '/api/invites/accept',
      requestBody: { inviteId },
      responseStatus: 200
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in POST /api/invites/accept:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

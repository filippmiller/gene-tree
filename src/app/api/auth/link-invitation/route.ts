import { NextResponse } from 'next/server';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';
import { getSupabaseAdmin } from '@/lib/supabase/server-admin';
import { logAudit } from '@/lib/audit/logger';

/**
 * POST /api/auth/link-invitation
 * 
 * Links a newly authenticated user to their pending invitation.
 * Called after magic link authentication to:
 * 1. Find pending invitations for the user's email
 * 2. Update user profile with the name from the invitation
 * 3. Mark invitation as linked
 * 
 * This handles the case where someone accepts an invitation,
 * gets a magic link, and authenticates as a new user.
 */
export async function POST() {
  try {
    const supabase = await getSupabaseSSR();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user || !user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = getSupabaseAdmin();

    // Find accepted invitations for this user's email that aren't yet linked
    const { data: invitations, error: inviteError } = await admin
      .from('pending_relatives')
      .select('*')
      .eq('email', user.email)
      .eq('status', 'accepted')
      .is('related_to_user_id', null) // Not yet linked to a user
      .order('created_at', { ascending: false })
      .limit(1);

    if (inviteError) {
      console.error('[LINK-INVITATION] Error fetching invitations:', inviteError);
      return NextResponse.json({ error: 'Failed to fetch invitations' }, { status: 500 });
    }

    if (!invitations || invitations.length === 0) {
      // No invitations to link - this is fine
      return NextResponse.json({ linked: false, message: 'No invitations to link' });
    }

    const invitation = invitations[0];

    // Update user profile with invitation data
    const { error: profileError } = await admin
      .from('user_profiles')
      .update({
        first_name: invitation.first_name,
        last_name: invitation.last_name,
        birth_date: invitation.date_of_birth,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (profileError) {
      console.error('[LINK-INVITATION] Error updating profile:', profileError);
      // Continue anyway - we still want to link the invitation
    }

    // Link the invitation to this user
    const { error: linkError } = await admin
      .from('pending_relatives')
      .update({
        related_to_user_id: user.id,
        is_verified: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', invitation.id);

    if (linkError) {
      console.error('[LINK-INVITATION] Error linking invitation:', linkError);
      return NextResponse.json({ error: 'Failed to link invitation' }, { status: 500 });
    }

    await logAudit({
      action: 'invitation_linked',
      entityType: 'pending_relatives',
      entityId: invitation.id,
      method: 'POST',
      path: '/api/auth/link-invitation',
      responseStatus: 200,
    });

    console.log('[LINK-INVITATION] Successfully linked invitation', invitation.id, 'to user', user.id);

    return NextResponse.json({
      linked: true,
      invitationId: invitation.id,
      profileUpdated: !profileError,
    });
  } catch (error: any) {
    console.error('[LINK-INVITATION] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

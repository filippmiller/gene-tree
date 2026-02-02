import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';
import { getSupabaseAdmin } from '@/lib/supabase/server-admin';
import { sendEmailInvite } from '@/lib/invitations/email';

interface InvitePayload {
  relativeId: string;
  relativeName?: string;
  relationshipType?: string;
  email: string;
  phone?: string;
}

/**
 * POST /api/onboarding/invite
 * Send invitation to a family member from onboarding wizard step 4
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseSSR();
    const admin = getSupabaseAdmin();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: InvitePayload = await request.json();

    // Validate required fields
    if (!body.relativeId || !body.email) {
      return NextResponse.json(
        { error: 'Relative ID and email are required' },
        { status: 400 }
      );
    }

    // Verify the relative belongs to this user
    const { data: relative, error: relativeError } = await admin
      .from('pending_relatives')
      .select('*')
      .eq('id', body.relativeId)
      .eq('invited_by', user.id)
      .single();

    if (relativeError || !relative) {
      return NextResponse.json({ error: 'Relative not found' }, { status: 404 });
    }

    // Generate invitation token
    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days expiry

    // Update pending_relative with email and token
    const { error: updateError } = await admin
      .from('pending_relatives')
      .update({
        email: body.email,
        phone: body.phone || null,
        invitation_token: token,
        invitation_expires_at: expiresAt.toISOString(),
      })
      .eq('id', body.relativeId);

    if (updateError) {
      console.error('Error updating relative:', updateError);
      return NextResponse.json(
        { error: 'Failed to update invitation' },
        { status: 500 }
      );
    }

    // Get inviter's profile for the email
    const { data: inviterProfile } = await admin
      .from('user_profiles')
      .select('first_name, last_name')
      .eq('id', user.id)
      .single();

    const inviterName = inviterProfile
      ? [inviterProfile.first_name, inviterProfile.last_name]
          .filter(Boolean)
          .join(' ') || 'A family member'
      : 'A family member';

    // Send invitation email
    // Build invite URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://gene-tree.app';
    const inviteUrl = `${baseUrl}/invite/${token}`;

    try {
      await sendEmailInvite({
        to: body.email,
        inviterName,
        inviteeName: body.relativeName,
        inviteUrl,
      });
    } catch (emailError) {
      console.error('Error sending invitation email:', emailError);
      // Don't fail the request if email fails - the invitation is still valid
    }

    return NextResponse.json({
      success: true,
      message: 'Invitation sent',
    });
  } catch (error) {
    console.error('Invite error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

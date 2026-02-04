import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server-admin';
import type { QuickLinkSignupRequest } from '@/types/quick-invite';

/**
 * POST /api/quick-links/by-code/[code]/signup
 * Submit a signup via quick link (public endpoint)
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    if (!code || code.length !== 6) {
      return NextResponse.json({ error: 'Invalid code' }, { status: 400 });
    }

    const body: QuickLinkSignupRequest = await req.json();
    const { email, firstName, lastName, phone, claimedRelationship } = body;

    // Validate required fields
    if (!email || !firstName || !lastName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // Using 'as any' because tables not yet in generated types
    const admin = getSupabaseAdmin() as any;

    // Get and validate link
    const { data: link, error: linkError } = await admin
      .from('quick_invite_links')
      .select('*')
      .eq('code', code.toUpperCase())
      .single();

    if (linkError || !link) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 });
    }

    // Validate link status
    const now = new Date();
    const expiresAt = new Date(link.expires_at);

    if (!link.is_active) {
      return NextResponse.json({ error: 'Link is inactive' }, { status: 410 });
    }

    if (expiresAt <= now) {
      return NextResponse.json({ error: 'Link has expired' }, { status: 410 });
    }

    if (link.current_uses >= link.max_uses) {
      return NextResponse.json({ error: 'Link has reached maximum uses' }, { status: 410 });
    }

    // Check for duplicate signup
    const { data: existingSignup } = await admin
      .from('quick_link_signups')
      .select('id')
      .eq('link_id', link.id)
      .eq('email', email.toLowerCase())
      .single();

    if (existingSignup) {
      return NextResponse.json({ error: 'You have already signed up with this email' }, { status: 409 });
    }

    // Create signup
    const { data: signup, error: signupError } = await admin
      .from('quick_link_signups')
      .insert({
        link_id: link.id,
        email: email.toLowerCase(),
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone?.trim() || null,
        claimed_relationship: claimedRelationship?.trim() || null,
        status: 'pending',
      })
      .select()
      .single();

    if (signupError) {
      console.error('Error creating signup:', signupError);
      return NextResponse.json({ error: 'Failed to submit signup' }, { status: 500 });
    }

    // Increment usage count
    await admin
      .from('quick_invite_links')
      .update({
        current_uses: link.current_uses + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', link.id);

    // Create notification for link creator
    // Note: The notifications system uses a two-table structure:
    // - notifications: stores the event data
    // - notification_recipients: links recipients to notifications
    try {
      // First create the notification
      const { data: notification, error: notifError } = await admin
        .from('notifications')
        .insert({
          event_type: 'quick_link_signup',
          actor_profile_id: link.created_by, // The creator is both actor and recipient here
          payload: {
            signupId: signup.id,
            linkId: link.id,
            linkCode: link.code,
            eventName: link.event_name,
            signupName: `${firstName} ${lastName}`,
            email,
            claimedRelationship,
          },
        })
        .select('id')
        .single();

      if (!notifError && notification) {
        // Then add the recipient
        await admin.from('notification_recipients').insert({
          notification_id: notification.id,
          profile_id: link.created_by,
        });
      }
    } catch (notifErr) {
      // Non-critical, log but don't fail
      console.error('Failed to create notification:', notifErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Signup submitted successfully. You will be notified when approved.',
      signupId: signup.id,
    });
  } catch (error) {
    console.error('Quick link signup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

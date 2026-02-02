import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server-admin';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';

interface ApprovalBody {
  action: 'approve' | 'reject';
  reason?: string;
}

/**
 * PATCH /api/quick-links/signups/[id]
 * Approve or reject a signup
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await getSupabaseSSR();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: signupId } = await params;
    const body: ApprovalBody = await req.json();
    const { action, reason } = body;

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Using 'as any' because tables not yet in generated types
    const admin = getSupabaseAdmin() as any;

    // Get signup with link info
    const { data: signup, error: signupError } = await admin
      .from('quick_link_signups')
      .select('*')
      .eq('id', signupId)
      .single();

    if (signupError || !signup) {
      return NextResponse.json({ error: 'Signup not found' }, { status: 404 });
    }

    // Get link to verify ownership
    const { data: link, error: linkError } = await admin
      .from('quick_invite_links')
      .select('id, created_by, event_name')
      .eq('id', signup.link_id)
      .single();

    if (linkError || !link) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 });
    }

    // Verify ownership
    if (link.created_by !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if already processed
    if (signup.status !== 'pending') {
      return NextResponse.json({ error: 'Signup already processed' }, { status: 409 });
    }

    if (action === 'approve') {
      // Update signup status
      const { error: updateError } = await admin
        .from('quick_link_signups')
        .update({
          status: 'approved',
          approved_by: user.id,
          approved_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', signupId);

      if (updateError) {
        console.error('Error approving signup:', updateError);
        return NextResponse.json({ error: 'Failed to approve signup' }, { status: 500 });
      }

      // TODO: Send approval email notification to the person who signed up
      // For now, just return success

      return NextResponse.json({
        success: true,
        message: 'Signup approved',
        status: 'approved',
      });
    } else {
      // Reject the signup
      const { error: updateError } = await admin
        .from('quick_link_signups')
        .update({
          status: 'rejected',
          rejection_reason: reason || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', signupId);

      if (updateError) {
        console.error('Error rejecting signup:', updateError);
        return NextResponse.json({ error: 'Failed to reject signup' }, { status: 500 });
      }

      // TODO: Send rejection email notification

      return NextResponse.json({
        success: true,
        message: 'Signup rejected',
        status: 'rejected',
      });
    }
  } catch (error) {
    console.error('Quick link signup PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

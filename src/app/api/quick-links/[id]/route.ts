import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server-admin';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';
import type { UpdateQuickLinkRequest } from '@/types/quick-invite';

/**
 * PATCH /api/quick-links/[id]
 * Update a quick link (deactivate, change settings)
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

    const { id } = await params;
    const body: UpdateQuickLinkRequest = await req.json();

    // Using 'as any' because table not yet in generated types
    const admin = getSupabaseAdmin() as any;

    // Verify ownership
    const { data: link, error: linkError } = await admin
      .from('quick_invite_links')
      .select('id, created_by')
      .eq('id', id)
      .single();

    if (linkError || !link) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 });
    }

    if (link.created_by !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Build update object
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (body.isActive !== undefined) {
      updates.is_active = body.isActive;
    }

    if (body.eventName !== undefined) {
      updates.event_name = body.eventName || null;
    }

    if (body.maxUses !== undefined && body.maxUses > 0) {
      updates.max_uses = body.maxUses;
    }

    // Update the link
    const { data: updatedLink, error: updateError } = await admin
      .from('quick_invite_links')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating quick link:', updateError);
      return NextResponse.json({ error: 'Failed to update link' }, { status: 500 });
    }

    return NextResponse.json({ success: true, link: updatedLink });
  } catch (error) {
    console.error('Quick link PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/quick-links/[id]
 * Delete a quick link
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await getSupabaseSSR();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Using 'as any' because table not yet in generated types
    const admin = getSupabaseAdmin() as any;

    // Verify ownership
    const { data: link, error: linkError } = await admin
      .from('quick_invite_links')
      .select('id, created_by')
      .eq('id', id)
      .single();

    if (linkError || !link) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 });
    }

    if (link.created_by !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete the link (cascade will delete signups)
    const { error: deleteError } = await admin
      .from('quick_invite_links')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting quick link:', deleteError);
      return NextResponse.json({ error: 'Failed to delete link' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Quick link DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server-admin';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';

/**
 * GET /api/quick-links/[id]/signups
 * List signups for a specific quick link
 */
export async function GET(
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

    // Using 'as any' because tables not yet in generated types
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

    // Get signups
    const { data: signups, error: signupsError } = await admin
      .from('quick_link_signups')
      .select('*')
      .eq('link_id', id)
      .order('created_at', { ascending: false });

    if (signupsError) {
      console.error('Error fetching signups:', signupsError);
      return NextResponse.json({ error: 'Failed to fetch signups' }, { status: 500 });
    }

    return NextResponse.json({ signups: signups || [] });
  } catch (error) {
    console.error('Quick link signups GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server-admin';

/**
 * GET /api/quick-links/by-code/[code]
 * Get link info by code (public endpoint for signup page)
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    if (!code || code.length !== 6) {
      return NextResponse.json({ error: 'Invalid code' }, { status: 400 });
    }

    // Using 'as any' because table not yet in generated types
    const admin = getSupabaseAdmin() as any;

    // Get link with creator info
    const { data: link, error } = await admin
      .from('quick_invite_links')
      .select(`
        id,
        code,
        expires_at,
        max_uses,
        current_uses,
        event_name,
        is_active,
        created_by
      `)
      .eq('code', code.toUpperCase())
      .single();

    if (error || !link) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 });
    }

    // Check if link is valid
    const now = new Date();
    const expiresAt = new Date(link.expires_at);

    if (!link.is_active) {
      return NextResponse.json({ error: 'Link is inactive', valid: false }, { status: 410 });
    }

    if (expiresAt <= now) {
      return NextResponse.json({ error: 'Link has expired', valid: false }, { status: 410 });
    }

    if (link.current_uses >= link.max_uses) {
      return NextResponse.json({ error: 'Link has reached maximum uses', valid: false }, { status: 410 });
    }

    // Get creator info
    const { data: creator } = await getSupabaseAdmin()
      .from('user_profiles')
      .select('first_name, last_name')
      .eq('id', link.created_by)
      .single();

    return NextResponse.json({
      valid: true,
      link: {
        id: link.id,
        code: link.code,
        eventName: link.event_name,
        expiresAt: link.expires_at,
        remainingUses: link.max_uses - link.current_uses,
        creator: creator
          ? {
              firstName: creator.first_name,
              lastName: creator.last_name,
            }
          : null,
      },
    });
  } catch (error) {
    console.error('Quick link GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

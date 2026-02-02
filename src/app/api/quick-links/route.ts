import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server-admin';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';
import { getExpirationMs } from '@/types/quick-invite';
import type { CreateQuickLinkRequest, QuickInviteLink } from '@/types/quick-invite';

/**
 * GET /api/quick-links
 * List user's quick invite links
 */
export async function GET() {
  try {
    const supabase = await getSupabaseSSR();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Using 'as any' because table not yet in generated types
    const { data: links, error } = await (getSupabaseAdmin() as any)
      .from('quick_invite_links')
      .select('*')
      .eq('created_by', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching quick links:', error);
      return NextResponse.json({ error: 'Failed to fetch links' }, { status: 500 });
    }

    return NextResponse.json({ links: links || [] });
  } catch (error) {
    console.error('Quick links GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/quick-links
 * Create a new quick invite link
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await getSupabaseSSR();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: CreateQuickLinkRequest = await req.json();
    const { expiration, maxUses = 50, eventName } = body;

    // Calculate expiration time
    const expirationMs = getExpirationMs(expiration);
    const expiresAt = new Date(Date.now() + expirationMs).toISOString();

    // Generate unique code
    const admin = getSupabaseAdmin() as any;
    let code: string = '';
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      // Generate a random 6-character code
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      code = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');

      // Check if code already exists
      const { data: existing } = await admin
        .from('quick_invite_links')
        .select('id')
        .eq('code', code)
        .single();

      if (!existing) break;
      attempts++;
    }

    if (attempts >= maxAttempts) {
      return NextResponse.json({ error: 'Failed to generate unique code' }, { status: 500 });
    }

    // Create the link
    const { data: link, error: createError } = await admin
      .from('quick_invite_links')
      .insert({
        created_by: user.id,
        code,
        expires_at: expiresAt,
        max_uses: maxUses,
        event_name: eventName || null,
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating quick link:', createError);
      return NextResponse.json({ error: 'Failed to create link' }, { status: 500 });
    }

    return NextResponse.json({ success: true, link: link as QuickInviteLink });
  } catch (error) {
    console.error('Quick links POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

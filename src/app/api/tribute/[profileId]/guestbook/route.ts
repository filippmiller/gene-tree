import { NextResponse } from 'next/server';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';
import type {
  GetGuestbookResponse,
  CreateTributeEntryRequest,
  CreateTributeEntryResponse,
} from '@/types/tribute';

/**
 * GET /api/tribute/[profileId]/guestbook
 * Get guestbook entries for a tribute profile
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ profileId: string }> }
) {
  try {
    const { profileId } = await params;
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = Math.min(parseInt(url.searchParams.get('pageSize') || '20'), 50);
    const offset = (page - 1) * pageSize;

    const supabase = await getSupabaseSSR();

    // Get total count
    const { count } = await (supabase as any)
      .from('tribute_guestbook')
      .select('id', { count: 'exact', head: true })
      .eq('tribute_profile_id', profileId)
      .eq('is_approved', true);

    // Get entries with author info
    const { data: entries, error } = await (supabase as any)
      .from('tribute_guestbook')
      .select(`
        id,
        tribute_profile_id,
        author_id,
        message,
        tribute_type,
        is_approved,
        created_at,
        author:user_profiles!author_id (
          id,
          first_name,
          last_name,
          avatar_url
        )
      `)
      .eq('tribute_profile_id', profileId)
      .eq('is_approved', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (error) {
      console.error('Error fetching guestbook:', error);
      return NextResponse.json(
        { success: false, entries: [], total: 0, page, pageSize },
        { status: 500 }
      );
    }

    const response: GetGuestbookResponse = {
      success: true,
      entries: entries || [],
      total: count || 0,
      page,
      pageSize,
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error('Error in GET /api/tribute/[profileId]/guestbook:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

/**
 * POST /api/tribute/[profileId]/guestbook
 * Add a guestbook entry
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ profileId: string }> }
) {
  try {
    const { profileId } = await params;
    const supabase = await getSupabaseSSR();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body: CreateTributeEntryRequest = await req.json();

    // Validate tribute type
    const validTypes = ['message', 'flower', 'candle'];
    if (!validTypes.includes(body.tribute_type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid tribute type' },
        { status: 400 }
      );
    }

    // Verify the profile exists and has tribute mode enabled or is deceased
    const { data: profile } = await (supabase as any)
      .from('user_profiles')
      .select('id, tribute_mode_enabled, death_date')
      .eq('id', profileId)
      .single() as { data: any };

    if (!profile) {
      return NextResponse.json(
        { success: false, error: 'Profile not found' },
        { status: 404 }
      );
    }

    if (!profile.tribute_mode_enabled && !profile.death_date) {
      return NextResponse.json(
        { success: false, error: 'Tribute page not available for this profile' },
        { status: 403 }
      );
    }

    // Create the entry (auto-approve for now)
    const { data: entry, error: insertError } = await (supabase as any)
      .from('tribute_guestbook')
      .insert({
        tribute_profile_id: profileId,
        author_id: user.id,
        tribute_type: body.tribute_type,
        message: body.message || null,
        is_approved: true, // Auto-approve for now
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating tribute entry:', insertError);
      return NextResponse.json(
        { success: false, error: insertError.message },
        { status: 500 }
      );
    }

    // Create notification for family members (optional enhancement)
    // This could notify the profile's close relatives

    const response: CreateTributeEntryResponse = {
      success: true,
      entry,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error: unknown) {
    console.error('Error in POST /api/tribute/[profileId]/guestbook:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

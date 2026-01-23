import { NextResponse } from 'next/server';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';
import type { GetTributePageResponse } from '@/types/tribute';

/**
 * GET /api/tribute/[profileId]
 * Get tribute page data for a deceased profile
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ profileId: string }> }
) {
  try {
    const { profileId } = await params;
    const supabase = await getSupabaseSSR();

    // Get profile data
    // Note: Using 'as any' until migration runs and types are regenerated
    const { data: profile, error: profileError } = await (supabase as any)
      .from('user_profiles')
      .select('id, first_name, last_name, avatar_url, birth_date, death_date, tribute_mode_enabled')
      .eq('id', profileId)
      .single() as { data: any; error: any };

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Check if tribute mode is enabled and person is deceased
    if (!profile.tribute_mode_enabled && !profile.death_date) {
      return NextResponse.json(
        { success: false, error: 'Tribute page not available for this profile' },
        { status: 403 }
      );
    }

    // Get guestbook count
    const { count: guestbookCount } = await (supabase as any)
      .from('tribute_guestbook')
      .select('id', { count: 'exact', head: true })
      .eq('tribute_profile_id', profileId)
      .eq('is_approved', true);

    // Get recent tributes
    const { data: recentTributes } = await (supabase as any)
      .from('tribute_guestbook')
      .select(`
        id,
        tribute_type,
        message,
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
      .limit(5);

    const response: GetTributePageResponse = {
      success: true,
      data: {
        profile: {
          id: profile.id,
          first_name: profile.first_name,
          last_name: profile.last_name,
          avatar_url: profile.avatar_url,
          birth_date: profile.birth_date,
          death_date: profile.death_date,
          tribute_mode_enabled: profile.tribute_mode_enabled || false,
        },
        guestbook_count: guestbookCount || 0,
        recent_tributes: recentTributes || [],
      },
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error('Error in GET /api/tribute/[profileId]:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

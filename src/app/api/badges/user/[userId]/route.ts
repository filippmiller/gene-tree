import { NextResponse } from 'next/server';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';

/**
 * GET /api/badges/user/[userId]
 * Get a specific user's earned badges
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const supabase = await getSupabaseSSR();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's earned badges with badge details
    const { data: userBadges, error } = await (supabase as any)
      .from('user_badges')
      .select(`
        id,
        user_id,
        badge_id,
        earned_at,
        is_featured,
        badges (
          id,
          name,
          name_ru,
          description,
          description_ru,
          icon,
          category,
          rarity
        )
      `)
      .eq('user_id', userId)
      .order('earned_at', { ascending: false });

    if (error) {
      console.error('Error fetching user badges:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get featured badges (sorted first)
    const featured = userBadges?.filter((ub: any) => ub.is_featured) || [];
    const others = userBadges?.filter((ub: any) => !ub.is_featured) || [];

    // Get badge stats
    const { data: stats } = await (supabase as any)
      .rpc('get_user_badge_stats', { p_user_id: userId });

    return NextResponse.json({
      badges: [...featured, ...others],
      featured: featured.map((ub: any) => ub.badges),
      stats: stats || { total_earned: userBadges?.length || 0, total_available: 0, by_category: {} },
    });

  } catch (error: unknown) {
    console.error('Error in GET /api/badges/user/[userId]:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

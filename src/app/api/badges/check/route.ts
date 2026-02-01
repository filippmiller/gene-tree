import { NextResponse } from 'next/server';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';
import { getSupabaseAdmin } from '@/lib/supabase/server-admin';

/**
 * POST /api/badges/check
 * Check and award any badges the user has earned
 * Called after major actions (add relative, upload photo, etc.)
 */
export async function POST(req: Request) {
  try {
    const supabase = await getSupabaseSSR();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use admin client to call the check function
    const admin = getSupabaseAdmin();
    const { data: awardedCount, error } = await (admin as any)
      .rpc('check_all_badges_for_user', { p_user_id: user.id });

    if (error) {
      console.error('Error checking badges:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // If badges were awarded, fetch the newly earned ones
    let newBadges: any[] = [];
    if (awardedCount > 0) {
      const { data: userBadges } = await (supabase as any)
        .from('user_badges')
        .select(`
          id,
          badge_id,
          earned_at,
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
        .eq('user_id', user.id)
        .order('earned_at', { ascending: false })
        .limit(awardedCount);

      newBadges = userBadges || [];
    }

    return NextResponse.json({
      success: true,
      awardedCount,
      newBadges,
    });

  } catch (error: unknown) {
    console.error('Error in POST /api/badges/check:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

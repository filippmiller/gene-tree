import { NextResponse } from 'next/server';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';
import { getSupabaseAdmin } from '@/lib/supabase/server-admin';

export interface Badge {
  id: string;
  name: string;
  name_ru: string | null;
  description: string | null;
  description_ru: string | null;
  icon: string;
  category: string;
  criteria_type: string;
  criteria_target: string | null;
  criteria_value: number | null;
  rarity: string;
  sort_order: number;
  is_active: boolean;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
  is_featured: boolean;
  badge?: Badge;
}

export interface BadgeProgress {
  user_id: string;
  badge_id: string;
  current_value: number;
  badge?: Badge;
}

/**
 * GET /api/badges
 * Get all badges, optionally with user's earned status
 */
export async function GET(req: Request) {
  try {
    const supabase = await getSupabaseSSR();
    const { data: { user } } = await supabase.auth.getUser();

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || user?.id;
    const category = searchParams.get('category');
    const includeProgress = searchParams.get('includeProgress') === 'true';

    // Build query for badges
    let query = (supabase as any)
      .from('badges')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (category) {
      query = query.eq('category', category);
    }

    const { data: badges, error: badgesError } = await query;

    if (badgesError) {
      console.error('Error fetching badges:', badgesError);
      return NextResponse.json({ error: badgesError.message }, { status: 500 });
    }

    // Get user's earned badges if userId provided
    let earnedBadgeIds: string[] = [];
    let progressMap: Record<string, number> = {};

    if (userId) {
      const { data: userBadges } = await (supabase as any)
        .from('user_badges')
        .select('badge_id')
        .eq('user_id', userId);

      earnedBadgeIds = (userBadges || []).map((ub: { badge_id: string }) => ub.badge_id);

      if (includeProgress) {
        const { data: progress } = await (supabase as any)
          .from('badge_progress')
          .select('badge_id, current_value')
          .eq('user_id', userId);

        for (const p of (progress || [])) {
          progressMap[p.badge_id] = p.current_value;
        }
      }
    }

    // Enrich badges with earned status and progress
    const enrichedBadges = badges.map((badge: Badge) => ({
      ...badge,
      earned: earnedBadgeIds.includes(badge.id),
      progress: includeProgress ? (progressMap[badge.id] || 0) : undefined,
    }));

    return NextResponse.json({
      badges: enrichedBadges,
      total: badges.length,
      earned: earnedBadgeIds.length,
    });

  } catch (error: unknown) {
    console.error('Error in GET /api/badges:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/badges
 * Manually award a badge (admin only)
 */
export async function POST(req: Request) {
  try {
    const supabase = await getSupabaseSSR();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { userId, badgeId } = body;

    if (!userId || !badgeId) {
      return NextResponse.json({ error: 'userId and badgeId required' }, { status: 400 });
    }

    // Use admin client to award badge
    const admin = getSupabaseAdmin();
    const { data, error } = await (admin as any)
      .from('user_badges')
      .insert({
        user_id: userId,
        badge_id: badgeId,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'User already has this badge' }, { status: 409 });
      }
      console.error('Error awarding badge:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      userBadge: data,
    });

  } catch (error: unknown) {
    console.error('Error in POST /api/badges:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

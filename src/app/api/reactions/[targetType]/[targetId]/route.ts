import { NextResponse } from 'next/server';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';
import type { ReactionCounts, GetReactionsResponse } from '@/types/reactions';

async function fetchReactionTarget(supabase: any, targetType: string, targetId: string) {
  if (targetType === 'story') {
    const { data, error } = await supabase
      .from('stories')
      .select('id')
      .eq('id', targetId)
      .maybeSingle();
    return { data, error };
  }

  if (targetType === 'photo') {
    const { data, error } = await (supabase as any)
      .from('photos')
      .select('id')
      .eq('id', targetId)
      .maybeSingle();
    return { data, error };
  }

  if (targetType === 'comment') {
    const { data, error } = await (supabase as any)
      .from('story_comments')
      .select('id')
      .eq('id', targetId)
      .maybeSingle();
    return { data, error };
  }

  return { data: null, error: null };
}

interface RouteParams {
  params: Promise<{
    targetType: string;
    targetId: string;
  }>;
}

/**
 * GET /api/reactions/[targetType]/[targetId]
 * Get all reactions for a target
 */
export async function GET(req: Request, { params }: RouteParams) {
  try {
    const supabase = await getSupabaseSSR();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { targetType, targetId } = await params;

    if (!['story', 'photo', 'comment'].includes(targetType)) {
      return NextResponse.json({ error: 'Invalid target type' }, { status: 400 });
    }

    const { data: target, error: targetError } = await fetchReactionTarget(
      supabase,
      targetType,
      targetId
    );

    if (targetError || !target) {
      return NextResponse.json({ error: 'Target not found' }, { status: 404 });
    }

    // Get all reactions with profile info
    // Note: Using 'as any' until migration runs and types are regenerated
    const { data: reactions, error: reactionsError } = await (supabase as any)
      .from('reactions')
      .select(`
        id,
        target_type,
        target_id,
        profile_id,
        reaction_type,
        created_at,
        profile:user_profiles!profile_id (
          first_name,
          last_name,
          avatar_url
        )
      `)
      .eq('target_type', targetType)
      .eq('target_id', targetId)
      .order('created_at', { ascending: false });

    if (reactionsError) {
      console.error('Error fetching reactions:', reactionsError);
      return NextResponse.json({ error: reactionsError.message }, { status: 500 });
    }

    // Get counts
    const counts: ReactionCounts = {
      heart: 0,
      sad: 0,
      hug: 0,
      laugh: 0,
      pray: 0,
      total: 0,
    };

    try {
      const { data: countsData } = await (supabase as any).rpc('get_reaction_counts', {
        p_target_type: targetType,
        p_target_id: targetId,
      });

      if (countsData) {
        for (const row of countsData as { reaction_type: string; count: number }[]) {
          const rt = row.reaction_type as keyof Omit<ReactionCounts, 'total'>;
          counts[rt] = Number(row.count);
          counts.total += Number(row.count);
        }
      }
    } catch {
      // Function may not exist yet
    }

    // Get user's reaction
    let userReaction = null;
    try {
      const result = await (supabase as any).rpc('get_user_reaction', {
        p_target_type: targetType,
        p_target_id: targetId,
        p_profile_id: user.id,
      });
      userReaction = result?.data || null;
    } catch {
      // Function may not exist yet
    }

    const response: GetReactionsResponse = {
      reactions: reactions || [],
      counts,
      userReaction,
    };

    return NextResponse.json(response);

  } catch (error: unknown) {
    console.error('Error in GET /api/reactions/[targetType]/[targetId]:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

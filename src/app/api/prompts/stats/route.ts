import { NextResponse } from 'next/server';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';

export interface PromptStats {
  total_shown: number;
  total_answered: number;
  total_skipped: number;
  total_available: number;
  current_week_answered: boolean;
  by_category: Record<string, { answered: number; total: number }>;
}

/**
 * GET /api/prompts/stats
 * Get prompt statistics for the authenticated user
 */
export async function GET() {
  try {
    const supabase = await getSupabaseSSR();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Call the database function to get stats
    const { data: statsResult, error } = await (supabase as any).rpc('get_user_prompt_stats', {
      p_user_id: user.id,
    });

    if (error) {
      console.error('Error getting prompt stats:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!statsResult || statsResult.length === 0) {
      // Return default stats if none exist
      return NextResponse.json({
        stats: {
          total_shown: 0,
          total_answered: 0,
          total_skipped: 0,
          total_available: 0,
          current_week_answered: false,
          by_category: {},
        } as PromptStats,
      });
    }

    const stats = statsResult[0];

    return NextResponse.json({
      stats: {
        total_shown: Number(stats.total_shown) || 0,
        total_answered: Number(stats.total_answered) || 0,
        total_skipped: Number(stats.total_skipped) || 0,
        total_available: Number(stats.total_available) || 0,
        current_week_answered: Boolean(stats.current_week_answered),
        by_category: stats.by_category || {},
      } as PromptStats,
    });

  } catch (error: unknown) {
    console.error('Error in GET /api/prompts/stats:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

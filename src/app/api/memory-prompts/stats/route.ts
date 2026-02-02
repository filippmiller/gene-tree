import { NextResponse } from 'next/server';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';
import type { PromptStats, PromptStatsAPIResponse } from '@/types/prompts';

/**
 * GET /api/memory-prompts/stats
 * Get user's prompt statistics
 */
export async function GET(): Promise<Response> {
  try {
    const supabase = await getSupabaseSSR();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Call the database function
    const { data: statsResult, error } = await (supabase as any).rpc(
      'get_memory_prompt_stats',
      {
        p_user_id: user.id,
      }
    );

    if (error) {
      console.error('[GET /api/memory-prompts/stats] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Function returns a table, get first row
    const stats = statsResult?.[0] as PromptStats | undefined;

    const response: PromptStatsAPIResponse = {
      stats: stats || null,
    };

    return NextResponse.json(response);

  } catch (error: unknown) {
    console.error('[GET /api/memory-prompts/stats] Unexpected error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

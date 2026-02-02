import { NextResponse } from 'next/server';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';
import type { PromptWithStatus, PromptsListAPIResponse } from '@/types/prompts';

/**
 * GET /api/memory-prompts
 * Get paginated list of memory prompts with user response status
 *
 * Query params:
 * - category: Filter by category
 * - limit: Number of prompts (default 20)
 * - offset: Pagination offset (default 0)
 * - includeAnswered: Include already answered prompts (default false)
 */
export async function GET(req: Request): Promise<Response> {
  try {
    const supabase = await getSupabaseSSR();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category') || null;
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const includeAnswered = searchParams.get('includeAnswered') === 'true';

    // Call the database function
    const { data: prompts, error } = await (supabase as any).rpc(
      'get_memory_prompts_for_user',
      {
        p_user_id: user.id,
        p_category: category,
        p_limit: limit,
        p_offset: offset,
        p_include_answered: includeAnswered,
      }
    );

    if (error) {
      console.error('[GET /api/memory-prompts] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const response: PromptsListAPIResponse = {
      prompts: (prompts || []) as PromptWithStatus[],
      total: prompts?.length || 0,
    };

    return NextResponse.json(response);

  } catch (error: unknown) {
    console.error('[GET /api/memory-prompts] Unexpected error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

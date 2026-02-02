import { NextResponse } from 'next/server';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';
import type { DailyPromptResponse, DailyPromptAPIResponse } from '@/types/prompts';

/**
 * GET /api/memory-prompts/daily
 * Get today's featured memory prompt for the user
 *
 * Query params:
 * - contextProfileId: Optional profile ID for relationship-specific prompts
 */
export async function GET(req: Request): Promise<Response> {
  try {
    const supabase = await getSupabaseSSR();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const contextProfileId = searchParams.get('contextProfileId') || null;

    // Call the database function
    const { data: promptResult, error } = await (supabase as any).rpc(
      'get_daily_memory_prompt',
      {
        p_user_id: user.id,
        p_context_profile_id: contextProfileId,
      }
    );

    if (error) {
      console.error('[GET /api/memory-prompts/daily] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Function returns a table, get first row
    const prompt = promptResult?.[0] as DailyPromptResponse | undefined;

    const response: DailyPromptAPIResponse = {
      prompt: prompt || null,
    };

    return NextResponse.json(response);

  } catch (error: unknown) {
    console.error('[GET /api/memory-prompts/daily] Unexpected error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';
import type { RemindLaterRequest } from '@/types/prompts';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/memory-prompts/[id]/remind-later
 * Dismiss a prompt temporarily (remind me later)
 *
 * Body:
 * - days: Number of days to wait before showing again (default 7)
 */
export async function POST(
  req: Request,
  { params }: RouteParams
): Promise<Response> {
  try {
    const { id: promptId } = await params;

    const supabase = await getSupabaseSSR();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!promptId) {
      return NextResponse.json({ error: 'Prompt ID is required' }, { status: 400 });
    }

    let days = 7;
    try {
      const body = await req.json() as Partial<RemindLaterRequest>;
      if (body.days && body.days > 0 && body.days <= 30) {
        days = body.days;
      }
    } catch {
      // Body is optional, use defaults
    }

    // Call the database function
    const { data: success, error } = await (supabase as any).rpc(
      'remind_later_memory_prompt',
      {
        p_user_id: user.id,
        p_prompt_id: promptId,
        p_days: days,
      }
    );

    if (error) {
      console.error('[POST /api/memory-prompts/[id]/remind-later] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      promptId,
      action: 'remind_later',
      remindAfterDays: days,
    });

  } catch (error: unknown) {
    console.error('[POST /api/memory-prompts/[id]/remind-later] Unexpected error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

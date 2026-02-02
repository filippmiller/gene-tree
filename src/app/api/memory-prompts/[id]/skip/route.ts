import { NextResponse } from 'next/server';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/memory-prompts/[id]/skip
 * Mark a prompt as skipped by the user
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

    // Call the database function
    const { data: success, error } = await (supabase as any).rpc(
      'skip_memory_prompt',
      {
        p_user_id: user.id,
        p_prompt_id: promptId,
      }
    );

    if (error) {
      console.error('[POST /api/memory-prompts/[id]/skip] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      promptId,
      action: 'skipped',
    });

  } catch (error: unknown) {
    console.error('[POST /api/memory-prompts/[id]/skip] Unexpected error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

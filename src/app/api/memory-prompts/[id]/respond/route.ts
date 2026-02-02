import { NextResponse } from 'next/server';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';
import type { RespondToPromptRequest } from '@/types/prompts';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/memory-prompts/[id]/respond
 * Mark a prompt as answered and link to a story
 *
 * Body:
 * - storyId: UUID of the created story
 * - contextProfileId: Optional profile ID for context
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

    const body = await req.json() as Partial<RespondToPromptRequest>;
    const { storyId, contextProfileId } = body;

    if (!storyId) {
      return NextResponse.json({ error: 'Story ID is required' }, { status: 400 });
    }

    // Call the database function
    const { data: success, error } = await (supabase as any).rpc(
      'respond_to_memory_prompt',
      {
        p_user_id: user.id,
        p_prompt_id: promptId,
        p_story_id: storyId,
        p_context_profile_id: contextProfileId || null,
      }
    );

    if (error) {
      console.error('[POST /api/memory-prompts/[id]/respond] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      promptId,
      storyId,
      action: 'responded',
    });

  } catch (error: unknown) {
    console.error('[POST /api/memory-prompts/[id]/respond] Unexpected error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

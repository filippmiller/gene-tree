import { NextResponse } from 'next/server';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';
import { getSupabaseAdmin } from '@/lib/supabase/server-admin';

export interface WeeklyPromptResponse {
  prompt_id: string;
  prompt_text: string;
  prompt_text_ru: string | null;
  category: string;
  tags: string[];
  is_new: boolean;
  week_number: number;
  year: number;
}

/**
 * GET /api/prompts/weekly
 * Get the current weekly prompt for the authenticated user
 * Ensures no repetition until all prompts have been used
 */
export async function GET(req: Request) {
  try {
    const supabase = await getSupabaseSSR();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category') || null;

    // Call the database function to get the weekly prompt
    const admin = getSupabaseAdmin();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: promptResult, error } = await (admin as any).rpc('get_weekly_prompt', {
      p_user_id: user.id,
      p_category: category,
    });

    if (error) {
      console.error('Error getting weekly prompt:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!promptResult || promptResult.length === 0) {
      return NextResponse.json({
        error: 'No prompts available',
        prompt: null,
      }, { status: 404 });
    }

    const prompt = promptResult[0];

    // Get current week info
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const weekNumber = Math.ceil(
      ((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7
    );

    return NextResponse.json({
      prompt: {
        prompt_id: prompt.prompt_id,
        prompt_text: prompt.prompt_text,
        prompt_text_ru: prompt.prompt_text_ru,
        category: prompt.category,
        tags: prompt.tags || [],
        is_new: prompt.is_new,
        week_number: weekNumber,
        year: now.getFullYear(),
      } as WeeklyPromptResponse,
    });

  } catch (error: unknown) {
    console.error('Error in GET /api/prompts/weekly:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/prompts/weekly
 * Mark the current weekly prompt as answered or skipped
 */
export async function POST(req: Request) {
  try {
    const supabase = await getSupabaseSSR();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { promptId, storyId, action } = body;

    if (!promptId) {
      return NextResponse.json({ error: 'promptId is required' }, { status: 400 });
    }

    if (!action || !['answered', 'skipped'].includes(action)) {
      return NextResponse.json({
        error: 'action must be "answered" or "skipped"'
      }, { status: 400 });
    }

    const admin = getSupabaseAdmin();

    if (action === 'answered') {
      // Mark as answered using the database function
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (admin as any).rpc('mark_prompt_answered', {
        p_user_id: user.id,
        p_prompt_id: promptId,
        p_story_id: storyId || null,
      });

      if (error) {
        console.error('Error marking prompt as answered:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    } else {
      // Mark as skipped
      const now = new Date();
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      const weekNumber = Math.ceil(
        ((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7
      );

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (admin as any)
        .from('user_prompt_history')
        .upsert({
          user_id: user.id,
          prompt_id: promptId,
          week_number: weekNumber,
          year: now.getFullYear(),
          status: 'skipped',
        }, {
          onConflict: 'user_id,prompt_id,year,week_number',
        });

      if (error) {
        console.error('Error marking prompt as skipped:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      action,
      promptId,
    });

  } catch (error: unknown) {
    console.error('Error in POST /api/prompts/weekly:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

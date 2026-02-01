import { NextResponse } from 'next/server';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';

export interface StoryPrompt {
  id: string;
  category: string;
  prompt_text: string;
  prompt_text_ru: string | null;
  min_age: number | null;
  max_age: number | null;
  tags: string[];
  sort_order: number;
  is_active: boolean;
  usage_count: number;
}

/**
 * GET /api/prompts
 * Get all story prompts with optional filtering
 */
export async function GET(req: Request) {
  try {
    const supabase = await getSupabaseSSR();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const age = searchParams.get('age');
    const tag = searchParams.get('tag');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Build query
    let query = (supabase as any)
      .from('story_prompts')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .limit(limit);

    if (category) {
      query = query.eq('category', category);
    }

    if (age) {
      const ageNum = parseInt(age);
      query = query
        .or(`min_age.is.null,min_age.lte.${ageNum}`)
        .or(`max_age.is.null,max_age.gte.${ageNum}`);
    }

    if (tag) {
      query = query.contains('tags', [tag]);
    }

    const { data: prompts, error } = await query;

    if (error) {
      console.error('Error fetching prompts:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Group by category
    const byCategory: Record<string, StoryPrompt[]> = {};
    for (const prompt of (prompts || [])) {
      if (!byCategory[prompt.category]) {
        byCategory[prompt.category] = [];
      }
      byCategory[prompt.category].push(prompt);
    }

    return NextResponse.json({
      prompts,
      byCategory,
      total: prompts?.length || 0,
    });

  } catch (error: unknown) {
    console.error('Error in GET /api/prompts:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

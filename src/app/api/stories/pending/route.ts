
import { NextResponse } from 'next/server';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';

/**
 * GET /api/stories/pending
 * Fetch stories waiting for current user's approval
 */
export async function GET() {
  try {
    const supabase = await getSupabaseSSR();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: stories, error } = await supabase
      .from('stories')
      .select(`
        *,
        author:author_id (
          first_name,
          last_name,
          avatar_url
        )
      `)
      .eq('subject_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching pending stories:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ stories });

  } catch (error: any) {
    console.error('Error in GET /api/stories/pending:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

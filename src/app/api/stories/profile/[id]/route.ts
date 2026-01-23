
import { NextResponse } from 'next/server';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';

/**
 * GET /api/stories/profile/[id]
 * Fetch approved stories for a specific profile
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: profileId } = await params;
    const supabase = await getSupabaseSSR();
    
    // RLS will handle visibility filtering, so we just need to query
    // But we should filter by status='approved' explicitly for the feed
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
      .eq('subject_id', profileId)
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ stories });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

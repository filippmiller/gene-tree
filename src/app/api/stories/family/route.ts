import { NextResponse } from 'next/server';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';

/**
 * GET /api/stories/family
 * Get all approved stories from the user's family tree
 */
export async function GET() {
  try {
    const supabase = await getSupabaseSSR();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all family member IDs (including self)
    const { data: familyMembers } = await supabase
      .from('user_profiles')
      .select('id')
      .limit(100) as { data: { id: string }[] | null };

    const familyIds = familyMembers?.map(m => m.id) || [user.id];

    // Get approved stories from family members
    const { data: stories, error } = await supabase
      .from('stories')
      .select(`
        id,
        title,
        content,
        media_type,
        media_url,
        created_at,
        author:author_id (
          id,
          first_name,
          last_name,
          avatar_url
        ),
        subject:subject_id (
          id,
          first_name,
          last_name
        )
      `)
      .in('author_id', familyIds)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching family stories:', error);
      return NextResponse.json({ stories: [] });
    }

    return NextResponse.json({ stories: stories || [] });
  } catch (error) {
    console.error('Error in GET /api/stories/family:', error);
    return NextResponse.json({ stories: [] });
  }
}

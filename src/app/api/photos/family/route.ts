import { NextResponse } from 'next/server';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';

/**
 * GET /api/photos/family
 * Get all approved photos from the user's family tree
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

    // Get approved photo stories from family members
    const { data: photos, error } = await supabase
      .from('stories')
      .select(`
        id,
        title,
        content,
        media_url,
        created_at,
        author:author_id (
          id,
          first_name,
          last_name
        ),
        subject:subject_id (
          id,
          first_name,
          last_name
        )
      `)
      .in('author_id', familyIds)
      .eq('media_type', 'photo')
      .eq('status', 'approved')
      .not('media_url', 'is', null)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error fetching family photos:', error);
      return NextResponse.json({ photos: [] });
    }

    return NextResponse.json({ photos: photos || [] });
  } catch (error) {
    console.error('Error in GET /api/photos/family:', error);
    return NextResponse.json({ photos: [] });
  }
}

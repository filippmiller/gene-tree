import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';

/**
 * GET /api/voice-memories
 * List voice memories with pagination
 */
export async function GET(request: NextRequest) {
  const supabase = await getSupabaseSSR();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const profileId = searchParams.get('profile_id');
  const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50);
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  // Using any type here since voice_memories table is new and not yet in generated types
  let query = (supabase as any)
    .from('voice_memories')
    .select(`
      *,
      profile:user_profiles!profile_id(id, first_name, last_name, avatar_url),
      creator:user_profiles!user_id(id, first_name, last_name, avatar_url)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (profileId) {
    query = query.eq('profile_id', profileId);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('[VOICE_MEMORIES] List error:', error);
    return NextResponse.json({ error: 'Failed to load memories' }, { status: 500 });
  }

  return NextResponse.json({
    data: data || [],
    total: count || 0,
    hasMore: (data?.length || 0) === limit,
  });
}

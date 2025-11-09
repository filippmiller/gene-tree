import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { logAudit, extractRequestMeta } from '@/lib/audit/logger';

export async function GET(req: NextRequest) {
  const requestMeta = extractRequestMeta(req);

  try {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return cookieStore.get(name)?.value; },
          set(name: string, value: string, options: any) { cookieStore.set({ name, value, ...options }); },
          remove(name: string, options: any) { cookieStore.set({ name, value: '', ...options, maxAge: 0 }); }
        }
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      await logAudit({
        action: 'tree_fetch_unauthorized',
        method: 'GET',
        path: '/api/tree',
        responseStatus: 401,
        errorMessage: 'Unauthorized',
        ...requestMeta,
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user profiles (nodes)
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('id, first_name, middle_name, last_name, nickname, avatar_url, gender');

    if (profilesError) {
      await logAudit({
        action: 'tree_fetch_profiles_error',
        method: 'GET',
        path: '/api/tree',
        responseStatus: 500,
        errorMessage: profilesError.message,
        errorStack: JSON.stringify(profilesError),
        ...requestMeta,
      });
      return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 });
    }

    // Fetch relationships (edges)
    const { data: relationships, error: relationshipsError } = await supabase
      .from('relationships')
      .select('id, user1_id, user2_id, relationship_type');

    if (relationshipsError) {
      await logAudit({
        action: 'tree_fetch_relationships_error',
        method: 'GET',
        path: '/api/tree',
        responseStatus: 500,
        errorMessage: relationshipsError.message,
        errorStack: JSON.stringify(relationshipsError),
        ...requestMeta,
      });
      return NextResponse.json({ error: 'Failed to fetch relationships' }, { status: 500 });
    }

    // Transform to D3-friendly format
    const nodes = profiles.map(p => ({
      id: p.id,
      label: [p.first_name, p.middle_name, p.last_name].filter(Boolean).join(' ') || p.nickname || 'Unknown',
      avatar: p.avatar_url,
      gender: p.gender,
    }));

    const edges = relationships.map(r => ({
      id: r.id,
      source: r.user1_id,
      target: r.user2_id,
      type: r.relationship_type,
    }));

    await logAudit({
      action: 'tree_fetch_success',
      method: 'GET',
      path: '/api/tree',
      responseStatus: 200,
      responseBody: { nodesCount: nodes.length, edgesCount: edges.length },
      ...requestMeta,
    });

    return NextResponse.json({ nodes, edges });
  } catch (err: any) {
    await logAudit({
      action: 'tree_fetch_exception',
      method: 'GET',
      path: '/api/tree',
      responseStatus: 500,
      errorMessage: err.message,
      errorStack: err.stack,
      ...requestMeta,
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

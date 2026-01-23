import { getSupabaseAdmin } from '@/lib/supabase/server-admin';
import { NextResponse } from 'next/server';

// GET /api/users - Get all users (profiles)
export async function GET() {
  try {
    const { data: { user } } = await getSupabaseAdmin().auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all user profiles
    const { data: users, error } = await getSupabaseAdmin()
      .from('user_profiles')
      .select('id, first_name, last_name, email, avatar_url, gender, birth_date')
      .order('first_name', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ users: users || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

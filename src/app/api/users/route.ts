import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/users - Get all users (profiles)
export async function GET(request: NextRequest) {
  console.log('[USERS-API] GET request received');
  try {
    const cookieStore = await cookies();
    const supabaseAdmin = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            cookieStore.set(name, value, options);
          },
          remove(name: string, options: any) {
            cookieStore.set(name, '', { ...options, maxAge: 0 });
          },
        },
      }
    );

    const { data: { user } } = await supabaseAdmin.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[USERS-API] Fetching user profiles');

    // Get all user profiles
    const { data: users, error } = await supabaseAdmin
      .from('user_profiles')
      .select('id, first_name, last_name, email, avatar_url, gender, birth_date')
      .order('first_name', { ascending: true });

    if (error) {
      console.error('[USERS-API] Error fetching users:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('[USERS-API] Found users:', users?.length || 0);

    return NextResponse.json({ users: users || [] });
  } catch (error: any) {
    console.error('[USERS-API] Unexpected error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


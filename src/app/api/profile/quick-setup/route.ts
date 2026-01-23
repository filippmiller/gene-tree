import { getSupabaseAdmin } from '@/lib/supabase/server-admin';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { data: { user } } = await getSupabaseAdmin().auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const first_name = formData.get('first_name') as string;
    const last_name = formData.get('last_name') as string;

    if (!first_name || !last_name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Insert profile
    const { error: insertError } = await getSupabaseAdmin()
      .from('user_profiles')
      .insert({
        id: user.id,
        first_name,
        last_name,
      });

    if (insertError) {
      console.error('Profile creation error:', insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Redirect to dashboard
    const url = new URL('/en/app', request.url);
    return NextResponse.redirect(url);
  } catch (error: any) {
    console.error('Quick setup error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


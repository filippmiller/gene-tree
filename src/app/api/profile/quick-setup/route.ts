import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
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

    const formData = await request.formData();
    const first_name = formData.get('first_name') as string;
    const last_name = formData.get('last_name') as string;

    if (!first_name || !last_name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Insert profile
    const { error: insertError } = await supabaseAdmin
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


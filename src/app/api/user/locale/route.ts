import { supabaseAdmin } from '@/lib/supabase/server-admin';
import { NextResponse } from 'next/server';

/**
 * GET /api/user/locale
 * Get user's preferred locale
 */
export async function GET() {
  try {
    // Using supabaseAdmin
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile, error } = await supabaseAdmin
      .from('user_profiles')
      .select('preferred_locale')
      .eq('id', user.id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      locale: profile?.preferred_locale || 'ru' 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/user/locale
 * Update user's preferred locale
 */
export async function POST(request: Request) {
  try {
    // Using supabaseAdmin
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { locale } = body;

    // Validate locale
    if (!locale || !['ru', 'en'].includes(locale)) {
      return NextResponse.json({ 
        error: 'Invalid locale. Must be "ru" or "en"' 
      }, { status: 400 });
    }

    // Update user profile
    const { error: updateError } = await supabaseAdmin
      .from('user_profiles')
      .update({ preferred_locale: locale })
      .eq('id', user.id);

    if (updateError) {
      return NextResponse.json({ 
        error: updateError.message 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      locale 
    });
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 });
  }
}


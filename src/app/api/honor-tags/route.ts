import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server-admin';

/**
 * GET /api/honor-tags
 *
 * List all available honor tags, optionally filtered by category
 */
export async function GET(request: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const countryCode = searchParams.get('country');

    // Use admin client to bypass RLS for reading honor tags
    // Tables not yet in generated types, using 'as any'
    let query = (supabaseAdmin as any)
      .from('honor_tags')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')
      .order('name');

    if (category) {
      query = query.eq('category', category);
    }

    if (countryCode) {
      query = query.or(`country_code.eq.${countryCode},country_code.is.null`);
    }

    const { data: tags, error } = await query;

    if (error) {
      console.error('Error fetching honor tags:', error);
      return NextResponse.json(
        { error: 'Failed to fetch honor tags' },
        { status: 500 }
      );
    }

    return NextResponse.json({ tags });
  } catch (error) {
    console.error('Error in GET /api/honor-tags:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server-admin';

/**
 * GET /api/honor-tags/categories
 *
 * List all honor tag categories with counts
 */
export async function GET() {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    // Tables not yet in generated types, using 'as any'
    const { data: tags, error } = await (supabaseAdmin as any)
      .from('honor_tags')
      .select('category')
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching honor tag categories:', error);
      return NextResponse.json(
        { error: 'Failed to fetch categories' },
        { status: 500 }
      );
    }

    // Count by category
    const categoryCounts = tags.reduce((acc: Record<string, number>, tag: { category: string }) => {
      acc[tag.category] = (acc[tag.category] || 0) + 1;
      return acc;
    }, {});

    const categories = Object.entries(categoryCounts).map(([category, count]) => ({
      category,
      count,
    }));

    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Error in GET /api/honor-tags/categories:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

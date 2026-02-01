import { NextResponse } from 'next/server';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';

/**
 * POST /api/badges/feature
 * Toggle a badge as featured on user's profile
 */
export async function POST(req: Request) {
  try {
    const supabase = await getSupabaseSSR();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { userBadgeId, featured } = body;

    if (!userBadgeId || typeof featured !== 'boolean') {
      return NextResponse.json({ error: 'userBadgeId and featured required' }, { status: 400 });
    }

    // Verify the badge belongs to the user
    const { data: existingBadge, error: findError } = await (supabase as any)
      .from('user_badges')
      .select('id, user_id, is_featured')
      .eq('id', userBadgeId)
      .single();

    if (findError || !existingBadge) {
      return NextResponse.json({ error: 'Badge not found' }, { status: 404 });
    }

    if (existingBadge.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check featured count if adding new featured
    if (featured) {
      const { count } = await (supabase as any)
        .from('user_badges')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_featured', true);

      if (count >= 5) {
        return NextResponse.json({
          error: 'Maximum 5 featured badges allowed'
        }, { status: 400 });
      }
    }

    // Update featured status
    const { data: updated, error: updateError } = await (supabase as any)
      .from('user_badges')
      .update({ is_featured: featured })
      .eq('id', userBadgeId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating badge:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      userBadge: updated,
    });

  } catch (error: unknown) {
    console.error('Error in POST /api/badges/feature:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

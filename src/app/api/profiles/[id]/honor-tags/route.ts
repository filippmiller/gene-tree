import { NextResponse } from 'next/server';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';
import { getSupabaseAdmin } from '@/lib/supabase/server-admin';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/profiles/:id/honor-tags
 *
 * Get all honor tags for a profile
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id: profileId } = await params;
    const supabaseAdmin = getSupabaseAdmin();

    // Get profile honor tags with full tag details
    // Tables not yet in generated types, using 'as any'
    const { data: tags, error } = await (supabaseAdmin as any)
      .from('profile_honor_tags')
      .select(`
        id,
        profile_id,
        honor_tag_id,
        verification_level,
        verified_by,
        document_url,
        notes,
        display_order,
        is_featured,
        added_by,
        added_at,
        honor_tags (
          id,
          code,
          name,
          name_ru,
          description,
          description_ru,
          category,
          icon,
          color,
          background_color,
          is_official,
          requires_verification
        )
      `)
      .eq('profile_id', profileId)
      .order('display_order')
      .order('added_at');

    if (error) {
      console.error('Error fetching profile honor tags:', error);
      return NextResponse.json(
        { error: 'Failed to fetch honor tags' },
        { status: 500 }
      );
    }

    // Flatten the response for easier frontend consumption
    const flattenedTags = tags?.map((tag: any) => ({
      ...tag,
      ...(tag.honor_tags as any),
      honor_tag: undefined,
    })) || [];

    return NextResponse.json({ tags: flattenedTags });
  } catch (error) {
    console.error('Error in GET /api/profiles/:id/honor-tags:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/profiles/:id/honor-tags
 *
 * Add an honor tag to a profile
 */
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id: profileId } = await params;
    const supabase = await getSupabaseSSR();
    const supabaseAdmin = getSupabaseAdmin();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { honor_tag_id, notes } = body;

    if (!honor_tag_id) {
      return NextResponse.json(
        { error: 'honor_tag_id is required' },
        { status: 400 }
      );
    }

    // Check if profile exists and determine permissions
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('id, is_living')
      .eq('id', profileId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Check permissions:
    // - Own profile: always allowed
    // - Deceased family member: allowed
    // - Other profiles: not allowed
    const isOwnProfile = profileId === user.id;
    const isDeceased = (profile as any).is_living === false;

    if (!isOwnProfile && !isDeceased) {
      return NextResponse.json(
        { error: 'Cannot add honor tags to other living profiles' },
        { status: 403 }
      );
    }

    // Check if tag already exists on profile
    const { data: existing } = await (supabaseAdmin as any)
      .from('profile_honor_tags')
      .select('id')
      .eq('profile_id', profileId)
      .eq('honor_tag_id', honor_tag_id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: 'Honor tag already added to this profile' },
        { status: 409 }
      );
    }

    // Add the honor tag
    const { data: newTag, error: insertError } = await (supabaseAdmin as any)
      .from('profile_honor_tags')
      .insert({
        profile_id: profileId,
        honor_tag_id,
        notes,
        added_by: user.id,
        verification_level: 'self_declared',
      })
      .select(`
        id,
        profile_id,
        honor_tag_id,
        verification_level,
        verified_by,
        notes,
        display_order,
        is_featured,
        added_by,
        added_at,
        honor_tags (
          id,
          code,
          name,
          name_ru,
          description,
          description_ru,
          category,
          icon,
          color,
          background_color
        )
      `)
      .single();

    if (insertError) {
      console.error('Error adding honor tag:', insertError);
      return NextResponse.json(
        { error: 'Failed to add honor tag' },
        { status: 500 }
      );
    }

    // Flatten the response
    const flattenedTag = {
      ...newTag,
      ...(newTag.honor_tags as any),
      honor_tag: undefined,
    };

    return NextResponse.json({ tag: flattenedTag }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/profiles/:id/honor-tags:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

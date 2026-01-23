import { NextResponse } from 'next/server';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';
import { createNotification } from '@/lib/notifications';
import type { AddPhotoTagRequest, GetPhotoTagsResponse, PhotoTagWithProfile } from '@/types/photo-tags';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/photos/[id]/tags
 * Get all tags for a photo
 */
export async function GET(req: Request, { params }: RouteParams) {
  try {
    const supabase = await getSupabaseSSR();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: photoId } = await params;

    // Verify photo exists and user can view it
    const { data: photo, error: photoError } = await (supabase as any)
      .from('photos')
      .select('id')
      .eq('id', photoId)
      .maybeSingle();

    if (photoError || !photo) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
    }

    // Get all tags with profile info
    // Note: Using 'as any' until migration runs and types are regenerated
    const { data: tags, error: tagsError } = await (supabase as any)
      .from('photo_tags')
      .select(`
        id,
        photo_id,
        tagged_profile_id,
        x_percent,
        y_percent,
        width_percent,
        height_percent,
        tagged_by,
        is_confirmed,
        confirmed_at,
        created_at,
        tagged_profile:user_profiles!tagged_profile_id (
          first_name,
          last_name,
          avatar_url
        ),
        tagger:user_profiles!tagged_by (
          first_name,
          last_name
        )
      `)
      .eq('photo_id', photoId)
      .order('created_at', { ascending: true });

    if (tagsError) {
      console.error('Error fetching photo tags:', tagsError);
      // Table may not exist yet
      if (tagsError.code === '42P01') {
        return NextResponse.json({ tags: [], total: 0 });
      }
      return NextResponse.json({ error: tagsError.message }, { status: 500 });
    }

    const response: GetPhotoTagsResponse = {
      tags: (tags || []) as PhotoTagWithProfile[],
      total: tags?.length || 0,
    };

    return NextResponse.json(response);

  } catch (error: unknown) {
    console.error('Error in GET /api/photos/[id]/tags:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/photos/[id]/tags
 * Add a tag to a photo
 */
export async function POST(req: Request, { params }: RouteParams) {
  try {
    const supabase = await getSupabaseSSR();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: photoId } = await params;
    const body: AddPhotoTagRequest = await req.json();
    const { tagged_profile_id, x_percent, y_percent, width_percent, height_percent } = body;

    // Validate required fields
    if (!tagged_profile_id || x_percent === undefined || y_percent === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate coordinates
    if (x_percent < 0 || x_percent > 100 || y_percent < 0 || y_percent > 100) {
      return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 });
    }

    // Verify photo exists and user can view it
    const { data: photo, error: photoError } = await (supabase as any)
      .from('photos')
      .select('id, uploaded_by')
      .eq('id', photoId)
      .maybeSingle();

    if (photoError || !photo) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
    }

    // Verify tagged profile exists
    const { data: taggedProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, first_name, last_name')
      .eq('id', tagged_profile_id)
      .maybeSingle();

    if (profileError || !taggedProfile) {
      return NextResponse.json({ error: 'Tagged profile not found' }, { status: 404 });
    }

    // Create the tag
    const { data: tag, error: createError } = await (supabase as any)
      .from('photo_tags')
      .insert({
        photo_id: photoId,
        tagged_profile_id,
        x_percent,
        y_percent,
        width_percent: width_percent || 10,
        height_percent: height_percent || 10,
        tagged_by: user.id,
        is_confirmed: tagged_profile_id === user.id, // Auto-confirm if tagging yourself
        confirmed_at: tagged_profile_id === user.id ? new Date().toISOString() : null,
      })
      .select(`
        id,
        photo_id,
        tagged_profile_id,
        x_percent,
        y_percent,
        width_percent,
        height_percent,
        tagged_by,
        is_confirmed,
        confirmed_at,
        created_at,
        tagged_profile:user_profiles!tagged_profile_id (
          first_name,
          last_name,
          avatar_url
        ),
        tagger:user_profiles!tagged_by (
          first_name,
          last_name
        )
      `)
      .single();

    if (createError) {
      console.error('Error creating photo tag:', createError);
      if (createError.code === '23505') {
        return NextResponse.json({ error: 'This person is already tagged in this photo' }, { status: 409 });
      }
      if (createError.code === '42501') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      return NextResponse.json({ error: createError.message }, { status: 500 });
    }

    // Send notification to tagged person (if not self)
    if (tagged_profile_id !== user.id) {
      await createNotification({
        eventType: 'PHOTO_TAGGED',
        actorUserId: user.id,
        primaryProfileId: tagged_profile_id,
        payload: {
          photo_id: photoId,
          tag_id: tag.id,
        },
      });
    }

    return NextResponse.json({
      success: true,
      tag: tag as PhotoTagWithProfile,
    });

  } catch (error: unknown) {
    console.error('Error in POST /api/photos/[id]/tags:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

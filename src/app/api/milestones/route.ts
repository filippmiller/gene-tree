import { NextResponse } from 'next/server';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';
import { logAudit } from '@/lib/audit/logger';
import type { MilestoneInsert } from '@/lib/milestones/types';

/**
 * GET /api/milestones
 * List milestones with optional filters
 *
 * Query params:
 * - profile_id: Filter by person the milestone is about
 * - category: Filter by category (baby, education, career, relationship, life, custom)
 * - type: Filter by specific milestone type
 * - limit: Number of results (default 50)
 * - offset: Pagination offset
 */
export async function GET(req: Request) {
  try {
    const supabase = await getSupabaseSSR();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const profileId = url.searchParams.get('profile_id');
    const category = url.searchParams.get('category');
    const milestoneType = url.searchParams.get('type');
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);

    // Build query - use type assertion since milestones table types not yet generated
    let query = supabase
      .from('milestones' as never)
      .select(`
        *,
        profile:profile_id (
          id,
          first_name,
          last_name,
          avatar_url
        ),
        creator:created_by (
          id,
          first_name,
          last_name,
          avatar_url
        )
      `)
      .order('milestone_date', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (profileId) {
      query = query.eq('profile_id', profileId);
    }

    if (category) {
      query = query.eq('category', category);
    }

    if (milestoneType) {
      query = query.eq('milestone_type', milestoneType);
    }

    const { data: milestones, error } = await query;

    if (error) {
      console.error('Error fetching milestones:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ milestones: milestones || [] });
  } catch (error: unknown) {
    console.error('Error in GET /api/milestones:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/milestones
 * Create a new milestone
 *
 * Body:
 * - profile_id: UUID - who this milestone is about
 * - milestone_type: string - type of milestone
 * - category: string - category (baby, education, career, relationship, life, custom)
 * - title: string - milestone title
 * - description?: string - optional description
 * - milestone_date: string - ISO date string
 * - media_urls?: string[] - optional array of media paths
 * - visibility?: string - public, family, private, unlisted (default: family)
 * - remind_annually?: boolean - whether to remind on anniversary
 * - reminder_days_before?: number - days before to remind (default: 7)
 */
export async function POST(req: Request) {
  try {
    const supabase = await getSupabaseSSR();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      profile_id,
      milestone_type,
      category = 'custom',
      title,
      description,
      milestone_date,
      media_urls = [],
      visibility = 'family',
      remind_annually = false,
      reminder_days_before = 7,
    } = body as Partial<MilestoneInsert>;

    // Validation
    if (!profile_id) {
      return NextResponse.json({ error: 'profile_id is required' }, { status: 400 });
    }
    if (!milestone_type) {
      return NextResponse.json({ error: 'milestone_type is required' }, { status: 400 });
    }
    if (!title) {
      return NextResponse.json({ error: 'title is required' }, { status: 400 });
    }
    if (!milestone_date) {
      return NextResponse.json({ error: 'milestone_date is required' }, { status: 400 });
    }

    // Verify the date format
    const dateObj = new Date(milestone_date);
    if (isNaN(dateObj.getTime())) {
      return NextResponse.json({ error: 'Invalid milestone_date format' }, { status: 400 });
    }

    // Create the milestone
    const insertData = {
      profile_id,
      created_by: user.id,
      milestone_type,
      category,
      title,
      description: description || null,
      milestone_date,
      media_urls,
      visibility,
      remind_annually,
      reminder_days_before,
    };

    const { data: milestone, error: createError } = await supabase
      .from('milestones' as never)
      .insert(insertData as never)
      .select(`
        *,
        profile:profile_id (
          id,
          first_name,
          last_name,
          avatar_url
        )
      `)
      .single();

    if (createError) {
      console.error('Error creating milestone:', createError);
      return NextResponse.json({ error: createError.message }, { status: 500 });
    }

    // Create notification for the profile owner if different from creator
    const milestoneData = milestone as { id: string } | null;
    if (profile_id !== user.id && milestoneData) {
      await supabase
        .from('notifications')
        .insert({
          event_type: 'MILESTONE_ADDED',
          actor_profile_id: user.id,
          primary_profile_id: profile_id,
          payload: {
            milestone_id: milestoneData.id,
            milestone_type,
            title,
          },
        } as never);

      await supabase
        .from('notification_recipients')
        .insert({
          notification_id: milestoneData.id,
          profile_id,
          is_read: false,
        } as never);
    }

    await logAudit({
      action: 'CREATE_MILESTONE',
      entityType: 'milestone',
      entityId: milestoneData?.id || '',
      requestBody: { profile_id, milestone_type, title },
    });

    return NextResponse.json(milestone, { status: 201 });
  } catch (error: unknown) {
    console.error('Error in POST /api/milestones:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

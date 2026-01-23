import { NextResponse } from 'next/server';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';
import type { ActivityFeedResponse, ActivityEventWithActor } from '@/types/activity';

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;

/**
 * GET /api/activity/feed
 * Get the activity feed for the current user's family circle
 */
export async function GET(req: Request) {
  try {
    const supabase = await getSupabaseSSR();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get('cursor'); // ISO timestamp
    const limitParam = searchParams.get('limit');
    const filterParam = searchParams.get('filter'); // comma-separated event types

    const limit = Math.min(
      Math.max(1, parseInt(limitParam || String(DEFAULT_PAGE_SIZE), 10)),
      MAX_PAGE_SIZE
    );

    // Get user's family circle
    const { data: familyRows, error: familyError } = await (supabase as any).rpc(
      'get_family_circle_profile_ids',
      { p_user_id: user.id }
    );

    const familyIds = new Set<string>();
    familyIds.add(user.id); // Include self

    if (familyError) {
      console.error('Error fetching family circle:', familyError);
    }

    for (const row of (familyRows as { profile_id: string }[] | null) || []) {
      if (row.profile_id) familyIds.add(row.profile_id);
    }

    // Build query
    // Note: Using 'as any' until migration runs and types are regenerated
    let query = (supabase as any)
      .from('activity_events')
      .select(`
        id,
        event_type,
        actor_id,
        subject_type,
        subject_id,
        display_data,
        visibility,
        created_at,
        actor:user_profiles!actor_id (
          id,
          first_name,
          last_name,
          avatar_url
        )
      `)
      .in('actor_id', Array.from(familyIds))
      .order('created_at', { ascending: false })
      .limit(limit + 1); // Fetch one extra to check if there's more

    // Apply cursor pagination
    if (cursor) {
      query = query.lt('created_at', cursor);
    }

    // Apply event type filter
    if (filterParam) {
      const filterTypes = filterParam.split(',').map(t => t.trim());
      query = query.in('event_type', filterTypes);
    }

    const { data: events, error: eventsError } = await query;

    if (eventsError) {
      console.error('Error fetching activity feed:', eventsError);
      return NextResponse.json({ error: eventsError.message }, { status: 500 });
    }

    // Determine if there are more results
    const hasMore = (events?.length || 0) > limit;
    const resultEvents = hasMore ? events?.slice(0, limit) : events;

    // Get next cursor
    const nextCursor = hasMore && resultEvents && resultEvents.length > 0
      ? resultEvents[resultEvents.length - 1].created_at
      : null;

    // Transform to response format
    const transformedEvents: ActivityEventWithActor[] = (resultEvents || []).map((event: any) => ({
      id: event.id,
      event_type: event.event_type,
      actor_id: event.actor_id,
      subject_type: event.subject_type,
      subject_id: event.subject_id,
      display_data: event.display_data || {},
      visibility: event.visibility,
      created_at: event.created_at,
      actor: event.actor as ActivityEventWithActor['actor'],
    }));

    const response: ActivityFeedResponse = {
      events: transformedEvents,
      nextCursor,
      hasMore,
    };

    return NextResponse.json(response);

  } catch (error: unknown) {
    console.error('Error in GET /api/activity/feed:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

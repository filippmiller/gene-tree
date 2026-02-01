import { NextResponse } from 'next/server';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';
import type { ActivityFeedResponse, ActivityEventWithActor, ActivityEventType, ActivitySubjectType } from '@/types/activity';

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;

/**
 * GET /api/activity/feed
 * Get the activity feed for the current user's family circle
 *
 * This endpoint uses a hybrid approach:
 * 1. First tries to fetch from activity_events table (if populated by triggers)
 * 2. Falls back to synthesizing events from pending_relatives and photos tables
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
    const familyIds = new Set<string>();
    familyIds.add(user.id); // Include self

    try {
      const { data: familyRows, error: familyError } = await (supabase as any).rpc(
        'get_family_circle_profile_ids',
        { p_user_id: user.id }
      );

      if (!familyError && familyRows) {
        for (const row of (familyRows as { profile_id: string }[] | null) || []) {
          if (row.profile_id) familyIds.add(row.profile_id);
        }
      }
    } catch (err) {
      console.warn('Family circle fetch failed, using only self:', err);
    }

    // Try to get events from activity_events table first
    let events: ActivityEventWithActor[] = [];
    let hasMore = false;
    let nextCursor: string | null = null;

    try {
      const result = await fetchFromActivityEvents(supabase, {
        familyIds: Array.from(familyIds),
        limit,
        cursor,
        filter: filterParam,
      });
      events = result.events;
      hasMore = result.hasMore;
      nextCursor = result.nextCursor;
    } catch (err) {
      console.warn('activity_events table query failed, synthesizing from source tables:', err);
    }

    // If no events from activity_events, synthesize from source tables
    if (events.length === 0) {
      const result = await synthesizeActivityEvents(supabase, {
        userId: user.id,
        familyIds: Array.from(familyIds),
        limit,
        cursor,
        filter: filterParam,
      });
      events = result.events;
      hasMore = result.hasMore;
      nextCursor = result.nextCursor;
    }

    const response: ActivityFeedResponse = {
      events,
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

/**
 * Fetch events from the activity_events table (if triggers have populated it)
 */
async function fetchFromActivityEvents(
  supabase: any,
  options: {
    familyIds: string[];
    limit: number;
    cursor: string | null;
    filter: string | null;
  }
): Promise<{ events: ActivityEventWithActor[]; hasMore: boolean; nextCursor: string | null }> {
  const { familyIds, limit, cursor, filter } = options;

  let query = supabase
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
    .in('actor_id', familyIds)
    .order('created_at', { ascending: false })
    .limit(limit + 1);

  if (cursor) {
    query = query.lt('created_at', cursor);
  }

  if (filter) {
    const filterTypes = filter.split(',').map(t => t.trim());
    query = query.in('event_type', filterTypes);
  }

  const { data: events, error } = await query;

  if (error) {
    throw error;
  }

  const hasMore = (events?.length || 0) > limit;
  const resultEvents = hasMore ? events?.slice(0, limit) : events;
  const nextCursor = hasMore && resultEvents && resultEvents.length > 0
    ? resultEvents[resultEvents.length - 1].created_at
    : null;

  const transformedEvents: ActivityEventWithActor[] = (resultEvents || []).map((event: any) => ({
    id: event.id,
    event_type: event.event_type as ActivityEventType,
    actor_id: event.actor_id,
    subject_type: event.subject_type as ActivitySubjectType,
    subject_id: event.subject_id,
    display_data: event.display_data || {},
    visibility: event.visibility,
    created_at: event.created_at,
    actor: event.actor as ActivityEventWithActor['actor'],
  }));

  return { events: transformedEvents, hasMore, nextCursor };
}

/**
 * Synthesize activity events from source tables (pending_relatives, photos)
 * This is the fallback when activity_events table is empty
 */
async function synthesizeActivityEvents(
  supabase: any,
  options: {
    userId: string;
    familyIds: string[];
    limit: number;
    cursor: string | null;
    filter: string | null;
  }
): Promise<{ events: ActivityEventWithActor[]; hasMore: boolean; nextCursor: string | null }> {
  const { familyIds, limit, cursor, filter } = options;

  const allEvents: ActivityEventWithActor[] = [];
  const filterTypes = filter ? filter.split(',').map(t => t.trim()) : null;

  // Fetch pending_relatives (relative_added events)
  if (!filterTypes || filterTypes.includes('relative_added')) {
    try {
      let query = supabase
        .from('pending_relatives')
        .select(`
          id,
          first_name,
          last_name,
          relationship_type,
          created_at,
          invited_by,
          inviter:user_profiles!invited_by (
            id,
            first_name,
            last_name,
            avatar_url
          )
        `)
        .in('invited_by', familyIds)
        .order('created_at', { ascending: false })
        .limit(limit + 5);

      if (cursor) {
        query = query.lt('created_at', cursor);
      }

      const { data: relatives, error } = await query;

      if (!error && relatives) {
        for (const rel of relatives) {
          if (!rel.inviter) continue;

          allEvents.push({
            id: `relative-${rel.id}`,
            event_type: 'relative_added',
            actor_id: rel.invited_by,
            subject_type: 'profile',
            subject_id: rel.id,
            display_data: {
              actor_name: `${rel.inviter.first_name} ${rel.inviter.last_name}`,
              related_profile_name: `${rel.first_name} ${rel.last_name}`,
              relationship_type: rel.relationship_type,
            },
            visibility: 'family',
            created_at: rel.created_at,
            actor: {
              id: rel.inviter.id,
              first_name: rel.inviter.first_name,
              last_name: rel.inviter.last_name,
              avatar_url: rel.inviter.avatar_url,
            },
          });
        }
      }
    } catch (err) {
      console.warn('Failed to fetch pending_relatives:', err);
    }
  }

  // Fetch photos (photo_added events)
  if (!filterTypes || filterTypes.includes('photo_added')) {
    try {
      let query = supabase
        .from('photos')
        .select(`
          id,
          caption,
          type,
          visibility,
          created_at,
          uploaded_by,
          target_profile_id,
          uploader:user_profiles!uploaded_by (
            id,
            first_name,
            last_name,
            avatar_url
          ),
          target:user_profiles!target_profile_id (
            id,
            first_name,
            last_name
          )
        `)
        .in('uploaded_by', familyIds)
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(limit + 5);

      if (cursor) {
        query = query.lt('created_at', cursor);
      }

      const { data: photos, error } = await query;

      if (!error && photos) {
        for (const photo of photos) {
          if (!photo.uploader) continue;

          const targetName = photo.target
            ? `${photo.target.first_name} ${photo.target.last_name}`
            : null;

          allEvents.push({
            id: `photo-${photo.id}`,
            event_type: 'photo_added',
            actor_id: photo.uploaded_by,
            subject_type: 'photo',
            subject_id: photo.id,
            display_data: {
              actor_name: `${photo.uploader.first_name} ${photo.uploader.last_name}`,
              subject_title: photo.caption || 'a photo',
              related_profile_name: targetName,
              media_type: photo.type,
            },
            visibility: photo.visibility || 'family',
            created_at: photo.created_at,
            actor: {
              id: photo.uploader.id,
              first_name: photo.uploader.first_name,
              last_name: photo.uploader.last_name,
              avatar_url: photo.uploader.avatar_url,
            },
          });
        }
      }
    } catch (err) {
      console.warn('Failed to fetch photos:', err);
    }
  }

  // Fetch profile updates (profile_updated events) - user's own profile changes
  if (!filterTypes || filterTypes.includes('profile_updated')) {
    try {
      let query = supabase
        .from('user_profiles')
        .select(`
          id,
          first_name,
          last_name,
          avatar_url,
          updated_at
        `)
        .in('id', familyIds)
        .not('updated_at', 'is', null)
        .order('updated_at', { ascending: false })
        .limit(limit + 5);

      if (cursor) {
        query = query.lt('updated_at', cursor);
      }

      const { data: profiles, error } = await query;

      if (!error && profiles) {
        for (const profile of profiles) {
          // Only include if updated_at is different from created_at (actual update)
          allEvents.push({
            id: `profile-${profile.id}-${profile.updated_at}`,
            event_type: 'profile_updated',
            actor_id: profile.id,
            subject_type: 'profile',
            subject_id: profile.id,
            display_data: {
              actor_name: `${profile.first_name} ${profile.last_name}`,
            },
            visibility: 'family',
            created_at: profile.updated_at,
            actor: {
              id: profile.id,
              first_name: profile.first_name,
              last_name: profile.last_name,
              avatar_url: profile.avatar_url,
            },
          });
        }
      }
    } catch (err) {
      console.warn('Failed to fetch profile updates:', err);
    }
  }

  // Sort all events by created_at descending
  allEvents.sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  // Apply pagination
  const hasMore = allEvents.length > limit;
  const resultEvents = allEvents.slice(0, limit);
  const nextCursor = hasMore && resultEvents.length > 0
    ? resultEvents[resultEvents.length - 1].created_at
    : null;

  return { events: resultEvents, hasMore, nextCursor };
}

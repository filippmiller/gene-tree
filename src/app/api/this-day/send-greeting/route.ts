import { NextResponse } from 'next/server';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';
import { createNotification } from '@/lib/notifications';
import type { SendGreetingRequest, SendGreetingResponse } from '@/types/this-day';

/**
 * POST /api/this-day/send-greeting
 * Send a greeting notification for a This Day event
 */
export async function POST(req: Request) {
  try {
    const supabase = await getSupabaseSSR();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: SendGreetingRequest = await req.json();
    const { event_id, message, greeting_type } = body;

    if (!event_id || !greeting_type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!['birthday', 'anniversary', 'memorial'].includes(greeting_type)) {
      return NextResponse.json({ error: 'Invalid greeting type' }, { status: 400 });
    }

    // Fetch the event to get the profile to notify
    // Note: Using 'as any' until migration runs and types are regenerated
    const { data: event, error: eventError } = await (supabase as any)
      .from('daily_events_cache')
      .select('id, profile_id, event_type, display_title, related_profile_id')
      .eq('id', event_id)
      .maybeSingle();

    if (eventError || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Don't send greeting to yourself
    if (event.profile_id === user.id) {
      return NextResponse.json({ error: 'Cannot send greeting to yourself' }, { status: 400 });
    }

    // Map greeting type to notification event type
    const notificationEventType = greeting_type === 'birthday'
      ? 'BIRTHDAY_REMINDER'
      : greeting_type === 'anniversary'
        ? 'BIRTHDAY_REMINDER' // We use same type for simplicity
        : 'BIRTHDAY_REMINDER';

    // Create notification for the event profile
    await createNotification({
      eventType: notificationEventType,
      actorUserId: user.id,
      primaryProfileId: event.profile_id,
      payload: {
        greeting_type,
        message: message || null,
        event_title: event.display_title,
        event_id: event.id,
      },
    });

    // If anniversary, also notify the related profile
    if (event.event_type === 'anniversary' && event.related_profile_id && event.related_profile_id !== user.id) {
      await createNotification({
        eventType: notificationEventType,
        actorUserId: user.id,
        primaryProfileId: event.related_profile_id,
        payload: {
          greeting_type,
          message: message || null,
          event_title: event.display_title,
          event_id: event.id,
        },
      });
    }

    const response: SendGreetingResponse = {
      success: true,
    };

    return NextResponse.json(response);

  } catch (error: unknown) {
    console.error('Error in POST /api/this-day/send-greeting:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

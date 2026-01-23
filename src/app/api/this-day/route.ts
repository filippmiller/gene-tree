import { NextResponse } from 'next/server';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';
import type { GetThisDayResponse, ThisDayEvent } from '@/types/this-day';
import { groupEventsByType } from '@/types/this-day';

/**
 * GET /api/this-day
 * Get today's family events (birthdays, anniversaries, commemorations)
 */
export async function GET(req: Request) {
  try {
    const supabase = await getSupabaseSSR();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse optional date override from query params
    const { searchParams } = new URL(req.url);
    const monthParam = searchParams.get('month');
    const dayParam = searchParams.get('day');

    const month = monthParam ? parseInt(monthParam, 10) : null;
    const day = dayParam ? parseInt(dayParam, 10) : null;

    // Validate month and day if provided
    if (monthParam && (isNaN(month!) || month! < 1 || month! > 12)) {
      return NextResponse.json({ error: 'Invalid month parameter' }, { status: 400 });
    }
    if (dayParam && (isNaN(day!) || day! < 1 || day! > 31)) {
      return NextResponse.json({ error: 'Invalid day parameter' }, { status: 400 });
    }

    // Use the database function to get events
    // Note: Using 'as any' until migration runs and types are regenerated
    const { data: events, error } = await (supabase as any).rpc('get_this_day_events', {
      p_user_id: user.id,
      p_month: month,
      p_day: day,
    });

    if (error) {
      console.error('Error fetching this day events:', error);

      // On any error, return empty response - feature is non-critical
      const now = new Date();
      const currentMonth = month ?? (now.getMonth() + 1);
      const currentDay = day ?? now.getDate();

      const emptyResponse: GetThisDayResponse = {
        date: `${now.getFullYear()}-${String(currentMonth).padStart(2, '0')}-${String(currentDay).padStart(2, '0')}`,
        events: [],
        groups: [],
        total: 0,
      };
      return NextResponse.json(emptyResponse);
    }

    const typedEvents: ThisDayEvent[] = events || [];
    const now = new Date();
    const currentMonth = month ?? (now.getMonth() + 1);
    const currentDay = day ?? now.getDate();

    const response: GetThisDayResponse = {
      date: `${now.getFullYear()}-${String(currentMonth).padStart(2, '0')}-${String(currentDay).padStart(2, '0')}`,
      events: typedEvents,
      groups: groupEventsByType(typedEvents),
      total: typedEvents.length,
    };

    return NextResponse.json(response);

  } catch (error: unknown) {
    console.error('Error in GET /api/this-day:', error);
    // Return empty response on any error - feature is non-critical
    const emptyResponse: GetThisDayResponse = {
      date: new Date().toISOString().split('T')[0],
      events: [],
      groups: [],
      total: 0,
    };
    return NextResponse.json(emptyResponse);
  }
}

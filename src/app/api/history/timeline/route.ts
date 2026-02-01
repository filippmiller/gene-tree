import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';
import { getSupabaseAdmin } from '@/lib/supabase/server-admin';
import {
  calculateTimeline,
  getSignificantEvents,
  generateHistoricalNarrative,
  getMilestoneEvents,
} from '@/lib/history/timeline-calculator';
import { EventCategory } from '@/lib/history/events';

/**
 * GET /api/history/timeline
 *
 * Returns historical events for a person's lifetime.
 *
 * Query parameters:
 * - profileId: string (required) - The profile ID to get timeline for
 * - categories: string (optional) - Comma-separated list of categories to filter
 * - minImportance: number (optional) - Minimum importance level (1-5)
 * - limit: number (optional) - Maximum number of events to return
 * - significantOnly: boolean (optional) - Only return significant events
 * - includeNarrative: boolean (optional) - Include generated narrative text
 * - includeMilestones: boolean (optional) - Include milestone age events
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get('profileId');

    if (!profileId) {
      return NextResponse.json(
        { error: 'profileId is required' },
        { status: 400 }
      );
    }

    // Get query parameters
    const categoriesParam = searchParams.get('categories');
    const minImportanceParam = searchParams.get('minImportance');
    const limitParam = searchParams.get('limit');
    const significantOnly = searchParams.get('significantOnly') === 'true';
    const includeNarrative = searchParams.get('includeNarrative') === 'true';
    const includeMilestones = searchParams.get('includeMilestones') === 'true';
    const locale = (searchParams.get('locale') as 'en' | 'ru') || 'en';

    // Parse categories
    const categories = categoriesParam
      ? (categoriesParam.split(',') as EventCategory[])
      : undefined;

    // Parse minImportance
    const minImportance = minImportanceParam
      ? parseInt(minImportanceParam, 10)
      : undefined;

    // Parse limit
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;

    // Get current user
    const supabase = await getSupabaseSSR();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Get profile data
    const supabaseAdmin = getSupabaseAdmin();

    // Try user_profiles first
    let profile: {
      id: string;
      first_name: string;
      birth_date: string | null;
      death_date: string | null;
    } | null = null;

    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('id, first_name, birth_date, death_date')
      .eq('id', profileId)
      .single();

    if (userProfile) {
      profile = userProfile;
    } else {
      // Try pending_relatives
      const { data: pendingProfile } = await supabaseAdmin
        .from('pending_relatives')
        .select('id, first_name, date_of_birth, is_deceased')
        .eq('id', profileId)
        .single();

      if (pendingProfile) {
        profile = {
          id: pendingProfile.id,
          first_name: pendingProfile.first_name,
          birth_date: pendingProfile.date_of_birth,
          death_date: pendingProfile.is_deceased ? 'unknown' : null,
        };
      }
    }

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    if (!profile.birth_date) {
      return NextResponse.json(
        { error: 'Birth date is required for timeline', events: [] },
        { status: 200 }
      );
    }

    // Calculate timeline
    if (significantOnly) {
      const events = getSignificantEvents(
        profile.birth_date,
        profile.death_date,
        limit || 10
      );

      return NextResponse.json({
        profileId: profile.id,
        firstName: profile.first_name,
        birthDate: profile.birth_date,
        deathDate: profile.death_date,
        events,
        totalEvents: events.length,
      });
    }

    const result = calculateTimeline(profile.birth_date, profile.death_date, {
      categories,
      minImportance,
    });

    if (!result) {
      return NextResponse.json(
        { error: 'Could not calculate timeline', events: [] },
        { status: 200 }
      );
    }

    // Filter to lifetime events only
    let events = result.events.filter((e) => e.wasAlive && e.wasBeforeDeath);

    // Apply limit
    if (limit) {
      events = events.slice(0, limit);
    }

    // Build response
    const response: {
      profileId: string;
      firstName: string;
      birthYear: number;
      deathYear: number | null;
      currentAge: number;
      isLiving: boolean;
      events: typeof events;
      totalEvents: number;
      categoryBreakdown: Record<EventCategory, number>;
      narrative?: string[];
      milestones?: Array<{ age: number; events: typeof events }>;
    } = {
      profileId: profile.id,
      firstName: profile.first_name,
      birthYear: result.birthYear,
      deathYear: result.deathYear,
      currentAge: result.currentAge,
      isLiving: result.isLiving,
      events,
      totalEvents: result.totalEvents,
      categoryBreakdown: result.categoryBreakdown,
    };

    // Add narrative if requested
    if (includeNarrative) {
      response.narrative = generateHistoricalNarrative(
        profile.first_name,
        profile.birth_date,
        profile.death_date,
        locale
      );
    }

    // Add milestones if requested
    if (includeMilestones) {
      response.milestones = getMilestoneEvents(
        profile.birth_date,
        profile.death_date
      );
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching timeline:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

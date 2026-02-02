import { getSupabaseAdmin } from '@/lib/supabase/server-admin';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import type { DashboardPreferences } from '@/types/dashboard-preferences';
import { DEFAULT_DASHBOARD_PREFERENCES } from '@/types/dashboard-preferences';

/**
 * Helper to get authenticated user
 */
async function getAuthenticatedUser() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component - ignore
          }
        },
      },
    }
  );

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

/**
 * GET /api/user/dashboard-preferences
 * Fetch current user's dashboard preferences
 */
export async function GET() {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile, error } = await getSupabaseAdmin()
      .from('user_profiles')
      .select('dashboard_preferences')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('[Dashboard Preferences] Fetch error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Merge with defaults to ensure all widgets are present
    const storedPrefs = profile?.dashboard_preferences as unknown as DashboardPreferences | null;
    const preferences: DashboardPreferences = {
      ...DEFAULT_DASHBOARD_PREFERENCES,
      ...(storedPrefs || {}),
      widgets: {
        ...DEFAULT_DASHBOARD_PREFERENCES.widgets,
        ...(storedPrefs?.widgets || {}),
      },
    };

    return NextResponse.json({ preferences });
  } catch (error: any) {
    console.error('[Dashboard Preferences] GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * PATCH /api/user/dashboard-preferences
 * Update user's dashboard preferences
 */
export async function PATCH(request: Request) {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { preferences } = body as { preferences: Partial<DashboardPreferences> };

    if (!preferences) {
      return NextResponse.json(
        { error: 'Missing preferences in request body' },
        { status: 400 }
      );
    }

    // Validate widget IDs
    const validWidgetIds = [
      'activity_feed',
      'this_day',
      'notifications',
      'quick_actions',
      'family_stats',
      'explore_features',
    ];

    if (preferences.widgets) {
      for (const widgetId of Object.keys(preferences.widgets)) {
        if (!validWidgetIds.includes(widgetId)) {
          return NextResponse.json(
            { error: `Invalid widget ID: ${widgetId}` },
            { status: 400 }
          );
        }
      }
    }

    // Fetch current preferences to merge
    const { data: currentProfile } = await getSupabaseAdmin()
      .from('user_profiles')
      .select('dashboard_preferences')
      .eq('id', user.id)
      .single();

    const currentPrefs = (currentProfile?.dashboard_preferences as unknown as DashboardPreferences) || DEFAULT_DASHBOARD_PREFERENCES;

    // Merge preferences
    const updatedPreferences: DashboardPreferences = {
      ...currentPrefs,
      ...preferences,
      widgets: {
        ...currentPrefs.widgets,
        ...(preferences.widgets || {}),
      },
    };

    // Update in database
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await getSupabaseAdmin()
      .from('user_profiles')
      .update({ dashboard_preferences: updatedPreferences as any })
      .eq('id', user.id);

    if (updateError) {
      console.error('[Dashboard Preferences] Update error:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      preferences: updatedPreferences,
    });
  } catch (error: any) {
    console.error('[Dashboard Preferences] PATCH error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';
import type {
  EmailPreferences,
  EmailPreferencesResponse,
  UpdateEmailPreferencesRequest
} from '@/types/email-preferences';
import { mergeWithDefaults } from '@/types/email-preferences';

/**
 * GET /api/digest/preferences
 * Get current user's email preferences
 */
export async function GET() {
  try {
    const supabase = await getSupabaseSSR();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile with email preferences
    // Note: Using 'as any' until migration runs and types are regenerated
    // The column may not exist yet, so we handle that gracefully
    let profileData: { email_preferences?: unknown } | null = null;

    try {
      const { data: profile, error } = await (supabase as any)
        .from('user_profiles')
        .select('id, email_preferences')
        .eq('id', user.id)
        .maybeSingle();

      if (error && !error.message.includes('email_preferences')) {
        console.error('Error fetching email preferences:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      profileData = profile;
    } catch {
      // Column may not exist - return defaults
    }

    // Merge with defaults in case some fields are missing or column doesn't exist
    const preferences = mergeWithDefaults(
      (profileData?.email_preferences as Partial<EmailPreferences>) || {}
    );

    const response: EmailPreferencesResponse = {
      success: true,
      preferences,
    };

    return NextResponse.json(response);

  } catch (error: unknown) {
    console.error('Error in GET /api/digest/preferences:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * PATCH /api/digest/preferences
 * Update current user's email preferences
 */
export async function PATCH(req: Request) {
  try {
    const supabase = await getSupabaseSSR();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: UpdateEmailPreferencesRequest = await req.json();

    // Validate digest_day if provided
    const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    if (body.digest_day && !validDays.includes(body.digest_day)) {
      return NextResponse.json({ error: 'Invalid digest_day' }, { status: 400 });
    }

    // Get current preferences
    // Note: Using 'as any' until migration runs and types are regenerated
    const { data: profile, error: fetchError } = await (supabase as any)
      .from('user_profiles')
      .select('id, email_preferences')
      .eq('id', user.id)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching profile:', fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    // Merge current preferences with updates
    const currentPrefs = mergeWithDefaults(
      (profile?.email_preferences as Partial<EmailPreferences>) || {}
    );

    const updatedPrefs: EmailPreferences = {
      ...currentPrefs,
      ...(body.weekly_digest !== undefined && { weekly_digest: body.weekly_digest }),
      ...(body.birthday_reminders !== undefined && { birthday_reminders: body.birthday_reminders }),
      ...(body.anniversary_reminders !== undefined && { anniversary_reminders: body.anniversary_reminders }),
      ...(body.death_commemorations !== undefined && { death_commemorations: body.death_commemorations }),
      ...(body.photo_tag_notifications !== undefined && { photo_tag_notifications: body.photo_tag_notifications }),
      ...(body.digest_day !== undefined && { digest_day: body.digest_day }),
    };

    // Update profile
    // Note: If email_preferences column doesn't exist, this will fail gracefully
    const { error: updateError } = await (supabase as any)
      .from('user_profiles')
      .update({ email_preferences: updatedPrefs })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating email preferences:', updateError);
      // If column doesn't exist, return a helpful message
      if (updateError.message.includes('email_preferences')) {
        return NextResponse.json({
          error: 'Email preferences feature not yet available. Please run migration 0034.',
          preferences: updatedPrefs,
        }, { status: 503 });
      }
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    const response: EmailPreferencesResponse = {
      success: true,
      preferences: updatedPrefs,
    };

    return NextResponse.json(response);

  } catch (error: unknown) {
    console.error('Error in PATCH /api/digest/preferences:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

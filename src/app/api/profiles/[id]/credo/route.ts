import { NextResponse } from 'next/server';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';
import { getSupabaseAdmin } from '@/lib/supabase/server-admin';

interface RouteParams {
  params: Promise<{ id: string }>;
}

const LIFE_MOTTO_LIMIT = 150;
const PERSONAL_STATEMENT_LIMIT = 500;

/**
 * GET /api/profiles/:id/credo
 *
 * Get personal credo (life motto and personal statement) for a profile
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id: profileId } = await params;
    const supabase = await getSupabaseSSR();
    const supabaseAdmin = getSupabaseAdmin();

    const { data: profile, error } = await supabaseAdmin
      .from('user_profiles')
      .select(`
        id,
        life_motto,
        life_motto_privacy,
        personal_statement,
        personal_statement_privacy,
        memorial_quote,
        memorial_quote_author,
        memorial_quote_added_at,
        is_living
      `)
      .eq('id', profileId)
      .single();

    if (error || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Get current user for privacy filtering
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const isOwnProfile = user?.id === profileId;
    const profileData = profile as any;

    // Apply privacy filters
    const response: Record<string, any> = {
      is_deceased: !profileData.is_living,
    };

    // Life motto
    if (
      isOwnProfile ||
      profileData.life_motto_privacy === 'public' ||
      (profileData.life_motto_privacy === 'family' && user)
    ) {
      response.life_motto = profileData.life_motto;
      response.life_motto_privacy = profileData.life_motto_privacy;
    }

    // Personal statement
    if (
      isOwnProfile ||
      profileData.personal_statement_privacy === 'public' ||
      (profileData.personal_statement_privacy === 'family' && user)
    ) {
      response.personal_statement = profileData.personal_statement;
      response.personal_statement_privacy = profileData.personal_statement_privacy;
    }

    // Memorial quote (for deceased profiles)
    if (!profileData.is_living) {
      response.memorial_quote = profileData.memorial_quote;
      response.memorial_quote_author = profileData.memorial_quote_author;
      response.memorial_quote_added_at = profileData.memorial_quote_added_at;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in GET /api/profiles/:id/credo:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/profiles/:id/credo
 *
 * Update personal credo for a profile
 */
export async function PATCH(request: Request, { params }: RouteParams) {
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
    const {
      life_motto,
      life_motto_privacy,
      personal_statement,
      personal_statement_privacy,
      memorial_quote, // Only for deceased profiles, added by family
    } = body;

    // Check if updating own profile or deceased family member
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('id, is_living')
      .eq('id', profileId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const isOwnProfile = profileId === user.id;
    const isDeceased = !(profile as any).is_living;

    // Only allow:
    // - Own profile: life_motto, personal_statement, privacy settings
    // - Deceased family member: memorial_quote only
    if (!isOwnProfile && !isDeceased) {
      return NextResponse.json(
        { error: 'Cannot update credo on other living profiles' },
        { status: 403 }
      );
    }

    // Build update object
    const updates: Record<string, any> = {};

    if (isOwnProfile) {
      // Own profile updates
      if (typeof life_motto === 'string') {
        if (life_motto.length > LIFE_MOTTO_LIMIT) {
          return NextResponse.json(
            { error: `Life motto must be ${LIFE_MOTTO_LIMIT} characters or less` },
            { status: 400 }
          );
        }
        updates.life_motto = life_motto || null;
      }

      if (life_motto_privacy && ['public', 'family', 'private'].includes(life_motto_privacy)) {
        updates.life_motto_privacy = life_motto_privacy;
      }

      if (typeof personal_statement === 'string') {
        if (personal_statement.length > PERSONAL_STATEMENT_LIMIT) {
          return NextResponse.json(
            { error: `Personal statement must be ${PERSONAL_STATEMENT_LIMIT} characters or less` },
            { status: 400 }
          );
        }
        updates.personal_statement = personal_statement || null;
      }

      if (
        personal_statement_privacy &&
        ['public', 'family', 'private'].includes(personal_statement_privacy)
      ) {
        updates.personal_statement_privacy = personal_statement_privacy;
      }
    }

    // Memorial quote for deceased profiles (can be added by family)
    if (isDeceased && typeof memorial_quote === 'string') {
      updates.memorial_quote = memorial_quote || null;
      updates.memorial_quote_author = user.id;
      updates.memorial_quote_added_at = new Date().toISOString();
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    // Update the profile
    const { data: updatedProfile, error: updateError } = await supabaseAdmin
      .from('user_profiles')
      .update(updates)
      .eq('id', profileId)
      .select(`
        life_motto,
        life_motto_privacy,
        personal_statement,
        personal_statement_privacy,
        memorial_quote,
        memorial_quote_author,
        memorial_quote_added_at
      `)
      .single();

    if (updateError) {
      console.error('Error updating credo:', updateError);
      return NextResponse.json(
        { error: 'Failed to update credo' },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedProfile);
  } catch (error) {
    console.error('Error in PATCH /api/profiles/:id/credo:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

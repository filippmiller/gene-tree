import { NextResponse } from 'next/server';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';
import { getSupabaseAdmin } from '@/lib/supabase/server-admin';
import { generateBiography, EnrichedProfileData, Locale, BiographyApiResponse } from '@/lib/biography';

/**
 * POST /api/biography/generate
 *
 * Generate a biography for a profile.
 *
 * Request body:
 * - profileId: string - The profile ID to generate biography for
 * - locale: 'en' | 'ru' - The language for the biography
 */
export async function POST(req: Request) {
  try {
    const supabase = await getSupabaseSSR();
    const supabaseAdmin = getSupabaseAdmin();

    // Verify authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json<BiographyApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await req.json();
    const { profileId, locale = 'en' } = body as { profileId: string; locale?: Locale };

    if (!profileId) {
      return NextResponse.json<BiographyApiResponse>(
        { success: false, error: 'Profile ID is required' },
        { status: 400 }
      );
    }

    // Validate locale
    const validLocale: Locale = locale === 'ru' ? 'ru' : 'en';

    // Fetch the profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('id', profileId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json<BiographyApiResponse>(
        { success: false, error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Check if user has access to this profile (family circle check)
    const { data: hasAccess } = await supabaseAdmin.rpc('is_in_family_circle', {
      profile_id: profileId,
      user_id: user.id,
    });

    // Allow access if user is the profile owner or in family circle
    const isOwner = user.id === profileId;
    if (!isOwner && !hasAccess) {
      return NextResponse.json<BiographyApiResponse>(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    // Fetch education
    const { data: education } = await supabaseAdmin
      .from('education')
      .select('*')
      .eq('user_id', profileId)
      .order('end_year', { ascending: false, nullsFirst: true });

    // Fetch employment
    const { data: employment } = await supabaseAdmin
      .from('employment')
      .select('*')
      .eq('user_id', profileId)
      .order('start_date', { ascending: false, nullsFirst: true });

    // Fetch residences
    const { data: residences } = await supabaseAdmin
      .from('person_residence')
      .select('*')
      .eq('person_id', profileId)
      .order('start_date', { ascending: false, nullsFirst: true });

    // Fetch relationships
    const { data: relationships } = await supabaseAdmin
      .from('relationships')
      .select('*')
      .or(`user1_id.eq.${profileId},user2_id.eq.${profileId}`);

    // Collect related profile IDs
    const relatedIds = new Set<string>();
    for (const rel of relationships || []) {
      if (rel.user1_id !== profileId) relatedIds.add(rel.user1_id);
      if (rel.user2_id !== profileId) relatedIds.add(rel.user2_id);
    }

    // Fetch related profiles
    const relatedProfiles = new Map<string, { first_name: string; last_name: string; gender?: string | null }>();
    if (relatedIds.size > 0) {
      const { data: relatedData } = await supabaseAdmin
        .from('user_profiles')
        .select('id, first_name, last_name, gender')
        .in('id', Array.from(relatedIds));

      for (const p of relatedData || []) {
        relatedProfiles.set(p.id, {
          first_name: p.first_name,
          last_name: p.last_name,
          gender: p.gender,
        });
      }
    }

    // Count voice stories
    const { count: voiceStoriesCount } = await supabaseAdmin
      .from('voice_stories')
      .select('id', { count: 'exact', head: true })
      .eq('target_profile_id', profileId)
      .eq('status', 'approved');

    // Count photos
    const { count: photosCount } = await supabaseAdmin
      .from('photos')
      .select('id', { count: 'exact', head: true })
      .eq('target_profile_id', profileId)
      .eq('status', 'approved');

    // Build enriched data
    const enrichedData: EnrichedProfileData = {
      profile,
      education: education || [],
      employment: employment || [],
      residences: residences || [],
      relationships: relationships || [],
      relatedProfiles,
      voiceStoriesCount: voiceStoriesCount || 0,
      photosCount: photosCount || 0,
    };

    // Generate biography
    const biography = generateBiography(enrichedData, validLocale);

    return NextResponse.json<BiographyApiResponse>({
      success: true,
      data: biography,
    });
  } catch (error: unknown) {
    console.error('Error in POST /api/biography/generate:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json<BiographyApiResponse>(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

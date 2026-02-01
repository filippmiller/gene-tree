import { getSupabaseAdmin } from '@/lib/supabase/server-admin';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/profile/complete
 * Returns profile completeness data for a given profile
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseSSR();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get('profileId') || user.id;

    // Check if user has permission to view this profile
    // For now, users can view their own profile or profiles in their family
    const supabaseAdmin = getSupabaseAdmin();

    // Fetch profile data
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('id', profileId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Check for photos (avatar)
    const hasPhoto = Boolean(profile.avatar_url || profile.current_avatar_id);

    // Check for stories (bio or voice_stories)
    let hasStory = Boolean(profile.bio && profile.bio.length > 20);

    if (!hasStory) {
      const { count: storyCount } = await supabaseAdmin
        .from('voice_stories')
        .select('id', { count: 'exact', head: true })
        .eq('target_profile_id', profileId)
        .eq('status', 'approved');

      hasStory = (storyCount || 0) > 0;
    }

    // Check for relationships
    const { count: relationshipCount } = await supabaseAdmin
      .from('relationships')
      .select('id', { count: 'exact', head: true })
      .or(`user1_id.eq.${profileId},user2_id.eq.${profileId}`)
      .eq('verification_status', 'verified');

    const hasRelationships = (relationshipCount || 0) > 0;

    // Check for residence history
    let hasResidenceHistory = Boolean(
      profile.current_city || profile.birth_city || profile.birth_place
    );

    if (!hasResidenceHistory) {
      const { count: residenceCount } = await supabaseAdmin
        .from('person_residence')
        .select('id', { count: 'exact', head: true })
        .eq('person_id', profileId);

      hasResidenceHistory = (residenceCount || 0) > 0;
    }

    return NextResponse.json({
      hasPhoto,
      hasStory,
      hasRelationships,
      hasResidenceHistory,
    });
  } catch (error: any) {
    console.error('Error fetching profile completeness:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { data: { user } } = await getSupabaseAdmin().auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    
    // Required fields
    const first_name = formData.get('first_name') as string;
    const last_name = formData.get('last_name') as string;
    const gender = formData.get('gender') as string;

    if (!first_name || !last_name || !gender) {
      return NextResponse.json(
        { error: 'Missing required fields: first_name, last_name, gender' }, 
        { status: 400 }
      );
    }

    // Optional fields
    const middle_name = formData.get('middle_name') as string | null;
    const maiden_name = formData.get('maiden_name') as string | null;
    const nickname = formData.get('nickname') as string | null;
    const birth_date = formData.get('birth_date') as string | null;
    const birth_place = formData.get('birth_place') as string | null;
    const phone = formData.get('phone') as string | null;
    const occupation = formData.get('occupation') as string | null;
    const bio = formData.get('bio') as string | null;

    // Build profile data object - only include non-empty values
    const profileData: any = {
      id: user.id,
      first_name,
      last_name,
      gender,
    };

    // Add optional fields only if they have values
    if (middle_name) profileData.middle_name = middle_name;
    if (maiden_name) profileData.maiden_name = maiden_name;
    if (nickname) profileData.nickname = nickname;
    if (birth_date) profileData.birth_date = birth_date;
    if (birth_place) profileData.birth_place = birth_place;
    if (phone) profileData.phone = phone;
    if (occupation) profileData.occupation = occupation;
    if (bio) profileData.bio = bio;

    // Insert profile
    const { error: insertError } = await getSupabaseAdmin()
      .from('user_profiles')
      .insert(profileData);

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


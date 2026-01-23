import { getSupabaseAdmin } from '@/lib/supabase/server-admin';
import { NextRequest, NextResponse } from 'next/server';

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


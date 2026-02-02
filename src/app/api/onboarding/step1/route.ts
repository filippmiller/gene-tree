import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';
import { getSupabaseAdmin } from '@/lib/supabase/server-admin';

/**
 * POST /api/onboarding/step1
 * Save user profile data from onboarding wizard step 1
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseSSR();
    const admin = getSupabaseAdmin();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse form data
    const formData = await request.formData();
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const birthDate = formData.get('birthDate') as string | null;
    const gender = formData.get('gender') as string | null;
    const avatarFile = formData.get('avatar') as File | null;

    // Validate required fields
    if (!firstName || !lastName) {
      return NextResponse.json(
        { error: 'First name and last name are required' },
        { status: 400 }
      );
    }

    // Prepare profile update
    const profileUpdate: Record<string, any> = {
      first_name: firstName,
      last_name: lastName,
      onboarding_step: 1,
    };

    if (birthDate) {
      profileUpdate.birth_date = birthDate;
    }

    if (gender) {
      profileUpdate.gender = gender;
    }

    // Handle avatar upload if provided
    if (avatarFile && avatarFile.size > 0) {
      // Validate file
      if (!avatarFile.type.startsWith('image/')) {
        return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
      }

      if (avatarFile.size > 25 * 1024 * 1024) {
        return NextResponse.json({ error: 'File too large (max 25MB)' }, { status: 400 });
      }

      // Generate unique filename
      const ext = avatarFile.name.split('.').pop() || 'jpg';
      const filename = `${user.id}/avatar.${ext}`;

      // Convert File to Buffer
      const arrayBuffer = await avatarFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Upload to storage using admin client
      const { error: uploadError } = await admin.storage
        .from('avatars')
        .upload(filename, buffer, {
          contentType: avatarFile.type,
          upsert: true,
        });

      if (uploadError) {
        console.error('Avatar upload error:', uploadError);
        return NextResponse.json(
          { error: 'Failed to upload avatar' },
          { status: 500 }
        );
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = admin.storage.from('avatars').getPublicUrl(filename);

      profileUpdate.avatar_url = publicUrl;
    }

    // Update profile
    const { error: updateError } = await admin
      .from('user_profiles')
      .update(profileUpdate)
      .eq('id', user.id);

    if (updateError) {
      console.error('Profile update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Step 1 error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

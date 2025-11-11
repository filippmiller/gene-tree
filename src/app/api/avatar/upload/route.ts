import { createServerSupabase } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    console.log('[AVATAR-API] === UPLOAD STARTED ===');
    
    // Verify auth
    const supabase = await createServerSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('[AVATAR-API] Auth failed:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[AVATAR-API] User authenticated:', user.id);

    // Get file from form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const profileId = formData.get('profileId') as string;
    
    console.log('[AVATAR-API] Form data:', { fileName: file?.name, fileSize: file?.size, profileId });

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }

    if (file.size > 25 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 25MB)' }, { status: 400 });
    }

    // Create unique filename
    const fileExt = file.name.split('.').pop();
    const fileId = crypto.randomUUID();
    const fileName = `${user.id}/${fileId}.${fileExt}`;
    
    console.log('[AVATAR-API] Generated filename:', fileName);

    // Upload using service role (bypass RLS)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const { error: uploadError } = await supabaseAdmin.storage
      .from('avatars')
      .upload(fileName, file, { 
        upsert: false,
        contentType: file.type 
      });

    if (uploadError) {
      console.error('[AVATAR-API] ❌ Storage upload failed:', uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }
    
    console.log('[AVATAR-API] ✅ File uploaded to storage');

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('avatars')
      .getPublicUrl(fileName);
    
    console.log('[AVATAR-API] Public URL generated:', urlData.publicUrl);

    // Create photo record
    const { data: photo, error: photoError } = await supabaseAdmin
      .from('photos')
      .insert({
        bucket: 'avatars',
        path: fileName,
        uploaded_by: user.id,
        target_profile_id: profileId || user.id,
        type: 'avatar',
        status: 'approved',
        approved_by: user.id,
        approved_at: new Date().toISOString(),
        visibility: 'public',
      })
      .select('id')
      .single();

    if (photoError) {
      console.error('[AVATAR-API] ❌ Photo record creation failed:', photoError);
      return NextResponse.json({ error: photoError.message }, { status: 500 });
    }
    
    console.log('[AVATAR-API] ✅ Photo record created:', photo.id);

    // Update profile with new avatar
    const targetProfileId = profileId || user.id;
    console.log('[AVATAR-API] Attempting to update user_profiles...', { 
      targetProfileId, 
      photoId: photo.id, 
      avatarUrl: urlData.publicUrl 
    });
    
    const { data: updateData, error: updateError } = await supabaseAdmin
      .from('user_profiles')
      .update({ 
        current_avatar_id: photo.id,
        avatar_url: urlData.publicUrl 
      })
      .eq('id', targetProfileId)
      .select();

    if (updateError) {
      console.error('[AVATAR-API] ❌ Profile update FAILED:', updateError);
      return NextResponse.json({ error: 'Failed to update profile: ' + updateError.message }, { status: 500 });
    }

    console.log('[AVATAR-API] ✅ Profile updated successfully! Data:', updateData);

    return NextResponse.json({
      success: true,
      photoId: photo.id,
      url: urlData.publicUrl
    });

  } catch (error: any) {
    console.error('[AVATAR-UPLOAD] Unexpected error:', error);
    return NextResponse.json({ 
      error: error.message || 'Upload failed' 
    }, { status: 500 });
  }
}

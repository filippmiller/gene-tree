import { getSupabaseSSR } from '@/lib/supabase/server-ssr';
import { NextResponse } from 'next/server';
import type { Database, TablesUpdate } from '@/lib/types/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * POST /api/avatar/upload
 * Uploads avatar for authenticated user
 * Uses SSR client (anon key) so RLS policies are enforced
 * Path structure: avatars/{user.id}/avatar.jpg
 */
export async function POST(request: Request) {
  try {
    console.log('[AVATAR-API] === UPLOAD STARTED ===');
    
    // Get authenticated user via SSR client
    const supabase = (await getSupabaseSSR()) as unknown as SupabaseClient<Database>;
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('[AVATAR-API] Auth failed:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[AVATAR-API] User authenticated:', user.id);

    // Get file from form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    console.log('[AVATAR-API] Form data:', { fileName: file?.name, fileSize: file?.size });

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

    // Path structure: {user.id}/avatar.jpg (upsert = true to replace)
    const fileExt = file.name.split('.').pop() || 'jpg';
    const path = `${user.id}/avatar.${fileExt}`;
    
    console.log('[AVATAR-API] Upload path:', path);

    // Upload using SSR client - RLS policies will be enforced
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { 
        upsert: true, // Replace existing avatar
        contentType: file.type || 'image/jpeg'
      });

    if (uploadError) {
      console.error('[AVATAR-API] ❌ Storage upload failed:', uploadError);
      return NextResponse.json({ 
        error: uploadError.message || 'Upload failed' 
      }, { status: 403 });
    }
    
    console.log('[AVATAR-API] ✅ File uploaded to storage:', uploadData.path);

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(path);
    
    const publicUrl = urlData.publicUrl;
    console.log('[AVATAR-API] Public URL generated:', publicUrl);

    // Update user_profiles with avatar URL (RLS enforced)
    const updatePayload: TablesUpdate<'user_profiles'> = { 
      avatar_url: publicUrl 
    };
    
    const { data: updateData, error: updateError } = await supabase
      .from('user_profiles')
      .update(updatePayload)
      .eq('id', user.id)
      .select('id, avatar_url')
      .single();

    if (updateError) {
      console.error('[AVATAR-API] ❌ Profile update FAILED:', updateError);
      return NextResponse.json({ 
        error: 'Failed to update profile: ' + updateError.message 
      }, { status: 500 });
    }

    console.log('[AVATAR-API] ✅ Profile updated successfully!');

    return NextResponse.json({
      success: true,
      url: publicUrl,
      profile: updateData
    });

  } catch (error: any) {
    console.error('[AVATAR-UPLOAD] Unexpected error:', error);
    return NextResponse.json({ 
      error: error.message || 'Upload failed' 
    }, { status: 500 });
  }
}


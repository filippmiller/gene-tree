// ============================================================================
// POST /api/photo/colorize
// AI-powered photo colorization using Replicate API
// Falls back to demo mode when REPLICATE_API_TOKEN is not configured
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';
import { getSupabaseAdmin } from '@/lib/supabase/server-admin';

// Colorization request body
interface ColorizeRequest {
  photoId: string;       // ID of the photo to colorize
  photoUrl?: string;     // Optional: direct URL if not using photoId
}

// Colorization response
interface ColorizeResponse {
  success: boolean;
  originalPhotoId: string;
  colorizedPhotoId?: string;
  colorizedUrl?: string;
  error?: string;
  demo?: boolean;        // True if using demo mode (no API key)
}

// DeOldify model on Replicate - good balance of quality and speed
const COLORIZATION_MODEL = 'arielreplicate/deoldify_image:0da600fab0c45a66211339f1c16b71345d22f26ef5fea3dca1bb90bb5711e950';

// Demo mode: When no API key is configured, we simulate colorization
// by returning the original image with a "demo" flag
const DEMO_MODE_ENABLED = true;

export async function POST(request: NextRequest): Promise<NextResponse<ColorizeResponse>> {
  try {
    const supabase = getSupabaseAdmin();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, originalPhotoId: '', error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request
    const body: ColorizeRequest = await request.json();
    const { photoId, photoUrl } = body;

    if (!photoId && !photoUrl) {
      return NextResponse.json(
        { success: false, originalPhotoId: '', error: 'Missing photoId or photoUrl' },
        { status: 400 }
      );
    }

    // Get the original photo details
    let imageUrl = photoUrl;
    let originalPhoto: any = null;

    if (photoId) {
      const { data: photo, error: photoError } = await supabase
        .from('photos')
        .select('*')
        .eq('id', photoId)
        .single();

      if (photoError || !photo) {
        return NextResponse.json(
          { success: false, originalPhotoId: photoId, error: 'Photo not found' },
          { status: 404 }
        );
      }

      originalPhoto = photo;

      // Generate signed URL for the original image
      const { data: signedData, error: signedError } = await supabase
        .storage
        .from(photo.bucket)
        .createSignedUrl(photo.path, 3600); // 1 hour expiry

      if (signedError || !signedData?.signedUrl) {
        console.error('[COLORIZE] Failed to get signed URL:', signedError);
        return NextResponse.json(
          { success: false, originalPhotoId: photoId, error: 'Failed to access original photo' },
          { status: 500 }
        );
      }

      imageUrl = signedData.signedUrl;
    }

    // Check for Replicate API token
    const replicateToken = process.env.REPLICATE_API_TOKEN;

    // =========================================================================
    // DEMO MODE: When no API key, simulate colorization for UI testing
    // =========================================================================
    if (!replicateToken && DEMO_MODE_ENABLED) {
      console.log('[COLORIZE] Demo mode - no REPLICATE_API_TOKEN configured');

      // Simulate processing delay (2-4 seconds)
      await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 2000));

      // In demo mode, we return the original image URL with a demo flag
      // The UI can then show a message that this is a demo
      // In production, you would set up REPLICATE_API_TOKEN for real colorization

      let colorizedPhotoId: string | undefined;
      const colorizedUrl = imageUrl;

      // If we have an original photo, create a "demo" enhanced version record
      if (originalPhoto) {
        // For demo, we just create a record pointing to the original
        // In production, the colorized image would be different
        const { data: newPhoto, error: insertError } = await supabase
          .from('photos')
          .insert({
            bucket: 'media',
            path: originalPhoto.path, // Same path in demo mode
            uploaded_by: user.id,
            target_profile_id: originalPhoto.target_profile_id,
            type: originalPhoto.type,
            status: 'approved',
            visibility: originalPhoto.visibility,
            caption: originalPhoto.caption
              ? `${originalPhoto.caption} (Demo Colorized)`
              : 'Demo Colorized Photo',
            approved_at: new Date().toISOString(),
            ai_enhanced: true,
            ai_enhancement_type: 'colorization',
            original_photo_id: originalPhoto.id,
          })
          .select('id')
          .single();

        if (!insertError && newPhoto) {
          colorizedPhotoId = newPhoto.id;
        } else if (insertError) {
          console.error('[COLORIZE] Demo mode - failed to create record:', insertError);
        }
      }

      return NextResponse.json({
        success: true,
        originalPhotoId: photoId || '',
        colorizedPhotoId,
        colorizedUrl,
        demo: true, // Flag indicating demo mode was used
      });
    }

    // If no API token and demo mode is disabled, return error
    if (!replicateToken) {
      console.error('[COLORIZE] Missing REPLICATE_API_TOKEN and demo mode disabled');
      return NextResponse.json(
        { success: false, originalPhotoId: '', error: 'AI service not configured' },
        { status: 503 }
      );
    }

    // =========================================================================
    // PRODUCTION MODE: Real colorization with Replicate API
    // =========================================================================

    // Initialize Replicate client
    const replicate = new Replicate({
      auth: replicateToken,
    });

    console.log('[COLORIZE] Starting colorization for photo:', photoId || 'direct-url');

    // Run the colorization model
    const output = await replicate.run(COLORIZATION_MODEL, {
      input: {
        image: imageUrl,
        render_factor: 35, // Higher = more colorful, 35 is good default
      },
    });

    // Output is a FileOutput or URL string
    let colorizedUrl: string;

    if (Array.isArray(output) && output.length > 0) {
      // Handle FileOutput array
      const fileOutput = output[0];
      colorizedUrl = typeof fileOutput === 'string'
        ? fileOutput
        : (fileOutput as any).url?.() || String(fileOutput);
    } else if (typeof output === 'string') {
      colorizedUrl = output;
    } else if (output && typeof (output as any).url === 'function') {
      colorizedUrl = (output as any).url();
    } else {
      console.error('[COLORIZE] Unexpected output format:', output);
      return NextResponse.json(
        { success: false, originalPhotoId: photoId || '', error: 'Unexpected AI output format' },
        { status: 500 }
      );
    }

    console.log('[COLORIZE] Colorization complete, result URL:', colorizedUrl);

    // If we have an original photo record, save the colorized version
    let colorizedPhotoId: string | undefined;

    if (originalPhoto) {
      // Download the colorized image
      const colorizedResponse = await fetch(colorizedUrl);
      if (!colorizedResponse.ok) {
        throw new Error('Failed to download colorized image');
      }

      const colorizedBlob = await colorizedResponse.blob();
      const colorizedBuffer = Buffer.from(await colorizedBlob.arrayBuffer());

      // Create path for colorized version
      const originalExt = originalPhoto.path.split('.').pop() || 'jpg';
      const colorizedFileName = `${crypto.randomUUID()}.${originalExt}`;
      const colorizedPath = `profiles/${originalPhoto.target_profile_id}/colorized/${colorizedFileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase
        .storage
        .from('media')
        .upload(colorizedPath, colorizedBuffer, {
          contentType: colorizedBlob.type || 'image/jpeg',
          upsert: false,
        });

      if (uploadError) {
        console.error('[COLORIZE] Failed to upload colorized image:', uploadError);
        // Still return success with the temporary URL
        return NextResponse.json({
          success: true,
          originalPhotoId: photoId || '',
          colorizedUrl,
        });
      }

      // Create photo record for colorized version
      // AI-enhanced photos inherit approval from original, set approved_at but not approved_by
      const { data: newPhoto, error: insertError } = await supabase
        .from('photos')
        .insert({
          bucket: 'media',
          path: colorizedPath,
          uploaded_by: user.id,
          target_profile_id: originalPhoto.target_profile_id,
          type: originalPhoto.type,
          status: 'approved', // Auto-approve AI-generated from approved original
          visibility: originalPhoto.visibility,
          caption: originalPhoto.caption
            ? `${originalPhoto.caption} (AI Colorized)`
            : 'AI Colorized Photo',
          approved_at: new Date().toISOString(), // Required for approved status
          ai_enhanced: true,
          ai_enhancement_type: 'colorization',
          original_photo_id: originalPhoto.id,
        })
        .select('id')
        .single();

      if (insertError) {
        console.error('[COLORIZE] Failed to create photo record:', insertError);
      } else {
        colorizedPhotoId = newPhoto?.id;
      }

      // Get signed URL for the stored colorized image
      const { data: storedSignedUrl } = await supabase
        .storage
        .from('media')
        .createSignedUrl(colorizedPath, 3600);

      if (storedSignedUrl?.signedUrl) {
        colorizedUrl = storedSignedUrl.signedUrl;
      }
    }

    return NextResponse.json({
      success: true,
      originalPhotoId: photoId || '',
      colorizedPhotoId,
      colorizedUrl,
    });

  } catch (error: any) {
    console.error('[COLORIZE] Error:', error);

    // Handle specific Replicate errors
    if (error.message?.includes('rate limit')) {
      return NextResponse.json(
        { success: false, originalPhotoId: '', error: 'AI service is busy. Please try again later.' },
        { status: 429 }
      );
    }

    if (error.message?.includes('timeout')) {
      return NextResponse.json(
        { success: false, originalPhotoId: '', error: 'Processing took too long. Please try with a smaller image.' },
        { status: 504 }
      );
    }

    return NextResponse.json(
      { success: false, originalPhotoId: '', error: 'Failed to colorize photo' },
      { status: 500 }
    );
  }
}

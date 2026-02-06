// ============================================================================
// POST /api/media/process-jobs
// Обработка очереди media_jobs (можно вызывать через cron)
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server-admin';
import sharp from 'sharp';
import { createHash } from 'crypto';


export async function POST(request: NextRequest) {
  try {
    // Using getSupabaseAdmin()
    
    // Проверяем что это admin (или можно добавить secret token для cron)
    const { data: { user }, error: authError } = await getSupabaseAdmin().auth.getUser();
    
    if (authError || !user) {
      // Проверяем secret token для cron
      const authHeader = request.headers.get('authorization');
      const expectedToken = process.env.CRON_SECRET || 'dev-secret-token';
      
      if (authHeader !== `Bearer ${expectedToken}`) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
    } else {
      // Если есть user - проверяем что admin
      const { data: isAdmin } = await getSupabaseAdmin().rpc('current_user_is_admin');
      if (!isAdmin) {
        return NextResponse.json(
          { error: 'Admin access required' },
          { status: 403 }
        );
      }
    }

    // Using getSupabaseAdmin() for admin operations
    if (!getSupabaseAdmin()) {
      return NextResponse.json({ error: 'Admin client not available' }, { status: 500 });
    }
    
    // Получаем queued jobs (максимум 10 за раз)
    const { data: jobs, error: jobsError } = await getSupabaseAdmin()
      .from('media_jobs')
      .select('*')
      .eq('status', 'queued')
      .order('created_at', { ascending: true })
      .limit(10);

    if (jobsError) {
      console.error('[PROCESS_JOBS] Failed to fetch jobs:', jobsError);
      return NextResponse.json(
        { error: 'Failed to fetch jobs' },
        { status: 500 }
      );
    }

    if (!jobs || jobs.length === 0) {
      return NextResponse.json({
        processed: 0,
        message: 'No queued jobs',
      });
    }

    const results = [];

    for (const job of jobs) {
      const jobAny = job as any;
      // Помечаем как processing
      await (getSupabaseAdmin() as any)
        .from('media_jobs')
        .update({
          status: 'processing',
          started_at: new Date().toISOString(),
        })
        .eq('id', jobAny.id);

      try {
        // Обрабатываем в зависимости от типа
        switch (jobAny.kind) {
          case 'move_to_approved':
            await processMoveToApproved(getSupabaseAdmin(), jobAny);
            break;
          
          case 'delete':
            await processDelete(getSupabaseAdmin(), jobAny);
            break;
          
          case 'thumbnail':
            await processThumbnail(getSupabaseAdmin(), jobAny);
            break;
          
          case 'strip_exif':
            await processStripExif(getSupabaseAdmin(), jobAny);
            break;
          
          case 'hash':
            await processHash(getSupabaseAdmin(), jobAny);
            break;
          
          default:
            throw new Error(`Unknown job kind: ${jobAny.kind}`);
        }

        // Помечаем как completed
        await (getSupabaseAdmin() as any)
          .from('media_jobs')
          .update({
            status: 'completed',
            finished_at: new Date().toISOString(),
          })
          .eq('id', jobAny.id);

        results.push({ id: jobAny.id, status: 'completed' });

      } catch (error: any) {
        console.error(`[PROCESS_JOBS] Job ${jobAny.id} failed:`, error);
        
        // Помечаем как failed
        await (getSupabaseAdmin() as any)
          .from('media_jobs')
          .update({
            status: 'failed',
            finished_at: new Date().toISOString(),
            error: error.message || 'Unknown error',
          })
          .eq('id', jobAny.id);

        results.push({ id: jobAny.id, status: 'failed', error: error.message });
      }
    }

    return NextResponse.json({
      processed: results.length,
      results,
    });

  } catch (error) {
    console.error('[PROCESS_JOBS] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// Job Processors
// ============================================================================

async function processMoveToApproved(supabaseAdmin: any, job: any) {
  const { photo_id, bucket, from_path, to_path } = job.payload;

  console.log(`[MOVE_TO_APPROVED] Moving ${from_path} → ${to_path}`);

  // Копируем файл
  const { data: fileData, error: downloadError } = await getSupabaseAdmin().storage
    .from(bucket)
    .download(from_path);

  if (downloadError) {
    throw new Error(`Failed to download file: ${downloadError.message}`);
  }

  // Загружаем в новое место
  const { error: uploadError } = await getSupabaseAdmin().storage
    .from(bucket)
    .upload(to_path, fileData, { upsert: false });

  if (uploadError) {
    throw new Error(`Failed to upload file: ${uploadError.message}`);
  }

  // Обновляем путь в photos
  const { error: updateError } = await getSupabaseAdmin()
    .from('photos')
    .update({ path: to_path })
    .eq('id', photo_id);

  if (updateError) {
    throw new Error(`Failed to update photo path: ${updateError.message}`);
  }

  // Удаляем старый файл
  const { error: deleteError } = await getSupabaseAdmin().storage
    .from(bucket)
    .remove([from_path]);

  if (deleteError) {
    console.warn(`[MOVE_TO_APPROVED] Failed to delete old file:`, deleteError);
    // Не бросаем ошибку - файл скопирован, это не критично
  }

  console.log(`[MOVE_TO_APPROVED] Successfully moved file`);
}

async function processDelete(supabaseAdmin: any, job: any) {
  const { photo_id, bucket, path, delay_hours } = job.payload;

  // Проверяем delay
  const { data: photo } = await getSupabaseAdmin()
    .from('photos')
    .select('rejected_at')
    .eq('id', photo_id)
    .single();

  if (photo && delay_hours && photo.rejected_at) {
    const rejectedAt = new Date(photo.rejected_at);
    const now = new Date();
    const hoursPassed = (now.getTime() - rejectedAt.getTime()) / (1000 * 60 * 60);

    if (hoursPassed < delay_hours) {
      console.log(`[DELETE] Too early to delete, waiting ${delay_hours - hoursPassed} more hours`);
      // Возвращаем job в очередь
      await getSupabaseAdmin()
        .from('media_jobs')
        .update({ status: 'queued', started_at: null })
        .eq('id', job.id);
      return;
    }
  }

  console.log(`[DELETE] Deleting file ${path} from ${bucket}`);

  // Удаляем файл из storage
  const { error: storageError } = await getSupabaseAdmin().storage
    .from(bucket)
    .remove([path]);

  if (storageError) {
    console.warn(`[DELETE] Failed to delete file:`, storageError);
  }

  // Удаляем запись из photos
  const { error: dbError } = await getSupabaseAdmin()
    .from('photos')
    .delete()
    .eq('id', photo_id);

  if (dbError) {
    throw new Error(`Failed to delete photo record: ${dbError.message}`);
  }

  console.log(`[DELETE] Successfully deleted photo`);
}

/**
 * Strip EXIF/GPS metadata from an uploaded image.
 * Downloads from Supabase Storage, processes with sharp, re-uploads the cleaned version.
 */
async function processStripExif(_supabaseAdmin: any, job: any) {
  const { photo_id, bucket, path } = job.payload;

  console.log(`[STRIP_EXIF] Stripping metadata from ${path}`);

  // Download the original image
  const { data: fileData, error: downloadError } = await getSupabaseAdmin().storage
    .from(bucket)
    .download(path);

  if (downloadError || !fileData) {
    throw new Error(`Failed to download file: ${downloadError?.message}`);
  }

  // Convert Blob to Buffer and strip all metadata with sharp
  const buffer = Buffer.from(await fileData.arrayBuffer());
  const strippedBuffer = await sharp(buffer)
    .rotate() // Auto-rotate based on EXIF orientation before stripping
    .withMetadata({
      // Keep only the orientation-corrected image, strip everything else:
      // GPS, camera info, timestamps, IPTC, XMP — all removed
    })
    .toBuffer();

  // Re-upload the stripped version (overwrite original)
  const { error: uploadError } = await getSupabaseAdmin().storage
    .from(bucket)
    .upload(path, strippedBuffer, {
      upsert: true,
      contentType: 'image/jpeg',
    });

  if (uploadError) {
    throw new Error(`Failed to upload stripped image: ${uploadError.message}`);
  }

  // Update the photo record to indicate EXIF was stripped
  await getSupabaseAdmin()
    .from('photos')
    .update({ exif_stripped: true } as any)
    .eq('id', photo_id);

  console.log(`[STRIP_EXIF] Successfully stripped metadata from ${path}`);
}

/**
 * Generate thumbnails at multiple sizes.
 * Downloads original, resizes with sharp, uploads as WebP thumbnails.
 */
async function processThumbnail(_supabaseAdmin: any, job: any) {
  const { photo_id, bucket, path, sizes } = job.payload;
  const targetSizes: number[] = sizes || [1024, 512, 256];

  console.log(`[THUMBNAIL] Generating thumbnails for ${path} at sizes: ${targetSizes.join(', ')}`);

  // Download the original image
  const { data: fileData, error: downloadError } = await getSupabaseAdmin().storage
    .from(bucket)
    .download(path);

  if (downloadError || !fileData) {
    throw new Error(`Failed to download file: ${downloadError?.message}`);
  }

  const buffer = Buffer.from(await fileData.arrayBuffer());
  const thumbPaths: string[] = [];

  // Generate each thumbnail size
  for (const size of targetSizes) {
    const thumbBuffer = await sharp(buffer)
      .resize(size, size, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();

    // Thumbnail path: same dir, append _thumb_{size}.webp
    const basePath = path.replace(/\.[^.]+$/, '');
    const thumbPath = `${basePath}_thumb_${size}.webp`;

    const { error: uploadError } = await getSupabaseAdmin().storage
      .from(bucket)
      .upload(thumbPath, thumbBuffer, {
        upsert: true,
        contentType: 'image/webp',
      });

    if (uploadError) {
      console.warn(`[THUMBNAIL] Failed to upload ${size}px thumbnail:`, uploadError.message);
      continue;
    }

    thumbPaths.push(thumbPath);
  }

  // Store thumbnail paths on the photo record
  if (thumbPaths.length > 0) {
    await getSupabaseAdmin()
      .from('photos')
      .update({ thumbnail_paths: thumbPaths } as any)
      .eq('id', photo_id);
  }

  console.log(`[THUMBNAIL] Generated ${thumbPaths.length}/${targetSizes.length} thumbnails`);
}

/**
 * Calculate SHA-256 hash of the image file for deduplication.
 */
async function processHash(_supabaseAdmin: any, job: any) {
  const { photo_id, bucket, path } = job.payload;

  console.log(`[HASH] Calculating SHA-256 for ${path}`);

  // Download the file
  const { data: fileData, error: downloadError } = await getSupabaseAdmin().storage
    .from(bucket)
    .download(path);

  if (downloadError || !fileData) {
    throw new Error(`Failed to download file: ${downloadError?.message}`);
  }

  const buffer = Buffer.from(await fileData.arrayBuffer());
  const hash = createHash('sha256').update(buffer).digest('hex');

  // Update photo record with the hash
  await getSupabaseAdmin()
    .from('photos')
    .update({ sha256: hash })
    .eq('id', photo_id);

  console.log(`[HASH] SHA-256 for ${photo_id}: ${hash.substring(0, 16)}...`);
}

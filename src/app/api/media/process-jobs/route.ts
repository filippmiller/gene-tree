// ============================================================================
// POST /api/media/process-jobs
// Обработка очереди media_jobs (можно вызывать через cron)
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    
    // Проверяем что это admin (или можно добавить secret token для cron)
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
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
      const { data: isAdmin } = await supabase.rpc('current_user_is_admin');
      if (!isAdmin) {
        return NextResponse.json(
          { error: 'Admin access required' },
          { status: 403 }
        );
      }
    }

    const adminSupabase = getAdminClient();
    if (!adminSupabase) {
      return NextResponse.json({ error: 'Admin client not available' }, { status: 500 });
    }
    
    // Получаем queued jobs (максимум 10 за раз)
    const { data: jobs, error: jobsError } = await adminSupabase
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
      // Помечаем как processing
      await adminSupabase
        .from('media_jobs')
        .update({
          status: 'processing',
          started_at: new Date().toISOString(),
        })
        .eq('id', job.id);

      try {
        // Обрабатываем в зависимости от типа
        switch (job.kind) {
          case 'move_to_approved':
            await processMoveToApproved(adminSupabase, job);
            break;
          
          case 'delete':
            await processDelete(adminSupabase, job);
            break;
          
          case 'thumbnail':
            // TODO: implement thumbnail generation
            console.log('[PROCESS_JOBS] Thumbnail generation not implemented yet');
            break;
          
          case 'strip_exif':
            // TODO: implement EXIF stripping
            console.log('[PROCESS_JOBS] EXIF stripping not implemented yet');
            break;
          
          case 'hash':
            // TODO: implement hash calculation
            console.log('[PROCESS_JOBS] Hash calculation not implemented yet');
            break;
          
          default:
            throw new Error(`Unknown job kind: ${job.kind}`);
        }

        // Помечаем как completed
        await adminSupabase
          .from('media_jobs')
          .update({
            status: 'completed',
            finished_at: new Date().toISOString(),
          })
          .eq('id', job.id);

        results.push({ id: job.id, status: 'completed' });

      } catch (error: any) {
        console.error(`[PROCESS_JOBS] Job ${job.id} failed:`, error);
        
        // Помечаем как failed
        await adminSupabase
          .from('media_jobs')
          .update({
            status: 'failed',
            finished_at: new Date().toISOString(),
            error: error.message || 'Unknown error',
          })
          .eq('id', job.id);

        results.push({ id: job.id, status: 'failed', error: error.message });
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

async function processMoveToApproved(supabase: any, job: any) {
  const { photo_id, bucket, from_path, to_path } = job.payload;

  console.log(`[MOVE_TO_APPROVED] Moving ${from_path} → ${to_path}`);

  // Копируем файл
  const { data: fileData, error: downloadError } = await supabase.storage
    .from(bucket)
    .download(from_path);

  if (downloadError) {
    throw new Error(`Failed to download file: ${downloadError.message}`);
  }

  // Загружаем в новое место
  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(to_path, fileData, { upsert: false });

  if (uploadError) {
    throw new Error(`Failed to upload file: ${uploadError.message}`);
  }

  // Обновляем путь в photos
  const { error: updateError } = await supabase
    .from('photos')
    .update({ path: to_path })
    .eq('id', photo_id);

  if (updateError) {
    throw new Error(`Failed to update photo path: ${updateError.message}`);
  }

  // Удаляем старый файл
  const { error: deleteError } = await supabase.storage
    .from(bucket)
    .remove([from_path]);

  if (deleteError) {
    console.warn(`[MOVE_TO_APPROVED] Failed to delete old file:`, deleteError);
    // Не бросаем ошибку - файл скопирован, это не критично
  }

  console.log(`[MOVE_TO_APPROVED] Successfully moved file`);
}

async function processDelete(supabase: any, job: any) {
  const { photo_id, bucket, path, delay_hours } = job.payload;

  // Проверяем delay
  const { data: photo } = await supabase
    .from('photos')
    .select('rejected_at')
    .eq('id', photo_id)
    .single();

  if (photo && delay_hours) {
    const rejectedAt = new Date(photo.rejected_at);
    const now = new Date();
    const hoursPassed = (now.getTime() - rejectedAt.getTime()) / (1000 * 60 * 60);

    if (hoursPassed < delay_hours) {
      console.log(`[DELETE] Too early to delete, waiting ${delay_hours - hoursPassed} more hours`);
      // Возвращаем job в очередь
      await supabase
        .from('media_jobs')
        .update({ status: 'queued', started_at: null })
        .eq('id', job.id);
      return;
    }
  }

  console.log(`[DELETE] Deleting file ${path} from ${bucket}`);

  // Удаляем файл из storage
  const { error: storageError } = await supabase.storage
    .from(bucket)
    .remove([path]);

  if (storageError) {
    console.warn(`[DELETE] Failed to delete file:`, storageError);
  }

  // Удаляем запись из photos
  const { error: dbError } = await supabase
    .from('photos')
    .delete()
    .eq('id', photo_id);

  if (dbError) {
    throw new Error(`Failed to delete photo record: ${dbError.message}`);
  }

  console.log(`[DELETE] Successfully deleted photo`);
}


import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';
import { getSupabaseAdmin } from '@/lib/supabase/server-admin';
import type { UpdateTimeCapsuleRequest } from '@/lib/time-capsules/types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseAny = any;

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/time-capsules/[id]
 * Get a single time capsule
 */
export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const supabase = await getSupabaseSSR();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Using any type here since time_capsules table is new and not yet in generated types
  const { data: capsule, error } = await (supabase as SupabaseAny)
    .from('time_capsules')
    .select(`
      *,
      creator:user_profiles!created_by(id, first_name, last_name, avatar_url),
      recipient:user_profiles!recipient_profile_id(id, first_name, last_name, avatar_url)
    `)
    .eq('id', id)
    .single();

  if (error || !capsule) {
    return NextResponse.json({ error: 'Time capsule not found' }, { status: 404 });
  }

  return NextResponse.json(capsule);
}

/**
 * PATCH /api/time-capsules/[id]
 * Update a time capsule (only before delivery)
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const supabase = await getSupabaseSSR();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // First check if capsule exists and user can modify it
  const { data: existing, error: fetchError } = await (supabase as SupabaseAny)
    .from('time_capsules')
    .select('created_by, delivery_status')
    .eq('id', id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: 'Time capsule not found' }, { status: 404 });
  }

  if (existing.created_by !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (existing.delivery_status !== 'scheduled') {
    return NextResponse.json({ error: 'Cannot modify a delivered or cancelled capsule' }, { status: 400 });
  }

  let body: UpdateTimeCapsuleRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};

  if (body.title !== undefined) {
    if (!body.title || body.title.trim().length === 0) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }
    if (body.title.length > 200) {
      return NextResponse.json({ error: 'Title must be 200 characters or less' }, { status: 400 });
    }
    updates.title = body.title.trim();
  }

  if (body.message !== undefined) {
    if (body.message && body.message.length > 10000) {
      return NextResponse.json({ error: 'Message must be 10000 characters or less' }, { status: 400 });
    }
    updates.message = body.message?.trim() || null;
  }

  if (body.scheduled_delivery_date !== undefined) {
    const deliveryDate = new Date(body.scheduled_delivery_date);
    const now = new Date();
    if (deliveryDate <= now) {
      return NextResponse.json({ error: 'Delivery date must be in the future' }, { status: 400 });
    }
    updates.scheduled_delivery_date = body.scheduled_delivery_date;
  }

  if (body.delivery_trigger !== undefined) {
    if (!['date', 'after_passing', 'event'].includes(body.delivery_trigger)) {
      return NextResponse.json({ error: 'Invalid delivery trigger' }, { status: 400 });
    }
    updates.delivery_trigger = body.delivery_trigger;
  }

  if (body.media_type !== undefined) {
    if (body.media_type && !['audio', 'video', 'image'].includes(body.media_type)) {
      return NextResponse.json({ error: 'Invalid media type' }, { status: 400 });
    }
    updates.media_type = body.media_type;
  }

  if (body.media_url !== undefined) {
    updates.media_url = body.media_url;
  }

  if (body.delivery_status === 'cancelled') {
    updates.delivery_status = 'cancelled';
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No updates provided' }, { status: 400 });
  }

  const { data: updated, error: updateError } = await (supabase as SupabaseAny)
    .from('time_capsules')
    .update(updates)
    .eq('id', id)
    .select(`
      *,
      creator:user_profiles!created_by(id, first_name, last_name, avatar_url),
      recipient:user_profiles!recipient_profile_id(id, first_name, last_name, avatar_url)
    `)
    .single();

  if (updateError || !updated) {
    console.error('[TIME_CAPSULES] Update error:', updateError);
    return NextResponse.json({ error: 'Failed to update time capsule' }, { status: 500 });
  }

  return NextResponse.json(updated);
}

/**
 * DELETE /api/time-capsules/[id]
 * Delete a time capsule (only before delivery, or admin)
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const supabase = await getSupabaseSSR();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if capsule exists and user can delete it
  const { data: existing, error: fetchError } = await (supabase as SupabaseAny)
    .from('time_capsules')
    .select('created_by, delivery_status, media_url')
    .eq('id', id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: 'Time capsule not found' }, { status: 404 });
  }

  // Check permissions - RLS will handle this but we do it explicitly for better errors
  const isOwner = existing.created_by === user.id;
  const isScheduled = existing.delivery_status === 'scheduled';

  if (!isOwner) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (!isScheduled) {
    return NextResponse.json({ error: 'Cannot delete a delivered capsule' }, { status: 400 });
  }

  // Delete associated media file if exists
  if (existing.media_url) {
    const admin = getSupabaseAdmin();
    await admin.storage
      .from('time-capsule-media')
      .remove([existing.media_url]);
  }

  // Delete the capsule
  const { error: deleteError } = await (supabase as SupabaseAny)
    .from('time_capsules')
    .delete()
    .eq('id', id);

  if (deleteError) {
    console.error('[TIME_CAPSULES] Delete error:', deleteError);
    return NextResponse.json({ error: 'Failed to delete time capsule' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

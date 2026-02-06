import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';
import { apiLogger } from '@/lib/logger';
import type {
  CreateTimeCapsuleRequest,
  TimeCapsuleListResponse,
} from '@/lib/time-capsules/types';

 
type SupabaseAny = any;

/**
 * GET /api/time-capsules
 * List time capsules (sent & received by current user)
 */
export async function GET(request: NextRequest) {
  const supabase = await getSupabaseSSR();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50);
  const offset = parseInt(searchParams.get('offset') || '0', 10);
  const filter = searchParams.get('filter') || 'all'; // 'all', 'sent', 'received'

  // Using any type here since time_capsules table is new and not yet in generated types
  // Note: created_by references auth.users, so we join user_profiles via inner join by ID match
  let query = (supabase as SupabaseAny)
    .from('time_capsules')
    .select(`
      *,
      recipient:user_profiles!recipient_profile_id(id, first_name, last_name, avatar_url)
    `, { count: 'exact' });

  if (filter === 'sent') {
    query = query.eq('created_by', user.id);
  } else if (filter === 'received') {
    // Only show delivered capsules for recipient
    query = query.eq('recipient_profile_id', user.id);
  } else {
    // Show all capsules user can see (created or received when delivered)
    query = query.or(`created_by.eq.${user.id},and(recipient_profile_id.eq.${user.id},delivery_status.eq.delivered)`);
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    apiLogger.error({ error: error.message, userId: user.id, filter }, 'Time capsules list error');
    return NextResponse.json({ error: 'Failed to load time capsules' }, { status: 500 });
  }

  // Fetch creator profiles for all capsules
  const creatorIds = [...new Set((data || []).map((c: { created_by: string }) => c.created_by))];
  const { data: creators } = await supabase
    .from('user_profiles')
    .select('id, first_name, last_name, avatar_url')
    .in('id', creatorIds);

  const creatorsMap = new Map(
    (creators || []).map((c: { id: string; first_name: string; last_name: string; avatar_url: string | null }) => [c.id, c])
  );

  // Attach creator info to each capsule
  const capsulesWithCreators = (data || []).map((capsule: { created_by: string }) => ({
    ...capsule,
    creator: creatorsMap.get(capsule.created_by) || null,
  }));

  const response: TimeCapsuleListResponse = {
    data: capsulesWithCreators as TimeCapsuleListResponse['data'],
    total: count || 0,
    hasMore: (data?.length || 0) === limit,
  };

  return NextResponse.json(response);
}

/**
 * POST /api/time-capsules
 * Create a new time capsule
 */
export async function POST(request: NextRequest) {
  const supabase = await getSupabaseSSR();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: CreateTimeCapsuleRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const {
    recipient_profile_id,
    title,
    message,
    media_type,
    media_url,
    scheduled_delivery_date,
    delivery_trigger = 'date',
  } = body;

  // Validation
  if (!title || title.trim().length === 0) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 });
  }

  if (title.length > 200) {
    return NextResponse.json({ error: 'Title must be 200 characters or less' }, { status: 400 });
  }

  if (message && message.length > 10000) {
    return NextResponse.json({ error: 'Message must be 10000 characters or less' }, { status: 400 });
  }

  if (!scheduled_delivery_date) {
    return NextResponse.json({ error: 'Delivery date is required' }, { status: 400 });
  }

  const deliveryDate = new Date(scheduled_delivery_date);
  const now = new Date();
  if (deliveryDate <= now) {
    return NextResponse.json({ error: 'Delivery date must be in the future' }, { status: 400 });
  }

  if (!['date', 'after_passing', 'event'].includes(delivery_trigger)) {
    return NextResponse.json({ error: 'Invalid delivery trigger' }, { status: 400 });
  }

  if (media_type && !['audio', 'video', 'image'].includes(media_type)) {
    return NextResponse.json({ error: 'Invalid media type' }, { status: 400 });
  }

  // Verify recipient exists if specified
  if (recipient_profile_id) {
    const { data: recipientExists } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('id', recipient_profile_id)
      .single();

    if (!recipientExists) {
      return NextResponse.json({ error: 'Recipient not found' }, { status: 400 });
    }
  }

  // Create the time capsule
  // Using any type here since time_capsules table is new and not yet in generated types
  const { data: capsule, error: insertError } = await (supabase as SupabaseAny)
    .from('time_capsules')
    .insert({
      created_by: user.id,
      recipient_profile_id: recipient_profile_id || null,
      title: title.trim(),
      message: message?.trim() || null,
      media_type: media_type || null,
      media_url: media_url || null,
      scheduled_delivery_date,
      delivery_trigger,
      delivery_status: 'scheduled',
      privacy_level: 'private',
    })
    .select(`
      *,
      recipient:user_profiles!recipient_profile_id(id, first_name, last_name, avatar_url)
    `)
    .single();

  if (insertError || !capsule) {
    apiLogger.error({ error: insertError?.message, userId: user.id }, 'Time capsule create error');
    return NextResponse.json({ error: 'Failed to create time capsule' }, { status: 500 });
  }

  // Fetch creator profile
  const { data: creatorProfile } = await supabase
    .from('user_profiles')
    .select('id, first_name, last_name, avatar_url')
    .eq('id', user.id)
    .single();

  return NextResponse.json({ ...capsule, creator: creatorProfile }, { status: 201 });
}

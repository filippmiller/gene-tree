import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';
import { getSupabaseAdmin } from '@/lib/supabase/server-admin';
import type { UpdateVoiceMemoryRequest } from '@/types/voice-memory';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Type for the memory record since voice_memories isn't in generated types yet
interface VoiceMemoryRecord {
  id: string;
  user_id: string;
  storage_path: string;
  [key: string]: unknown;
}

/**
 * GET /api/voice-memories/[id]
 * Get a single voice memory with signed playback URL
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const supabase = await getSupabaseSSR();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Fetch memory with RLS
  // Using any type here since voice_memories table is new and not yet in generated types
  const { data: memory, error } = await (supabase as any)
    .from('voice_memories')
    .select(`
      *,
      profile:user_profiles!profile_id(id, first_name, last_name, avatar_url),
      creator:user_profiles!user_id(id, first_name, last_name, avatar_url)
    `)
    .eq('id', id)
    .single();

  if (error || !memory) {
    return NextResponse.json({ error: 'Memory not found' }, { status: 404 });
  }

  const memoryRecord = memory as VoiceMemoryRecord;

  // Generate signed playback URL
  const admin = getSupabaseAdmin();
  const { data: signedData, error: signedError } = await admin
    .storage
    .from('voice-memories')
    .createSignedUrl(memoryRecord.storage_path, 3600); // 1 hour expiry

  if (signedError) {
    console.error('[VOICE_MEMORIES] Failed to create playback URL', signedError);
    return NextResponse.json(
      { error: 'Failed to generate playback URL' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ...memoryRecord,
    playback_url: signedData.signedUrl,
  });
}

/**
 * PATCH /api/voice-memories/[id]
 * Update a voice memory
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const supabase = await getSupabaseSSR();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: UpdateVoiceMemoryRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { title, description, privacy_level } = body;

  // Validate privacy level if provided
  if (privacy_level && !['public', 'family', 'private'].includes(privacy_level)) {
    return NextResponse.json({ error: 'Invalid privacy level' }, { status: 400 });
  }

  // Build update object
  const updates: Record<string, unknown> = {};
  if (title !== undefined) updates.title = title;
  if (description !== undefined) updates.description = description;
  if (privacy_level !== undefined) updates.privacy_level = privacy_level;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  // Update with RLS (only owner can update)
  // Using any type here since voice_memories table is new and not yet in generated types
  const { data: memory, error } = await (supabase as any)
    .from('voice_memories')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id) // Ensure ownership
    .select()
    .single();

  if (error) {
    console.error('[VOICE_MEMORIES] Update error:', error);
    return NextResponse.json({ error: 'Failed to update memory' }, { status: 500 });
  }

  if (!memory) {
    return NextResponse.json({ error: 'Memory not found or access denied' }, { status: 404 });
  }

  return NextResponse.json({ memory });
}

/**
 * DELETE /api/voice-memories/[id]
 * Delete a voice memory
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const supabase = await getSupabaseSSR();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // First, get the memory to find storage path
  // Using any type here since voice_memories table is new and not yet in generated types
  const { data: memory, error: fetchError } = await (supabase as any)
    .from('voice_memories')
    .select('id, user_id, storage_path')
    .eq('id', id)
    .eq('user_id', user.id) // Ensure ownership
    .single();

  if (fetchError || !memory) {
    return NextResponse.json(
      { error: 'Memory not found or access denied' },
      { status: 404 }
    );
  }

  const memoryRecord = memory as VoiceMemoryRecord;

  // Delete from storage
  const admin = getSupabaseAdmin();
  const { error: storageError } = await admin
    .storage
    .from('voice-memories')
    .remove([memoryRecord.storage_path]);

  if (storageError) {
    console.error('[VOICE_MEMORIES] Storage delete error:', storageError);
    // Continue with database deletion even if storage fails
  }

  // Delete from database
  const { error: deleteError } = await (supabase as any)
    .from('voice_memories')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (deleteError) {
    console.error('[VOICE_MEMORIES] Delete error:', deleteError);
    return NextResponse.json({ error: 'Failed to delete memory' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

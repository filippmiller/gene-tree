import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';
import { getSupabaseAdmin } from '@/lib/supabase/server-admin';

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
 * POST /api/voice-memories/[id]/confirm
 * Confirm that a file has been uploaded to storage
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const supabase = await getSupabaseSSR();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Fetch the memory record
  // Using explicit typing since voice_memories table is new and not yet in generated types
  const { data: memory, error: fetchError } = await (supabase as any)
    .from('voice_memories')
    .select('id, user_id, storage_path')
    .eq('id', id)
    .eq('user_id', user.id)
    .single() as { data: VoiceMemoryRecord | null; error: Error | null };

  if (fetchError || !memory) {
    return NextResponse.json(
      { error: 'Memory not found or access denied' },
      { status: 404 }
    );
  }

  // Verify the file exists in storage
  const admin = getSupabaseAdmin();
  const { data: fileData, error: fileError } = await admin
    .storage
    .from('voice-memories')
    .list(user.id, {
      search: memory.storage_path.split('/').pop(),
    });

  const fileExists = fileData && fileData.length > 0 && !fileError;

  if (!fileExists) {
    // Clean up the orphaned record
    await (supabase as any)
      .from('voice_memories')
      .delete()
      .eq('id', id);

    return NextResponse.json(
      { error: 'File not found in storage. Upload may have failed.' },
      { status: 400 }
    );
  }

  // Fetch the complete memory with relations
  const { data: completeMemory, error: completeError } = await (supabase as any)
    .from('voice_memories')
    .select(`
      *,
      profile:user_profiles!profile_id(id, first_name, last_name, avatar_url),
      creator:user_profiles!user_id(id, first_name, last_name, avatar_url)
    `)
    .eq('id', id)
    .single();

  if (completeError) {
    return NextResponse.json(
      { error: 'Failed to fetch memory details' },
      { status: 500 }
    );
  }

  return NextResponse.json({ memory: completeMemory });
}

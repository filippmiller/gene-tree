import { NextResponse } from 'next/server';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';
import { getSupabaseAdmin } from '@/lib/supabase/server-admin';
import { createNotification } from '@/lib/notifications';

export interface AssignPromptRequest {
  promptId: string;
  toUserId: string;
  message?: string;
}

/**
 * POST /api/prompts/assign
 * Assign a prompt to a family member
 */
export async function POST(req: Request) {
  try {
    const supabase = await getSupabaseSSR();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: AssignPromptRequest = await req.json();
    const { promptId, toUserId, message } = body;

    if (!promptId || !toUserId) {
      return NextResponse.json({ error: 'promptId and toUserId required' }, { status: 400 });
    }

    // Verify prompt exists
    const { data: prompt, error: promptError } = await (supabase as any)
      .from('story_prompts')
      .select('id, prompt_text, prompt_text_ru')
      .eq('id', promptId)
      .eq('is_active', true)
      .single();

    if (promptError || !prompt) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
    }

    // Verify target user exists and is in family circle
    const { data: targetUser } = await supabase
      .from('user_profiles')
      .select('id, first_name, last_name')
      .eq('id', toUserId)
      .single();

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if already assigned (pending)
    const { data: existing } = await (supabase as any)
      .from('assigned_prompts')
      .select('id')
      .eq('prompt_id', promptId)
      .eq('from_user_id', user.id)
      .eq('to_user_id', toUserId)
      .eq('status', 'pending')
      .maybeSingle();

    if (existing) {
      return NextResponse.json({
        error: 'This prompt is already assigned and pending'
      }, { status: 409 });
    }

    // Create assignment
    const { data: assignment, error: assignError } = await (supabase as any)
      .from('assigned_prompts')
      .insert({
        prompt_id: promptId,
        from_user_id: user.id,
        to_user_id: toUserId,
        message: message || null,
      })
      .select()
      .single();

    if (assignError) {
      console.error('Error assigning prompt:', assignError);
      if (assignError.code === '42501') {
        return NextResponse.json({
          error: 'You can only assign prompts to family members'
        }, { status: 403 });
      }
      return NextResponse.json({ error: assignError.message }, { status: 500 });
    }

    // Update usage count
    const admin = getSupabaseAdmin();
    await (admin as any).rpc('increment_prompt_usage', { p_prompt_id: promptId });

    // Send notification to recipient
    await createNotification({
      eventType: 'PROMPT_ASSIGNED',
      actorUserId: user.id,
      primaryProfileId: toUserId,
      payload: {
        prompt_id: promptId,
        prompt_text: prompt.prompt_text,
        assigned_prompt_id: assignment.id,
        message: message || null,
      },
    });

    return NextResponse.json({
      success: true,
      assignment,
    });

  } catch (error: unknown) {
    console.error('Error in POST /api/prompts/assign:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

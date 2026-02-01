import { NextResponse } from 'next/server';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';

export interface AssignedPrompt {
  id: string;
  prompt_id: string;
  from_user_id: string;
  to_user_id: string;
  status: 'pending' | 'answered' | 'declined';
  response_story_id: string | null;
  message: string | null;
  created_at: string;
  answered_at: string | null;
  prompt?: {
    id: string;
    prompt_text: string;
    prompt_text_ru: string | null;
    category: string;
  };
  from_user?: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  };
}

/**
 * GET /api/prompts/assigned/[userId]
 * Get prompts assigned to a specific user
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const supabase = await getSupabaseSSR();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'pending';
    const direction = searchParams.get('direction') || 'received'; // 'received' or 'sent'

    // Build query based on direction
    let query = (supabase as any)
      .from('assigned_prompts')
      .select(`
        id,
        prompt_id,
        from_user_id,
        to_user_id,
        status,
        response_story_id,
        message,
        created_at,
        answered_at,
        story_prompts (
          id,
          prompt_text,
          prompt_text_ru,
          category
        )
      `)
      .order('created_at', { ascending: false });

    if (direction === 'received') {
      query = query.eq('to_user_id', userId);
    } else {
      query = query.eq('from_user_id', userId);
    }

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: assignments, error } = await query;

    if (error) {
      console.error('Error fetching assigned prompts:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Fetch sender/receiver profiles
    const userIds = new Set<string>();
    for (const a of (assignments || [])) {
      userIds.add(direction === 'received' ? a.from_user_id : a.to_user_id);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const profiles: Record<string, any> = {};
    if (userIds.size > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profileData } = await (supabase as any)
        .from('user_profiles')
        .select('id, first_name, last_name, avatar_url')
        .in('id', Array.from(userIds));

      for (const p of (profileData || []) as { id: string }[]) {
        profiles[p.id] = p;
      }
    }

    // Enrich with profile data
    const enriched = (assignments || []).map((a: any) => ({
      ...a,
      prompt: a.story_prompts,
      from_user: direction === 'received' ? profiles[a.from_user_id] : null,
      to_user: direction === 'sent' ? profiles[a.to_user_id] : null,
    }));

    return NextResponse.json({
      assignments: enriched,
      total: enriched.length,
    });

  } catch (error: unknown) {
    console.error('Error in GET /api/prompts/assigned/[userId]:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * PATCH /api/prompts/assigned/[userId]
 * Update an assigned prompt (answer or decline)
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const supabase = await getSupabaseSSR();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // User can only update their own assignments
    if (user.id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { assignmentId, status, storyId } = body;

    if (!assignmentId || !status) {
      return NextResponse.json({
        error: 'assignmentId and status required'
      }, { status: 400 });
    }

    if (!['answered', 'declined'].includes(status)) {
      return NextResponse.json({
        error: 'Status must be answered or declined'
      }, { status: 400 });
    }

    // Update assignment
    const updateData: any = {
      status,
      answered_at: new Date().toISOString(),
    };

    if (status === 'answered' && storyId) {
      updateData.response_story_id = storyId;
    }

    const { data: updated, error: updateError } = await (supabase as any)
      .from('assigned_prompts')
      .update(updateData)
      .eq('id', assignmentId)
      .eq('to_user_id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating assignment:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    if (!updated) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      assignment: updated,
    });

  } catch (error: unknown) {
    console.error('Error in PATCH /api/prompts/assigned/[userId]:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

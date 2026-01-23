import { NextResponse } from 'next/server';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';
import { getSupabaseAdmin } from '@/lib/supabase/server-admin';
import { createNotification } from '@/lib/notifications';
import type { AddReactionRequest, RemoveReactionRequest, ReactionCounts } from '@/types/reactions';

async function fetchReactionTarget(supabase: any, targetType: string, targetId: string) {
  if (targetType === 'story') {
    const { data, error } = await supabase
      .from('stories')
      .select('id, subject_id, title')
      .eq('id', targetId)
      .maybeSingle();
    return { data, error };
  }

  if (targetType === 'photo') {
    const { data, error } = await (supabase as any)
      .from('photos')
      .select('id')
      .eq('id', targetId)
      .maybeSingle();
    return { data, error };
  }

  if (targetType === 'comment') {
    const { data, error } = await (supabase as any)
      .from('story_comments')
      .select('id')
      .eq('id', targetId)
      .maybeSingle();
    return { data, error };
  }

  return { data: null, error: null };
}

/**
 * POST /api/reactions
 * Add or toggle a reaction
 */
export async function POST(req: Request) {
  try {
    const supabase = await getSupabaseSSR();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: AddReactionRequest = await req.json();
    const { target_type, target_id, reaction_type } = body;

    if (!target_type || !target_id || !reaction_type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!['story', 'photo', 'comment'].includes(target_type)) {
      return NextResponse.json({ error: 'Invalid target_type' }, { status: 400 });
    }

    if (!['heart', 'sad', 'hug', 'laugh', 'pray'].includes(reaction_type)) {
      return NextResponse.json({ error: 'Invalid reaction_type' }, { status: 400 });
    }

    const { data: target, error: targetError } = await fetchReactionTarget(
      supabase,
      target_type,
      target_id
    );

    if (targetError || !target) {
      return NextResponse.json({ error: 'Target not found' }, { status: 404 });
    }

    // Check if user already has a reaction on this target
    // Note: Using 'as any' until migration runs and types are regenerated
    const { data: existingReaction } = await (supabase as any)
      .from('reactions')
      .select('id, reaction_type')
      .eq('target_type', target_type)
      .eq('target_id', target_id)
      .eq('profile_id', user.id)
      .maybeSingle();

    let reaction = null;

    if (existingReaction) {
      if (existingReaction.reaction_type === reaction_type) {
        // Same reaction - remove it (toggle off)
        const { error: deleteError } = await (supabase as any)
          .from('reactions')
          .delete()
          .eq('id', existingReaction.id);
        if (deleteError) {
          console.error('Error deleting reaction:', deleteError);
          if (deleteError.code === '42501') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
          }
          return NextResponse.json({ error: deleteError.message }, { status: 500 });
        }
      } else {
        // Different reaction - update it
        const { data: updatedReaction, error: updateError } = await (supabase as any)
          .from('reactions')
          .update({ reaction_type })
          .eq('id', existingReaction.id)
          .select()
          .single();

        if (updateError) {
          console.error('Error updating reaction:', updateError);
          if (updateError.code === '42501') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
          }
          return NextResponse.json({ error: updateError.message }, { status: 500 });
        }
        reaction = updatedReaction;
      }
    } else {
      // No existing reaction - create new
      const { data: newReaction, error: createError } = await (supabase as any)
        .from('reactions')
        .insert({
          target_type,
          target_id,
          profile_id: user.id,
          reaction_type,
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating reaction:', createError);
        if (createError.code === '42501') {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        return NextResponse.json({ error: createError.message }, { status: 500 });
      }
      reaction = newReaction;

      // Send notification to target owner (if not self)
      if (target_type === 'story') {
        const story = target as { subject_id: string; title: string | null };
        if (story.subject_id !== user.id) {
          await createNotification({
            eventType: 'REACTION_RECEIVED',
            actorUserId: user.id,
            primaryProfileId: story.subject_id,
            payload: {
              target_type,
              target_id,
              reaction_type,
              target_title: story.title,
            },
          });
        }
      }

      // Record activity event (function may not exist until migration)
      try {
        const admin = getSupabaseAdmin();
        await (admin as any).rpc('record_activity_event', {
          p_event_type: 'reaction_added',
          p_actor_id: user.id,
          p_subject_type: target_type,
          p_subject_id: target_id,
          p_display_data: { reaction_type },
          p_visibility: 'family',
        });
      } catch {
        // Activity recording is optional
      }
    }

    // Get updated counts
    const counts: ReactionCounts = {
      heart: 0,
      sad: 0,
      hug: 0,
      laugh: 0,
      pray: 0,
      total: 0,
    };

    try {
      const { data: countsData } = await (supabase as any).rpc('get_reaction_counts', {
        p_target_type: target_type,
        p_target_id: target_id,
      });

      if (countsData) {
        for (const row of countsData as { reaction_type: string; count: number }[]) {
          const rt = row.reaction_type as keyof Omit<ReactionCounts, 'total'>;
          counts[rt] = Number(row.count);
          counts.total += Number(row.count);
        }
      }
    } catch {
      // Function may not exist yet
    }

    // Get user's current reaction
    let userReaction = null;
    try {
      const result = await (supabase as any).rpc('get_user_reaction', {
        p_target_type: target_type,
        p_target_id: target_id,
        p_profile_id: user.id,
      });
      userReaction = result?.data || null;
    } catch {
      // Function may not exist yet
    }

    return NextResponse.json({
      success: true,
      reaction,
      counts,
      userReaction,
    });

  } catch (error: unknown) {
    console.error('Error in POST /api/reactions:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/reactions
 * Remove a reaction
 */
export async function DELETE(req: Request) {
  try {
    const supabase = await getSupabaseSSR();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: RemoveReactionRequest = await req.json();
    const { target_type, target_id } = body;

    if (!target_type || !target_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!['story', 'photo', 'comment'].includes(target_type)) {
      return NextResponse.json({ error: 'Invalid target_type' }, { status: 400 });
    }

    const { data: target, error: targetError } = await fetchReactionTarget(
      supabase,
      target_type,
      target_id
    );

    if (targetError || !target) {
      return NextResponse.json({ error: 'Target not found' }, { status: 404 });
    }

    const { error: deleteError } = await (supabase as any)
      .from('reactions')
      .delete()
      .eq('target_type', target_type)
      .eq('target_id', target_id)
      .eq('profile_id', user.id);

    if (deleteError) {
      console.error('Error deleting reaction:', deleteError);
      if (deleteError.code === '42501') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    // Get updated counts
    const counts: ReactionCounts = {
      heart: 0,
      sad: 0,
      hug: 0,
      laugh: 0,
      pray: 0,
      total: 0,
    };

    try {
      const { data: countsData } = await (supabase as any).rpc('get_reaction_counts', {
        p_target_type: target_type,
        p_target_id: target_id,
      });

      if (countsData) {
        for (const row of countsData as { reaction_type: string; count: number }[]) {
          const rt = row.reaction_type as keyof Omit<ReactionCounts, 'total'>;
          counts[rt] = Number(row.count);
          counts.total += Number(row.count);
        }
      }
    } catch {
      // Function may not exist yet
    }

    return NextResponse.json({
      success: true,
      counts,
      userReaction: null,
    });

  } catch (error: unknown) {
    console.error('Error in DELETE /api/reactions:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

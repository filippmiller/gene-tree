import { NextResponse } from 'next/server';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';
import { logAudit } from '@/lib/audit/logger';
import type { MilestoneUpdate } from '@/lib/milestones/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/milestones/[id]
 * Get a single milestone by ID
 */
export async function GET(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await getSupabaseSSR();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: milestone, error } = await supabase
      .from('milestones' as never)
      .select(`
        *,
        profile:profile_id (
          id,
          first_name,
          last_name,
          avatar_url
        ),
        creator:created_by (
          id,
          first_name,
          last_name,
          avatar_url
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Milestone not found' }, { status: 404 });
      }
      console.error('Error fetching milestone:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(milestone);
  } catch (error: unknown) {
    console.error('Error in GET /api/milestones/[id]:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * PATCH /api/milestones/[id]
 * Update a milestone (only by creator)
 */
export async function PATCH(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await getSupabaseSSR();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json() as MilestoneUpdate;

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {};

    if (body.milestone_type !== undefined) updateData.milestone_type = body.milestone_type;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.milestone_date !== undefined) {
      const dateObj = new Date(body.milestone_date);
      if (isNaN(dateObj.getTime())) {
        return NextResponse.json({ error: 'Invalid milestone_date format' }, { status: 400 });
      }
      updateData.milestone_date = body.milestone_date;
    }
    if (body.media_urls !== undefined) updateData.media_urls = body.media_urls;
    if (body.visibility !== undefined) updateData.visibility = body.visibility;
    if (body.remind_annually !== undefined) updateData.remind_annually = body.remind_annually;
    if (body.reminder_days_before !== undefined) updateData.reminder_days_before = body.reminder_days_before;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const { data: milestone, error } = await supabase
      .from('milestones' as never)
      .update(updateData as never)
      .eq('id', id)
      .eq('created_by', user.id) // Ensure only creator can update
      .select(`
        *,
        profile:profile_id (
          id,
          first_name,
          last_name,
          avatar_url
        )
      `)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Milestone not found or you do not have permission to update it' },
          { status: 404 }
        );
      }
      console.error('Error updating milestone:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await logAudit({
      action: 'UPDATE_MILESTONE',
      entityType: 'milestone',
      entityId: id,
      requestBody: updateData as Record<string, string>,
    });

    return NextResponse.json(milestone);
  } catch (error: unknown) {
    console.error('Error in PATCH /api/milestones/[id]:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/milestones/[id]
 * Delete a milestone (only by creator)
 */
export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await getSupabaseSSR();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // First check if the milestone exists and belongs to the user
    const { data: existing, error: checkError } = await supabase
      .from('milestones' as never)
      .select('id, created_by')
      .eq('id', id)
      .single();

    if (checkError || !existing) {
      return NextResponse.json({ error: 'Milestone not found' }, { status: 404 });
    }

    const existingData = existing as { id: string; created_by: string } | null;
    if (existingData?.created_by !== user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this milestone' },
        { status: 403 }
      );
    }

    const { error } = await supabase
      .from('milestones' as never)
      .delete()
      .eq('id', id)
      .eq('created_by', user.id);

    if (error) {
      console.error('Error deleting milestone:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await logAudit({
      action: 'DELETE_MILESTONE',
      entityType: 'milestone',
      entityId: id,
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error in DELETE /api/milestones/[id]:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

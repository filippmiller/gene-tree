import { getSupabaseAdmin } from '@/lib/supabase/server-admin';
import { NextRequest, NextResponse } from 'next/server';

// PATCH /api/relationships/[id] - Update a relationship
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { data: { user } } = await getSupabaseAdmin().auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { relationship_type, marriage_date, marriage_place, divorce_date } = body;

    const updateData: any = {};
    if (relationship_type) updateData.relationship_type = relationship_type;
    if (marriage_date !== undefined) updateData.marriage_date = marriage_date;
    if (marriage_place !== undefined) updateData.marriage_place = marriage_place;
    if (divorce_date !== undefined) updateData.divorce_date = divorce_date;

    const { data: relationship, error } = await getSupabaseAdmin()
      .from('relationships')
      .update(updateData)
      .eq('id', id)
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!relationship) {
      return NextResponse.json({ error: 'Relationship not found' }, { status: 404 });
    }

    return NextResponse.json({ relationship });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/relationships/[id] - Delete a relationship
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { data: { user } } = await getSupabaseAdmin().auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { error } = await getSupabaseAdmin()
      .from('relationships')
      .delete()
      .eq('id', id)
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

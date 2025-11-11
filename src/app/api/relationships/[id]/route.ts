import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// PATCH /api/relationships/[id] - Update a relationship
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  console.log('[RELATIONSHIPS-API] PATCH request received for ID:', id);
  try {
    const cookieStore = await cookies();
    const supabaseAdmin = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            cookieStore.set(name, value, options);
          },
          remove(name: string, options: any) {
            cookieStore.set(name, '', { ...options, maxAge: 0 });
          },
        },
      }
    );

    const { data: { user } } = await supabaseAdmin.auth.getUser();
    
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

    console.log('[RELATIONSHIPS-API] Updating relationship:', id);

    const { data: relationship, error } = await supabaseAdmin
      .from('relationships')
      .update(updateData)
      .eq('id', id)
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .select()
      .single();

    if (error) {
      console.error('[RELATIONSHIPS-API] Error updating relationship:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!relationship) {
      return NextResponse.json({ error: 'Relationship not found' }, { status: 404 });
    }

    console.log('[RELATIONSHIPS-API] Relationship updated successfully');

    return NextResponse.json({ relationship });
  } catch (error: any) {
    console.error('[RELATIONSHIPS-API] Unexpected error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/relationships/[id] - Delete a relationship
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  console.log('[RELATIONSHIPS-API] DELETE request received for ID:', id);
  try {
    const cookieStore = await cookies();
    const supabaseAdmin = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            cookieStore.set(name, value, options);
          },
          remove(name: string, options: any) {
            cookieStore.set(name, '', { ...options, maxAge: 0 });
          },
        },
      }
    );

    const { data: { user } } = await supabaseAdmin.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[RELATIONSHIPS-API] Deleting relationship:', id);

    const { error } = await supabaseAdmin
      .from('relationships')
      .delete()
      .eq('id', id)
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);

    if (error) {
      console.error('[RELATIONSHIPS-API] Error deleting relationship:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('[RELATIONSHIPS-API] Relationship deleted successfully');

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[RELATIONSHIPS-API] Unexpected error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

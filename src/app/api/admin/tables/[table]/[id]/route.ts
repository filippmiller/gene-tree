import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server-admin';
import { requireAdminContext, logAdminAction, getRequestMeta, canPerformOperation } from '@/lib/admin';

/**
 * GET /api/admin/tables/[table]/[id]
 * Returns a single record
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ table: string; id: string }> }
) {
  const { table, id } = await params;

  // Verify admin access
  const auth = await requireAdminContext();
  if (!auth.authorized) {
    return NextResponse.json(
      { error: auth.reason === 'not_authenticated' ? 'Not authenticated' : 'Admin access required' },
      { status: auth.reason === 'not_authenticated' ? 401 : 403 }
    );
  }

  if (!canPerformOperation(table, 'read')) {
    return NextResponse.json({ error: 'Table not accessible' }, { status: 403 });
  }

  const adminClient = getSupabaseAdmin();

  try {
    const { data, error } = await adminClient
      .from(table as 'user_profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    // Log the action
    const meta = getRequestMeta(request);
    await logAdminAction({
      action: 'ADMIN_VIEW_RECORD',
      entityType: table,
      entityId: id,
      userId: auth.user.id,
      userEmail: auth.user.email,
      path: `/api/admin/tables/${table}/${id}`,
      method: 'GET',
      ...meta,
    });

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/admin/tables/[table]/[id]
 * Updates a record
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ table: string; id: string }> }
) {
  const { table, id } = await params;

  // Verify admin access
  const auth = await requireAdminContext();
  if (!auth.authorized) {
    return NextResponse.json(
      { error: auth.reason === 'not_authenticated' ? 'Not authenticated' : 'Admin access required' },
      { status: auth.reason === 'not_authenticated' ? 401 : 403 }
    );
  }

  if (!canPerformOperation(table, 'update')) {
    return NextResponse.json({ error: 'Update not allowed on this table' }, { status: 403 });
  }

  const body = await request.json();
  const adminClient = getSupabaseAdmin();

  try {
    // Remove id from body to prevent id change
    const { id: _id, ...updateData } = body;

    const { data, error } = await adminClient
      .from(table as 'user_profiles')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Log the action
    const meta = getRequestMeta(request);
    await logAdminAction({
      action: 'ADMIN_UPDATE',
      entityType: table,
      entityId: id,
      userId: auth.user.id,
      userEmail: auth.user.email,
      requestBody: updateData,
      path: `/api/admin/tables/${table}/${id}`,
      method: 'PUT',
      ...meta,
    });

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/tables/[table]/[id]
 * Deletes a record
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ table: string; id: string }> }
) {
  const { table, id } = await params;
  const { searchParams } = new URL(request.url);
  const reason = searchParams.get('reason') || 'Admin deletion';

  // Verify admin access
  const auth = await requireAdminContext();
  if (!auth.authorized) {
    return NextResponse.json(
      { error: auth.reason === 'not_authenticated' ? 'Not authenticated' : 'Admin access required' },
      { status: auth.reason === 'not_authenticated' ? 401 : 403 }
    );
  }

  if (!canPerformOperation(table, 'delete')) {
    return NextResponse.json({ error: 'Delete not allowed on this table' }, { status: 403 });
  }

  const adminClient = getSupabaseAdmin();

  try {
    // First, get the record for audit purposes
    const { data: existingData } = await adminClient
      .from(table as 'user_profiles')
      .select('*')
      .eq('id', id)
      .single();

    const { error } = await adminClient
      .from(table as 'user_profiles')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Log the action with the deleted data
    const meta = getRequestMeta(request);
    await logAdminAction({
      action: 'ADMIN_DELETE',
      entityType: table,
      entityId: id,
      userId: auth.user.id,
      userEmail: auth.user.email,
      requestBody: { deletedData: existingData, reason },
      path: `/api/admin/tables/${table}/${id}`,
      method: 'DELETE',
      ...meta,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server-admin';
import { requireAdminContext, logAdminAction, getRequestMeta, getTableConfig, canPerformOperation } from '@/lib/admin';

/**
 * GET /api/admin/tables/[table]
 * Returns paginated data from a table
 * Query params: page, pageSize, sort, sortDir, search, filters (JSON)
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ table: string }> }
) {
  const { table } = await params;
  const { searchParams } = new URL(request.url);

  // Verify admin access
  const auth = await requireAdminContext();
  if (!auth.authorized) {
    return NextResponse.json(
      { error: auth.reason === 'not_authenticated' ? 'Not authenticated' : 'Admin access required' },
      { status: auth.reason === 'not_authenticated' ? 401 : 403 }
    );
  }

  // Check table access
  if (!canPerformOperation(table, 'read')) {
    return NextResponse.json({ error: 'Table not accessible' }, { status: 403 });
  }

  // Parse query params
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '25'), 100);
  const sort = searchParams.get('sort') || 'created_at';
  const sortDir = (searchParams.get('sortDir') || 'desc') as 'asc' | 'desc';
  const search = searchParams.get('search') || '';

  const adminClient = getSupabaseAdmin();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  try {
    let query = adminClient
      .from(table as 'user_profiles')
      .select('*', { count: 'exact' });

    // Apply search if provided (searches text columns)
    if (search) {
      // For now, search in common text columns
      const searchColumns = ['first_name', 'last_name', 'email', 'name', 'title', 'content'];
      const searchConditions = searchColumns.map(col => `${col}.ilike.%${search}%`);
      query = query.or(searchConditions.join(','));
    }

    // Apply sorting
    query = query.order(sort, { ascending: sortDir === 'asc', nullsFirst: false });

    // Apply pagination
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching data:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Log the action
    const meta = getRequestMeta(request);
    await logAdminAction({
      action: 'ADMIN_VIEW_TABLE',
      entityType: table,
      userId: auth.user.id,
      userEmail: auth.user.email,
      requestBody: { page, pageSize, sort, sortDir, search },
      path: `/api/admin/tables/${table}`,
      method: 'GET',
      ...meta,
    });

    return NextResponse.json({
      data,
      pagination: {
        page,
        pageSize,
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      },
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/admin/tables/[table]
 * Creates a new record
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ table: string }> }
) {
  const { table } = await params;

  // Verify admin access
  const auth = await requireAdminContext();
  if (!auth.authorized) {
    return NextResponse.json(
      { error: auth.reason === 'not_authenticated' ? 'Not authenticated' : 'Admin access required' },
      { status: auth.reason === 'not_authenticated' ? 401 : 403 }
    );
  }

  // Check table access
  if (!canPerformOperation(table, 'create')) {
    return NextResponse.json({ error: 'Create not allowed on this table' }, { status: 403 });
  }

  const body = await request.json();
  const adminClient = getSupabaseAdmin();

  try {
    const { data, error } = await adminClient
      .from(table as 'user_profiles')
      .insert(body)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Log the action
    const meta = getRequestMeta(request);
    await logAdminAction({
      action: 'ADMIN_CREATE',
      entityType: table,
      entityId: (data as Record<string, unknown>)?.id as string,
      userId: auth.user.id,
      userEmail: auth.user.email,
      requestBody: body,
      path: `/api/admin/tables/${table}`,
      method: 'POST',
      ...meta,
    });

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

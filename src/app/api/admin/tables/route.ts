import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server-admin';
import { requireAdminContext, logAdminAction, getRequestMeta, TABLE_CONFIG, HIDDEN_TABLES, type TableCategory } from '@/lib/admin';

export interface TableInfo {
  name: string;
  displayName: string;
  category: TableCategory;
  accessLevel: 'full' | 'read-only' | 'no-delete';
  recordCount: number;
}

/**
 * GET /api/admin/tables
 * Returns list of all accessible tables with metadata
 */
export async function GET(request: Request) {
  // Verify admin access
  const auth = await requireAdminContext();
  if (!auth.authorized) {
    return NextResponse.json(
      { error: auth.reason === 'not_authenticated' ? 'Not authenticated' : 'Admin access required' },
      { status: auth.reason === 'not_authenticated' ? 401 : 403 }
    );
  }

  const adminClient = getSupabaseAdmin();

  try {
    // Get list of tables from information_schema
    const { data: tables, error: tablesError } = await adminClient.rpc('get_table_list');

    if (tablesError) {
      // Fallback: use our predefined table list
      const tableList = await getTablesFromConfig(adminClient);

      // Log the action
      const meta = getRequestMeta(request);
      await logAdminAction({
        action: 'ADMIN_VIEW_TABLE',
        entityType: 'tables',
        userId: auth.user.id,
        userEmail: auth.user.email,
        path: '/api/admin/tables',
        method: 'GET',
        ...meta,
      });

      return NextResponse.json({ tables: tableList });
    }

    // Filter and enhance with our config
    const enhancedTables: TableInfo[] = (tables || [])
      .filter((t: { table_name: string }) => !HIDDEN_TABLES.includes(t.table_name))
      .map((t: { table_name: string; row_count: number }) => {
        const config = TABLE_CONFIG[t.table_name];
        return {
          name: t.table_name,
          displayName: config?.displayName || t.table_name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
          category: config?.category || 'content',
          accessLevel: config?.accessLevel === 'hidden' ? 'read-only' : (config?.accessLevel || 'full'),
          recordCount: t.row_count || 0,
        };
      });

    // Log the action
    const meta = getRequestMeta(request);
    await logAdminAction({
      action: 'ADMIN_VIEW_TABLE',
      entityType: 'tables',
      userId: auth.user.id,
      userEmail: auth.user.email,
      path: '/api/admin/tables',
      method: 'GET',
      ...meta,
    });

    return NextResponse.json({ tables: enhancedTables });
  } catch (error) {
    console.error('Error fetching tables:', error);

    // Fallback to config-based list
    const tableList = await getTablesFromConfig(adminClient);
    return NextResponse.json({ tables: tableList });
  }
}

async function getTablesFromConfig(adminClient: ReturnType<typeof getSupabaseAdmin>): Promise<TableInfo[]> {
  const tables: TableInfo[] = [];

  for (const [tableName, config] of Object.entries(TABLE_CONFIG)) {
    if (config.accessLevel === 'hidden') continue;

    let recordCount = 0;
    try {
      const { count } = await adminClient
        .from(tableName as keyof typeof TABLE_CONFIG)
        .select('*', { count: 'exact', head: true });
      recordCount = count || 0;
    } catch {
      // Table might not exist, skip
      continue;
    }

    tables.push({
      name: tableName,
      displayName: config.displayName || tableName,
      category: config.category,
      accessLevel: config.accessLevel === 'hidden' ? 'read-only' : config.accessLevel,
      recordCount,
    });
  }

  return tables;
}

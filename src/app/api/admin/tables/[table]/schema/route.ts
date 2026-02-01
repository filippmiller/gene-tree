import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server-admin';
import { requireAdminContext, getTableConfig } from '@/lib/admin';

export interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue: string | null;
  isPrimaryKey: boolean;
}

/**
 * GET /api/admin/tables/[table]/schema
 * Returns column information for a table
 */
export async function GET(
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
  const tableConfig = getTableConfig(table);
  if (!tableConfig) {
    return NextResponse.json({ error: 'Table not accessible' }, { status: 403 });
  }

  const adminClient = getSupabaseAdmin();

  try {
    // Query information_schema for column details
    const { data: columns, error } = await adminClient
      .from('information_schema.columns' as 'user_profiles')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_schema', 'public')
      .eq('table_name', table)
      .order('ordinal_position');

    if (error) {
      // Fallback: try to infer schema from a single row
      const schema = await inferSchemaFromData(adminClient, table);
      return NextResponse.json({ columns: schema, accessLevel: tableConfig.accessLevel });
    }

    const columnInfo: ColumnInfo[] = ((columns as unknown as Record<string, string | null>[] | null) || []).map((col) => ({
      name: col.column_name || '',
      type: col.data_type || 'text',
      nullable: col.is_nullable === 'YES',
      defaultValue: col.column_default,
      isPrimaryKey: col.column_name === 'id',
    }));

    return NextResponse.json({
      columns: columnInfo,
      accessLevel: tableConfig.accessLevel,
      displayName: tableConfig.displayName,
    });
  } catch (error) {
    console.error('Error fetching schema:', error);
    const schema = await inferSchemaFromData(adminClient, table);
    return NextResponse.json({ columns: schema, accessLevel: tableConfig.accessLevel });
  }
}

async function inferSchemaFromData(
  adminClient: ReturnType<typeof getSupabaseAdmin>,
  table: string
): Promise<ColumnInfo[]> {
  try {
    const { data } = await adminClient
      .from(table as 'user_profiles')
      .select('*')
      .limit(1);

    if (!data || data.length === 0) {
      return [];
    }

    const row = data[0];
    return Object.keys(row).map(key => ({
      name: key,
      type: inferType(row[key as keyof typeof row]),
      nullable: true,
      defaultValue: null,
      isPrimaryKey: key === 'id',
    }));
  } catch {
    return [];
  }
}

function inferType(value: unknown): string {
  if (value === null) return 'text';
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'number') return Number.isInteger(value) ? 'integer' : 'numeric';
  if (typeof value === 'object') return 'jsonb';
  if (typeof value === 'string') {
    if (/^\d{4}-\d{2}-\d{2}T/.test(value)) return 'timestamp with time zone';
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return 'date';
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) return 'uuid';
  }
  return 'text';
}

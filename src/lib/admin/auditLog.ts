import { getSupabaseAdmin } from '@/lib/supabase/server-admin';

export type AdminAction =
  | 'ADMIN_VIEW_TABLE'
  | 'ADMIN_VIEW_RECORD'
  | 'ADMIN_CREATE'
  | 'ADMIN_UPDATE'
  | 'ADMIN_DELETE';

export interface AuditLogEntry {
  action: AdminAction;
  entityType: string;
  entityId?: string | null;
  userId: string;
  userEmail: string;
  requestBody?: object | null;
  responseStatus?: number;
  method?: string;
  path?: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  errorMessage?: string | null;
}

/**
 * Log an admin action to the audit_logs table
 * This should be called for every admin operation
 */
export async function logAdminAction(entry: AuditLogEntry): Promise<void> {
  const adminClient = getSupabaseAdmin();

  try {
    await adminClient.from('audit_logs').insert({
      action: entry.action,
      entity_type: entry.entityType,
      entity_id: entry.entityId || null,
      user_id: entry.userId,
      user_email: entry.userEmail,
      request_body: entry.requestBody || null,
      response_status: entry.responseStatus || 200,
      method: entry.method || 'API',
      path: entry.path || `/admin/db-explorer/${entry.entityType}`,
      ip_address: entry.ipAddress || null,
      user_agent: entry.userAgent || null,
      error_message: entry.errorMessage || null,
    });
  } catch (error) {
    // Log to console but don't fail the operation
    console.error('[AuditLog] Failed to log admin action:', error);
  }
}

/**
 * Get request metadata from headers
 */
export function getRequestMeta(request: Request): { ipAddress: string | null; userAgent: string | null } {
  return {
    ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
    userAgent: request.headers.get('user-agent'),
  };
}

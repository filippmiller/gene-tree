import { getSupabaseSSR } from '@/lib/supabase/server-ssr';

export interface AuditLogData {
  action: string;
  entityType?: string;
  entityId?: string;
  method?: string;
  path?: string;
  requestBody?: any;
  responseStatus?: number;
  responseBody?: any;
  errorMessage?: string;
  errorStack?: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Log an action to audit_logs table
 */
export async function logAudit(data: AuditLogData): Promise<void> {
  try {
    const supabase = await getSupabaseSSR();
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    // Insert log entry
    const { error } = await supabase
      .from('audit_logs')
      .insert({
        user_id: user?.id || null,
        user_email: user?.email || null,
        action: data.action,
        entity_type: data.entityType || null,
        entity_id: data.entityId || null,
        method: data.method || null,
        path: data.path || null,
        request_body: data.requestBody || null,
        response_status: data.responseStatus || null,
        response_body: data.responseBody || null,
        error_message: data.errorMessage || null,
        error_stack: data.errorStack || null,
        ip_address: data.ipAddress || null,
        user_agent: data.userAgent || null,
      } as any);
    
    if (error) {
      // Don't throw - logging should never break the app
      console.error('[Audit] Failed to log action:', error);
    }
  } catch (err) {
    console.error('[Audit] Exception while logging:', err);
  }
}

/**
 * Extract IP and User-Agent from request headers
 */
export function extractRequestMeta(request: Request) {
  const headers = request.headers;
  
  return {
    ipAddress: headers.get('x-forwarded-for') || 
               headers.get('x-real-ip') || 
               'unknown',
    userAgent: headers.get('user-agent') || 'unknown',
  };
}

// ============================================================================
// Admin Supabase Client (Service Role)
// For server-side operations that bypass RLS
// ============================================================================

import { createClient } from '@supabase/supabase-js';

// Проверяем наличие переменных окружения
if (!process.env.SUPABASE_URL) {
  throw new Error('Missing SUPABASE_URL environment variable');
}

if (!process.env.SUPABASE_SERVICE_ROLE) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE environment variable');
}

/**
 * Admin Supabase client с service_role ключом
 * ВНИМАНИЕ: Использовать ТОЛЬКО на server-side!
 * Этот клиент обходит все RLS политики
 */
export const createAdminClient = () => {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
};

// Singleton instance для API routes
let adminClientInstance: ReturnType<typeof createClient> | null = null;

export const getAdminClient = () => {
  if (!adminClientInstance) {
    adminClientInstance = createAdminClient();
  }
  return adminClientInstance;
};

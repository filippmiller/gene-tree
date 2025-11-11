import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/types/supabase';
import { requireServer } from '@/lib/env.server';

/**
 * Admin Supabase client with service_role key
 * WARNING: Use ONLY in API routes! Bypasses all RLS policies
 */
export const supabaseAdmin = createClient<Database>(
  requireServer('SUPABASE_URL'),
  requireServer('SUPABASE_SERVICE_ROLE_KEY'),
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

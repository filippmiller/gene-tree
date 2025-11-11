import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/types/supabase';
import { requireServer } from '@/lib/env.server';

/**
 * Get Admin Supabase client with service role access
 * WARNING: This bypasses RLS. Use ONLY in API routes for admin operations.
 * 
 * This is a factory function to avoid initialization at module load time,
 * which would fail during build phase in Docker.
 */
export function getSupabaseAdmin(): SupabaseClient<Database> {
  return createClient<Database>(
    requireServer('SUPABASE_URL'),
    requireServer('SUPABASE_SERVICE_ROLE_KEY'),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

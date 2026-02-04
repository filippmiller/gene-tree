import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/types/supabase';

let supabaseInstance: SupabaseClient<Database> | null = null;

/**
 * Get browser Supabase client (singleton)
 * Safe to call multiple times - returns same instance
 */
export function getSupabaseBrowser(): SupabaseClient<Database> {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  supabaseInstance = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: false, // Disable auto-refresh to prevent crashes on stale tokens
      detectSessionInUrl: true,
    },
  });

  return supabaseInstance;
}

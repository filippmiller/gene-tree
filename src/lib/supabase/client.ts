import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export function createClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[SUPABASE] Missing environment variables!');
    console.error('[SUPABASE] URL:', supabaseUrl ? 'present' : 'MISSING');
    console.error('[SUPABASE] Key:', supabaseAnonKey ? 'present' : 'MISSING');
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }
  console.log('[SUPABASE] Creating client with URL:', supabaseUrl);
  return createSupabaseClient(supabaseUrl, supabaseAnonKey);
}

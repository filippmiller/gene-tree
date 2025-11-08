import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export function createClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[SUPABASE-BROWSER] Missing environment variables!');
    console.error('[SUPABASE-BROWSER] URL:', supabaseUrl ? 'present' : 'MISSING');
    console.error('[SUPABASE-BROWSER] Key:', supabaseAnonKey ? 'present' : 'MISSING');
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }
  console.log('[SUPABASE-BROWSER] Creating SSR browser client with URL:', supabaseUrl);
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

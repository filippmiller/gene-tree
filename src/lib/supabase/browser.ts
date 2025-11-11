import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/types/supabase';
import { envClient } from '@/lib/env.client';

export const supabase = createClient<Database>(
  envClient.NEXT_PUBLIC_SUPABASE_URL,
  envClient.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = 'https://mbntpsfllwhlnzuzspvp.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ibnRwc2ZsbHdobG56dXpzcHZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjUxNTk2MCwiZXhwIjoyMDc4MDkxOTYwfQ.69MK8rgK1adYjAIL7tl6ZnbO1RLF-ozNQtnsZ58ts_U';

console.log('🚀 Applying RLS Recursion Fix Migration...\n');

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

const sql = `
-- Fix RLS Infinite Recursion
DROP POLICY IF EXISTS "Admins have full access" ON public.user_profiles;

CREATE OR REPLACE FUNCTION public.current_user_is_admin()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE
AS $$ 
  SELECT EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin'); 
$$;

DROP POLICY IF EXISTS "media_select_policy" ON storage.objects;
DROP POLICY IF EXISTS "media_delete_policy" ON storage.objects;
DROP POLICY IF EXISTS "media_insert_policy" ON storage.objects;
DROP POLICY IF EXISTS "media_update_policy" ON storage.objects;

CREATE POLICY "media_bucket_insert" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'media' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "media_bucket_update" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'media' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'media' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "media_bucket_delete" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'media' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "media_bucket_select" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'media' AND (storage.foldername(name))[1] = auth.uid()::text);
`;

// Split into individual statements for execution
const statements = sql
  .split(';')
  .map(s => s.trim())
  .filter(s => s && !s.startsWith('--'));

console.log(`📋 Executing ${statements.length} SQL statements...\n`);

let successCount = 0;
let errorCount = 0;

for (let i = 0; i < statements.length; i++) {
  const stmt = statements[i];
  console.log(`[${i + 1}/${statements.length}] ${stmt.substring(0, 60)}...`);
  
  try {
    // Use HTTP POST to execute raw SQL via PostgREST
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({ query: stmt })
    });
    
    if (response.ok) {
      console.log('  ✅ Success');
      successCount++;
    } else {
      const error = await response.text();
      console.log(`  ❌ Error: ${error}`);
      errorCount++;
    }
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`);
    errorCount++;
  }
}

console.log(`\n📊 Results: ${successCount} success, ${errorCount} errors`);

if (errorCount === 0) {
  console.log('\n✅ Migration applied successfully!');
  console.log('🧪 Test avatar upload now');
} else {
  console.log('\n⚠️  Migration had errors - may need manual application in Dashboard');
  console.log('   Go to: https://supabase.com/dashboard/project/mbntpsfllwhlnzuzspvp/sql/new');
}

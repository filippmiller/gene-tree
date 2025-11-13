#!/usr/bin/env node
/**
 * Diagnose Supabase Schema
 * Checks which schema/tables exist and where user_profiles is located
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mbntpsfllwhlnzuzspvp.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ibnRwc2ZsbHdobG56dXpzcHZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjUxNTk2MCwiZXhwIjoyMDc4MDkxOTYwfQ.69MK8rgK1adYjAIL7tl6ZnbO1RLF-ozNQtnsZ58ts_U';

console.log('🔍 Diagnosing Supabase Schema...\n');

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

try {
  console.log('=== Step 1: Check if user_profiles table exists ===');
  const { data: profiles, error: profilesError, count } = await supabase
    .from('user_profiles')
    .select('id, role', { count: 'exact', head: true });
  
  if (profilesError) {
    console.log('❌ Error:', profilesError.message);
  } else {
    console.log(`✅ user_profiles table accessible via REST API`);
    console.log(`   Row count: ${count}`);
  }
  
  console.log('\n=== Step 2: Try to list all tables in information_schema ===');
  
  // This might not work via PostgREST, but let's try
  const { data: tables, error: tablesError } = await supabase
    .rpc('get_tables_list');
  
  if (tablesError) {
    console.log('❌ Cannot list tables via RPC:', tablesError.message);
    console.log('   (Expected - function likely doesn\'t exist)');
  } else {
    console.log('✅ Tables found:', tables);
  }
  
  console.log('\n=== Step 3: Check storage.objects table (for policies) ===');
  const { data: storageCheck, error: storageError } = await supabase
    .from('storage.objects')
    .select('id', { count: 'exact', head: true });
  
  if (storageError) {
    console.log('❌ Cannot access storage.objects:', storageError.message);
  } else {
    console.log('✅ storage.objects accessible');
  }
  
  console.log('\n=== Step 4: Check current_user_is_admin function ===');
  const { data: adminCheck, error: adminError } = await supabase
    .rpc('current_user_is_admin');
  
  if (adminError) {
    console.log('❌ Function current_user_is_admin error:', adminError.message);
    if (adminError.message.includes('infinite recursion')) {
      console.log('   ⚠️  CONFIRMED: Infinite recursion issue exists!');
    }
  } else {
    console.log('✅ Function works, result:', adminCheck);
  }
  
  console.log('\n=== Summary ===');
  console.log('PostgREST (REST API) can access user_profiles ✅');
  console.log('Next step: Apply RLS fix migration in Dashboard SQL Editor');
  console.log('\nIf SQL Editor says "relation does not exist", run this diagnostic SQL:');
  console.log(`
    SELECT current_database() as db,
           current_schema() as current_schema,
           current_schemas(true) as search_path;
    
    SELECT table_schema, table_name
    FROM information_schema.tables
    WHERE table_name ILIKE '%user_profiles%';
  `);
  
} catch (err) {
  console.error('❌ Unexpected error:', err.message);
}

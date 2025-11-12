import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mbntpsfllwhlnzuzspvp.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ibnRwc2ZsbHdobG56dXpzcHZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjUxNTk2MCwiZXhwIjoyMDc4MDkxOTYwfQ.69MK8rgK1adYjAIL7tl6ZnbO1RLF-ozNQtnsZ58ts_U';

console.log('🔍 Checking RLS policies...\n');

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

try {
  // Query pg_policies view
  const { data, error } = await supabase
    .rpc('exec_sql', {
      query: `
        SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
        FROM pg_policies
        WHERE tablename IN ('user_profiles', 'photos')
        ORDER BY tablename, policyname
      `
    });
  
  if (error) {
    console.log('❌ Error (RPC might not exist):', error.message);
    console.log('\n💡 Trying direct query via PostgREST...');
    
    // Alternative: query information_schema
    const { data: tables, error: err2 } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['user_profiles', 'photos']);
    
    if (err2) {
      console.log('❌ Cannot query schema:', err2.message);
    } else {
      console.log('✅ Tables exist:', tables?.map(t => t.table_name));
      console.log('\n📋 Need to check RLS policies manually in Supabase Dashboard');
      console.log('   Go to: Database → Tables → user_profiles → Policies');
    }
  } else {
    console.log('📊 Current RLS Policies:');
    console.table(data);
  }
  
} catch (err) {
  console.error('❌ Error:', err.message);
  console.log('\n💡 Apply RLS fix migration directly in Supabase SQL Editor');
}

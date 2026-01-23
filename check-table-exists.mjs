import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mbntpsfllwhlnzuzspvp.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ibnRwc2ZsbHdobG56dXpzcHZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjUxNTk2MCwiZXhwIjoyMDc4MDkxOTYwfQ.69MK8rgK1adYjAIL7tl6ZnbO1RLF-ozNQtnsZ58ts_U';

console.log('🔍 Checking if user_profiles table exists...\n');

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

try {
  // Try to query user_profiles table
  const { error, count } = await supabase
    .from('user_profiles')
    .select('id', { count: 'exact', head: true });
  
  if (error) {
    if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
      console.log('❌ Table user_profiles DOES NOT EXIST');
      console.log('   Error:', error.message);
      console.log('\n📋 Need to apply migration: 20251112010000_ensure_user_profiles_table.sql');
    } else {
      console.log('❌ Error querying table:', error.message);
    }
  } else {
    console.log('✅ Table user_profiles EXISTS');
    console.log(`   Row count: ${count || 0}`);
    
    // Check for admin role column
    const { error: sampleError } = await supabase
      .from('user_profiles')
      .select('id, role')
      .limit(1);
    
    if (sampleError) {
      console.log('⚠️  Column "role" might not exist:', sampleError.message);
    } else {
      console.log('✅ Column "role" exists');
    }
  }
  
} catch (err) {
  console.error('❌ Unexpected error:', err.message);
}

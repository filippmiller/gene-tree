import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mbntpsfllwhlnzuzspvp.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ibnRwc2ZsbHdobG56dXpzcHZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjUxNTk2MCwiZXhwIjoyMDc4MDkxOTYwfQ.69MK8rgK1adYjAIL7tl6ZnbO1RLF-ozNQtnsZ58ts_U';

console.log('🔌 Connecting to Supabase with service role...');

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Test 1: Count relationships
console.log('\n📊 Test 1: Count relationships');
const { data: relCount, error: relError } = await supabase
  .from('relationships')
  .select('*', { count: 'exact', head: true });

if (relError) {
  console.error('❌ Error:', relError);
} else {
  console.log('✅ Total relationships:', relCount);
}

// Test 2: Count users
console.log('\n👥 Test 2: Count users');
const { data: userCount, error: userError } = await supabase
  .from('user_profiles')
  .select('*', { count: 'exact', head: true });

if (userError) {
  console.error('❌ Error:', userError);
} else {
  console.log('✅ Total users:', userCount);
}

// Test 3: List users
console.log('\n📋 Test 3: List users (first 5)');
const { data: users, error: usersError } = await supabase
  .from('user_profiles')
  .select('id, first_name, last_name')
  .limit(5);

if (usersError) {
  console.error('❌ Error:', usersError);
} else {
  console.log('✅ Users:');
  users?.forEach(u => console.log(`  - ${u.first_name} ${u.last_name} (ID: ${u.id.slice(0, 8)}...)`));
}

console.log('\n✨ Connection test complete!');

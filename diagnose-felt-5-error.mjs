import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mbntpsfllwhlnzuzspvp.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ibnRwc2ZsbHdobG56dXpzcHZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjUxNTk2MCwiZXhwIjoyMDc4MDkxOTYwfQ.69MK8rgK1adYjAIL7tl6ZnbO1RLF-ozNQtnsZ58ts_U';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🔍 Diagnosing "felt 5" error...\n');

// 1. Check all relationships
console.log('📊 Step 1: Check all relationships in DB');
const { data: rels, error: relsError } = await supabase
  .from('relationships')
  .select('*');

if (relsError) {
  console.error('❌ Error fetching relationships:', relsError);
} else {
  console.log(`✅ Found ${rels.length} relationships`);
  rels.forEach(r => {
    console.log(`  - ${r.relationship_type}: ${r.user1_id.slice(0,8)} ↔️ ${r.user2_id.slice(0,8)}`);
  });
}

// 2. Check users
console.log('\n👥 Step 2: Check all users');
const { data: users, error: usersError } = await supabase
  .from('user_profiles')
  .select('id, first_name, last_name');

if (usersError) {
  console.error('❌ Error fetching users:', usersError);
} else {
  console.log(`✅ Found ${users.length} users:`);
  users.forEach(u => {
    console.log(`  - ${u.first_name} ${u.last_name || ''} [${u.id.slice(0,8)}...]`);
  });
}

// 3. Test as authenticated user (Filip)
console.log('\n🔐 Step 3: Test query as authenticated user (Filip)');
const filip = users.find(u => u.first_name === 'Filip' && u.last_name === '');

if (filip) {
  console.log(`   Testing as: ${filip.first_name} (${filip.id.slice(0,8)}...)`);
  
  // Create anon client (simulating logged-in user)
  const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ibnRwc2ZsbHdobG56dXpzcHZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MTU5NjAsImV4cCI6MjA3ODA5MTk2MH0.esC4-YPgCGZ82RO6Iud3d6nPEK0UX3iT6enqBGz9_dE';
  const anonClient = createClient(supabaseUrl, anonKey);
  
  // Try to query relationships
  const { data: userRels, error: userRelsError } = await anonClient
    .from('relationships')
    .select('*')
    .or(`user1_id.eq.${filip.id},user2_id.eq.${filip.id}`);
  
  if (userRelsError) {
    console.error('   ❌ Error querying as user:', userRelsError);
  } else {
    console.log(`   ✅ User can see ${userRels.length} relationships`);
  }
}

// 4. Check RLS policies
console.log('\n🛡️ Step 4: Check if there are any invalid relationships');
const invalidRels = rels.filter(r => {
  const user1Exists = users.some(u => u.id === r.user1_id);
  const user2Exists = users.some(u => u.id === r.user2_id);
  return !user1Exists || !user2Exists;
});

if (invalidRels.length > 0) {
  console.error(`❌ Found ${invalidRels.length} invalid relationships (user doesn't exist):`);
  invalidRels.forEach(r => {
    console.error(`   - ${r.id}: ${r.user1_id} ↔️ ${r.user2_id}`);
  });
} else {
  console.log('✅ All relationships point to existing users');
}

console.log('\n💡 Summary:');
console.log(`   - ${users.length} users in DB`);
console.log(`   - ${rels.length} relationships in DB`);
console.log(`   - ${invalidRels.length} invalid relationships`);
console.log('\nIf error persists, check browser console for actual error message.');

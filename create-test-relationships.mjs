import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mbntpsfllwhlnzuzspvp.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ibnRwc2ZsbHdobG56dXpzcHZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjUxNTk2MCwiZXhwIjoyMDc4MDkxOTYwfQ.69MK8rgK1adYjAIL7tl6ZnbO1RLF-ozNQtnsZ58ts_U';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

console.log('🌳 Creating family relationships...\n');

// Get users
const { data: users, error: usersError } = await supabase
  .from('user_profiles')
  .select('id, first_name, last_name')
  .order('created_at');

if (usersError) {
  console.error('❌ Error fetching users:', usersError);
  process.exit(1);
}

console.log('👥 Found users:');
users.forEach((u, i) => console.log(`  ${i}: ${u.first_name} ${u.last_name} (${u.id.slice(0,8)}...)`));

// Find specific users
const filip = users.find(u => u.first_name === 'Filip');
const alexander = users.find(u => u.first_name === 'Alexander');
const elena = users.find(u => u.first_name === 'Elena');
const anna = users.find(u => u.first_name === 'Anna');

if (!filip || !alexander || !elena || !anna) {
  console.error('❌ Could not find required users');
  process.exit(1);
}

console.log('\n🔗 Creating relationships:');
console.log(`  - ${alexander.first_name} + ${elena.first_name} = married`);
console.log(`  - ${filip.first_name} is child of ${alexander.first_name} and ${elena.first_name}`);
console.log(`  - ${anna.first_name} is child of ${alexander.first_name} and ${elena.first_name}`);
console.log(`  - ${filip.first_name} and ${anna.first_name} are siblings\n`);

// Create relationships
const relationships = [
  {
    user1_id: alexander.id,
    user2_id: elena.id,
    relationship_type: 'spouse',
    in_law: false,
    is_ex: false,
    cousin_removed: 0,
    source: {},
    qualifiers: {},
    created_by: filip.id
  },
  {
    user1_id: alexander.id,
    user2_id: filip.id,
    relationship_type: 'parent',
    in_law: false,
    is_ex: false,
    cousin_removed: 0,
    source: {},
    qualifiers: {},
    created_by: filip.id
  },
  {
    user1_id: elena.id,
    user2_id: filip.id,
    relationship_type: 'parent',
    in_law: false,
    is_ex: false,
    cousin_removed: 0,
    source: {},
    qualifiers: {},
    created_by: filip.id
  },
  {
    user1_id: alexander.id,
    user2_id: anna.id,
    relationship_type: 'parent',
    in_law: false,
    is_ex: false,
    cousin_removed: 0,
    source: {},
    qualifiers: {},
    created_by: filip.id
  },
  {
    user1_id: elena.id,
    user2_id: anna.id,
    relationship_type: 'parent',
    in_law: false,
    is_ex: false,
    cousin_removed: 0,
    source: {},
    qualifiers: {},
    created_by: filip.id
  },
  {
    user1_id: filip.id,
    user2_id: anna.id,
    relationship_type: 'sibling',
    in_law: false,
    is_ex: false,
    cousin_removed: 0,
    source: {},
    qualifiers: {},
    created_by: filip.id
  }
];

const { data, error } = await supabase
  .from('relationships')
  .insert(relationships)
  .select();

if (error) {
  console.error('❌ Error creating relationships:', error);
  process.exit(1);
}

console.log(`✅ Created ${data.length} relationships successfully!\n`);

// Verify
const { count } = await supabase
  .from('relationships')
  .select('*', { count: 'exact', head: true });

console.log(`📊 Total relationships in DB: ${count}`);
console.log('\n🎉 Family tree is ready! Check production now!');

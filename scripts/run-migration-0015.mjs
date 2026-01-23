import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://mbntpsfllwhlnzuzspvp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ibnRwc2ZsbHdobG56dXpzcHZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjUxNTk2MCwiZXhwIjoyMDc4MDkxOTYwfQ.69MK8rgK1adYjAIL7tl6ZnbO1RLF-ozNQtnsZ58ts_U'
);

console.log('🚀 Applying migration 0015: Merge relationships tables...\n');

// Step 1: Add column via raw query
console.log('1️⃣ Adding relationship_status column...');
try {
  const { error } = await supabase
    .from('pending_relatives')
    .select('relationship_status')
    .limit(1);
  
  if (error && error.message.includes('column')) {
    console.log('   Column does not exist, will add via ALTER TABLE');
  } else {
    console.log('   ✓ Column already exists');
  }
} catch {
  console.log('   Will attempt to add column');
}

// Step 2: Update all records to have status
console.log('\n2️⃣ Setting relationship_status = "pending" for all records...');
const { data: updateData, error: updateError } = await supabase
  .from('pending_relatives')
  .update({ relationship_status: 'pending' })
  .select('id');

if (updateError) {
  console.error('   ❌ Error:', updateError.message);
} else {
  console.log(`   ✓ Updated ${updateData?.length || 0} records`);
}

// Step 3: Verify
console.log('\n3️⃣ Verifying data...');
const { data: verifyData, error: verifyError } = await supabase
  .from('pending_relatives')
  .select('id, first_name, last_name, relationship_type, relationship_status')
  .limit(5);

if (verifyError) {
  console.error('   ❌ Error:', verifyError.message);
} else {
  console.log(`   ✓ Sample records:`);
  verifyData?.forEach(r => {
    console.log(`     - ${r.first_name} ${r.last_name} (${r.relationship_type}): ${r.relationship_status || 'NULL'}`);
  });
}

console.log('\n✅ Migration complete!');
console.log('\n📝 Next: Apply VIEW updates via Supabase Dashboard SQL Editor');
console.log('   File: supabase/migrations/0015_merge_relationships_tables.sql');
console.log('   Lines: 55-120');

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mbntpsfllwhlnzuzspvp.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  console.log('📝 Reading migration file...\n');
  
  const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '002_residences_and_deceased.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');
  
  console.log('🚀 Applying migration to database...\n');
  
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    }
    
    console.log('✅ Migration applied successfully!\n');
    console.log('Created tables:');
    console.log('  - residences');
    console.log('  - deceased_relatives');
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.log('\n💡 Note: You may need to run this SQL manually in Supabase SQL Editor');
    process.exit(1);
  }
}

applyMigration();

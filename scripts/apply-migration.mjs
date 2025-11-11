import postgres from 'postgres';
import fs from 'fs';

// Direct connection string from Supabase dashboard
// IPv6 address from nslookup
const connectionString = 'postgresql://postgres:fYvqFxFl0vuo0mlp@[2600:1f16:1cd0:3321:9cf6:69eb:ef72:265b]:5432/postgres';

const sql = postgres(connectionString, {
  ssl: 'require'
});

async function applyMigration() {
  console.log('🚀 Applying migration 0016_merge_tables_with_flags.sql...\n');

  try {
    // Read migration file
    const migrationSQL = fs.readFileSync(
      './supabase/migrations/0016_merge_tables_with_flags.sql',
      'utf8'
    );

    console.log('📄 Migration file loaded');
    console.log('🔄 Executing SQL...\n');

    // Execute migration
    await sql.unsafe(migrationSQL);

    console.log('✅ Migration applied successfully!');
    
    // Verify
    console.log('\n📊 Verifying...');
    const result = await sql`
      SELECT 
        column_name, 
        data_type, 
        is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'pending_relatives' 
        AND column_name IN ('is_pending', 'is_verified', 'is_temporary')
      ORDER BY column_name
    `;
    
    console.log('\n✓ New columns:');
    result.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });

    // Check sample data
    const sample = await sql`
      SELECT first_name, last_name, relationship_type, is_pending, is_verified, is_temporary
      FROM pending_relatives
      LIMIT 3
    `;
    
    console.log('\n✓ Sample data:');
    sample.forEach(row => {
      console.log(`  - ${row.first_name} ${row.last_name}: pending=${row.is_pending}, verified=${row.is_verified}, temp=${row.is_temporary}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await sql.end();
  }
}

applyMigration().catch(console.error);

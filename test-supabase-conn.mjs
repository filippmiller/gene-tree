import pg from 'pg';

console.log('Testing connection to Supabase pooler...\n');

// Use DIRECT connection (not pooler) - pooler strips username
const client = new pg.Client({
  host: 'db.mbntpsfllwhlnzuzspvp.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'Airbus380Airbud3802024',
  ssl: {
    rejectUnauthorized: false,
    checkServerIdentity: () => undefined
  },
  application_name: 'gene-tree-readonly',
  connectionTimeoutMillis: 10000
});

console.log('Connection params:', {
  host: client.host,
  port: client.port,
  database: client.database,
  user: client.user
});

try {
  await client.connect();
  console.log('✅ Connected!\n');
  
  await client.query("SET default_transaction_read_only = on;");
  await client.query("SET statement_timeout = '30s';");
  console.log('✅ Read-only mode enabled\n');
  
  const result = await client.query('SELECT now(), current_user, current_database()');
  console.log('📊 Database info:');
  console.table(result.rows);
  
  const tables = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name LIKE '%profile%'
    ORDER BY table_name
  `);
  
  console.log('\n📋 Tables with "profile" in name:');
  console.table(tables.rows);
  
} catch (error) {
  console.error('❌ Error:', error.message);
  console.error('   Code:', error.code);
  process.exit(1);
} finally {
  await client.end();
}

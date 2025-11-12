#!/usr/bin/env node
/**
 * Read-only database query script
 * Usage: node scripts/db_ro_query.mjs "SELECT now(), current_user"
 */

import pg from 'pg';
import { config } from 'dotenv';

config({ path: '.env.local' });

const query = process.argv[2];

if (!query) {
  console.error('Usage: node scripts/db_ro_query.mjs "SELECT ..."');
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error('ERROR: DATABASE_URL not set in environment');
  process.exit(1);
}

// Use pooler connection (Transaction mode - port 6543)
const client = new pg.Client({
  host: 'aws-1-us-east-2.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  user: 'postgres.mbntpsfllwhlnzuzspvp',
  password: 'Airbus380Airbud3802024',
  ssl: {
    rejectUnauthorized: false
  },
  application_name: 'gene-tree-ro-query'
});

try {
  await client.connect();
  console.log('✅ Connected to database');
  
  // Enable read-only mode
  await client.query("SET default_transaction_read_only = on;");
  await client.query("SET statement_timeout = '30s';");
  console.log('✅ Read-only mode enabled');
  
  // Execute query
  const result = await client.query(query);
  console.log('\n📊 Query Results:');
  console.table(result.rows);
  console.log(`\n Rows returned: ${result.rowCount}`);
  
} catch (error) {
  console.error('❌ Error:', error.message);
  if (error.code) console.error('   Code:', error.code);
  process.exit(2);
} finally {
  await client.end();
}

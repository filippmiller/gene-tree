import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const supabase = createClient(
  'https://mbntpsfllwhlnzuzspvp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ibnRwc2ZsbHdobG56dXpzcHZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjUxNTk2MCwiZXhwIjoyMDc4MDkxOTYwfQ.69MK8rgK1adYjAIL7tl6ZnbO1RLF-ozNQtnsZ58ts_U'
);

async function applyMigration() {
  console.log('Applying migration 0015_merge_relationships_tables.sql...');
  
  // Step 1: Add status column
  console.log('1. Adding relationship_status column...');
  const { error: alterError } = await supabase.rpc('exec', {
    sql: 'ALTER TABLE public.pending_relatives ADD COLUMN IF NOT EXISTS relationship_status TEXT DEFAULT \'pending\';'
  });
  
  if (alterError) console.log('Note:', alterError.message);

  // Step 2: Update existing records
  console.log('2. Updating existing records...');
  const { error: updateError } = await supabase
    .from('pending_relatives')
    .update({ relationship_status: 'pending' })
    .is('relationship_status', null);
  
  if (updateError) console.log('Note:', updateError.message);

  // Step 3: Create index
  console.log('3. Creating index...');
  const { error: indexError } = await supabase.rpc('exec', {
    sql: 'CREATE INDEX IF NOT EXISTS idx_pending_relatives_status ON public.pending_relatives(relationship_status);'
  });
  
  if (indexError) console.log('Note:', indexError.message);

  console.log('✓ Migration completed!');
  console.log('\nNext: Apply VIEW updates via Supabase Dashboard SQL Editor');
  console.log('File: supabase/migrations/0015_merge_relationships_tables.sql');
  console.log('Lines: 55-120 (VIEW definitions)');
}

applyMigration().catch(console.error);

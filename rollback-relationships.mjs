import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mbntpsfllwhlnzuzspvp.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ibnRwc2ZsbHdobG56dXpzcHZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjUxNTk2MCwiZXhwIjoyMDc4MDkxOTYwfQ.69MK8rgK1adYjAIL7tl6ZnbO1RLF-ozNQtnsZ58ts_U';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🔄 Rolling back test relationships...\n');

const { error } = await supabase
  .from('relationships')
  .delete()
  .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

if (error) {
  console.error('❌ Error:', error);
  process.exit(1);
}

console.log('✅ Deleted all relationships');

// Verify
const { count } = await supabase
  .from('relationships')
  .select('*', { count: 'exact', head: true });

console.log(`📊 Relationships in DB: ${count}`);
console.log('\n✨ Rollback complete!');

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://mbntpsfllwhlnzuzspvp.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  console.log('Available env vars:', Object.keys(process.env).filter(k => k.includes('SUPABASE')));
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createRelationship(user1Id, user2Id, relationshipType) {
  console.log(`\n🔗 Creating relationship: ${relationshipType}`);
  
  const { error } = await supabase
    .from('relationships')
    .insert({
      user1_id: user1Id,
      user2_id: user2Id,
      relationship_type: relationshipType
    });

  if (error) {
    console.error(`❌ Relationship error:`, error.message);
    return false;
  }

  console.log(`✅ Relationship created`);
  return true;
}

async function main() {
  console.log('🚀 Creating Relationships for Miller Family\n');
  console.log('=' .repeat(60));

  // Get all existing users from database
  console.log('\n🔍 Fetching existing family members from database...');
  
  const { data: allProfiles, error: profilesError } = await supabase
    .from('user_profiles')
    .select('id, first_name, last_name');

  if (profilesError) {
    console.error('❌ Error fetching profiles:', profilesError.message);
    return;
  }

  console.log(`✅ Found ${allProfiles?.length || 0} profiles in database`);
  allProfiles?.forEach(p => {
    console.log(`   - ${p.first_name} ${p.last_name} (${p.id})`);
  });

  // Map profiles by first name for easy lookup
  const profileMap = {};
  allProfiles?.forEach(p => {
    profileMap[p.first_name] = p.id;
  });

  const filippId = profileMap['Filipp'];
  const alexanderId = profileMap['Alexander'];
  const elenaId = profileMap['Elena'];
  const annaId = profileMap['Anna'];
  const mariaId = profileMap['Maria'];
  const dmitryId = profileMap['Dmitry'];

  if (!filippId) {
    console.log('\n⚠️  Filipp Miller not found in database. Cannot create relationships.');
    return;
  }

  console.log(`\n✅ Center person: Filipp (${filippId})`);

  // Create relationships
  console.log('\n📍 Creating family relationships...');
  
  let relationshipsCreated = 0;

  // Parents of Filipp
  if (alexanderId) {
    const success = await createRelationship(alexanderId, filippId, 'parent');
    if (success) relationshipsCreated++;
  }
  if (elenaId) {
    const success = await createRelationship(elenaId, filippId, 'parent');
    if (success) relationshipsCreated++;
  }
  
  // Spouse between parents
  if (alexanderId && elenaId) {
    const success = await createRelationship(alexanderId, elenaId, 'spouse');
    if (success) relationshipsCreated++;
  }
  
  // Sibling
  if (annaId) {
    const success = await createRelationship(filippId, annaId, 'sibling');
    if (success) relationshipsCreated++;
  }
  
  // Spouse (wife)
  if (mariaId) {
    const success = await createRelationship(filippId, mariaId, 'spouse');
    if (success) relationshipsCreated++;
  }
  
  // Child
  if (dmitryId) {
    const success = await createRelationship(filippId, dmitryId, 'parent');
    if (success) relationshipsCreated++;
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ RELATIONSHIPS CREATED SUCCESSFULLY!\n');
  console.log('📊 Summary:');
  console.log(`   Total members: ${allProfiles?.length || 0}`);
  console.log(`   Relationships created: ${relationshipsCreated} connections`);
  
  console.log('\n🎉 You can now query the family tree!');
}

main().catch(console.error);

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://mbntpsfllwhlnzuzspvp.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

// Тестовая семья Миллер
const family = [
  {
    email: 'alexander.miller@test.com',
    password: 'Test123456!',
    profile: {
      first_name: 'Alexander',
      middle_name: 'Ivanovich',
      last_name: 'Miller',
      gender: 'male',
      birth_date: '1955-03-15',
      birth_place: 'Moscow, Russia',
      occupation: 'Engineer (retired)',
      bio: 'Retired engineer, grandfather'
    },
    role: 'Отец Филиппа'
  },
  {
    email: 'elena.miller@test.com',
    password: 'Test123456!',
    profile: {
      first_name: 'Elena',
      middle_name: 'Petrovna',
      last_name: 'Miller',
      maiden_name: 'Ivanova',
      gender: 'female',
      birth_date: '1958-07-22',
      birth_place: 'Saint Petersburg, Russia',
      occupation: 'Teacher (retired)',
      bio: 'Retired teacher, grandmother'
    },
    role: 'Мать Филиппа'
  },
  {
    email: 'anna.miller@test.com',
    password: 'Test123456!',
    profile: {
      first_name: 'Anna',
      middle_name: 'Alexandrovna',
      last_name: 'Miller',
      gender: 'female',
      birth_date: '1985-11-10',
      birth_place: 'Moscow, Russia',
      occupation: 'Doctor',
      bio: 'Medical doctor, sister of Filipp'
    },
    role: 'Сестра Филиппа'
  },
  {
    email: 'maria.miller@test.com',
    password: 'Test123456!',
    profile: {
      first_name: 'Maria',
      middle_name: 'Sergeevna',
      last_name: 'Miller',
      maiden_name: 'Petrova',
      gender: 'female',
      birth_date: '1990-04-18',
      birth_place: 'Moscow, Russia',
      occupation: 'Designer',
      bio: 'Graphic designer, wife of Filipp'
    },
    role: 'Жена Филиппа'
  },
  {
    email: 'dmitry.miller@test.com',
    password: 'Test123456!',
    profile: {
      first_name: 'Dmitry',
      middle_name: 'Filippovich',
      last_name: 'Miller',
      gender: 'male',
      birth_date: '2015-09-05',
      birth_place: 'Moscow, Russia',
      occupation: 'Student',
      bio: 'School student, son of Filipp'
    },
    role: 'Сын Филиппа'
  }
];

async function createUser(userData) {
  console.log(`\n📝 Creating user: ${userData.email} (${userData.role})`);
  
  try {
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          name: userData.profile.first_name
        }
      }
    });

    if (authError) {
      console.error(`❌ Auth error:`, authError.message);
      return null;
    }

    if (!authData.user) {
      console.error(`❌ No user returned`);
      return null;
    }

    console.log(`✅ Auth user created: ${authData.user.id}`);

    // Sign in to get session
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: userData.email,
      password: userData.password
    });

    if (signInError) {
      console.error(`❌ Sign in error:`, signInError.message);
      return authData.user;
    }

    // Create profile
    const profileData = {
      id: authData.user.id,
      ...userData.profile
    };

    const { error: profileError } = await supabase
      .from('user_profiles')
      .upsert(profileData);

    if (profileError) {
      console.error(`❌ Profile error:`, profileError.message);
    } else {
      console.log(`✅ Profile created`);
    }

    // Sign out
    await supabase.auth.signOut();

    return {
      ...authData.user,
      profile: userData.profile,
      role: userData.role
    };

  } catch (error) {
    console.error(`❌ Error:`, error.message);
    return null;
  }
}

async function createInvitation(fromUserId, toEmail, relationshipType) {
  console.log(`\n📨 Creating invitation from ${fromUserId} to ${toEmail} as ${relationshipType}`);
  
  const { data, error } = await supabase
    .from('invitations')
    .insert({
      inviter_id: fromUserId,
      invitee_email: toEmail,
      relationship_type: relationshipType,
      message: `Join our family tree!`
    })
    .select()
    .single();

  if (error) {
    console.error(`❌ Invitation error:`, error.message);
    return null;
  }

  console.log(`✅ Invitation created with token: ${data.token}`);
  return data;
}

async function createRelationship(user1Id, user2Id, relationshipType) {
  console.log(`\n🔗 Creating relationship between users: ${relationshipType}`);
  
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
  console.log('🚀 Creating Miller Family Test Data\n');
  console.log('=' .repeat(60));

  // Step 1: Create all users
  console.log('\n📍 STEP 1: Creating all family members...');
  const users = [];
  
  for (const userData of family) {
    const user = await createUser(userData);
    if (user) {
      users.push(user);
    }
    await new Promise(r => setTimeout(r, 1000)); // Wait between creations
  }

  console.log(`\n✅ Created ${users.length} users`);

  // Assume Filipp (filippmiller@gmail.com) already exists
  // Get Filipp's user ID
  const { data: filippProfile } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('first_name', 'Filipp')
    .eq('last_name', 'Miller')
    .single();

  if (!filippProfile) {
    console.log('\n⚠️  Filipp Miller not found. Using first user as center.');
  }

  const filippId = filippProfile?.id || users[0]?.id;

  // Step 2: Create relationships
  console.log('\n📍 STEP 2: Creating family relationships...');
  
  // Relationships structure:
  // Alexander (0) - parent of Filipp
  // Elena (1) - parent of Filipp  
  // Anna (2) - sibling of Filipp
  // Maria (3) - spouse of Filipp
  // Dmitry (4) - child of Filipp

  if (filippId && users.length >= 5) {
    // Parents
    if (users[0]) await createRelationship(users[0].id, filippId, 'parent');
    if (users[1]) await createRelationship(users[1].id, filippId, 'parent');
    
    // Spouse between parents
    if (users[0] && users[1]) await createRelationship(users[0].id, users[1].id, 'spouse');
    
    // Sibling
    if (users[2]) await createRelationship(filippId, users[2].id, 'sibling');
    
    // Spouse (wife)
    if (users[3]) await createRelationship(filippId, users[3].id, 'spouse');
    
    // Child
    if (users[4]) await createRelationship(filippId, users[4].id, 'parent');
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ TEST FAMILY CREATED SUCCESSFULLY!\n');
  console.log('📊 Summary:');
  console.log(`   Total members: ${users.length + 1} (including Filipp)`);
  console.log(`   Relationships created: ~${users.length} connections`);
  console.log('\n📝 Login credentials (all passwords: Test123456!):');
  
  family.forEach(member => {
    console.log(`   ${member.email.padEnd(30)} - ${member.role}`);
  });
  
  console.log('\n🎉 You can now test the family tree with these accounts!');
}

main().catch(console.error);

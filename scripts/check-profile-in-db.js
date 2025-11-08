const { createClient } = require('@supabase/supabase-js');

// Get credentials from Railway env
const supabaseUrl = 'https://mbntpsfllwhlnzuzspvp.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ibnRwc2ZsbHdobG56dXpzcHZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzEwNzA4OTIsImV4cCI6MjA0NjY0Njg5Mn0.eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ibnRwc2ZsbHdobG56dXpzcHZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzEwNzA4OTIsImV4cCI6MjA0NjY0Njg5Mn0.nYLKtLNyiv-JoVdEhVk1pqvYMh5t_hHSVjPrBWqod_dE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProfile() {
  console.log('🔍 Checking profiles in database...\n');

  try {
    // Get all profiles
    const { data: profiles, error } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching profiles:', error);
      return;
    }

    if (!profiles || profiles.length === 0) {
      console.log('⚠️  No profiles found in database');
      return;
    }

    console.log(`✅ Found ${profiles.length} profile(s)\n`);

    profiles.forEach((profile, index) => {
      console.log(`${'='.repeat(60)}`);
      console.log(`Profile ${index + 1}:`);
      console.log(`${'='.repeat(60)}`);
      console.log('ID:', profile.id);
      console.log('Name:', profile.first_name, profile.middle_name || '', profile.last_name);
      console.log('Maiden Name:', profile.maiden_name || 'N/A');
      console.log('Nickname:', profile.nickname || 'N/A');
      console.log('Gender:', profile.gender || 'N/A');
      console.log('Birth Date:', profile.birth_date || 'N/A');
      console.log('Birth Place:', profile.birth_place || 'N/A');
      console.log('Phone:', profile.phone || 'N/A');
      console.log('Occupation:', profile.occupation || 'N/A');
      console.log('Bio:', profile.bio ? profile.bio.substring(0, 100) + '...' : 'N/A');
      console.log('Living:', profile.is_living);
      console.log('Created:', new Date(profile.created_at).toLocaleString());
      console.log('Updated:', new Date(profile.updated_at).toLocaleString());
      console.log();
    });

    // Check specifically for Filip's email
    console.log('\n📧 Checking for filippmiller@gmail.com...');
    
    // We need to get the user ID first from auth.users
    // But we can't access auth.users directly, so let's check by recent profiles
    const filipProfile = profiles.find(p => 
      p.first_name && p.first_name.toLowerCase().includes('filip')
    );

    if (filipProfile) {
      console.log('✅ Found Filip\'s profile:');
      console.log(JSON.stringify(filipProfile, null, 2));
    } else {
      console.log('⚠️  Could not find Filip\'s profile by name');
    }

  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

checkProfile();

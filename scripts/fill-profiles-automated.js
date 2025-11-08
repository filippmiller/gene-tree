const { chromium } = require('playwright');

const users = [
  {
    email: 'mylifeis0plus1@gmail.com',
    password: 'Airbus380+',
    profile: {
      first_name: 'Filip',
      middle_name: '',
      last_name: 'Miller',
      maiden_name: '',
      nickname: 'Flip',
      gender: 'male',
      birth_date: '1990-05-15',
      birth_place: 'Moscow, Russia',
      phone: '+7 999 123 4567',
      occupation: 'Software Engineer',
      bio: 'Passionate about family history and genealogy. Building tools to help people discover their roots.'
    }
  },
  {
    email: 'filippmiller@gmail.com',
    password: 'Airbus380+',
    profile: {
      first_name: 'Filipp',
      middle_name: 'Alexandrovich',
      last_name: 'Miller',
      maiden_name: '',
      nickname: 'Phil',
      gender: 'male',
      birth_date: '1988-03-20',
      birth_place: 'Saint Petersburg, Russia',
      phone: '+7 911 987 6543',
      occupation: 'Product Manager',
      bio: 'Tech entrepreneur and family tree enthusiast. Love connecting people and discovering family stories.'
    }
  }
];

async function fillProfile(user) {
  const browser = await chromium.launch({ headless: false, slowMo: 300 });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log(`\n${'='.repeat(60)}`);
  console.log(`📝 Processing user: ${user.email}`);
  console.log(`${'='.repeat(60)}\n`);

  try {
    // Step 1: Login
    console.log('🔐 Step 1: Logging in...');
    await page.goto('https://gene-tree-production.up.railway.app/en/sign-in');
    await page.fill('input[type="email"]', user.email);
    await page.fill('input[type="password"]', user.password);
    await page.click('button[type="submit"]');
    
    console.log('⏳ Waiting for redirect...');
    await page.waitForTimeout(3000);
    
    const currentUrl = page.url();
    console.log('📍 Current URL:', currentUrl);

    // Step 2: Check if we're on profile complete page
    if (currentUrl.includes('/profile/complete')) {
      console.log('✅ Redirected to profile completion page\n');
      
      // Step 3: Fill the form
      console.log('📝 Step 2: Filling profile form...');
      
      await page.fill('input[name="first_name"]', user.profile.first_name);
      console.log('  ✓ First name:', user.profile.first_name);
      
      if (user.profile.middle_name) {
        await page.fill('input[name="middle_name"]', user.profile.middle_name);
        console.log('  ✓ Middle name:', user.profile.middle_name);
      }
      
      await page.fill('input[name="last_name"]', user.profile.last_name);
      console.log('  ✓ Last name:', user.profile.last_name);
      
      if (user.profile.maiden_name) {
        await page.fill('input[name="maiden_name"]', user.profile.maiden_name);
      }
      
      if (user.profile.nickname) {
        await page.fill('input[name="nickname"]', user.profile.nickname);
        console.log('  ✓ Nickname:', user.profile.nickname);
      }
      
      await page.selectOption('select[name="gender"]', user.profile.gender);
      console.log('  ✓ Gender:', user.profile.gender);
      
      if (user.profile.birth_date) {
        await page.fill('input[name="birth_date"]', user.profile.birth_date);
        console.log('  ✓ Birth date:', user.profile.birth_date);
      }
      
      if (user.profile.birth_place) {
        await page.fill('input[name="birth_place"]', user.profile.birth_place);
        console.log('  ✓ Birth place:', user.profile.birth_place);
      }
      
      if (user.profile.phone) {
        await page.fill('input[name="phone"]', user.profile.phone);
        console.log('  ✓ Phone:', user.profile.phone);
      }
      
      if (user.profile.occupation) {
        await page.fill('input[name="occupation"]', user.profile.occupation);
        console.log('  ✓ Occupation:', user.profile.occupation);
      }
      
      if (user.profile.bio) {
        await page.fill('textarea[name="bio"]', user.profile.bio);
        console.log('  ✓ Bio:', user.profile.bio.substring(0, 50) + '...');
      }
      
      // Take screenshot before submit
      await page.screenshot({ path: `profile-filled-${user.email.split('@')[0]}.png` });
      console.log(`\n📸 Screenshot saved`);
      
      // Step 4: Submit form
      console.log('\n🚀 Step 3: Submitting form...');
      await page.click('button[type="submit"]');
      
      // Wait for response
      await page.waitForTimeout(5000);
      
      const finalUrl = page.url();
      console.log('📍 Final URL:', finalUrl);
      
      if (finalUrl.includes('/app') && !finalUrl.includes('/profile')) {
        console.log('✅ SUCCESS! Profile created and redirected to dashboard\n');
        
        // Take screenshot of dashboard
        await page.screenshot({ path: `dashboard-${user.email.split('@')[0]}.png` });
        console.log('📸 Dashboard screenshot saved');
        
        return { success: true, email: user.email };
      } else {
        console.log('⚠️  Still on profile page or unexpected redirect\n');
        
        // Check for error
        const errorText = await page.textContent('body').catch(() => '');
        if (errorText.includes('error') || errorText.includes('Error')) {
          console.log('❌ Error detected on page');
        }
        
        return { success: false, email: user.email, url: finalUrl };
      }
      
    } else if (currentUrl.includes('/app')) {
      console.log('ℹ️  User already has a profile, redirected to dashboard');
      await page.screenshot({ path: `dashboard-existing-${user.email.split('@')[0]}.png` });
      return { success: true, email: user.email, existing: true };
    } else {
      console.log('❌ Unexpected URL after login:', currentUrl);
      return { success: false, email: user.email, url: currentUrl };
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    return { success: false, email: user.email, error: error.message };
  } finally {
    await browser.close();
  }
}

async function main() {
  console.log('\n🚀 Starting automated profile filling for all users...\n');
  
  const results = [];
  
  for (const user of users) {
    const result = await fillProfile(user);
    results.push(result);
    
    // Wait a bit between users
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  
  results.forEach((result, index) => {
    console.log(`\n${index + 1}. ${result.email}`);
    if (result.success) {
      console.log('   Status: ✅ Success');
      if (result.existing) {
        console.log('   Note: Profile already existed');
      }
    } else {
      console.log('   Status: ❌ Failed');
      if (result.error) {
        console.log('   Error:', result.error);
      }
      if (result.url) {
        console.log('   URL:', result.url);
      }
    }
  });
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ Process complete! Now checking database...\n');
}

main();

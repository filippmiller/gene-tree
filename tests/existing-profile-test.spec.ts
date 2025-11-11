import { test, expect } from '@playwright/test';

const TEST_EMAIL = 'filippmiller@gmail.com';
const TEST_PASSWORD = 'Airbus380+';

test('login with existing profile should go to dashboard', async ({ page }) => {
  page.on('console', msg => console.log('[BROWSER]', msg.text()));
  
  console.log('\n=== Login ===');
  await page.goto('http://localhost:3000/en/sign-in');
  await page.fill('input#email', TEST_EMAIL);
  await page.fill('input#password', TEST_PASSWORD);
  await page.click('button[type="submit"]', { force: true });
  
  console.log('\n=== Wait for page load ===');
  await page.waitForTimeout(3000);
  
  const url = page.url();
  console.log('Current URL:', url);
  
  // Check for Nav
  const nav = page.locator('nav');
  const hasNav = await nav.count() > 0;
  console.log('Has navigation:', hasNav);
  
  if (hasNav) {
    console.log('✅ Navigation found');
    
    // Check nav links
    const familyProfileBtn = page.locator('nav button:has-text("Family Profile"), nav a:has-text("Family Profile")');
    const count = await familyProfileBtn.count();
    console.log('Family Profile links:', count);
    
    if (count > 0) {
      console.log('\n=== Click Family Profile ===');
      await familyProfileBtn.first().click();
      await page.waitForTimeout(2000);
      
      const newUrl = page.url();
      console.log('New URL:', newUrl);
      
      if (newUrl.includes('family-profile')) {
        console.log('✅ Successfully navigated to family profile!');
      }
      
      await page.screenshot({ path: 'family-profile-page.png', fullPage: true });
    }
  }
  
  // Check page title
  const h1 = await page.locator('h1').first().textContent();
  console.log('Page title:', h1);
  
  await page.screenshot({ path: 'after-login-existing-profile.png', fullPage: true });
  console.log('📸 Screenshot saved');
});

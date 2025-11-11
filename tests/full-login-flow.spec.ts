import { test, expect } from '@playwright/test';

const TEST_EMAIL = 'filippmiller@gmail.com';
const TEST_PASSWORD = 'Airbus380+';

test.describe('Full Login Flow Diagnostic', () => {
  test('should login and check navigation', async ({ page }) => {
    // Enable console logging
    page.on('console', msg => console.log('[BROWSER]', msg.text()));
    
    console.log('\n=== STEP 1: Navigate to sign-in ===');
    await page.goto('http://localhost:3000/en/sign-in');
    await page.waitForLoadState('networkidle');
    
    console.log('\n=== STEP 2: Fill credentials ===');
    await page.fill('input#email', TEST_EMAIL);
    await page.fill('input#password', TEST_PASSWORD);
    
    console.log('\n=== STEP 3: Submit form ===');
    await page.click('button[type="submit"]', { force: true });
    
    console.log('\n=== STEP 4: Wait for redirect ===');
    await page.waitForURL('**', { timeout: 15000 });
    
    const finalUrl = page.url();
    console.log('\n=== FINAL URL:', finalUrl);
    
    // Check where we landed
    if (finalUrl.includes('/app')) {
      console.log('✅ Landed on dashboard');
    } else if (finalUrl.includes('/profile')) {
      console.log('⚠️  Landed on profile page');
    } else {
      console.log('❌ Landed on unknown page');
    }
    
    console.log('\n=== STEP 5: Check for navigation bar ===');
    await page.waitForTimeout(2000); // Wait for page to fully load
    
    // Take screenshot
    await page.screenshot({ path: 'after-login.png', fullPage: true });
    console.log('📸 Screenshot saved: after-login.png');
    
    // Check for Nav component
    const nav = page.locator('nav');
    const navCount = await nav.count();
    console.log(`Navigation bars found: ${navCount}`);
    
    if (navCount > 0) {
      console.log('✅ Navigation bar exists');
      
      // Check for nav items
      const dashboardLink = page.locator('nav a:has-text("Dashboard"), nav button:has-text("Dashboard")');
      const peopleLink = page.locator('nav a:has-text("People"), nav button:has-text("People")');
      const profileLink = page.locator('nav a:has-text("Profile"), nav button:has-text("Profile")');
      
      console.log(`  - Dashboard link: ${await dashboardLink.count()}`);
      console.log(`  - People link: ${await peopleLink.count()}`);
      console.log(`  - Profile link: ${await profileLink.count()}`);
    } else {
      console.log('❌ NO navigation bar found!');
    }
    
    console.log('\n=== STEP 6: Check page title ===');
    const h1 = page.locator('h1');
    const h1Count = await h1.count();
    if (h1Count > 0) {
      const h1Text = await h1.first().textContent();
      console.log(`Page title (h1): "${h1Text}"`);
    }
    
    console.log('\n=== STEP 7: Check profile data in console ===');
    // Profile data should be logged in browser console (we already captured it above)
    
    console.log('\n=== Test complete ===\n');
  });
  
  test('should have navigation on profile page', async ({ page }) => {
    // Login first
    await page.goto('http://localhost:3000/en/sign-in');
    await page.fill('input#email', TEST_EMAIL);
    await page.fill('input#password', TEST_PASSWORD);
    await page.click('button[type="submit"]', { force: true });
    await page.waitForURL('**', { timeout: 15000 });
    
    console.log('\n=== Navigate to profile directly ===');
    await page.goto('http://localhost:3000/en/profile');
    await page.waitForLoadState('networkidle');
    
    // Check for navigation
    const nav = page.locator('nav');
    await expect(nav).toBeVisible({ timeout: 5000 });
    
    console.log('✅ Navigation is visible on profile page');
    
    // Screenshot
    await page.screenshot({ path: 'profile-page.png', fullPage: true });
  });
});

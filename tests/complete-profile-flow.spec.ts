import { test, expect } from '@playwright/test';

const TEST_EMAIL = 'filippmiller@gmail.com';
const TEST_PASSWORD = 'Airbus380+';

test.describe('Complete Profile Flow', () => {
  test('should login, see nav, fill profile, and reach dashboard', async ({ page }) => {
    page.on('console', msg => console.log('[BROWSER]', msg.text()));
    
    console.log('\n=== STEP 1: Login ===');
    await page.goto('http://localhost:3000/en/sign-in');
    await page.fill('input#email', TEST_EMAIL);
    await page.fill('input#password', TEST_PASSWORD);
    await page.click('button[type="submit"]', { force: true });
    
    console.log('\n=== STEP 2: Wait for redirect ===');
    await page.waitForURL('**', { timeout: 15000 });
    await page.waitForTimeout(2000);
    
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);
    
    console.log('\n=== STEP 3: Check navigation bar ===');
    const nav = page.locator('nav');
    await expect(nav).toBeVisible({ timeout: 5000 });
    console.log('✅ Navigation bar is visible');
    
    // Check nav links
    const dashboardBtn = page.locator('nav button:has-text("Dashboard")');
    const peopleBtn = page.locator('nav button:has-text("People")');
    const familyProfileBtn = page.locator('nav button:has-text("Family Profile")');
    
    console.log('Nav links found:');
    console.log('  - Dashboard:', await dashboardBtn.count());
    console.log('  - People:', await peopleBtn.count());
    console.log('  - Family Profile:', await familyProfileBtn.count());
    
    console.log('\n=== STEP 4: Check page title ===');
    const h1 = page.locator('h1').first();
    const pageTitle = await h1.textContent();
    console.log('Page title:', pageTitle);
    
    if (pageTitle?.includes('Complete Your Profile')) {
      console.log('\n=== STEP 5: Fill profile form ===');
      
      await page.fill('input[name="first_name"]', 'Филипп');
      await page.fill('input[name="last_name"]', 'Миллер');
      await page.selectOption('select[name="gender"]', 'male');
      
      console.log('✅ Form filled');
      
      // Take screenshot before submit
      await page.screenshot({ path: 'before-submit.png', fullPage: true });
      console.log('📸 Screenshot: before-submit.png');
      
      console.log('\n=== STEP 6: Submit form ===');
      await page.click('button[type="submit"]');
      
      console.log('\n=== STEP 7: Wait for redirect to dashboard ===');
      await page.waitForURL('**/app**', { timeout: 15000 });
      
      const finalUrl = page.url();
      console.log('Final URL:', finalUrl);
      
      // Check we're on dashboard
      const welcomeText = await page.locator('h1').first().textContent();
      console.log('Dashboard title:', welcomeText);
      
      expect(welcomeText).toContain('Филипп');
      console.log('✅ Successfully created profile and reached dashboard!');
      
      // Screenshot
      await page.screenshot({ path: 'dashboard.png', fullPage: true });
      console.log('📸 Screenshot: dashboard.png');
      
    } else if (pageTitle?.includes('Welcome back')) {
      console.log('✅ Already on dashboard!');
      await page.screenshot({ path: 'dashboard-already.png', fullPage: true });
    }
    
    console.log('\n=== Test complete! ===\n');
  });
});

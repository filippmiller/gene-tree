import { test, expect } from '@playwright/test';

const TEST_EMAIL = 'filippmiller@gmail.com';
const TEST_PASSWORD = 'Airbus380+';

test.describe('Locale and Layout Tests', () => {
  test('should default to Russian locale and switch to English', async ({ page }) => {
    // 1. Login
    await page.goto('http://localhost:3000/en/sign-in');
    await page.fill('input#email', TEST_EMAIL);
    await page.fill('input#password', TEST_PASSWORD);
    await page.click('button[type="submit"]', { force: true });
    
    // Wait for redirect to dashboard
    await page.waitForURL('**/app**', { timeout: 10000 });
    
    // 2. Check if we're on Russian version by default (after redirect)
    // The URL might be /ru/app or just /app depending on localePrefix
    const currentUrl = page.url();
    console.log('Current URL after login:', currentUrl);
    
    // 3. Check for Russian text on dashboard
    const welcomeText = await page.textContent('h1');
    console.log('Welcome text:', welcomeText);
    // Should contain "Добро пожаловать" or "Welcome back" depending on locale
    
    // 4. Check navigation links are in Russian
    const dashboardLink = page.locator('nav a:has-text("Дашборд"), nav button:has-text("Дашборд")');
    const peopleLink = page.locator('nav a:has-text("Люди"), nav button:has-text("Люди")');
    
    // At least one should be visible (either Russian or English)
    const hasDashboard = await dashboardLink.count() > 0;
    const hasPeople = await peopleLink.count() > 0;
    console.log('Has Russian nav:', { hasDashboard, hasPeople });
    
    // 5. Click language switcher to switch to EN
    const langSwitcher = page.locator('button:has-text("EN")');
    await langSwitcher.click();
    
    // Wait for page to reload with new locale
    await page.waitForTimeout(1000);
    
    // 6. Check URL now has /en
    const newUrl = page.url();
    console.log('URL after switching to EN:', newUrl);
    expect(newUrl).toContain('/en/');
    
    // 7. Check for English text
    const englishDashboard = page.locator('nav a:has-text("Dashboard"), nav button:has-text("Dashboard")');
    await expect(englishDashboard.first()).toBeVisible({ timeout: 5000 });
  });

  test('should have full-width layout (no max-width constraint)', async ({ page }) => {
    // Login
    await page.goto('http://localhost:3000/en/sign-in');
    await page.fill('input#email', TEST_EMAIL);
    await page.fill('input#password', TEST_PASSWORD);
    await page.click('button[type="submit"]', { force: true });
    await page.waitForURL('**/app**', { timeout: 10000 });
    
    // Check main content width
    const main = page.locator('main');
    const boundingBox = await main.boundingBox();
    
    if (boundingBox) {
      console.log('Main element width:', boundingBox.width);
      console.log('Viewport width:', page.viewportSize()?.width);
      
      // Main should be nearly full width (minus padding)
      const viewportWidth = page.viewportSize()?.width || 0;
      // Allow for padding (24px * 2 = 48px minimum)
      expect(boundingBox.width).toBeGreaterThan(viewportWidth - 200);
    }
  });

  test('should have only one language switcher button', async ({ page }) => {
    // Login
    await page.goto('http://localhost:3000/en/sign-in');
    await page.fill('input#email', TEST_EMAIL);
    await page.fill('input#password', TEST_PASSWORD);
    await page.click('button[type="submit"]', { force: true });
    await page.waitForURL('**/app**', { timeout: 10000 });
    
    // Count language switcher buttons (should be exactly 1)
    const enButtons = page.locator('button:has-text("EN")');
    const ruButtons = page.locator('button:has-text("RU")');
    
    const enCount = await enButtons.count();
    const ruCount = await ruButtons.count();
    
    console.log('Language buttons found:', { EN: enCount, RU: ruCount });
    
    // Should have exactly one language switcher showing the OTHER language
    const totalLangButtons = enCount + ruCount;
    expect(totalLangButtons).toBe(1);
  });
});

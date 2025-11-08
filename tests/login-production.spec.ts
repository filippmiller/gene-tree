import { test, expect } from '@playwright/test';

test('login to production', async ({ page }) => {
  // Navigate to production sign-in page
  await page.goto('https://gene-tree-production.up.railway.app/en/sign-in');
  
  // Wait for page to load
  await page.waitForLoadState('networkidle');
  
  // Fill in email
  await page.fill('input[type="email"]', 'filippmiller@gmail.com');
  
  // Fill in password
  await page.fill('input[type="password"]', 'Airbus380+');
  
  // Click sign in button
  await page.click('button[type="submit"]');
  
  // Wait for navigation to dashboard
  await page.waitForURL('**/app**', { timeout: 10000 });
  
  // Verify we're on the dashboard
  await expect(page).toHaveURL(/\/app/);
  
  // Keep the browser open for manual testing
  await page.pause();
});

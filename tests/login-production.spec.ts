import { test, expect } from '@playwright/test';

const SHOULD_RUN = process.env.PLAYWRIGHT_RUN_PROD === '1';
const PROD_BASE = process.env.PLAYWRIGHT_PROD_BASE_URL || 'https://gene-tree-production.up.railway.app';
const EMAIL = process.env.PLAYWRIGHT_E2E_EMAIL;
const PASSWORD = process.env.PLAYWRIGHT_E2E_PASSWORD;

test('login to production', async ({ page }) => {
  test.skip(!SHOULD_RUN, 'Production e2e skipped by default. Set PLAYWRIGHT_RUN_PROD=1 to enable.');
  test.skip(!EMAIL || !PASSWORD, 'Missing PLAYWRIGHT_E2E_EMAIL or PLAYWRIGHT_E2E_PASSWORD');

  // Navigate to production sign-in page
  await page.goto(`${PROD_BASE}/en/sign-in`);
  await page.waitForLoadState('networkidle');

  // Fill in credentials
  await page.fill('input[type="email"]', EMAIL!);
  await page.fill('input[type="password"]', PASSWORD!);

  // Click sign in button
  await page.click('button[type="submit"]');

  // Wait for navigation to dashboard
  await page.waitForURL('**/app**', { timeout: 15000 });

  // Verify we're on the dashboard
  await expect(page).toHaveURL(/\/app/);
});

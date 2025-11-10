import { test, expect } from '@playwright/test';

const EMAIL = process.env.PLAYWRIGHT_LOCAL_EMAIL;
const PASSWORD = process.env.PLAYWRIGHT_LOCAL_PASSWORD;
const BASE = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
const LOCALE = process.env.PLAYWRIGHT_LOCALE || 'en';

test('local sign-in flow', async ({ page }) => {
  test.skip(!EMAIL || !PASSWORD, 'Set PLAYWRIGHT_LOCAL_EMAIL and PLAYWRIGHT_LOCAL_PASSWORD to run this test');

  await page.goto(`${BASE}/${LOCALE}/sign-in`);
  await page.fill('input#email', EMAIL!);
  await page.fill('input#password', PASSWORD!);
  await page.click('button[type="submit"]');

  await page.waitForURL(`**/${LOCALE}/app**`, { timeout: 15000 });
  await expect(page).toHaveURL(new RegExp(`/${LOCALE}/app`));
});

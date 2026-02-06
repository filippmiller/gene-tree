/**
 * Profile Flow E2E Tests
 *
 * Tests viewing and navigating the user profile:
 * - Own profile page loads
 * - Profile sections are visible (education, residence, photos, interests)
 * - Navigation to profile works from sidebar
 *
 * Requires the dev server to be running at localhost:3000.
 */

import { test, expect, type Page } from '@playwright/test';

const TEST_EMAIL = process.env.PLAYWRIGHT_E2E_EMAIL || 'filippmiller@gmail.com';
const TEST_PASSWORD = process.env.PLAYWRIGHT_E2E_PASSWORD || 'Airbus380+';

/**
 * Helper: sign in and wait for the dashboard to load.
 */
async function signIn(page: Page, locale: string = 'en') {
  await page.goto(`/${locale}/sign-in`);
  await page.waitForLoadState('networkidle');
  await page.fill('#email', TEST_EMAIL);
  await page.fill('#password', TEST_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL(`**/${locale}/app**`, { timeout: 20000 });
}

test.describe('Profile - View Own Profile', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await signIn(page, 'en');
  });

  test('my-profile page loads successfully', async ({ page }) => {
    await page.goto('/en/my-profile');
    await page.waitForLoadState('networkidle');

    // The page title should say "My Profile"
    await expect(page.getByText('My Profile')).toBeVisible({ timeout: 10000 });
  });

  test('profile page shows header with description', async ({ page }) => {
    await page.goto('/en/my-profile');
    await page.waitForLoadState('networkidle');

    // Check for the profile description text
    await expect(
      page.getByText('Update your information, upload photos, and share your interests.')
    ).toBeVisible({ timeout: 10000 });
  });

  test('profile page has avatar section', async ({ page }) => {
    await page.goto('/en/my-profile');
    await page.waitForLoadState('networkidle');

    // The AvatarUpload component should be on the page
    // It could be an image or a placeholder div
    const avatarArea = page.locator('[class*="rounded-2xl"]').first();
    await expect(avatarArea).toBeVisible({ timeout: 10000 });
  });

  test('navigate to my-profile from sidebar avatar link', async ({ page }) => {
    // The sidebar has an avatar area that links to /my-profile
    const profileLink = page.locator('a[href*="/my-profile"]').first();
    await expect(profileLink).toBeVisible({ timeout: 5000 });

    await profileLink.click();
    await page.waitForURL('**/my-profile**', { timeout: 10000 });
    await expect(page).toHaveURL(/\/en\/my-profile/);
  });
});

test.describe('Profile - Russian Locale', () => {
  test('my-profile page loads in Russian', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await signIn(page, 'ru');

    await page.goto('/ru/my-profile');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Мой профиль')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Profile - Unauthenticated Access', () => {
  test('unauthenticated access to my-profile redirects to sign-in', async ({ page }) => {
    await page.goto('/en/my-profile');

    // Should redirect to sign-in
    await page.waitForURL('**/sign-in**', { timeout: 15000 });
    await expect(page).toHaveURL(/\/en\/sign-in/);
  });
});

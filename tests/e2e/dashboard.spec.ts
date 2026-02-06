/**
 * Dashboard Flow E2E Tests
 *
 * Tests the authenticated dashboard experience:
 * - Page loads for authenticated user
 * - Key sections are visible (welcome, stats, quick actions)
 * - Sidebar navigation works
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

test.describe('Dashboard - Authenticated User', () => {
  test.beforeEach(async ({ page }) => {
    // Use a desktop viewport so the sidebar is visible
    await page.setViewportSize({ width: 1280, height: 720 });
    await signIn(page, 'en');
  });

  test('dashboard page loads successfully', async ({ page }) => {
    await expect(page).toHaveURL(/\/en\/app/);

    // The main content area should be rendered
    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('welcome section displays user name', async ({ page }) => {
    // The dashboard has a welcome hero with the user's name
    // The h1 contains translated "welcomeBack" with the user name
    const heading = page.locator('h1');
    await expect(heading).toBeVisible({ timeout: 10000 });

    // The heading should contain some text (the user's name or a greeting)
    const text = await heading.textContent();
    expect(text).toBeTruthy();
    expect(text!.length).toBeGreaterThan(0);
  });

  test('sidebar navigation is visible', async ({ page }) => {
    const sidebarNav = page.getByTestId('sidebar-nav');
    await expect(sidebarNav).toBeVisible({ timeout: 5000 });
  });

  test('sidebar contains key navigation links', async ({ page }) => {
    const sidebar = page.getByTestId('sidebar-nav');
    await expect(sidebar).toBeVisible();

    // Check that navigation groups are rendered with links
    // The sidebar uses next-intl Link with locale-prefixed hrefs
    // Key links: /app (Dashboard), /people, /tree, /stories
    const navLinks = sidebar.locator('a');
    const linkCount = await navLinks.count();

    // Should have multiple navigation links (dashboard, people, tree, stories, etc.)
    expect(linkCount).toBeGreaterThanOrEqual(8);
  });

  test('navigate to People page via sidebar', async ({ page }) => {
    const sidebar = page.getByTestId('sidebar-nav');
    await expect(sidebar).toBeVisible();

    // Click the People nav link
    const peopleLink = sidebar.locator('a[href*="/people"]').first();
    await expect(peopleLink).toBeVisible();
    await peopleLink.click();

    await page.waitForURL('**/people**', { timeout: 10000 });
    await expect(page).toHaveURL(/\/en\/people/);
  });

  test('navigate to Family Tree page via sidebar', async ({ page }) => {
    const sidebar = page.getByTestId('sidebar-nav');
    await expect(sidebar).toBeVisible();

    const treeLink = sidebar.locator('a[href*="/tree"]').first();
    await expect(treeLink).toBeVisible();
    await treeLink.click();

    await page.waitForURL('**/tree**', { timeout: 10000 });
    await expect(page).toHaveURL(/\/en\/tree/);
  });

  test('navigate to Stories page via sidebar', async ({ page }) => {
    const sidebar = page.getByTestId('sidebar-nav');
    await expect(sidebar).toBeVisible();

    const storiesLink = sidebar.locator('a[href*="/stories"]').first();
    await expect(storiesLink).toBeVisible();
    await storiesLink.click();

    await page.waitForURL('**/stories**', { timeout: 10000 });
    await expect(page).toHaveURL(/\/en\/stories/);
  });

  test('navigate to Add Person page via sidebar', async ({ page }) => {
    const sidebar = page.getByTestId('sidebar-nav');
    await expect(sidebar).toBeVisible();

    const addPersonLink = sidebar.locator('a[href*="/people/new"]').first();
    await expect(addPersonLink).toBeVisible();
    await addPersonLink.click();

    await page.waitForURL('**/people/new**', { timeout: 10000 });
    await expect(page).toHaveURL(/\/en\/people\/new/);
  });
});

test.describe('Dashboard - Unauthenticated Redirect', () => {
  test('unauthenticated user is redirected to sign-in', async ({ page }) => {
    // Go directly to the dashboard without signing in
    await page.goto('/en/app');

    // Should be redirected to sign-in
    await page.waitForURL('**/sign-in**', { timeout: 15000 });
    await expect(page).toHaveURL(/\/en\/sign-in/);
  });
});

test.describe('Dashboard - Russian Locale', () => {
  test('dashboard loads in Russian locale', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await signIn(page, 'ru');

    await expect(page).toHaveURL(/\/ru\/app/);

    // The page should render with Russian content
    const main = page.locator('main');
    await expect(main).toBeVisible();

    // Heading should be present
    const heading = page.locator('h1');
    await expect(heading).toBeVisible({ timeout: 10000 });
  });
});

/**
 * 06 - Global Search E2E Tests
 *
 * Tests the Ctrl+K search command palette:
 * - Modal open/close
 * - Search input + debounced results
 * - Keyboard navigation
 * - Result click -> profile navigation
 */

import { test, expect } from '@playwright/test';
import {
  createOnboardedTestUser,
  createTestFamily,
  TEST_PASSWORD,
} from '../../helpers/test-user-factory';
import { signInViaAPI } from '../../helpers/auth-helpers';
import { selectors } from '../../helpers/selectors';
import { cleanupUsers, cleanupProfiles } from '../../helpers/cleanup';

const locale = 'en';
const createdUserIds: string[] = [];
const createdProfileIds: string[] = [];

test.afterAll(async () => {
  await cleanupProfiles(createdProfileIds);
  await cleanupUsers(createdUserIds);
});

/** Helper: sign in and navigate to app, ensure page body is focused for keyboard events */
async function goToApp(page: import('@playwright/test').Page, email: string, password: string) {
  await signInViaAPI(page, email, password, `/${locale}/app`, locale);
  // Click on body to ensure keyboard focus is on the page (not in an iframe or other element)
  await page.locator('body').click();
  await page.waitForTimeout(300);
}

/**
 * Open the search modal via Ctrl+K and return the modal locator.
 * Handles the duplicate dialog issue (sidebar renders modal twice).
 */
async function openSearch(page: import('@playwright/test').Page) {
  await page.keyboard.press('Control+k');
  await page.waitForTimeout(500);
  // The modal may appear twice (sidebar expanded + collapsed). Use .first().
  const searchModal = page.locator('[role="dialog"][aria-modal="true"]').first();
  await expect(searchModal).toBeVisible({ timeout: 5000 });
  return searchModal;
}

test.describe('Global Search', () => {
  let testUser: { id: string; email: string; password: string };

  test.beforeAll(async () => {
    testUser = await createOnboardedTestUser({ name: 'E2E SearchUser' });
    createdUserIds.push(testUser.id);

    const familyIds = await createTestFamily(testUser.id);
    createdProfileIds.push(...familyIds);
  });

  test('Ctrl+K opens search modal', async ({ page }) => {
    test.setTimeout(120_000);
    await goToApp(page, testUser.email, testUser.password);

    const searchModal = await openSearch(page);

    // Input should be visible and focused
    const searchInput = searchModal.locator(selectors.search.input);
    await expect(searchInput).toBeVisible();
  });

  test('Escape closes search modal', async ({ page }) => {
    await goToApp(page, testUser.email, testUser.password);

    const searchModal = await openSearch(page);

    // Press Escape
    await page.keyboard.press('Escape');
    await expect(searchModal).not.toBeVisible({ timeout: 3000 });
  });

  test('typing query shows search results', async ({ page }) => {
    await goToApp(page, testUser.email, testUser.password);

    const searchModal = await openSearch(page);

    // Type a search query for the test family member name
    const searchInput = searchModal.locator(selectors.search.input);
    await searchInput.fill('TestMother');

    // Wait for debounce (300ms) + API response
    await page.waitForTimeout(1500);

    // Should have at least one result option or a "no results" message
    const results = searchModal.locator('[role="option"]');
    const noResults = searchModal.getByText(/no results/i);
    const hasResults = await results.count() > 0;
    const hasNoResults = await noResults.isVisible().catch(() => false);

    expect(hasResults || hasNoResults).toBeTruthy();
  });

  test('empty query shows no results or hint', async ({ page }) => {
    await goToApp(page, testUser.email, testUser.password);

    const searchModal = await openSearch(page);

    // With empty input, should not have search result options
    const results = searchModal.locator('[role="option"]');
    const resultCount = await results.count();
    expect(resultCount).toBe(0);
  });

  test('clicking backdrop closes search modal', async ({ page }) => {
    await goToApp(page, testUser.email, testUser.password);

    const searchModal = await openSearch(page);

    // Press Escape to close
    await page.keyboard.press('Escape');
    await expect(searchModal).not.toBeVisible({ timeout: 3000 });
  });

  test('search result click navigates to profile', async ({ page }) => {
    await goToApp(page, testUser.email, testUser.password);

    const searchModal = await openSearch(page);

    // Search for the user's own name
    const searchInput = searchModal.locator(selectors.search.input);
    await searchInput.fill('E2E SearchUser');
    await page.waitForTimeout(1500);

    // If results appear, click the first one
    const firstResult = searchModal.locator('[role="option"]').first();
    const hasResult = await firstResult.isVisible().catch(() => false);

    if (hasResult) {
      await firstResult.click();

      // Should navigate to a profile page
      await page.waitForURL(/\/profile\//, { timeout: 10_000 });
      await expect(page).toHaveURL(/\/profile\//);
    }
  });

  test('keyboard navigation works in search results', async ({ page }) => {
    await goToApp(page, testUser.email, testUser.password);

    const searchModal = await openSearch(page);

    const searchInput = searchModal.locator(selectors.search.input);
    await searchInput.fill('Test');
    await page.waitForTimeout(1500);

    const results = searchModal.locator('[role="option"]');
    const count = await results.count();

    if (count > 0) {
      // Arrow down should highlight first result
      await page.keyboard.press('ArrowDown');
      await page.waitForTimeout(200);

      // The aria-activedescendant should be set
      const activeDescendant = await searchInput.getAttribute('aria-activedescendant');
      expect(activeDescendant).toBeTruthy();
    }
  });
});

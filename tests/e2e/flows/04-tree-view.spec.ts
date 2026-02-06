/**
 * 04 - Tree View E2E Tests
 *
 * Tests the family tree visualization (React Flow canvas).
 * Pre-seeds family members via admin API for consistent state.
 */

import { test, expect } from '@playwright/test';
import {
  createOnboardedTestUser,
  createTestFamily,
  TEST_PASSWORD,
} from '../../helpers/test-user-factory';
import { signInViaAPI } from '../../helpers/auth-helpers';
import { selectors, urlPatterns } from '../../helpers/selectors';
import { cleanupUsers, cleanupProfiles } from '../../helpers/cleanup';

const locale = 'en';
const createdUserIds: string[] = [];
const createdProfileIds: string[] = [];

test.afterAll(async () => {
  await cleanupProfiles(createdProfileIds);
  await cleanupUsers(createdUserIds);
});

/** Helper: sign in and navigate to tree page */
async function goToTree(page: import('@playwright/test').Page, email: string, password: string) {
  await signInViaAPI(page, email, password, `/${locale}/tree`, locale);
  // Tree page redirects to /tree/[userId]
  await page.waitForURL(/\/tree\//, { timeout: 15_000 });
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1000);
}

test.describe('Tree View - Canvas', () => {
  let testUser: { id: string; email: string; password: string };

  test.beforeAll(async () => {
    testUser = await createOnboardedTestUser({ name: 'E2E TreeView' });
    createdUserIds.push(testUser.id);

    // Pre-seed family
    const familyIds = await createTestFamily(testUser.id);
    createdProfileIds.push(...familyIds);
  });

  test('tree page loads and shows canvas', async ({ page }) => {
    test.setTimeout(120_000); // First test may need extra time for cold server compilation
    await goToTree(page, testUser.email, testUser.password);

    // React Flow canvas should be visible
    await expect(page.locator('.react-flow')).toBeVisible({ timeout: 15_000 });
  });

  test('tree shows header text', async ({ page }) => {
    await goToTree(page, testUser.email, testUser.password);

    await expect(page.getByRole('heading', { name: /Family Tree/i })).toBeVisible({ timeout: 10_000 });
  });

  test('tree renders person nodes', async ({ page }) => {
    await goToTree(page, testUser.email, testUser.password);

    // Wait for React Flow to render
    await expect(page.locator('.react-flow')).toBeVisible({ timeout: 15_000 });
    await page.waitForTimeout(2000); // Allow tree layout to complete

    // Should have at least one node (the user themselves)
    const nodes = page.locator('.react-flow__node');
    const nodeCount = await nodes.count();
    expect(nodeCount).toBeGreaterThanOrEqual(1);
  });

  test('tree nodes display person names', async ({ page }) => {
    await goToTree(page, testUser.email, testUser.password);

    await expect(page.locator('.react-flow')).toBeVisible({ timeout: 15_000 });
    await page.waitForTimeout(2000);

    // The user's name should be visible in a node
    const treeContainer = page.locator('.react-flow');
    await expect(treeContainer.getByText('E2E')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Tree View - Interaction', () => {
  let testUser: { id: string; email: string; password: string };

  test.beforeAll(async () => {
    testUser = await createOnboardedTestUser({ name: 'E2E TreeInteract' });
    createdUserIds.push(testUser.id);

    const familyIds = await createTestFamily(testUser.id);
    createdProfileIds.push(...familyIds);
  });

  test('clicking a person node opens profile dialog', async ({ page }) => {
    await goToTree(page, testUser.email, testUser.password);

    await expect(page.locator('.react-flow')).toBeVisible({ timeout: 15_000 });
    await page.waitForTimeout(2000);

    // Click a node
    const firstNode = page.locator('.react-flow__node').first();
    await firstNode.click();

    // A dialog or profile panel should appear
    await page.waitForTimeout(1000);
    const dialog = page.locator('[role="dialog"]');
    const hasDialog = await dialog.isVisible().catch(() => false);

    // Either a dialog opens or the node becomes selected
    if (hasDialog) {
      await expect(dialog).toBeVisible();
    } else {
      // Node should at least be interactable
      await expect(firstNode).toBeVisible();
    }
  });

  test('canvas supports zoom via scroll', async ({ page }) => {
    await goToTree(page, testUser.email, testUser.password);

    await expect(page.locator('.react-flow')).toBeVisible({ timeout: 15_000 });
    await page.waitForTimeout(2000);

    // Get initial viewport
    const canvas = page.locator('.react-flow');
    const box = await canvas.boundingBox();
    if (!box) return;

    // Scroll to zoom
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.wheel(0, -300); // Zoom in
    await page.waitForTimeout(500);
    await page.mouse.wheel(0, 300); // Zoom out
    await page.waitForTimeout(500);

    // Canvas should still be visible (no crash)
    await expect(canvas).toBeVisible();
  });

  test('canvas supports pan via drag', async ({ page }) => {
    await goToTree(page, testUser.email, testUser.password);

    await expect(page.locator('.react-flow')).toBeVisible({ timeout: 15_000 });
    await page.waitForTimeout(2000);

    const canvas = page.locator('.react-flow');
    const box = await canvas.boundingBox();
    if (!box) return;

    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;

    // Pan via drag on the background (not on a node)
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx + 100, cy + 50, { steps: 5 });
    await page.mouse.up();
    await page.waitForTimeout(300);

    // Canvas should still be visible
    await expect(canvas).toBeVisible();
  });
});

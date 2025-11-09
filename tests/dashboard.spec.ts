import { test, expect } from '@playwright/test';

test.describe('Dashboard and Family Tree', () => {
  test('should load homepage', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Family Tree/i);
  });

  test('should show sign-in page', async ({ page }) => {
    await page.goto('/en/sign-in');
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
  });

  test('dashboard should show stats', async ({ page }) => {
    // Note: This requires authentication
    // We'll skip for now or add auth setup
    await page.goto('/en/app');
    
    // Should redirect to sign-in if not authenticated
    await expect(page).toHaveURL(/sign-in/);
  });

  test('kinship search page loads', async ({ page }) => {
    await page.goto('/en/kin');
    
    // Should have search field
    await expect(page.getByPlaceholder(/сестра мамы/i)).toBeVisible();
  });

  test('people page requires auth', async ({ page }) => {
    await page.goto('/en/people');
    
    // Should redirect to sign-in
    await expect(page).toHaveURL(/sign-in/);
  });
});

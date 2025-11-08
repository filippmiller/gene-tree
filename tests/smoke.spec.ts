import { test, expect } from '@playwright/test';

// Minimal smoke test: opens home page and checks response
// Optional: tries to toggle language if a control with text 'EN'/'RU' exists

test('home loads and shows some content', async ({ page }) => {
  const resp = await page.goto('/');
  expect(resp, 'HTTP response should be OK').not.toBeNull();
  expect(resp!.ok(), 'Response should be ok()').toBeTruthy();

  // Page should have some visible text
  await expect(page.locator('body')).toBeVisible();
});

test('language switcher (best-effort)', async ({ page }) => {
  await page.goto('/');
  const ru = page.getByRole('button', { name: /ru/i }).first();
  const en = page.getByRole('button', { name: /en/i }).first();
  if (await ru.isVisible().catch(() => false)) {
    await ru.click();
  } else if (await en.isVisible().catch(() => false)) {
    await en.click();
  } else {
    test.skip(true, 'No visible language switcher');
  }
});

import { test, expect } from '@playwright/test';

test.describe('Avatar Upload Simple', () => {
  
  test('Upload avatar through UI', async ({ page }) => {
    // Сначала логинимся программно через API
    console.log('[TEST] Logging in via API...');
    
    const loginRes = await page.request.post('http://localhost:3000/en/sign-in', {
      form: {
        email: 'filippmiller@gmail.com',
        password: 'Airbus380+',
      },
    });
    
    console.log('[TEST] Login response:', loginRes.status());
    
    // Теперь просто открываем профиль
    await page.goto('http://localhost:3000/en/app/profile');
    await page.waitForLoadState('networkidle');
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/avatar-simple-1.png', fullPage: true });
    console.log('[TEST] On profile page');

    // Find and click avatar section button
    const avatarButton = page.locator('button:has-text("Фотография профиля")');
    await avatarButton.waitFor({ state: 'visible', timeout: 5000 });
    await avatarButton.click({ force: true });
    await page.waitForTimeout(1000);
    
    await page.screenshot({ path: 'test-results/avatar-simple-2-expanded.png', fullPage: true });
    console.log('[TEST] Avatar section expanded');

    // Find file input
    const fileInput = page.locator('input[type="file"]');
    await fileInput.waitFor({ state: 'attached', timeout: 5000 });
    console.log('[TEST] ✓ File input found');

    // Create test image
    const testImage = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );

    // Upload
    console.log('[TEST] Uploading...');
    await fileInput.setInputFiles({
      name: 'test-avatar.png',
      mimeType: 'image/png',
      buffer: testImage,
    });

    // Wait for upload
    await page.waitForTimeout(5000);
    
    await page.screenshot({ path: 'test-results/avatar-simple-3-uploaded.png', fullPage: true });

    // Check for success/error messages
    const pageText = await page.textContent('body');
    console.log('[TEST] Page contains "обновлен"?', pageText?.includes('обновлен'));
    console.log('[TEST] Page contains "Ошибка"?', pageText?.includes('Ошибка'));
  });
});

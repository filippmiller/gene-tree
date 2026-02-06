import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testIgnore: ['**/unit/**', '**/setup.ts'],
  fullyParallel: false,
  retries: 1,
  workers: 1,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
    headless: process.env.PLAYWRIGHT_HEADLESS === '1',
  },
  webServer: {
    command: 'npm run dev',
    url: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120_000,
  },
  reporter: [['html'], ['list']],
});

import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testIgnore: ['**/unit/**', '**/setup.ts', '**/global-setup.ts'],
  globalSetup: './tests/global-setup.ts',
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
  projects: [
    {
      name: 'flows',
      testMatch: 'tests/e2e/flows/*.spec.ts',
      timeout: 60_000,
    },
    {
      name: 'e2e',
      testMatch: 'tests/e2e/*.spec.ts',
    },
    {
      name: 'legacy',
      testMatch: 'tests/*.spec.ts',
    },
  ],
});

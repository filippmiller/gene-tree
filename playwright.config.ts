import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  retries: 1,
  workers: 1,
  use: {
    baseURL: process.env.BASE_URL || 'https://gene-tree-production.up.railway.app',
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
    headless: true,
  },
  reporter: [['html'], ['list']],
});

import { defineConfig } from '@playwright/test';

export default defineConfig({
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3020',
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    headless: false,
  },
  reporter: [['html']],
});

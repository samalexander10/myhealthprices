import { defineConfig } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5000';

export default defineConfig({
  timeout: 30000,
  use: {
    baseURL,
    headless: true,
    viewport: { width: 1280, height: 800 },
    ignoreHTTPSErrors: true,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  reporter: [['list'], ['html', { outputFolder: 'playwright-report' }]]
});

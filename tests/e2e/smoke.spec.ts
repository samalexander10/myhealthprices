import { test, expect } from '@playwright/test';

test('home page loads and shows title', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/MyHealthPrices|React App|My Health Prices/i);
  const root = page.locator('#root');
  await expect(root).toBeVisible();
});

test('health endpoint responds OK', async ({ request }) => {
  const res = await request.get('/api/health');
  expect(res.ok()).toBeTruthy();
  const json = await res.json();
  expect(json.status).toMatch(/OK/i);
});

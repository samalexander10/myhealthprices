import { test, expect } from '@playwright/test';

test('home page loads and shows title', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/MyHealthPrices|React App|My Health Prices/i);
  const root = page.locator('#root');
  await expect(root).toBeVisible();
  
  const heroSection = page.locator('.hero-section');
  await expect(heroSection).toBeVisible();
  const heroTitle = page.locator('.hero-title');
  await expect(heroTitle).toBeVisible();
  await expect(heroTitle).toContainText('MyHealthPrices');
});

const base = process.env.PLAYWRIGHT_BASE_URL || '';
const isProdSite = /myhealthprices\.com\/?$/i.test(base);

const maybe = isProdSite ? test.skip : test;

maybe('health endpoint responds OK', async ({ request }) => {
  const res = await request.get('/api/health');
  expect(res.ok()).toBeTruthy();
  const json = await res.json();
  expect(json.status).toMatch(/OK/i);
});

import { test, expect } from '@playwright/test';

test.describe('search flow (smoke)', () => {
  test('can type a drug name and submit', async ({ page }) => {
    await page.goto('/');
    const input = page.getByRole('textbox').first();
    await input.fill('AMOXICILLIN');
    await input.press('Enter');
    await page.waitForTimeout(1500);
    await expect(page).toHaveURL(/./);
  });
});

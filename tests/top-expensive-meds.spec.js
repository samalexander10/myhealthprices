import { test, expect } from '@playwright/test';

test.describe('Top 3 Highest-Priced Medications', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should display the top medications section', async ({ page }) => {
    const section = page.locator('[data-testid="top-expensive-meds"]');
    await expect(section).toBeVisible();
    
    const title = section.locator('h2');
    await expect(title).toHaveText('Top 3 Highest-Priced Medications');
  });

  test('should display exactly 3 medication cards', async ({ page }) => {
    const cards = page.locator('[data-testid^="med-card-"]');
    await expect(cards).toHaveCount(3);
  });

  test('should display required information for each medication', async ({ page }) => {
    const firstCard = page.locator('[data-testid="med-card-0"]');
    
    await expect(firstCard.locator('[data-testid="med-name"]')).toBeVisible();
    await expect(firstCard.locator('[data-testid="med-price"]')).toBeVisible();
    await expect(firstCard.locator('[data-testid="med-location"]')).toBeVisible();
    
    const price = await firstCard.locator('[data-testid="med-price"]').textContent();
    expect(price).toMatch(/^\$\d+\.\d{2}$/);
  });

  test('should sort medications by price in descending order', async ({ page }) => {
    const prices = await page.locator('[data-testid="med-price"]').allTextContents();
    
    const numericPrices = prices.map(price => 
      parseFloat(price.replace('$', ''))
    );
    
    expect(numericPrices[0]).toBeGreaterThanOrEqual(numericPrices[1]);
    expect(numericPrices[1]).toBeGreaterThanOrEqual(numericPrices[2]);
  });

  test('should display rank badges correctly', async ({ page }) => {
    for (let i = 0; i < 3; i++) {
      const card = page.locator(`[data-testid="med-card-${i}"]`);
      const rankBadge = card.locator('.rank-badge');
      await expect(rankBadge).toHaveText(`#${i + 1}`);
    }
  });

  test('should handle loading state', async ({ page }) => {
    await page.route('/api/medications/top-expensive*', async route => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.continue();
    });
    
    await page.reload();
    
    await expect(page.locator('.loading')).toBeVisible();
    await expect(page.locator('.loading')).toHaveText('Loading top medications...');
    
    await expect(page.locator('.loading')).not.toBeVisible();
    await expect(page.locator('[data-testid="top-expensive-meds"]')).toBeVisible();
  });

  test('should handle error state', async ({ page }) => {
    await page.route('/api/medications/top-expensive*', route => 
      route.abort('failed')
    );
    
    await page.reload();
    
    await expect(page.locator('.error')).toBeVisible();
    await expect(page.locator('.error')).toContainText('Error:');
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    
    const section = page.locator('[data-testid="top-expensive-meds"]');
    await expect(section).toBeVisible();
    
    const cards = page.locator('[data-testid^="med-card-"]');
    const firstCardBox = await cards.nth(0).boundingBox();
    const secondCardBox = await cards.nth(1).boundingBox();
    
    expect(secondCardBox.y).toBeGreaterThan(firstCardBox.y + firstCardBox.height - 10);
  });

  test('should have proper accessibility attributes', async ({ page }) => {
    const section = page.locator('[data-testid="top-expensive-meds"]');
    
    await expect(section.locator('h2')).toBeVisible();
    
    await page.keyboard.press('Tab');
  });
});

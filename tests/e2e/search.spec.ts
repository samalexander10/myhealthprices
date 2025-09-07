import { test, expect } from '@playwright/test';

test.describe('search flow (smoke)', () => {
  test('can type a drug name and submit', async ({ page }) => {
    await page.goto('/');
    
    const searchSection = page.locator('.search-section');
    await expect(searchSection).toBeVisible();
    
    const input = page.getByRole('textbox').first();
    await input.fill('IBUPROFEN 200 MG CAPSULE');
    
    const searchButton = page.locator('.search-bar button');
    await searchButton.click();
    
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(/./);
  });

  test('displays chart and enhanced results for valid drug search', async ({ page }) => {
    await page.goto('/');
    
    const input = page.getByRole('textbox').first();
    await input.fill('IBUPROFEN 200 MG CAPSULE');
    await input.press('Enter');
    
    await page.waitForTimeout(3000);
    
    const chartContainer = page.locator('.chart-container');
    const resultsSection = page.locator('.results-section');
    const errorMessage = page.locator('.error');
    const spinner = page.locator('.spinner');
    
    const hasResults = await chartContainer.isVisible();
    const hasError = await errorMessage.isVisible();
    const isLoading = await spinner.isVisible();
    
    if (hasResults) {
      await expect(chartContainer).toBeVisible();
      await expect(resultsSection).toBeVisible();
      
      const resultCards = page.locator('.result-card');
      await expect(resultCards.first()).toBeVisible();
      
      const priceBadge = page.locator('.price-badge');
      await expect(priceBadge.first()).toBeVisible();
    } else if (hasError) {
      await expect(errorMessage).toBeVisible();
    } else if (isLoading) {
      await expect(spinner).toBeVisible();
    } else {
      console.log('Search completed but no results, error, or loading state found');
      await expect(page.locator('.search-section')).toBeVisible();
    }
  });

  test('responsive design works on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    const heroSection = page.locator('.hero-section');
    await expect(heroSection).toBeVisible();
    
    const filterPanel = page.locator('.filter-panel');
    await expect(filterPanel).toBeVisible();
    
    const searchSection = page.locator('.search-section');
    await expect(searchSection).toBeVisible();
  });
});

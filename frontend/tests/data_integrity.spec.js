import { test, expect } from '@playwright/test';

test('Data Integrity: NDC with leading zeros and Manufacturer display', async ({ page }) => {
    // Given the application is running
    await page.goto('http://localhost:5173');

    // Test Search with NDC containing leading zeros
    const searchInput = page.getByPlaceholder(/Enter drug name/);
    await searchInput.fill('00002150680'); // MOUNJARO

    // Then I should see the correct suggestion with manufacturer
    const suggestionList = page.locator('.suggestions-list');
    await expect(suggestionList).toBeVisible({ timeout: 30000 });

    const suggestion = suggestionList.locator('li', { hasText: 'MOUNJARO' }).first();
    await expect(suggestion).toBeVisible();
    await expect(suggestion.locator('.suggestion-manufacturer')).toContainText('Eli Lilly and Company');

    // When I click on the suggestion
    await suggestion.click();

    // Then the dashboard title should show the drug and manufacturer
    const dashboardTitle = page.locator('.search-section h2');
    await expect(dashboardTitle).toContainText('MOUNJARO');
    await expect(dashboardTitle).toContainText('Eli Lilly and Company');
});

test('Data Integrity: Featured medications show manufacturers and prices', async ({ page }) => {
    await page.goto('http://localhost:5173');

    // Check Most Expensive section
    const expensiveSection = page.locator('.top-expensive-meds-container');
    await expect(expensiveSection).toBeVisible({ timeout: 30000 });

    const firstExpensiveCard = expensiveSection.locator('.med-card').first();
    await expect(firstExpensiveCard.locator('.med-name')).not.toBeEmpty();

    // Check that manufacturer is present and not just "Unknown" if it's high profile
    const manufacturer = await firstExpensiveCard.locator('.med-manufacturer').innerText();
    expect(manufacturer.length).toBeGreaterThan(0);
    expect(manufacturer).not.toBe('Unknown');

    // Verify price format
    const price = await firstExpensiveCard.locator('.med-price').innerText();
    expect(price).toMatch(/\$\d+\.\d{2}/);

    // Verify NDC is present and correct length
    const ndcInfo = await firstExpensiveCard.locator('.ndc-info').innerText();
    expect(ndcInfo).toContain('NDC:');
    const ndcMatch = ndcInfo.match(/\d{11}/);
    expect(ndcMatch).not.toBeNull();
});

test('Data Integrity: Search by generic name returns results', async ({ page }) => {
    await page.goto('http://localhost:5173');

    const searchInput = page.getByPlaceholder(/Enter drug name/);
    await searchInput.fill('ATORVASTAT');

    const suggestionList = page.locator('.suggestions-list');
    await expect(suggestionList).toBeVisible({ timeout: 30000 });

    const suggestion = suggestionList.locator('li').first();
    await expect(suggestion).toContainText('ATORVASTAT');
});

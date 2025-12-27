import { test, expect } from '@playwright/test';

test('User searches for a drug and views prices', async ({ page }) => {
    // Given the application is running
    await page.goto('http://localhost:5173');

    // When I visit the homepage
    await expect(page).toHaveTitle(/MyHealthPrices/);

    // And I enter "ATORVASTAT" into the search bar
    const searchInput = page.getByPlaceholder('Enter drug name');
    await searchInput.fill('ATORVASTAT');

    // Then I should see a list of drug suggestions
    const suggestionList = page.locator('.suggestions-list');
    await expect(suggestionList).toBeVisible({ timeout: 10000 });
    const firstSuggestion = suggestionList.locator('li').first();
    await expect(firstSuggestion).toBeVisible();

    // When I click on the first suggestion
    await firstSuggestion.click();

    // Then I should see the "Nationwide Summary" card
    await expect(page.getByText('Nationwide Summary')).toBeVisible();

    // When I select "Alabama"
    await page.getByText('Alabama').click();

    // And I should see the "Selected State Prices" section
    await expect(page.getByText('Selected State Prices')).toBeVisible();
});

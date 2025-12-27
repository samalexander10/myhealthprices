import { test, expect } from '@playwright/test';

test('User searches for a drug by NDC', async ({ page }) => {
    // Given the application is running
    await page.goto('http://localhost:5173');

    // And I enter "00002150680" (MOUNJARO) into the search bar
    const searchInput = page.getByPlaceholder(/Enter drug name/);
    await searchInput.fill('00002150680');

    // Then I should see "MOUNJARO" in the suggestions
    const suggestionList = page.locator('.suggestions-list');
    await expect(suggestionList).toBeVisible({ timeout: 10000 });

    const drugSuggestion = suggestionList.locator('li', { hasText: 'MOUNJARO' });
    await expect(drugSuggestion).toBeVisible();

    // When I click on the suggestion
    await drugSuggestion.click();

    // Then I should see the Nationwide Summary and the correct name
    await expect(page.getByText('Nationwide Summary')).toBeVisible();
    await expect(page.locator('.search-section h2')).toContainText('MOUNJARO');
});

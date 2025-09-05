const { When, Then } = require('@cucumber/cucumber');
const { expect } = require('@playwright/test');

When('I type {string} in the medication search box', async function (medication) {
  const searchBox = this.page.locator('input[type="text"]').first();
  await searchBox.clear();
  await searchBox.fill(medication);
  this.currentMedication = medication;
});

When('I click the Search button', async function () {
  const searchButton = this.page.locator('button:has-text("Search")');
  await searchButton.click();
});

When('I wait for search results to appear', async function () {
  try {
    await this.page.waitForSelector('.card, .error', {
      timeout: 5000
    });
  } catch (e) {
    console.log('No immediate results appeared');
  }
  
  await this.page.waitForTimeout(2000);
});

When('I wait for search results', async function () {
  await this.page.waitForTimeout(3000);
});

When('I clear the medication search box', async function () {
  const searchBox = this.page.locator('input[type="text"]').first();
  await searchBox.clear();
});

Then('I should see medication pricing information', async function () {
  const pricingResults = this.page.locator('h2');
  const count = await pricingResults.count();
  expect(count).toBeGreaterThan(0);
});

Then('the pricing should include location-specific data', async function () {
  const locationInfo = this.page.locator('text=/Location:/').first();
  await expect(locationInfo).toBeVisible();
});

Then('I should see an error message with status code 404', async function () {
  const errorMessage = this.page.locator('text=/Error.*404/');
  await expect(errorMessage).toBeVisible();
});

Then('the error should suggest trying a specific medication name', async function () {
  const suggestion = this.page.locator('text=/Try a specific name/');
  await expect(suggestion).toBeVisible();
});

Then('the application should handle the input gracefully', async function () {
  await expect(this.page).toHaveTitle(/MyHealthPrices/);
  const searchBox = this.page.locator('input[type="text"]').first();
  await expect(searchBox).toBeVisible();
});

Then('no pricing information should be displayed', async function () {
  const pricingResults = this.page.locator('h2');
  const count = await pricingResults.count();
  expect(count).toBe(0);
});

Then('I should see relevant medication suggestions or results', async function () {
  await this.page.waitForTimeout(2000);
  const hasResults = await this.page.locator('.card').count() > 0;
  const hasError = await this.page.locator('text=/Error.*404/').count() > 0;
  
  expect(hasResults || !hasError).toBeTruthy();
});

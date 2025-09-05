const { Given, When, Then } = require('@cucumber/cucumber');
const { expect } = require('@playwright/test');

Given('I have entered {string} in the search box', async function (medication) {
  const searchBox = this.page.locator('input[type="text"]').first();
  await searchBox.clear();
  await searchBox.fill(medication);
  this.currentMedication = medication;
});

Given('I have selected {string} location', async function (locationName) {
  const locationButton = this.page.locator(`li:has-text("${locationName}")`).first();
  await expect(locationButton).toBeVisible();
  await locationButton.click();
  this.selectedLocation = locationName;
});

Given('I have clicked the Search button', async function () {
  const searchButton = this.page.locator('button:has-text("Search")');
  await searchButton.click();
});

Given('pricing information is displayed', async function () {
  await this.page.waitForSelector('h2', { timeout: 10000 });
  const pricingResults = this.page.locator('h2');
  const count = await pricingResults.count();
  expect(count).toBeGreaterThan(0);
});

When('I wait for pricing information to load', async function () {
  try {
    await this.page.waitForSelector('h2', { timeout: 10000 });
  } catch (e) {
    console.log('No pricing information loaded');
  }
  await this.page.waitForTimeout(2000);
});

When('I do not select any location', async function () {
});

When('I do not enter any medication', async function () {
});

When('I change the location to {string}', async function (newLocation) {
  if (this.selectedLocation) {
    const currentButton = this.page.locator(`li:has-text("${this.selectedLocation}")`).first();
    await currentButton.click();
  }
  
  const newLocationButton = this.page.locator(`li:has-text("${newLocation}")`).first();
  await newLocationButton.click();
  this.selectedLocation = newLocation;
  
  await this.page.waitForTimeout(2000);
});

When('I select multiple locations: {string}, {string}, {string}', async function (loc1, loc2, loc3) {
  const locations = [loc1, loc2, loc3];
  for (const location of locations) {
    const locationButton = this.page.locator(`li:has-text("${location}")`).first();
    await expect(locationButton).toBeVisible();
    await locationButton.click();
    await this.page.waitForTimeout(500);
  }
  this.selectedLocations = locations;
});

Then('the pricing information should update', async function () {
  await this.page.waitForTimeout(3000);
  const pricingResults = this.page.locator('h2');
  const count = await pricingResults.count();
  expect(count).toBeGreaterThan(0);
});

Then('should reflect nationwide pricing', async function () {
  const nationwideText = this.page.locator('text=/Location: Nationwide/');
  await expect(nationwideText).toBeVisible();
});

Then('I should see pricing information for each selected location', async function () {
  await this.page.waitForTimeout(3000);
  const pricingResults = this.page.locator('h2');
  const count = await pricingResults.count();
  
  expect(count).toBeGreaterThanOrEqual(this.selectedLocations.length);
});

Then('I should be able to compare prices across locations', async function () {
  const locationTexts = this.page.locator('text=/Location:/');
  const locationCount = await locationTexts.count();
  expect(locationCount).toBeGreaterThan(1);
});

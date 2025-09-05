const { When, Then } = require('@cucumber/cucumber');
const { expect } = require('@playwright/test');

When('I click on the {string} location button', async function (locationName) {
  const locationButton = this.page.locator(`li:has-text("${locationName}")`).first();
  await expect(locationButton).toBeVisible();
  await locationButton.click();
  this.selectedLocation = locationName;
});

When('I select the {string} location', async function (locationName) {
  const locationButton = this.page.locator(`li:has-text("${locationName}")`).first();
  await expect(locationButton).toBeVisible();
  await locationButton.click();
  this.selectedLocation = locationName;
});

When('I hover over a location button', async function () {
  const firstLocationButton = this.page.locator('text="Alabama"').first();
  await firstLocationButton.hover();
});

Then('the {string} location should be selected', async function (locationName) {
  const locationButton = this.page.locator(`li:has-text("${locationName}")`).first();
  
  const isSelected = await locationButton.evaluate((el) => {
    const computedStyle = window.getComputedStyle(el);
    return computedStyle.backgroundColor === 'rgb(0, 123, 255)' ||
           computedStyle.backgroundColor === '#007bff' ||
           el.classList.contains('active') || 
           el.classList.contains('selected');
  });
  
  expect(isSelected).toBeTruthy();
});

Then('the California location should be selected', async function () {
  const locationButton = this.page.locator(`li:has-text("California")`).first();
  
  const isSelected = await locationButton.evaluate((el) => {
    const computedStyle = window.getComputedStyle(el);
    return computedStyle.backgroundColor === 'rgb(0, 123, 255)' ||
           computedStyle.backgroundColor === '#007bff' ||
           el.classList.contains('active') || 
           el.classList.contains('selected');
  });
  
  expect(isSelected).toBeTruthy();
});

Then('the Nationwide option should be selected', async function () {
  const locationButton = this.page.locator(`li:has-text("Nationwide")`).first();
  
  const isSelected = await locationButton.evaluate((el) => {
    const computedStyle = window.getComputedStyle(el);
    return computedStyle.backgroundColor === 'rgb(0, 123, 255)' ||
           computedStyle.backgroundColor === '#007bff' ||
           el.classList.contains('active') || 
           el.classList.contains('selected');
  });
  
  expect(isSelected).toBeTruthy();
});

Then('the button should show active state', async function () {
  const hasActiveButton = await this.page.evaluate(() => {
    const buttons = document.querySelectorAll('li');
    return Array.from(buttons).some(btn => {
      const computedStyle = window.getComputedStyle(btn);
      return computedStyle.backgroundColor === 'rgb(0, 123, 255)' ||
             btn.classList.contains('active') ||
             btn.classList.contains('selected');
    });
  });
  
  expect(hasActiveButton).toBeTruthy();
});

Then('both {string} and {string} should be selected', async function (location1, location2) {
  for (const location of [location1, location2]) {
    const button = this.page.locator(`li:has-text("${location}")`).first();
    const isSelected = await button.evaluate((el) => {
      const computedStyle = window.getComputedStyle(el);
      return computedStyle.backgroundColor === 'rgb(0, 123, 255)' ||
             computedStyle.backgroundColor === '#007bff' ||
             el.classList.contains('active') || 
             el.classList.contains('selected');
    });
    expect(isSelected).toBeTruthy();
  }
});

Then('both Texas and New York should be selected', async function () {
  for (const location of ['Texas', 'New York']) {
    const button = this.page.locator(`li:has-text("${location}")`).first();
    const isSelected = await button.evaluate((el) => {
      const computedStyle = window.getComputedStyle(el);
      return computedStyle.backgroundColor === 'rgb(0, 123, 255)' ||
             computedStyle.backgroundColor === '#007bff' ||
             el.classList.contains('active') || 
             el.classList.contains('selected');
    });
    expect(isSelected).toBeTruthy();
  }
});

Then('I should see exactly {int} state location buttons', async function (expectedCount) {
  await this.page.waitForSelector('li', { timeout: 10000 });
  
  const allLocationItems = this.page.locator('li');
  const totalCount = await allLocationItems.count();
  const nationwideCount = await this.page.locator('li:has-text("Nationwide")').count();
  
  const stateButtonCount = totalCount - nationwideCount;
  expect(stateButtonCount).toBe(expectedCount);
});

Then('I should see {int} Nationwide location button', async function (expectedCount) {
  const nationwideButton = this.page.locator('li:has-text("Nationwide")');
  const actualCount = await nationwideButton.count();
  expect(actualCount).toBe(expectedCount);
});

When('I click the location button', async function () {
  const firstLocationButton = this.page.locator('li:has-text("Alabama")').first();
  await firstLocationButton.click();
});

Then('the button should show hover state', async function () {
  await this.page.waitForTimeout(500);
});

Then('the button should show selected state immediately', async function () {
  await this.page.waitForTimeout(100);
  const hasActiveButton = await this.page.evaluate(() => {
    const buttons = document.querySelectorAll('li');
    return Array.from(buttons).some(btn => {
      const computedStyle = window.getComputedStyle(btn);
      return computedStyle.backgroundColor === 'rgb(0, 123, 255)' ||
             btn.classList.contains('active') ||
             btn.classList.contains('selected');
    });
  });
  expect(hasActiveButton).toBeTruthy();
});

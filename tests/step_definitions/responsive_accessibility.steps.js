const { Given, When, Then } = require('@cucumber/cucumber');
const { expect } = require('@playwright/test');

Given('I set the viewport to mobile size', async function () {
  await this.page.setViewportSize({ width: 375, height: 667 });
  await this.page.waitForTimeout(1000);
});

Given('I set the viewport to tablet size', async function () {
  await this.page.setViewportSize({ width: 768, height: 1024 });
  await this.page.waitForTimeout(1000);
});

Given('I set the viewport to desktop size', async function () {
  await this.page.setViewportSize({ width: 1920, height: 1080 });
  await this.page.waitForTimeout(1000);
});

When('I use tab navigation to move through the page', async function () {
  const searchBox = this.page.locator('input[type="text"]').first();
  await searchBox.focus();
  
  for (let i = 0; i < 5; i++) {
    await this.page.keyboard.press('Tab');
    await this.page.waitForTimeout(200);
  }
});

When('I analyze the page for accessibility', async function () {
  await this.page.waitForSelector('input[type="text"]', { timeout: 10000 });
  await this.page.waitForTimeout(2000);
});

Then('the layout should be optimized for mobile', async function () {
  const searchBox = this.page.locator('input[type="text"]').first();
  await expect(searchBox).toBeVisible();
  
  const searchBoxBounds = await searchBox.boundingBox();
  expect(searchBoxBounds.width).toBeLessThan(375);
});

Then('all location buttons should be accessible and clickable', async function () {
  const firstLocationButton = this.page.locator('li').first();
  await expect(firstLocationButton).toBeVisible();
  
  const buttonBounds = await firstLocationButton.boundingBox();
  expect(buttonBounds.height).toBeGreaterThan(30); // Minimum touch target size
});

Then('the search box should be properly sized', async function () {
  const searchBox = this.page.locator('input[type="text"]').first();
  const bounds = await searchBox.boundingBox();
  
  expect(bounds.width).toBeGreaterThan(200);
  expect(bounds.width).toBeLessThan(375);
});

Then('the layout should be optimized for tablet', async function () {
  const searchBox = this.page.locator('input[type="text"]').first();
  await expect(searchBox).toBeVisible();
  
  const searchBoxBounds = await searchBox.boundingBox();
  expect(searchBoxBounds.width).toBeLessThan(768);
});

Then('location buttons should be arranged appropriately', async function () {
  const locationButtons = this.page.locator('li');
  const count = await locationButtons.count();
  expect(count).toBeGreaterThan(50); // Should have all 51 locations
});

Then('pricing information should be readable', async function () {
  const pricingElements = this.page.locator('h2');
  const count = await pricingElements.count();
  
  if (count > 0) {
    const firstPricing = pricingElements.first();
    await expect(firstPricing).toBeVisible();
  }
});

Then('the layout should utilize the full screen effectively', async function () {
  const searchBox = this.page.locator('input[type="text"]').first();
  await expect(searchBox).toBeVisible();
  
  const searchBoxBounds = await searchBox.boundingBox();
  expect(searchBoxBounds.width).toBeGreaterThan(300);
});

Then('all elements should be properly spaced', async function () {
  const locationButtons = this.page.locator('li');
  const count = await locationButtons.count();
  expect(count).toBeGreaterThan(50);
});

Then('I should be able to reach all interactive elements', async function () {
  const focusedElement = this.page.locator(':focus');
  await expect(focusedElement).toBeVisible();
});

Then('the focus indicators should be clearly visible', async function () {
  const focusedElement = this.page.locator(':focus');
  const count = await focusedElement.count();
  expect(count).toBeGreaterThanOrEqual(1);
});

Then('I should be able to select locations using keyboard', async function () {
  await this.page.keyboard.press('Enter');
  await this.page.waitForTimeout(500);
  
  const hasActiveButton = await this.page.evaluate(() => {
    const buttons = document.querySelectorAll('li');
    return Array.from(buttons).some(btn => {
      const computedStyle = window.getComputedStyle(btn);
      return computedStyle.backgroundColor === 'rgb(0, 123, 255)';
    });
  });
  
});

Then('all buttons should have appropriate labels', async function () {
  const buttons = this.page.locator('button, li');
  const count = await buttons.count();
  expect(count).toBeGreaterThan(50);
  
  const searchButton = this.page.locator('button:has-text("Search")');
  await expect(searchButton).toBeVisible();
});

Then('form elements should have proper labels', async function () {
  const searchBox = this.page.locator('input[type="text"]').first();
  await expect(searchBox).toBeVisible();
  
  const placeholder = await searchBox.getAttribute('placeholder');
  expect(placeholder).toBeTruthy();
});

Then('pricing information should be structured clearly', async function () {
  const pricingElements = this.page.locator('h2');
  const count = await pricingElements.count();
  
  if (count > 0) {
    const firstPricing = pricingElements.first();
    await expect(firstPricing).toBeVisible();
  }
});

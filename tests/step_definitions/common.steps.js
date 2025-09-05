const { Given, When, Then, setDefaultTimeout } = require('@cucumber/cucumber');
const { expect } = require('@playwright/test');

setDefaultTimeout(30000);

Given('I navigate to the MyHealthPrices website', async function () {
  await this.page.goto('/', { 
    waitUntil: 'networkidle',
    timeout: 30000 
  });
});

Given('I am on the medication search page', async function () {
  await expect(this.page).toHaveURL(/.*myhealthprices.com.*/);
  await this.page.waitForSelector('input[type="text"]', {
    timeout: 10000
  });
});

Given('I set the viewport to mobile size \\({int}x{int})', async function (width, height) {
  await this.page.setViewportSize({ width, height });
});

Given('I set the viewport to tablet size \\({int}x{int})', async function (width, height) {
  await this.page.setViewportSize({ width, height });
});

Given('I set the viewport to desktop size \\({int}x{int})', async function (width, height) {
  await this.page.setViewportSize({ width, height });
});

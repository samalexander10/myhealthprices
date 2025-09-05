const { setWorldConstructor, Before, After } = require('@cucumber/cucumber');
const { chromium } = require('@playwright/test');

class CustomWorld {
  constructor() {
    this.browser = null;
    this.context = null;
    this.page = null;
  }
}

setWorldConstructor(CustomWorld);

Before(async function () {
  const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'https://www.myhealthprices.com';
  this.browser = await chromium.launch({ headless: true });
  this.context = await this.browser.newContext({
    baseURL,
    viewport: { width: 1280, height: 800 },
    ignoreHTTPSErrors: true
  });
  this.page = await this.context.newPage();
});

After(async function () {
  if (this.page) await this.page.close();
  if (this.context) await this.context.close();
  if (this.browser) await this.browser.close();
});

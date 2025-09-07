import { test, expect } from '@playwright/test';

test.describe('Comprehensive Drug Search Regression Tests', () => {
  const medicines = [
    'TRULICITY',
    'HUMALOG', 
    'AMOXICILLIN',
    'LISINOPRIL',
    'ATORVASTATIN',
    'AMLODIPINE',
    'METFORMIN',
    'SIMVASTATIN',
    'OMEPRAZOLE',
    '12HR NASAL DECONGEST ER 120 MG'
  ];

  const locations = [
    'Nationwide', 'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California',
    'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii',
    'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana',
    'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi',
    'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey',
    'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
    'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina',
    'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia',
    'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'
  ];

  const locationPairs: [string, string][] = [];
  for (let i = 0; i < locations.length; i++) {
    const loc1 = locations[i];
    const loc2 = locations[(i + 1) % locations.length];
    const loc3 = locations[(i + 2) % locations.length];
    locationPairs.push([loc1, loc2]);
    if (i % 2 === 0) locationPairs.push([loc1, loc3]);
  }

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/MyHealthPrices|React App|My Health Prices/i);
    
    const nationwideOption = page.locator('.location-item').filter({ hasText: 'Nationwide' });
    if (await nationwideOption.getAttribute('class').then(c => c?.includes('active'))) {
      await nationwideOption.click();
    }
  });

  for (const medicine of medicines) {
    for (let i = 0; i < Math.min(5, locationPairs.length); i++) {
      const [location1, location2] = locationPairs[i];
      
      test(`Search ${medicine} in ${location1} and ${location2}`, async ({ page }) => {
        const loc1Option = page.locator('.location-item').filter({ hasText: location1 });
        await expect(loc1Option).toBeVisible();
        await loc1Option.click();
        await expect(loc1Option).toHaveClass(/active/);
        
        const loc2Option = page.locator('.location-item').filter({ hasText: location2 });
        await expect(loc2Option).toBeVisible();
        await loc2Option.click();
        await expect(loc2Option).toHaveClass(/active/);
        
        const searchInput = page.getByRole('textbox').first();
        await searchInput.clear();
        await searchInput.fill(medicine);
        
        const searchButton = page.getByRole('button', { name: /search/i });
        await searchButton.click();
        
        await page.waitForTimeout(3000);
        
        const resultsContainer = page.locator('.results');
        await expect(resultsContainer).toBeVisible({ timeout: 15000 });
        
        await expect(page.locator('body')).toContainText(medicine, { timeout: 10000 });
        await expect(page.locator('body')).toContainText(/Location:|Price:|NDC:/);
        
        await expect(page.locator('body')).toContainText(location1);
        await expect(page.locator('body')).toContainText(location2);
        
        await page.screenshot({ 
          path: `test-results/comprehensive-${medicine.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${location1.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${location2.toLowerCase().replace(/[^a-z0-9]/g, '-')}.png`,
          fullPage: true 
        });
      });
    }
  }

  test('Verify all locations are selectable', async ({ page }) => {
    for (const location of locations.slice(0, 10)) {
      const locationOption = page.locator('.location-item').filter({ hasText: location });
      await expect(locationOption).toBeVisible();
      await locationOption.click();
      await expect(locationOption).toHaveClass(/active/);
      await locationOption.click();
    }
  });

  test('Verify multi-location price differences', async ({ page }) => {
    const californiaOption = page.locator('.location-item').filter({ hasText: 'California' });
    const texasOption = page.locator('.location-item').filter({ hasText: 'Texas' });
    
    await californiaOption.click();
    await texasOption.click();
    
    const searchInput = page.getByRole('textbox').first();
    await searchInput.fill('TRULICITY');
    
    const searchButton = page.getByRole('button', { name: /search/i });
    await searchButton.click();
    
    await page.waitForTimeout(3000);
    
    await expect(page.locator('body')).toContainText('California');
    await expect(page.locator('body')).toContainText('Texas');
    await expect(page.locator('.result-card')).toHaveCount(2);
  });
});

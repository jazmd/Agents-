import { test, expect } from '@playwright/test';

test.describe('Landing', () => {
  test('renders the EN hero', async ({ page }) => {
    await page.goto('/en');
    await expect(page).toHaveTitle(/Tickra/);
    await expect(page.getByRole('heading', { name: /Start at candle 1/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Take the placement test/i }).first()).toBeVisible();
  });

  test('exposes JSON-LD structured data', async ({ page }) => {
    const res = await page.request.get('/en');
    const html = await res.text();
    expect(html).toContain('application/ld+json');
    expect(html).toContain('"EducationalOrganization"');
    expect(html).toContain('"FAQPage"');
  });

  test('serves a stable OG image meta', async ({ page }) => {
    const res = await page.request.get('/en');
    const html = await res.text();
    expect(html).toMatch(/opengraph-image/);
  });
});

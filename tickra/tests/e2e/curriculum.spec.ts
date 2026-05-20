import { test, expect } from '@playwright/test';

test.describe('Curriculum', () => {
  test('lists all five tracks', async ({ page }) => {
    await page.goto('/en/curriculum', { waitUntil: 'domcontentloaded' });
    for (const track of ['Foundations', 'Structure', 'Patterns', 'Risk', 'Execution']) {
      await expect(page.getByRole('heading', { level: 2, name: track })).toBeVisible({
        timeout: 10_000,
      });
    }
  });

  test('opens a free lesson without auth', async ({ page }) => {
    await page.goto('/en/lesson/what-a-candle-says');
    await expect(page.getByRole('heading', { name: /What a candle says/ })).toBeVisible();
  });

  test('paywalled lesson shows the paywall when anonymous', async ({ page }) => {
    await page.goto('/en/lesson/japanese-candles');
    await expect(page.getByRole('heading', { name: /Continue with the full lesson/ })).toBeVisible();
    expect(await page.locator('iframe').count()).toBe(0);
  });

  test('unknown slug 404s', async ({ page }) => {
    const res = await page.goto('/en/lesson/does-not-exist');
    expect(res?.status()).toBe(404);
  });
});

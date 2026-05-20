import { test, expect } from '@playwright/test';

test.describe('Auth gates', () => {
  test('dashboard redirects anonymous to /signin with next', async ({ page }) => {
    const res = await page.goto('/en/dashboard');
    expect(res?.url()).toMatch(/\/en\/signin\?next=%2Fen%2Fdashboard/);
  });

  test('settings redirects anonymous to /signin', async ({ page }) => {
    const res = await page.goto('/en/settings');
    expect(res?.url()).toMatch(/\/en\/signin/);
  });

  test('sign-in page renders the form and OAuth buttons', async ({ page }) => {
    await page.goto('/en/signin');
    await expect(page.getByRole('heading', { name: /Welcome back/ })).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: /Continue with Google/i })).toBeVisible();
  });

  test('protected POST endpoints reject GET with 405', async ({ request }) => {
    for (const path of ['/api/signout', '/api/checkout', '/api/billing/portal', '/api/stripe/webhook']) {
      const r = await request.get(path);
      expect(r.status()).toBe(405);
    }
  });
});

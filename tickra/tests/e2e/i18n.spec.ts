import { test, expect } from '@playwright/test';

test.describe('Locale switching', () => {
  test('root redirects to /en by default', async ({ page }) => {
    const res = await page.goto('/');
    expect(res?.url()).toMatch(/\/en$/);
  });

  test('root respects Accept-Language fr', async ({ request }) => {
    const res = await request.get('/', {
      headers: { 'Accept-Language': 'fr-FR,fr;q=0.9' },
      maxRedirects: 0,
    });
    expect([301, 302, 307]).toContain(res.status());
    expect(res.headers()['location']).toContain('/fr');
  });

  test('persists locale cookie via API', async ({ request }) => {
    const res = await request.post('/api/locale', { data: { locale: 'fr' } });
    expect(res.ok()).toBeTruthy();
    const setCookie = res.headers()['set-cookie'];
    expect(setCookie).toContain('tickra-locale=fr');
  });

  test('FR landing renders the FR title', async ({ page }) => {
    await page.goto('/fr');
    await expect(page.getByRole('heading', { name: /Commencez à la bougie/ })).toBeVisible();
  });
});

import { test, expect } from '@playwright/test';

test.describe('Onboarding quiz', () => {
  test('answers six questions and reaches the level card', async ({ page }) => {
    await page.goto('/en/onboarding', { waitUntil: 'domcontentloaded' });

    for (let q = 0; q < 6; q++) {
      // Quiz choices live inside <li> elements; scoping there avoids the
      // navbar locale switcher buttons that also expose aria-pressed.
      const choice = page.locator('li button[aria-pressed]').first();
      await choice.click();

      const cta = page.getByRole('button', { name: /^(Next|See my level)$/i });
      await expect(cta).toBeEnabled({ timeout: 5000 });
      await cta.click();
    }

    await expect(
      page.getByRole('heading', { name: /(Apprentice|Operator|Strategist)\./ }),
    ).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('link', { name: /Open my dashboard/i })).toBeVisible();
  });
});

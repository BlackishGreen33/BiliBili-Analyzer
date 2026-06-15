import { expect, test } from '@playwright/test';

test('compare page loads', async ({ page }) => {
  await page.goto('/dashboard/compare');
  await expect(
    page.getByRole('heading', { name: /Day-over-day|Cross-day|跨日/ })
  ).toBeVisible({ timeout: 20_000 });
});

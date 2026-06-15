import { expect, test } from '@playwright/test';

test('home page loads and shows search results', async ({ page }) => {
  await page.goto('/');
  // Hero heading
  await expect(
    page.getByRole('heading', {
      name: /热门|熱門|Trending|Popular/,
    })
  ).toBeVisible({ timeout: 20_000 });
  // At least one video card image
  await expect(page.locator('img').first()).toBeVisible({ timeout: 15_000 });
});

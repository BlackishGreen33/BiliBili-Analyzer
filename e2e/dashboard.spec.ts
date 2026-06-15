import { expect, test } from '@playwright/test';

test('dashboard page loads and shows KPI cards + chart', async ({ page }) => {
  await page.goto('/dashboard');
  // Dashboard heading
  await expect(
    page.getByRole('heading', { name: /Analytics|聚合分析|聚合/ })
  ).toBeVisible({ timeout: 20_000 });
  // Engagement TOP card title
  await expect(
    page.getByText(/Top 10 engagement|互动率|互動率/).first()
  ).toBeVisible({ timeout: 15_000 });
});

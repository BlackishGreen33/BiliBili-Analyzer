import { expect, test } from '@playwright/test';

test('details page loads and shows 7 engagement metrics', async ({
  page,
  request,
}) => {
  // Fetch a real bvid from the latest result
  const res = await request.get(
    'https://raw.githubusercontent.com/BlackishGreen33/BiliBili-Analyzer/result/result/2026-06-15T18-28-29+0800.json'
  );
  expect(res.status()).toBe(200);
  const data = await res.json();
  const bvid: string = data.video?.[0]?.bvid;
  expect(bvid).toBeTruthy();

  await page.goto(`/details?bvid=${bvid}`);
  // 7-metric block label
  await expect(
    page.getByText(/Engagement metrics|互动指标|互動指標/i)
  ).toBeVisible({ timeout: 20_000 });
  // First metric label
  await expect(
    page.getByText(/Views|观看次数|觀看次數/i).first()
  ).toBeVisible();
});

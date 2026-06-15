import { expect, test } from '@playwright/test';

type Route = {
  name: string;
  method: 'GET' | 'POST';
  path: string;
  body?: unknown;
  isText?: boolean;
};

const ROUTES: Route[] = [
  { name: 'randomBvid', method: 'GET', path: '/api/randomBvid', isText: true },
  {
    name: 'videoInfo',
    method: 'POST',
    path: '/api/videoInfo',
    body: { bvid: 'BV1wEEg62EDP' },
  },
  {
    name: 'videoTags',
    method: 'POST',
    path: '/api/videoTags',
    // BV1nAJK6PEwh is the first bvid in the latest production crawl
    body: { bvid: 'BV1nAJK6PEwh' },
  },
  { name: 'dashboard', method: 'GET', path: '/api/dashboard' },
  {
    name: 'dashboard-trend',
    method: 'GET',
    path: '/api/dashboard/trend?window=7',
  },
  {
    name: 'up-overlap',
    method: 'GET',
    path: '/api/up/overlap?window=7',
  },
  { name: 'latency', method: 'GET', path: '/api/latency?window=7' },
  { name: 'wordcloud', method: 'GET', path: '/api/wordcloud' },
  {
    name: 'length-recommend',
    method: 'GET',
    path: '/api/length/recommend?type=channel&value=游戏&window=7',
  },
];

for (const route of ROUTES) {
  test(`API ${route.name} returns 200`, async ({ request }) => {
    const res =
      route.method === 'GET'
        ? await request.get(route.path)
        : await request.post(route.path, { data: route.body });
    expect(res.status(), `${route.path} status`).toBe(200);
    if (route.isText) {
      const text = await res.text();
      expect(text.length, `${route.path} body length`).toBeGreaterThan(0);
    } else {
      const data = await res.json();
      expect(data, `${route.path} body`).toBeTruthy();
    }
  });
}

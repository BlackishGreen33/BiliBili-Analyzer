const axios = require('axios');
const fs = require('fs');
const path = require('path');

const POPULAR_API = 'https://api.bilibili.com/x/web-interface/popular';
const TAGS_API = (bvid) =>
  `https://api.bilibili.com/x/tag/archive/tags?bvid=${bvid}`;
const UP_FOLLOWERS_API = (mid) =>
  `https://api.bilibili.com/x/relation/stat?vmid=${mid}`;
const UP_INFO_API = (mid) =>
  `https://api.bilibili.com/x/space/wbi/acc/info?mid=${mid}`;

const PER_PAGE = 20;
const MAX_PAGES = 50;
const MAX_RETRIES = 3;
const TAG_CONCURRENCY = 8;
const UP_CONCURRENCY = 6;
const BACKOFF_MS = [1000, 2500, 5000];

const headers = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Referer: 'https://www.bilibili.com/',
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const fetchWithRetry = async (url) => {
  let retries = 0;
  let lastErr;
  while (retries < MAX_RETRIES) {
    try {
      const { data } = await axios.get(url, { headers, timeout: 10000 });
      if (data && data.code === -101) {
        throw new Error('NOT_LOGGED_IN');
      }
      return data;
    } catch (error) {
      lastErr = error;
      const delay = BACKOFF_MS[Math.min(retries, BACKOFF_MS.length - 1)];
      console.warn(
        `请求失败 (${retries + 1}/${MAX_RETRIES})，${delay}ms 后重试：${error.message}`
      );
      await sleep(delay);
      retries++;
    }
  }
  throw lastErr;
};

const fetchPopularPage = async (pn) => {
  const data = await fetchWithRetry(`${POPULAR_API}?ps=${PER_PAGE}&pn=${pn}`);
  if (data.code !== 0) {
    throw new Error(`Popular API error: ${data.message}`);
  }
  return data.data?.list || [];
};

const fetchOrdinaryTags = async (bvid) => {
  try {
    const data = await fetchWithRetry(TAGS_API(bvid));
    if (data.code !== 0) return [];
    return (data.data || []).map((t) => t.tag_name);
  } catch (error) {
    console.warn(`获取标签失败 ${bvid}:`, error.message);
    return [];
  }
};

const fetchUpFollowers = async (mid) => {
  try {
    const data = await fetchWithRetry(UP_FOLLOWERS_API(mid));
    if (data.code !== 0) return null;
    return data.data?.following ?? null; // 0 if normal user
  } catch (error) {
    console.warn(`获取 UP 粉丝数失败 ${mid}:`, error.message);
    return null;
  }
};

const fetchUpInfo = async (mid) => {
  try {
    const data = await fetchWithRetry(UP_INFO_API(mid));
    if (data.code !== 0) return null;
    return data.data || null;
  } catch (error) {
    console.warn(`获取 UP 信息失败 ${mid}:`, error.message);
    return null;
  }
};

const mapWithConcurrency = async (items, limit, fn) => {
  const results = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: limit }, async () => {
    while (true) {
      const i = next++;
      if (i >= items.length) return;
      results[i] = await fn(items[i], i);
    }
  });
  await Promise.all(workers);
  return results;
};

/** Extract the dominant orientation / dimension. */
const normalizeDimension = (dim) =>
  dim
    ? {
        width: dim.width ?? 0,
        height: dim.height ?? 0,
        rotate: dim.rotate ?? 0,
      }
    : undefined;

const processVideo = async (video) => {
  const bvid = video.bvid;
  const ordinaryTags = await fetchOrdinaryTags(bvid);

  const base = {
    bvid,
    url: `https://www.bilibili.com/video/${bvid}`,
    cover:
      (video.pic || '').replace(/^http:/, 'https:') +
      '@412w_232h_1c_!web-popular.avif',
    title: video.title,
    UP: video.owner?.name || '',
    mid: video.owner?.mid,
    views: video.stat?.view ?? 0,
    duration: video.duration ?? 0,
    pubdate: video.pubdate ?? 0,
    tags: {
      firstChannel: video.tname || '',
      secondChannel: video.tnamev2 || '',
      ordinaryTags,
    },
  };

  // Optional fields (do not break the schema if missing)
  const dimension = normalizeDimension(video.dimension);
  if (dimension) base.dimension = dimension;

  if (video.pages && Array.isArray(video.pages)) {
    base.pages = video.pages.length;
  }

  if (video.desc) {
    base.desc = video.desc;
  }

  if (video.tid) base.tid = video.tid;
  if (video.tid_v2) base.tid_v2 = video.tid_v2;
  if (video.tnamev2) base.tnamev2 = video.tnamev2;
  if (video.short_link_v2) base.shortLink = video.short_link_v2;

  if (video.honor_reply?.honor?.length) {
    base.honors = video.honor_reply.honor.map((h) => h.desc);
  }

  if (video.rights) {
    base.rights = {
      isCooperation: !!video.rights.is_cooperation,
      isSteinGate: !!video.rights.stein_gate,
      is360: !!video.rights.is_360,
    };
  }

  if (video.pub_location) base.pubLocation = video.pub_location;

  return base;
};

const enrichUpMeta = async (videos) => {
  const uniqueMids = Array.from(
    new Set(videos.map((v) => v.mid).filter((m) => typeof m === 'number'))
  );
  console.log(`共 ${uniqueMids.length} 个唯一 UP 主，开始补抓粉丝/认证`);

  const upMeta = {};
  await mapWithConcurrency(uniqueMids, UP_CONCURRENCY, async (mid) => {
    const [followers, info] = await Promise.all([
      fetchUpFollowers(mid),
      fetchUpInfo(mid),
    ]);
    upMeta[mid] = {
      mid,
      followers,
      sign: info?.sign || undefined,
      level: info?.level ?? undefined,
      official: info?.official?.type ?? undefined,
    };
  });

  for (const v of videos) {
    if (v.mid && upMeta[v.mid]) {
      v.upMeta = upMeta[v.mid];
    }
  }
};

const buildAggregations = (videos) => {
  const safe = (n) => (Number.isFinite(n) ? n : 0);

  // Channels
  const channelMap = new Map();
  for (const v of videos) {
    const first = v.tags.firstChannel || '未分类';
    const second = v.tags.secondChannel || '未分类';
    const c = channelMap.get(first) || {
      firstChannel: first,
      count: 0,
      views: 0,
      like: 0,
      coin: 0,
      favorite: 0,
      secondChannels: new Map(),
    };
    c.count++;
    c.views += safe(v.views);
    c.like += safe(v.statLike);
    c.coin += safe(v.statCoin);
    c.favorite += safe(v.statFavorite);
    const sub = c.secondChannels.get(second) || {
      secondChannel: second,
      count: 0,
      views: 0,
    };
    sub.count++;
    sub.views += safe(v.views);
    c.secondChannels.set(second, sub);
    channelMap.set(first, c);
  }
  const channelAgg = Array.from(channelMap.values()).map((c) => ({
    firstChannel: c.firstChannel,
    count: c.count,
    views: c.views,
    avgViews: c.count > 0 ? Math.round(c.views / c.count) : 0,
    like: c.like,
    coin: c.coin,
    favorite: c.favorite,
    secondChannels: Array.from(c.secondChannels.values()).sort(
      (a, b) => b.count - a.count
    ),
  }));

  // Top UP
  const upMap = new Map();
  for (const v of videos) {
    const key = v.UP || v.mid;
    if (!key) continue;
    const e = upMap.get(key) || {
      name: v.UP,
      mid: v.mid,
      count: 0,
      views: 0,
      followers: v.upMeta?.followers,
    };
    e.count++;
    e.views += safe(v.views);
    upMap.set(key, e);
  }
  const topUps = Array.from(upMap.values())
    .sort((a, b) => b.count - a.count || b.views - a.views)
    .slice(0, 50);

  // Duration histogram
  const durationBuckets = [
    { label: '<1 分钟', min: 0, max: 60, count: 0 },
    { label: '1-3 分钟', min: 60, max: 180, count: 0 },
    { label: '3-5 分钟', min: 180, max: 300, count: 0 },
    { label: '5-10 分钟', min: 300, max: 600, count: 0 },
    { label: '10-20 分钟', min: 600, max: 1200, count: 0 },
    { label: '20-30 分钟', min: 1200, max: 1800, count: 0 },
    { label: '>30 分钟', min: 1800, max: Infinity, count: 0 },
  ];
  for (const v of videos) {
    const d = v.duration || 0;
    const bucket = durationBuckets.find((b) => d >= b.min && d < b.max);
    if (bucket) bucket.count++;
  }

  // Publish hour distribution
  const hourHist = Array.from({ length: 24 }, (_, h) => ({
    hour: h,
    count: 0,
  }));
  for (const v of videos) {
    if (!v.pubdate) continue;
    const d = new Date(v.pubdate * 1000 + 8 * 60 * 60 * 1000); // UTC+8
    hourHist[d.getUTCHours()].count++;
  }

  // Engagement metrics
  const totalViews = videos.reduce((a, v) => a + safe(v.views), 0);
  const totalLike = videos.reduce((a, v) => a + safe(v.statLike), 0);
  const totalCoin = videos.reduce((a, v) => a + safe(v.statCoin), 0);
  const totalFavorite = videos.reduce((a, v) => a + safe(v.statFavorite), 0);
  const totalReply = videos.reduce((a, v) => a + safe(v.statReply), 0);
  const totalDanmaku = videos.reduce((a, v) => a + safe(v.statDanmaku), 0);
  const totalShare = videos.reduce((a, v) => a + safe(v.statShare), 0);

  // Top tags
  const tagCount = new Map();
  for (const v of videos) {
    for (const t of v.tags.ordinaryTags || []) {
      tagCount.set(t, (tagCount.get(t) || 0) + 1);
    }
  }
  const topTags = Array.from(tagCount.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 100);

  // Per-video engagement ranking
  // engagement = (like + 2·coin + 2·favorite + share) / view
  // 收藏與投幣加權 ×2（顯式 intent，權重應高於被動的 like）
  const topEngagement = videos
    .map((v) => {
      const views = safe(v.views);
      const eng =
        views > 0
          ? (safe(v.statLike) +
              safe(v.statCoin) * 2 +
              safe(v.statFavorite) * 2 +
              safe(v.statShare)) /
            views
          : 0;
      return {
        bvid: v.bvid,
        title: v.title,
        UP: v.UP,
        mid: v.mid,
        views,
        like: safe(v.statLike),
        coin: safe(v.statCoin),
        favorite: safe(v.statFavorite),
        share: safe(v.statShare),
        engagement: eng,
      };
    })
    .filter((v) => v.views > 0)
    .sort((a, b) => b.engagement - a.engagement || b.views - a.views)
    .slice(0, 10);

  return {
    summary: {
      totalVideos: videos.length,
      totalUp: upMap.size,
      totalViews,
      totalLike,
      totalCoin,
      totalFavorite,
      totalReply,
      totalDanmaku,
      totalShare,
      avgEngagement:
        totalViews > 0
          ? (totalLike + totalCoin * 2 + totalFavorite * 2 + totalShare) /
            totalViews
          : 0,
    },
    channels: channelAgg,
    topUps,
    duration: durationBuckets,
    hourHeatmap: hourHist,
    topTags,
    topEngagement,
  };
};

const crawlData = async () => {
  console.log('开始获取热门视频');

  const allVideos = [];
  for (let pn = 1; pn <= MAX_PAGES; pn++) {
    console.log(`正在获取第 ${pn} 页`);
    const videos = await fetchPopularPage(pn);
    if (videos.length === 0) break;
    allVideos.push(...videos);
    if (videos.length < PER_PAGE) break;
  }

  console.log(`共获取 ${allVideos.length} 个视频，正在获取标签`);

  const resultArray = await mapWithConcurrency(
    allVideos,
    TAG_CONCURRENCY,
    processVideo
  );

  // 注入原始 stat 字段（保持数值），供聚合使用
  for (let i = 0; i < resultArray.length; i++) {
    const v = resultArray[i];
    const src = allVideos[i];
    v.statLike = src.stat?.like || 0;
    v.statCoin = src.stat?.coin || 0;
    v.statFavorite = src.stat?.favorite || 0;
    v.statShare = src.stat?.share || 0;
    v.statReply = src.stat?.reply || 0;
    v.statDanmaku = src.stat?.danmaku || 0;
  }

  await enrichUpMeta(resultArray);

  console.log(`完成 ${resultArray.length} 支视频爬取，开始写入文件`);

  if (!fs.existsSync('result')) {
    fs.mkdirSync('result');
  }

  const now = Date.now();
  const currentDate = new Date(now + 8 * 60 * 60 * 1000);
  const resultObject = {
    time: now,
    video: resultArray,
  };

  const formattedDate = currentDate.toISOString().slice(0, -5) + '+0800';
  const fileName = `${formattedDate.replace(/:/g, '-')}.json`;
  const filePath = path.join('result', fileName);
  fs.writeFileSync(filePath, JSON.stringify(resultObject, null, 2));

  // 预聚合
  const aggregations = buildAggregations(resultArray);
  const agg = {
    time: now,
    file: fileName.replace('.json', ''),
    ...aggregations,
  };
  fs.writeFileSync(
    path.join('result', 'agg-latest.json'),
    JSON.stringify(agg, null, 2)
  );

  // 维护 list.json
  let list = [];
  const listFilePath = path.join('result', 'list.json');
  if (fs.existsSync(listFilePath)) {
    list = JSON.parse(fs.readFileSync(listFilePath, 'utf-8'));
  }
  list.unshift(fileName.replace('.json', ''));
  fs.writeFileSync(listFilePath, JSON.stringify(list, null, 2));

  console.log(`完成，已保存 ${resultArray.length} 个视频到 ${filePath}`);
};

crawlData().catch((err) => {
  console.error('爬虫出错：', err);
  process.exit(1);
});

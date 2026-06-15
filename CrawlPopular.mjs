import axios from 'axios';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildAggregations } from './src/common/aggregations/build.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

  const resultDir = path.join(__dirname, 'result');
  if (!fs.existsSync(resultDir)) {
    fs.mkdirSync(resultDir);
  }

  const now = Date.now();
  const currentDate = new Date(now + 8 * 60 * 60 * 1000);
  const resultObject = {
    time: now,
    video: resultArray,
  };

  const formattedDate = currentDate.toISOString().slice(0, -5) + '+0800';
  const fileName = `${formattedDate.replace(/:/g, '-')}.json`;
  const filePath = path.join(resultDir, fileName);
  fs.writeFileSync(filePath, JSON.stringify(resultObject, null, 2));

  // 预聚合 — 共享 src/common/aggregations/build.mjs
  const aggregations = buildAggregations(resultArray);
  const agg = {
    time: now,
    file: fileName.replace('.json', ''),
    ...aggregations,
  };
  fs.writeFileSync(
    path.join(resultDir, 'agg-latest.json'),
    JSON.stringify(agg, null, 2)
  );

  // 维护 list.json
  let list = [];
  const listFilePath = path.join(resultDir, 'list.json');
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

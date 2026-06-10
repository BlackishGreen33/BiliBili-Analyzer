const axios = require('axios');
const fs = require('fs');
const path = require('path');

const POPULAR_API = 'https://api.bilibili.com/x/web-interface/popular';
const TAGS_API = (bvid) =>
  `https://api.bilibili.com/x/tag/archive/tags?bvid=${bvid}`;

const PER_PAGE = 20;
const MAX_PAGES = 50;
const MAX_RETRIES = 3;

const headers = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Referer: 'https://www.bilibili.com/',
};

const fetchWithRetry = async (url) => {
  let retries = 0;
  while (retries < MAX_RETRIES) {
    try {
      const { data } = await axios.get(url, { headers });
      return data;
    } catch (error) {
      console.error('获取数据时出错：', error.message, '即将重试');
      retries++;
    }
  }
  throw new Error('达到最大重试次数。无法获取数据。');
};

const formatViews = (view) => {
  if (typeof view !== 'number' || !Number.isFinite(view)) return '';
  if (view >= 100000000) {
    const v = (view / 100000000).toFixed(1);
    return (v.endsWith('.0') ? v.slice(0, -2) : v) + '亿';
  }
  if (view >= 10000) {
    const v = (view / 10000).toFixed(1);
    return (v.endsWith('.0') ? v.slice(0, -2) : v) + '万';
  }
  return String(view);
};

const fetchPopularPage = async (pn) => {
  const data = await fetchWithRetry(
    `${POPULAR_API}?ps=${PER_PAGE}&pn=${pn}`
  );
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
    console.error(`获取标签失败 ${bvid}:`, error.message);
    return [];
  }
};

const processVideo = async (video) => {
  const bvid = video.bvid;
  const ordinaryTags = await fetchOrdinaryTags(bvid);

  return {
    url: `https://www.bilibili.com/video/${bvid}`,
    cover: video.pic.replace(/^http:/, 'https:') + '@412w_232h_1c_!web-popular.avif',
    title: video.title,
    UP: video.owner?.name || '',
    views: formatViews(video.stat?.view),
    tags: {
      firstChannel: video.tname || '',
      secondChannel: video.tnamev2 || '',
      ordinaryTags,
    },
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

  const resultArray = await Promise.all(allVideos.map(processVideo));

  const currentTime = Date.now();
  const currentDate = new Date(currentTime + 8 * 60 * 60 * 1000);
  const resultObject = {
    time: currentTime,
    video: resultArray,
  };

  if (!fs.existsSync('result')) {
    fs.mkdirSync('result');
  }

  const formattedDate = currentDate.toISOString().slice(0, -5) + '+0800';
  const fileName = `${formattedDate.replace(/:/g, '-')}.json`;
  const filePath = path.join('result', fileName);
  fs.writeFileSync(filePath, JSON.stringify(resultObject, null, 2));

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

// 引入所需的库和模块
const puppeteer = require('puppeteer');
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

// 目标网页的 URL 和用于选择视频元素的 CSS 选择器
const url = 'https://www.bilibili.com/v/popular/all/';
const selector =
  '#app > div.popular-container > div.popular-video-container.popular-list > div.flow-loader > ul.card-list > div.video-card';

const resultArray = []; // 存储处理后的数据的数组
const maxRetries = 3; // 最大重试次数

// 使用 axios 获取视频详情页面的 HTML
const fetchData = async (videoLink) => {
  let retries = 0;
  while (retries < maxRetries) {
    try {
      const response = await axios.get(videoLink);
      return response.data;
    } catch (error) {
      console.error('获取数据时出错：', error.message, '即将重试');
      retries++;
    }
  }
  throw new Error('达到最大重试次数。无法获取数据。');
};

// 处理视频详情页面的 HTML
const processVideoPage = (videoPageHTML) => {
  const $ = cheerio.load(videoPageHTML);

  // 使用 Cheerio 选择器提取所需信息
  return {
    firstChannel: $('#v_tag .tag-panel .firstchannel-tag').text().trim(),
    secondChannel: $('#v_tag .tag-panel .secondchannel-tag').text().trim(),
    ordinaryTags: $('#v_tag .tag-panel .ordinary-tag')
      .map((_, el) => $(el).text().trim())
      .get(),
  };
};

// 处理每个视频元素的数据
const processData = async (targetElement) => {
  const videoLink =
    'https:' +
    (await targetElement.$eval('.video-card__content a', (link) =>
      link.getAttribute('href')
    ));
  const imageUrl =
    'https:' +
    (await targetElement.$eval('.cover-picture__image', (image) =>
      image.getAttribute('data-src')
    ));
  const title = await targetElement.$eval('.video-name', (titleElement) =>
    titleElement.getAttribute('title')
  );
  const upName = await targetElement.$eval('.up-name__text', (upElement) =>
    upElement.getAttribute('title')
  );
  const videoViews = (
    await targetElement.$eval(
      '.play-text',
      (viewsElement) => viewsElement.textContent
    )
  ).trim();

  // 使用 axios 获取视频详情页面的 HTML
  const videoPageHTML = await fetchData(videoLink);

  const videoTags = processVideoPage(videoPageHTML);

  // 输出视频信息到控制台
  console.log('视频链接:', videoLink);
  console.log('视频封面:', imageUrl);
  console.log('标题:', title);
  console.log('UP主:', upName);
  console.log('播放量:', videoViews);
  console.log('一级分区:', videoTags.firstChannel);
  console.log('二级分区:', videoTags.secondChannel);
  console.log('普通标签:', videoTags.ordinaryTags);

  // 将处理后的数据存入数组
  resultArray.push({
    url: videoLink,
    cover: imageUrl,
    title: title,
    UP: upName,
    views: videoViews,
    tags: videoTags,
  });
};

// 爬取数据的主函数
const crawlData = async () => {
  // 启动无头浏览器
  const browser = await puppeteer.launch({ headless: 'new' });
  console.log('打开热门页面');
  // 创建一个新页面
  const page = await browser.newPage();
  console.log('页面加载中');
  // 访问哔哩哔哩热门视频页面
  await page.goto(url, { waitUntil: 'networkidle2' });

  let previousHeight;
  // 模拟滚动加载更多内容
  while (true) {
    const currentHeight = await page.evaluate('document.body.scrollHeight');
    if (previousHeight && currentHeight === previousHeight) {
      break;
    }
    await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
    await new Promise((r) => setTimeout(r, 1000)); // 等待加载，根据需要调整等待时间
    previousHeight = currentHeight;
  }

  // 等待页面加载完毕
  await page.waitForSelector(selector);
  console.log('正在获取数据');

  const targetElements = await page.$$(selector);

  // 使用 Promise.all 并行处理每个视频元素的数据
  await Promise.all(
    targetElements.map((targetElement) => processData(targetElement))
  );

  const currentTime = Date.now();
  const currentDate = new Date(currentTime + 8 * 60 * 60 * 1000); // 计算东八区的当前时间
  // 将结果写入 JSON 文件
  const resultObject = {
    time: currentTime,
    video: resultArray,
  };

  // 如果result目录不存在则创建result目录
  if (!fs.existsSync('result')) {
    fs.mkdirSync('result');
  }

  const formattedDate = currentDate.toISOString().slice(0, -5) + '+0800';
  const fileName = `${formattedDate.replace(/:/g, '-')}.json`;
  const filePath = path.join('result', fileName);
  fs.writeFileSync(filePath, JSON.stringify(resultObject, null, 2)); // 将结果对象写入 JSON 文件

  // 读取list.json文件内容
  let list = [];
  const listFilePath = path.join('result', 'list.json');
  if (fs.existsSync(listFilePath)) {
    list = JSON.parse(fs.readFileSync(listFilePath, 'utf-8'));
  }
  list.unshift(fileName.replace('.json', '')); // 将新文件名插入到数组的最前面
  fs.writeFileSync(listFilePath, JSON.stringify(list, null, 2)); // 更新list.json文件

  // 关闭浏览器
  await browser.close();
};

// 立即执行一次
crawlData().then(() => {
  // 每小时执行一次
  // setInterval(crawlData, 3600000);
});

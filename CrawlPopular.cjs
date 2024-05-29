const puppeteer = require('puppeteer');
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const url = 'https://www.bilibili.com/v/popular/all/';
const selector =
  '#app > div.popular-container > div.popular-video-container.popular-list > div.flow-loader > ul.card-list > div.video-card';

const resultArray = [];
const maxRetries = 3;

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

const processVideoPage = (videoPageHTML) => {
  const $ = cheerio.load(videoPageHTML);

  return {
    firstChannel: $('#v_tag .tag-panel .firstchannel-tag').text().trim(),
    secondChannel: $('#v_tag .tag-panel .secondchannel-tag').text().trim(),
    ordinaryTags: $('#v_tag .tag-panel .ordinary-tag')
      .map((_, el) => $(el).text().trim())
      .get(),
  };
};

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

  const videoPageHTML = await fetchData(videoLink);

  const videoTags = processVideoPage(videoPageHTML);

  console.log('视频链接:', videoLink);
  console.log('视频封面:', imageUrl);
  console.log('标题:', title);
  console.log('UP主:', upName);
  console.log('播放量:', videoViews);
  console.log('一级分区:', videoTags.firstChannel);
  console.log('二级分区:', videoTags.secondChannel);
  console.log('普通标签:', videoTags.ordinaryTags);

  resultArray.push({
    url: videoLink,
    cover: imageUrl,
    title: title,
    UP: upName,
    views: videoViews,
    tags: videoTags,
  });
};

const crawlData = async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  console.log('打开热门页面');
  const page = await browser.newPage();
  console.log('页面加载中');
  await page.goto(url, { waitUntil: 'networkidle2' });

  let previousHeight;
  while (true) {
    const currentHeight = await page.evaluate('document.body.scrollHeight');
    if (previousHeight && currentHeight === previousHeight) {
      break;
    }
    await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
    await new Promise((r) => setTimeout(r, 1000));
    previousHeight = currentHeight;
  }

  await page.waitForSelector(selector);
  console.log('正在获取数据');

  const targetElements = await page.$$(selector);

  await Promise.all(
    targetElements.map((targetElement) => processData(targetElement))
  );

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

  await browser.close();
};

crawlData().then(() => {
  // 每小时执行一次
  // setInterval(crawlData, 3600000);
});

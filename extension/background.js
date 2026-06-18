const ANALYZER_BASE_URL = 'https://bilibili-analyzer.vercel.app';

const getBvidFromUrl = (currentURL) => {
  const prefix = 'https://www.bilibili.com/video/';
  if (!currentURL || !currentURL.startsWith(prefix)) {
    return null;
  }
  const matchResult = currentURL.match(/video\/([a-zA-Z0-9]+)/);
  return matchResult ? matchResult[1] : null;
};

const openAnalysisPage = (bvid) => {
  const newUrl = `${ANALYZER_BASE_URL}/details?bvid=${bvid}`;
  chrome.tabs.create({ url: newUrl }, () => {
    const lastError = chrome.runtime.lastError;
    if (lastError) {
      console.error(`Failed to open analyzer page: ${lastError.message}`);
    }
  });
};

const isBilibiliVideoPage = (url) =>
  typeof url === 'string' && url.startsWith('https://www.bilibili.com/video/');

const handleContextMenuClick = (info, tab) => {
  if (info.menuItemId !== 'open-bilibili-analyzer') return;
  if (!isBilibiliVideoPage(tab?.url)) {
    alert('當前網址並非 Bilibili 視頻');
    return;
  }
  const bvid = getBvidFromUrl(tab.url);
  if (!bvid) {
    alert('無法獲取 BV 號');
    return;
  }
  openAnalysisPage(bvid);
};

chrome.contextMenus.create(
  {
    type: 'normal',
    title: 'BiliBili Analyzer：打開視頻詳細分析',
    id: 'open-bilibili-analyzer',
    contexts: ['all'],
  },
  () => {
    const lastError = chrome.runtime.lastError;
    if (lastError) {
      console.error(`Failed to create context menu: ${lastError.message}`);
    }
  }
);

chrome.contextMenus.onClicked.addListener(handleContextMenuClick);

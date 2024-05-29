const getSauce = (tab) => {
	const currentURL = tab.url;
	const prefix = "https://www.bilibili.com/video/";
	if (!currentURL.startsWith(prefix)) {
		alert("当前网址并非 Bilibili 视频");
		return;
	}
	const pattern = /video\/([a-zA-Z0-9]+)/;
	const matchResult = currentURL.match(pattern);
	if (!matchResult) {
		alert("无法获取BV号");
		return;
	}
	const bvid = matchResult[1];
	const newUrl = "https://bilibili-analyzer.vercel.app/details?bvid=" + bvid;
	chrome.tabs.create({ url: newUrl });
};

chrome.contextMenus.create({
	type: "normal",
	title: "BiliBili Search",
	id: "BiliBili Search",
	contexts: ["all"],
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
	if (info.menuItemId === "BiliBili Search") {
		getSauce(tab);
	}
});

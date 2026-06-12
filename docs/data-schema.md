# 資料字典 / Data Schema

> 雙語：[繁體中文](./data-schema.md) · [English](./data-schema.en.md)

## 儲存位置

- **格式**: JSON（UTF-8）
- **位置**: GitHub `BlackishGreen33/BiliBili-Analyzer` 的 `result` orphan 分支
- **URL**: `https://raw.githubusercontent.com/BlackishGreen33/BiliBili-Analyzer/result/result/{filename}.json`
- **清單**: `https://raw.githubusercontent.com/BlackishGreen33/BiliBili-Analyzer/result/result/list.json`
- **預聚合**: `https://raw.githubusercontent.com/BlackishGreen33/BiliBili-Analyzer/result/result/agg-latest.json`

## `list.json`

```ts
type ListFile = string[]; // 最新優先，例如 ["2026-06-10T16-30-52+0800", "2026-06-09T..."]
```

## 每日爬取檔（`{ISO-timestamp}.json`）

完整結構（**所有欄位均為 `CrawlResultSchema.parse` 通過後的正規化形態**）：

```ts
type CrawlResult = {
  /** 爬取時刻，Unix 毫秒（UTC+8） */
  time: number;
  video: VideoData[];
};

type VideoData = {
  /** B 站視頻唯一 ID（`BV...`） */
  bvid: string;
  /** 完整 URL */
  url: string;
  /** 封面圖（hdslb 412×232 webp） */
  cover: string;
  /** 視頻標題 */
  title: string;
  /** UP 主暱稱 */
  UP: string;
  /** UP 主 mid（可選） */
  mid?: number;
  /** 播放量（原始數字） */
  views: number;
  /** 視頻時長（秒） */
  duration?: number;
  /** 發布時間，Unix 秒 */
  pubdate?: number;
  tags: {
    /** 一級分區，例如 "動畫" */
    firstChannel: string;
    /** 二級分區，例如 "MAD·AMV" */
    secondChannel: string;
    /** 用戶標籤（從 `/x/tag/archive/tags` 取得） */
    ordinaryTags: string[];
  };
  // === 進階欄位 ===
  /** 視頻尺寸，僅當原 API 包含時 */
  dimension?: { width: number; height: number; rotate: number };
  /** 分 P 數量，僅當原 API 包含時 */
  pages?: number;
  /** 視頻簡介 */
  desc?: string;
  /** 類型 ID（`tid`） */
  tid?: number;
  /** v2 類型 ID */
  tid_v2?: number;
  /** 短鏈 */
  shortLink?: string;
  /** 榮譽（"全站日榜最高第 X 名" 等） */
  honors?: string[];
  /** 權限 */
  rights?: {
    isCooperation: boolean;
    isSteinGate: boolean;
    is360: boolean;
  };
  /** IP 屬地（部分視頻有） */
  pubLocation?: string;
  /** UP 主元資料（從第二輪請求補抓） */
  upMeta?: {
    mid: number;
    /** 粉絲數（null 表示 API 未返回） */
    followers: number | null;
    /** 簽名 */
    sign?: string;
    /** 等級 */
    level?: number;
    /** 認證類型（-1 = 無，0 = 個人，1/2 = 機構） */
    official?: number;
  };
};
```

> **重要**：`views`、`duration`、`pubdate` 皆為**數字**（舊版是格式化字串如
> "119.6 萬"）。前端透過 `formatViews`、`formatDuration` 工具函式處理。

## 預聚合檔（`agg-latest.json`）

由 `CrawlPopular.cjs` 在爬取完成後立即計算並寫入。前端 `/api/dashboard`
5 分鐘快取後回傳給前端。

```ts
type DashboardAgg = {
  /** 對應的爬取檔名（不含 .json） */
  file: string;
  /** 同 CrawlResult.time */
  time: number;
  summary: {
    totalVideos: number;
    totalUp: number;
    totalViews: number;
    totalLike: number;
    totalCoin: number;
    totalFavorite: number;
    totalReply: number;
    totalDanmaku: number;
  };
  channels: Array<{
    firstChannel: string;
    count: number;
    views: number;
    avgViews: number;
    like: number;
    coin: number;
    favorite: number;
    secondChannels: Array<{
      secondChannel: string;
      count: number;
      views: number;
    }>;
  }>;
  topUps: Array<{
    name: string;
    mid?: number;
    count: number;
    views: number;
    /** 粉絲數（從第二輪請求補抓） */
    followers?: number | null;
  }>;
  duration: Array<{
    label: string;
    min: number;
    max: number; // Infinity 表示無上限
    count: number;
  }>;
  hourHeatmap: Array<{
    hour: number; // 0-23，UTC+8
    count: number;
  }>;
  topTags: Array<{
    tag: string;
    count: number;
  }>;
  /** 互動率 TOP 10（v0.2 新增） */
  topEngagement: Array<{
    bvid: string;
    title: string;
    UP: string;
    mid?: number;
    views: number;
    like: number;
    coin: number;
    favorite: number;
    share: number;
    /** engagement = (like + 2·coin + 2·favorite + share) / view */
    engagement: number;
  }>;
};
```

## Zod Schema

所有 client 端資料獲取都通過 `CrawlResultSchema`（`src/common/types/schema.ts`）
驗證。如果 `CrawlPopular.cjs` 未來改了欄位，client 端會在 console 記錄
`ZodError`，但仍 render（fallback 至 raw JSON）以避免 100% 不可用。

## 變更歷史

- **v0.3**（2026-06-12）:
  - `summary.avgEngagement` — 加權平均互動率
  - `topEngagement[10]` — 影片級互動率排行
- **v0.2**（2026-06-11）:
  - `views` 從 `string` 改為 `number`
  - 新增 `bvid`、`mid`、`duration`、`pubdate`、`dimension`、`pages`、
    `desc`、`tid`、`tid_v2`、`tnamev2`、`shortLink`、`honors`、
    `rights`、`pubLocation`、`upMeta`、`statLike`/`statCoin`/
    `statFavorite`/`statShare`/`statReply`/`statDanmaku`
  - 新增 `agg-latest.json` 預聚合檔
- **v0.1**（2024）: 初始版本，僅有 `url/cover/title/UP/views/tags`

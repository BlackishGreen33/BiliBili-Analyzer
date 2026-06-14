# 资料字典 / Data Schema

> 双语：[简体中文](./data-schema.md) · [English](./data-schema.en.md)

## 储存位置

- **格式**: JSON（UTF-8）
- **位置**: GitHub `BlackishGreen33/BiliBili-Analyzer` 的 `result` orphan 分支
- **URL**: `https://raw.githubusercontent.com/BlackishGreen33/BiliBili-Analyzer/result/result/{filename}.json`
- **清单**: `https://raw.githubusercontent.com/BlackishGreen33/BiliBili-Analyzer/result/result/list.json`
- **预聚合**: `https://raw.githubusercontent.com/BlackishGreen33/BiliBili-Analyzer/result/result/agg-latest.json`

## `list.json`

```ts
type ListFile = string[]; // 最新优先，例如 ["2026-06-10T16-30-52+0800", "2026-06-09T..."]
```

## 每日爬取文件（`{ISO-timestamp}.json`）

完整结构（**所有字段均为 `CrawlResultSchema.parse` 通过后的正规化形态**）：

```ts
type CrawlResult = {
  /** 爬取时刻，Unix 毫秒（UTC+8） */
  time: number;
  video: VideoData[];
};

type VideoData = {
  /** B 站视频唯一 ID（`BV...`） */
  bvid: string;
  /** 完整 URL */
  url: string;
  /** 封面图（hdslb 412×232 webp） */
  cover: string;
  /** 视频标题 */
  title: string;
  /** UP 主昵称 */
  UP: string;
  /** UP 主 mid（可选） */
  mid?: number;
  /** 播放量（原始数字） */
  views: number;
  /** 视频时长（秒） */
  duration?: number;
  /** 发布时间，Unix 秒 */
  pubdate?: number;
  tags: {
    /** 一级分区，例如 "动画" */
    firstChannel: string;
    /** 二级分区，例如 "MAD·AMV" */
    secondChannel: string;
    /** 用户标签（从 `/x/tag/archive/tags` 取得） */
    ordinaryTags: string[];
  };
  // === 进阶字段 ===
  /** 视频尺寸，仅当原 API 包含时 */
  dimension?: { width: number; height: number; rotate: number };
  /** 分 P 数量，仅当原 API 包含时 */
  pages?: number;
  /** 视频简介 */
  desc?: string;
  /** 类型 ID（`tid`） */
  tid?: number;
  /** v2 类型 ID */
  tid_v2?: number;
  /** 短链 */
  shortLink?: string;
  /** 荣誉（"全站日榜最高第 X 名" 等） */
  honors?: string[];
  /** 权限 */
  rights?: {
    isCooperation: boolean;
    isSteinGate: boolean;
    is360: boolean;
  };
  /** IP 属地（部分视频有） */
  pubLocation?: string;
  /** UP 主元数据（从第二轮请求补抓） */
  upMeta?: {
    mid: number;
    /** 粉丝数（null 表示 API 未返回） */
    followers: number | null;
    /** 签名 */
    sign?: string;
    /** 等级 */
    level?: number;
    /** 认证类型（-1 = 无，0 = 个人，1/2 = 机构） */
    official?: number;
  };
};
```

> **重要**：`views`、`duration`、`pubdate` 皆为**数字**（旧版是格式化字符串如
> "119.6 万"）。前端通过 `formatViews`、`formatDuration` 工具函数处理。

## 预聚合文件（`agg-latest.json`）

由 `CrawlPopular.cjs` 在爬取完成后立即计算并写入。前端 `/api/dashboard`
5 分钟缓存后回传给前端。

```ts
type DashboardAgg = {
  /** 对应的爬取文件名（不含 .json） */
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
    /** 粉丝数（从第二轮请求补抓） */
    followers?: number | null;
  }>;
  duration: Array<{
    label: string;
    min: number;
    max: number; // Infinity 表示无上限
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
  /** 互动率 TOP 10（v0.2 新增） */
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

所有 client 端数据获取都通过 `CrawlResultSchema`（`src/common/types/schema.ts`）
验证。如果 `CrawlPopular.cjs` 未来改了字段，client 端会在 console 记录
`ZodError`，但仍 render（fallback 至 raw JSON）以避免 100% 不可用。

## 变更历史

- **v0.9**（2026-06-14）:
  - `formatDateTime` / `formatDate` 显式带 `timeZone: 'Asia/Shanghai'`,
    修 CI (ubuntu-latest UTC) 失败
  - 拆 6 个 route 内的纯函数到 `src/common/libs/routes/`,
    7 个 helper 各补 RTL 测试 (`bucketFor` 10 桶边界、
    `computeLatencyStats` 奇偶中位数、`buildTrendPoint` totalEngagement
    计算、`parseOverlapParams` 4 链 fallback、`matchVideo` 3 type、
    `computeDiff` 4 helper 拆解)
  - branches 覆盖率 87 → 90
- **v0.3**（2026-06-12）:
  - `summary.avgEngagement` — 加权平均互动率
  - `topEngagement[10]` — 视频级互动率排行
- **v0.2**（2026-06-11）:
  - `views` 从 `string` 改为 `number`
  - 新增 `bvid`、`mid`、`duration`、`pubdate`、`dimension`、`pages`、
    `desc`、`tid`、`tid_v2`、`tnamev2`、`shortLink`、`honors`、
    `rights`、`pubLocation`、`upMeta`、`statLike`/`statCoin`/
    `statFavorite`/`statShare`/`statReply`/`statDanmaku`
  - 新增 `agg-latest.json` 预聚合文件
- **v0.1**（2024）: 初始版本，仅有 `url/cover/title/UP/views/tags`

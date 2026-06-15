/**
 * TypeScript types for src/common/aggregations/build.mjs.
 *
 * Kept in sync with the JS implementation; consumed by result-data.server.ts
 * to preserve existing type contracts (DashboardAgg etc).
 */

export type VideoLikeForAgg = {
  bvid: string;
  title: string;
  UP: string;
  mid?: number;
  views: number;
  duration?: number;
  pubdate?: number;
  tags: {
    firstChannel: string;
    secondChannel: string;
    ordinaryTags: string[];
  };
  upMeta?: { followers?: number | null };
  statLike?: number;
  statCoin?: number;
  statFavorite?: number;
  statReply?: number;
  statDanmaku?: number;
  statShare?: number;
};

export type AggregationSummary = {
  totalVideos: number;
  totalUp: number;
  totalViews: number;
  totalLike: number;
  totalCoin: number;
  totalFavorite: number;
  totalReply: number;
  totalDanmaku: number;
  avgEngagement: number;
};

export type AggregationChannel = {
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
};

export type AggregationTopUp = {
  name: string;
  mid?: number;
  count: number;
  views: number;
  followers?: number | null;
};

export type AggregationDurationBucket = {
  label: string;
  min: number;
  max: number;
  count: number;
};

export type AggregationHourBucket = {
  hour: number;
  count: number;
};

export type AggregationTag = {
  tag: string;
  count: number;
};

export type AggregationEngagementItem = {
  bvid: string;
  title: string;
  UP: string;
  mid?: number;
  views: number;
  like: number;
  coin: number;
  favorite: number;
  share: number;
  engagement: number;
};

export type AggregationResult = {
  summary: AggregationSummary;
  channels: AggregationChannel[];
  topUps: AggregationTopUp[];
  duration: AggregationDurationBucket[];
  hourHeatmap: AggregationHourBucket[];
  topTags: AggregationTag[];
  topEngagement: AggregationEngagementItem[];
};

export function buildAggregations(videos: VideoLikeForAgg[]): AggregationResult;

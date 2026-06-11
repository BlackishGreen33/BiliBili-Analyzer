export type VideoTags = {
  firstChannel: string;
  secondChannel: string;
  ordinaryTags: string[];
};

export type VideoData = {
  bvid: string;
  url: string;
  cover: string;
  title: string;
  UP: string;
  /** UP 主 ID，便于跨日聚合 */
  mid?: number;
  views: number;
  /** 视频时长（秒） */
  duration?: number;
  /** 发布 unix 秒 */
  pubdate?: number;
  tags: VideoTags;
};

export type CrawlResult = {
  time: number;
  video: VideoData[];
};

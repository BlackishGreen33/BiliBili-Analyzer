export type VideoTags = {
  firstChannel: string;
  secondChannel: string;
  ordinaryTags: string[];
};

export type VideoData = {
  url: string;
  cover: string;
  title: string;
  UP: string;
  views: string;
  tags: VideoTags;
};

export type CrawlResult = {
  time: number;
  video: VideoData[];
};

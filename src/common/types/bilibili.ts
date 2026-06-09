export type BilibiliVideoStat = {
  aid: number;
  view: number;
  danmaku: number;
  reply: number;
  favorite: number;
  coin: number;
  share: number;
  like: number;
};

export type BilibiliVideoOwner = {
  mid: number;
  name: string;
  face: string;
};

export type BilibiliVideoInfo = {
  bvid: string;
  aid: number;
  cid: number;
  title: string;
  pic: string;
  duration: number;
  pubdate: number;
  owner: BilibiliVideoOwner;
  stat: BilibiliVideoStat;
};

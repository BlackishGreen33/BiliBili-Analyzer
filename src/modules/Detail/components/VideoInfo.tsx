'use client';

import axios from 'axios';
import React, { useEffect, useState } from 'react';

import type { BilibiliVideoInfo } from '@/common/types/bilibili';
import type { VideoTags } from '@/common/types/video';

import Earnings from './Analization';
import Base from './Base';
import StackedChart from './StackedChart';
import Video from './Video';
import WordCloud from './WordCloud';

interface VideoInfoProps {
  bvid: string;
}

type WordTag = { text: string; value: number };

const createTagsArray = (tags: VideoTags): WordTag[] => {
  const result: WordTag[] = [
    { text: tags.firstChannel, value: 300 },
    { text: tags.secondChannel, value: 200 },
  ];
  tags.ordinaryTags.forEach((tag) => {
    result.push({ text: tag, value: 100 });
  });
  return result;
};

const VideoInfo: React.FC<VideoInfoProps> = React.memo(({ bvid }) => {
  const [videoInfo, setVideoInfo] = useState<BilibiliVideoInfo | null>(null);
  const [tagProps, setTagProps] = useState<WordTag[]>([]);

  useEffect(() => {
    if (!bvid) {
      return;
    }
    let cancelled = false;

    const fetchVideoInfo = async () => {
      const res = await axios.post<{ data: BilibiliVideoInfo }>(
        '/api/videoInfo',
        { bvid }
      );
      if (!cancelled) {
        setVideoInfo(res.data.data);
      }
    };

    const getVideoTags = async () => {
      const res = await axios.post<VideoTags>('/api/videoTags', { bvid });
      if (!cancelled) {
        setTagProps(createTagsArray(res.data));
      }
    };

    fetchVideoInfo();
    getVideoTags();

    return () => {
      cancelled = true;
    };
  }, [bvid]);

  if (!videoInfo) {
    return null;
  }

  return (
    <div className="flex flex-col gap-[2vh]">
      <div className="flex flex-col gap-[2vh] xl:flex-row">
        <Video bvid={bvid} cid={videoInfo.cid} className="xl:flex-1" />
        <Base videoInfo={videoInfo} />
      </div>
      <div className="flex flex-col gap-[2vh] xl:flex-row">
        <WordCloud formattedTopics={tagProps} />
        <StackedChart videoInfo={videoInfo} />
      </div>
      <Earnings videoInfo={videoInfo} />
    </div>
  );
});

export default VideoInfo;

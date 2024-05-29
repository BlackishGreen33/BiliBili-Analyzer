'use client';

import axios from 'axios';
import React, { useEffect, useState } from 'react';

import Earnings from './Analization';
import Base from './Base';
import StackedChart from './StackedChart';
import Video from './Video';
import WordCloud from './WordCloud';

interface VideoInfoProps {
  bvid: string;
}

type TagsData = {
  firstChannel: string;
  secondChannel: string;
  ordinaryTags: string[];
};

const VideoInfo: React.FC<VideoInfoProps> = React.memo(({ bvid }) => {
  const [videoInfo, setVideoInfo] = useState(null);
  const [getTags, setGetTags] = useState<TagsData>({
    firstChannel: '生活',
    secondChannel: '搞笑',
    ordinaryTags: ['勇敢哥特', '这是一个悲伤的故事'],
  });
  const [tagProps, setTagProps] = useState<{ text: string; value: number }[]>([
    { text: '', value: 0 },
  ]);

  const createTagsArray = (
    tags: typeof getTags
  ): { text: string; value: number }[] => {
    const result: { text: string; value: number }[] = [];
    result.push({
      // @ts-ignore
      text: tags.firstChannel,
      value: 300,
    });
    result.push({
      // @ts-ignore
      text: tags.secondChannel,
      value: 200,
    });
    // @ts-ignore
    tags.ordinaryTags.forEach((tag) => {
      result.push({
        text: tag,
        value: 100,
      });
    });

    return result;
  };

  const fetchVideoInfo = async () => {
    const res = await axios.post('/api/videoInfo', { bvid: bvid });
    setVideoInfo(res.data.data);
  };

  const getVideoTags = async () => {
    const res = await axios.post('/api/videoTags', { bvid: bvid });
    console.log(res);
    setGetTags(res.data.data);
  };

  useEffect(() => {
    if (bvid) {
      fetchVideoInfo();
      getVideoTags();
      if (getTags) {
        setTagProps(createTagsArray(getTags));
      }
    }
  }, [bvid]);

  return (
    videoInfo && (
      <div className="flex flex-col gap-[2vh]">
        <div className="flex flex-col gap-[2vh] xl:flex-row">
          <Video
            bvid={bvid}
            // @ts-ignore
            cid={videoInfo!.cid}
            className="xl:flex-1"
          />
          <Base videoInfo={videoInfo} />
        </div>
        <div className="flex flex-col gap-[2vh] xl:flex-row">
          <WordCloud formattedTopics={tagProps!} />
          <StackedChart videoInfo={videoInfo} />
        </div>
        <Earnings videoInfo={videoInfo} />
      </div>
    )
  );
});

export default VideoInfo;

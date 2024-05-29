"use client";

import axios from 'axios';
import React, { useEffect, useState } from 'react';

import Earnings from './Analization';
import Base from './Base';
import StackedChart from './StackedChart';
import Video from './Video';

interface VideoInfoProps {
  bvid: string;
}

const VideoInfo: React.FC<VideoInfoProps> = React.memo(({ bvid }) => {
  const [videoInfo, setVideoInfo] = useState(null);

  const fetchVideoInfo = async () => {
    const response = await axios.post('/api/videoInfo', { bvid: bvid });
    setVideoInfo(response.data.data);
  };

  useEffect(() => {
    if (bvid) {
      fetchVideoInfo();
    }
  }, [bvid]);

  return (
    videoInfo && (
      <>
        <div className="flex flex-col gap-[2vh] xl:flex-row">
          <Video
            bvid={bvid}
            // @ts-ignore
            cid={videoInfo!.cid}
            className="xl:flex-1"
          />
          <Base videoInfo={videoInfo} />
        </div>
        <StackedChart videoInfo={videoInfo} />
        <Earnings videoInfo={videoInfo} />
      </>
    )
  );
});

export default VideoInfo;

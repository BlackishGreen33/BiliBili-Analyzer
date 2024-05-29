'use client';

import axios from 'axios';
import { useSearchParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';

import Earnings from './Analization';
import Base from './Base';
import StackedChart from './StackedChart';
import Video from './Video';

const Detail: React.FC = React.memo(() => {
  const searchParams = useSearchParams();
  const bvid = searchParams.get('bvid');
  const [videoInfo, setVideoInfo] = useState(null);

  const fetchVideoInfo = async () => {
    const response = await axios.post('/api/videoInfo', { bvid: bvid });
    console.log(response.data.data);
    setVideoInfo(response.data.data);
  };

  useEffect(() => {
    if (bvid) {
      fetchVideoInfo();
    }
  }, [bvid]);

  // @ts-ignore
  const videoCid = videoInfo?.cid;

  return (
    <div className="m-2 mt-24 p-2 md:m-10 md:p-10">
      <div className="flex flex-col gap-[2vh] xl:flex-row">
        {videoInfo && (
          <Video bvid={bvid!} cid={videoCid} className="xl:flex-1" />
        )}
        {videoInfo && <Base videoInfo={videoInfo} />}
      </div>
      {videoInfo && <StackedChart videoInfo={videoInfo} />}
      {videoInfo && <Earnings videoInfo={videoInfo} />}
    </div>
  );
});

export default Detail;

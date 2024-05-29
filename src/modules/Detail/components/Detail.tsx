'use client';

import { useSearchParams } from 'next/navigation';
import React from 'react';

import SearchBar from './SearchBar';
import VideoInfo from './VideoInfo';

const Detail: React.FC = React.memo(() => {
  const searchParams = useSearchParams();
  const bvid = searchParams.get('bvid');

  return (
    <div className="m-2 mt-24 p-2 md:m-10 md:p-10">
      {bvid ? <VideoInfo bvid={bvid!} /> : <SearchBar />}
    </div>
  );
});

export default Detail;

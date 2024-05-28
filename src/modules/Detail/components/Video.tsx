'use client';

import IframeResizer from '@iframe-resizer/react';
import React from 'react';

interface VideoProps {
  bvid: string;
  cid: number;
  className?: string;
}

const Video: React.FC<VideoProps> = React.memo(({ bvid, cid, className }) => {
  return (
    <IframeResizer
      src={`//player.bilibili.com/player.html?isOutside=true&aid=347243364&bvid=${bvid}&cid=${cid}&p=1&autoplay=false`}
      scrolling={false}
      style={{ border: 0, height: '35vh' }}
      frameBorder="no"
      allowFullScreen={true}
      aria-controls="video-player"
      sandbox="allow-top-navigation allow-same-origin allow-forms allow-scripts"
      className={className}
      license=""
    />
  );
});

export default Video;

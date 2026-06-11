'use client';

import React from 'react';

interface VideoProps {
  bvid: string;
  aid: number;
  cid: number;
  className?: string;
}

const Video: React.FC<VideoProps> = React.memo(
  ({ bvid, aid, cid, className }) => {
    return (
      <iframe
        src={`//player.bilibili.com/player.html?isOutside=true&aid=${aid}&bvid=${bvid}&cid=${cid}&p=1&autoplay=false`}
        scrolling="no"
        style={{ border: 0 }}
        frameBorder="no"
        allowFullScreen
        sandbox="allow-top-navigation allow-same-origin allow-forms allow-scripts"
        className={`aspect-video w-full rounded-xl ${className ?? ''}`}
        title="bilibili-player"
      />
    );
  }
);

export default Video;

import Image from 'next/image';
import Link from 'next/link';
import React from 'react';
import { MdDateRange, MdOutlineAccessTime, MdSubtitles } from 'react-icons/md';

import { Card } from '@/common/components/ui/card';
import type { BilibiliVideoInfo } from '@/common/types/bilibili';
import { formatDuration } from '@/common/utils/format';

type BaseProps = { videoInfo: BilibiliVideoInfo };

const Base: React.FC<BaseProps> = React.memo(({ videoInfo }) => {
  return (
    <Card className="flex flex-1 flex-col gap-5 p-6">
      <div className="flex items-center gap-4">
        <Image
          className="h-16 w-16 rounded-full"
          src={videoInfo.owner.face}
          alt={videoInfo.owner.name}
          width={64}
          height={64}
          loading="lazy"
          referrerPolicy="no-referrer"
        />
        <div>
          <p className="text-2xl leading-tight font-bold">
            {videoInfo.owner.name}
          </p>
          <p className="text-muted-foreground text-sm">视频作者</p>
        </div>
      </div>
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <MdSubtitles className="text-muted-foreground shrink-0" />
          <span className="shrink-0 text-sm">视频标题：</span>
          <Link
            href={`https://www.bilibili.com/video/${videoInfo.bvid}`}
            target="_blank"
            className="min-w-0 truncate font-semibold text-blue-800 hover:underline dark:text-blue-300"
          >
            {videoInfo.title}
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <MdOutlineAccessTime className="text-muted-foreground shrink-0" />
          <span className="text-sm">视频时长：</span>
          <span className="font-semibold tabular-nums">
            {formatDuration(videoInfo.duration)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <MdDateRange className="text-muted-foreground shrink-0" />
          <span className="text-sm">发布日期：</span>
          <span className="font-semibold">
            {new Date(videoInfo.pubdate * 1000).toLocaleString('zh-CN')}
          </span>
        </div>
      </div>
    </Card>
  );
});

export default Base;

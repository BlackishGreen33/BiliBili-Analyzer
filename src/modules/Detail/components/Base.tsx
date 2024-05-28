import { Card } from '@/common/components/ui/card';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';
import { MdDateRange, MdOutlineAccessTime, MdSubtitles } from 'react-icons/md';

type BaseProps = { videoInfo: any };

const Base: React.FC<BaseProps> = React.memo(({ videoInfo }) => {
  return (
    <Card className="h-[35vh] flex-1 px-[4vh] py-[3vh]">
      <div className="flex items-center gap-[2vh]">
        <Image
          className="h-[11vh] w-[11vh] rounded-full"
          src={videoInfo.pic}
          alt={videoInfo.owner.name}
          width={200}
          height={200}
          loading="lazy"
          referrerPolicy="no-referrer"
        />
        <div className="mt-[0.5vh] flex flex-col gap-[0.5vh]">
          <p className="text-[3vh] font-bold">{videoInfo.owner.name}</p>
          <p className="text-[2.2vh] text-gray-400">视频作者</p>
        </div>
      </div>
      <div className="flex flex-col gap-[2vh]">
        <div className="mt-[2.8vh] flex items-center">
          <p className="flex items-center gap-2 text-nowrap text-[2vh]">
            <MdSubtitles />
            视频标题：
          </p>
          <p className="min-w-0 cursor-pointer truncate text-[1.8vh] font-bold text-blue-800 hover:underline">
            <Link href={`https://www.bilibili.com/video/${videoInfo.bvid}`}>
              {videoInfo.title}
            </Link>
          </p>
        </div>
        <div className="flex items-center">
          <p className="flex items-center gap-2 text-[2vh]">
            <MdOutlineAccessTime />
            视频时长：
          </p>
          <p className="text-[1.8vh] font-bold text-gray-800">
            {videoInfo.duration} 秒
          </p>
        </div>
        <div className="flex items-center">
          <p className="flex items-center gap-2 text-[2vh]">
            <MdDateRange />
            发布日期：
          </p>
          <p className="text-[1.8vh] font-bold text-gray-800">
            {new Date(videoInfo.pubdate * 1000).toLocaleString()}
          </p>
        </div>
      </div>
    </Card>
  );
});

export default Base;

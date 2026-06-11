'use client';

import { useRouter } from 'next/navigation';
import React from 'react';
import useSWR from 'swr';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/common/components/ui/card';
import { Spinner } from '@/common/components/ui/spinner';
import { useRelatedVideos } from '@/common/libs/video-data';
import type { BilibiliVideoInfo } from '@/common/types/bilibili';
import type { VideoTags } from '@/common/types/video';
import { extractBvid, formatViews } from '@/common/utils/format';

import Analization from './Analization';
import Base from './Base';
import StackedChart from './StackedChart';
import Video from './Video';
import WordCloud from './WordCloud';

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

const fetcher = async <T,>(url: string, body: unknown): Promise<T> => {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`Request failed (${res.status})`);
  }
  return (await res.json()) as T;
};

interface VideoInfoProps {
  bvid: string;
}

const RelatedVideoList: React.FC<{
  title: string;
  description: string;
  videos: Array<{
    bvid: string;
    url: string;
    cover: string;
    title: string;
    UP: string;
    views: number;
  }>;
}> = ({ title, description, videos }) => {
  const router = useRouter();
  if (videos.length === 0) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {videos.slice(0, 8).map((v) => (
            <button
              key={v.url}
              type="button"
              onClick={() => {
                const bvid = v.bvid || extractBvid(v.url);
                if (bvid) router.push('/details?bvid=' + bvid);
              }}
              className="group bg-card hover:border-primary/50 flex flex-col gap-2 rounded-lg border p-2 text-left transition hover:shadow-md"
            >
              <div className="bg-muted relative aspect-video w-full overflow-hidden rounded-md">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={v.cover}
                  alt={v.title}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover transition group-hover:scale-105"
                />
              </div>
              <p className="line-clamp-2 text-sm leading-tight font-medium">
                {v.title}
              </p>
              <div className="text-muted-foreground flex items-center justify-between text-xs">
                <span className="truncate">{v.UP}</span>
                <span className="tabular-nums">{formatViews(v.views)}</span>
              </div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

const VideoInfo: React.FC<VideoInfoProps> = React.memo(({ bvid }) => {
  const { data: videoInfo, isLoading: infoLoading } = useSWR<BilibiliVideoInfo>(
    bvid ? ['/api/videoInfo', bvid] : null,
    ([url, id]) =>
      fetcher<{ data: BilibiliVideoInfo }>(url, { bvid: id }).then(
        (r) => r.data
      )
  );

  const { data: tags, isLoading: tagsLoading } = useSWR<VideoTags>(
    bvid ? ['/api/videoTags', bvid] : null,
    ([url, id]) => fetcher<VideoTags>(url, { bvid: id })
  );

  const { data: upRelated } = useRelatedVideos(
    videoInfo
      ? {
          mode: 'up',
          value: String(videoInfo.owner.mid ?? videoInfo.owner.name),
        }
      : { mode: 'up', value: '' }
  );
  const { data: channelRelated } = useRelatedVideos(
    tags
      ? { mode: 'channel', value: tags.firstChannel }
      : { mode: 'channel', value: '' }
  );

  const tagProps: WordTag[] = tags ? createTagsArray(tags) : [];

  if (infoLoading || tagsLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!videoInfo) {
    return (
      <div className="text-muted-foreground flex h-96 flex-col items-center justify-center gap-2">
        <p>无法加载视频信息</p>
        <p className="text-sm">请检查网络连接或稍后重试</p>
      </div>
    );
  }

  const upVideos = (upRelated?.video ?? []).filter((v) => v.bvid !== bvid);
  const channelVideos = (channelRelated?.video ?? []).filter(
    (v) => v.bvid !== bvid
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-6 xl:flex-row">
        <Video
          bvid={bvid}
          aid={videoInfo.aid}
          cid={videoInfo.cid}
          className="xl:flex-1"
        />
        <Base videoInfo={videoInfo} />
      </div>
      <div className="flex flex-col gap-6 xl:flex-row">
        <WordCloud formattedTopics={tagProps} />
        <StackedChart stat={videoInfo.stat} />
      </div>
      <Analization stat={videoInfo.stat} />
      {upVideos.length > 0 && (
        <RelatedVideoList
          title={`${videoInfo.owner.name} 的其他热门视频`}
          description="同一 UP 主当日上榜的其他热门"
          videos={upVideos}
        />
      )}
      {channelVideos.length > 0 && (
        <RelatedVideoList
          title={`${tags?.firstChannel ?? '同分区'}的其他热门视频`}
          description="同一一级分区当日上榜的其他热门"
          videos={channelVideos}
        />
      )}
    </div>
  );
});

export default VideoInfo;

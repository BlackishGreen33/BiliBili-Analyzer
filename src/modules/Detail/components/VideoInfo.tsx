'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import React from 'react';
import { useTranslation } from 'react-i18next';
import useSWR from 'swr';

import { LengthRecommendCard } from '@/common/components/elements';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/common/components/ui/card';
import { Spinner } from '@/common/components/ui/spinner';
import { useRelatedVideos } from '@/common/libs/video-data';
import {
  containerStagger,
  EASE_OUT_EXPO,
  fadeUp,
} from '@/common/styles/motion';
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

type RelatedVideo = {
  bvid: string;
  url: string;
  cover: string;
  title: string;
  UP: string;
  views: number;
};

const RelatedVideoList: React.FC<{
  title: string;
  description: string;
  videos: RelatedVideo[];
  index: number;
}> = React.memo(({ title, description, videos, index }) => {
  const router = useRouter();
  if (videos.length === 0) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.06 * index, ease: EASE_OUT_EXPO }}
    >
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <motion.div
            variants={containerStagger(0.04, 0.02)}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            {videos.slice(0, 8).map((v) => (
              <motion.button
                key={v.url}
                type="button"
                variants={fadeUp}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.2, ease: EASE_OUT_EXPO }}
                onClick={() => {
                  const bvid = v.bvid || extractBvid(v.url);
                  if (bvid) router.push('/details?bvid=' + bvid);
                }}
                className="group bg-card hover:border-primary/50 transition-base flex cursor-pointer flex-col gap-2 rounded-lg border p-2 text-left hover:shadow-md"
              >
                <div className="bg-muted relative aspect-video w-full overflow-hidden rounded-md">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={v.cover}
                    alt={v.title}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <p className="line-clamp-2 text-sm leading-tight font-medium">
                  {v.title}
                </p>
                <div className="text-muted-foreground flex items-center justify-between text-xs">
                  <span className="truncate">{v.UP}</span>
                  <span className="tabular-nums">{formatViews(v.views)}</span>
                </div>
              </motion.button>
            ))}
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
});
RelatedVideoList.displayName = 'RelatedVideoList';

const VideoInfo: React.FC<VideoInfoProps> = React.memo(({ bvid }) => {
  const { t } = useTranslation();
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
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="text-muted-foreground flex h-96 flex-col items-center justify-center gap-2"
      >
        <p>{t('detail.error.title')}</p>
        <p className="text-sm">{t('detail.error.hint')}</p>
      </motion.div>
    );
  }

  const upVideos = (upRelated?.video ?? []).filter((v) => v.bvid !== bvid);
  const channelVideos = (channelRelated?.video ?? []).filter(
    (v) => v.bvid !== bvid
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-6 xl:flex-row">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
          className="xl:flex-1"
        >
          <Video
            bvid={bvid}
            aid={videoInfo.aid}
            cid={videoInfo.cid}
            className="xl:flex-1"
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.06, ease: EASE_OUT_EXPO }}
          className="xl:flex-1"
        >
          <Base videoInfo={videoInfo} />
        </motion.div>
      </div>
      <div className="flex flex-col gap-6 xl:flex-row">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.12, ease: EASE_OUT_EXPO }}
          className="xl:flex-1"
        >
          <WordCloud formattedTopics={tagProps} />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.18, ease: EASE_OUT_EXPO }}
          className="xl:flex-1"
        >
          <StackedChart stat={videoInfo.stat} />
        </motion.div>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.24, ease: EASE_OUT_EXPO }}
      >
        <Analization stat={videoInfo.stat} />
      </motion.div>
      {upVideos.length > 0 && (
        <RelatedVideoList
          title={t('detail.relatedUpTitle', { name: videoInfo.owner.name })}
          description={t('detail.relatedUpDesc')}
          videos={upVideos}
          index={0}
        />
      )}
      {videoInfo.owner.name && (
        <LengthRecommendCard
          scope={{
            type: 'up',
            value: String(videoInfo.owner.mid ?? videoInfo.owner.name),
            label: videoInfo.owner.name,
            window: 30,
          }}
        />
      )}
      {channelVideos.length > 0 && (
        <RelatedVideoList
          title={t('detail.relatedChannelTitle', {
            channel: tags?.firstChannel ?? '',
          })}
          description={t('detail.relatedChannelDesc')}
          videos={channelVideos}
          index={1}
        />
      )}
    </div>
  );
});

export default VideoInfo;

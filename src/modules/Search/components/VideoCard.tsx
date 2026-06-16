'use client';

import { motion } from 'framer-motion';
import React from 'react';
import { FaUserAlt } from 'react-icons/fa';

import { Badge } from '@/common/components/ui/badge';
import { Card, CardContent } from '@/common/components/ui/card';
import { fadeUp } from '@/common/styles/motion';
import type { VideoData } from '@/common/types/video';
import { formatViews } from '@/common/utils/format';

type VideoCardProps = {
  item: VideoData;
  currentColor: string;
  onClick: () => void;
  onTagClick: (tag: string) => void;
};

const VideoCard: React.FC<VideoCardProps> = React.memo(
  ({ item, currentColor, onClick, onTagClick }) => (
    <motion.div variants={fadeUp}>
      <Card
        className="hover:border-primary/50 group transition-base cursor-pointer overflow-hidden border-transparent hover:-translate-y-0.5 hover:shadow-md"
        onClick={onClick}
      >
        <div className="bg-muted relative aspect-video w-full overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.cover}
            alt={item.title}
            loading="lazy"
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute top-2 right-2">
            <Badge
              variant="secondary"
              className="bg-black/60 text-white backdrop-blur"
            >
              {formatViews(item.views)}
            </Badge>
          </div>
        </div>
        <CardContent className="space-y-2 p-4">
          <p className="line-clamp-2 text-sm leading-tight font-semibold">
            {item.title}
          </p>
          <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
            <FaUserAlt className="h-3 w-3" />
            <span className="truncate">{item.UP}</span>
          </div>
          <div className="flex flex-wrap gap-1">
            <Badge
              variant="outline"
              style={{ borderColor: currentColor, color: currentColor }}
            >
              {item.tags.firstChannel}
            </Badge>
            <Badge variant="outline">{item.tags.secondChannel}</Badge>
            {item.tags.ordinaryTags.slice(0, 2).map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onTagClick(tag);
                }}
                className="bg-muted hover:bg-muted/70 transition-base cursor-pointer rounded-full px-2 py-0.5 text-[10px] hover:scale-105 active:scale-95"
              >
                {tag}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
);
VideoCard.displayName = 'VideoCard';

export default VideoCard;

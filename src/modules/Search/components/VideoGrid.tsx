'use client';

import { AnimatePresence, motion } from 'framer-motion';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { Badge } from '@/common/components/ui/badge';
import { Button } from '@/common/components/ui/button';
import { containerStagger } from '@/common/styles/motion';

import VideoCard, { type VideoItem } from './VideoCard';

type VideoGridProps = {
  visible: ReadonlyArray<VideoItem>;
  filteredCount: number;
  hasMore: boolean;
  currentColor: string;
  onCardClick: (url: string) => void;
  onTagClick: (tag: string) => void;
  onReset: () => void;
  /** gridCols already calculated in the parent */
  gridCols: number;
};

const VideoGrid: React.FC<VideoGridProps> = ({
  visible,
  filteredCount,
  hasMore,
  currentColor,
  onCardClick,
  onTagClick,
  onReset,
  gridCols,
}) => {
  const { t } = useTranslation();
  return (
    <div className="mx-auto max-w-7xl">
      <AnimatePresence mode="wait">
        {visible.length === 0 && filteredCount === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="text-muted-foreground flex h-64 flex-col items-center justify-center"
          >
            <p>{t('search.empty.title')}</p>
            <Button
              variant="link"
              onClick={onReset}
              className="mt-2 cursor-pointer"
            >
              {t('search.empty.action')}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        variants={containerStagger(0.02, 0)}
        initial="hidden"
        animate="show"
        className="grid gap-4"
        style={{ gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))` }}
      >
        {visible.map((item) => (
          <VideoCard
            key={item.url}
            item={item}
            currentColor={currentColor}
            onClick={() => onCardClick(item.url)}
            onTagClick={onTagClick}
          />
        ))}
      </motion.div>

      {hasMore && (
        <div className="mt-6 flex items-center justify-center py-4">
          <div
            className="border-muted-foreground/30 border-t-foreground inline-block h-4 w-4 animate-spin rounded-full border-2"
            role="status"
            aria-label="加载中"
          />
          <span className="text-muted-foreground ml-2 text-xs">
            {t('search.loadingMore', {
              visible: visible.length,
              total: filteredCount,
            })}
          </span>
        </div>
      )}

      {filteredCount > 0 && (
        <span className="sr-only" aria-hidden>
          <Badge>{filteredCount}</Badge>
        </span>
      )}
    </div>
  );
};

export default VideoGrid;

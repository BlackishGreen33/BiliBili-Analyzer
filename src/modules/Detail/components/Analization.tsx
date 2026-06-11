'use client';

import { motion } from 'framer-motion';
import React, { type ReactNode } from 'react';
import { BsCurrencyDollar, BsFillCollectionPlayFill } from 'react-icons/bs';
import {
  FaCommentDots,
  FaComments,
  FaEye,
  FaRegThumbsUp,
  FaShareFromSquare,
} from 'react-icons/fa6';

import { Card } from '@/common/components/ui/card';
import {
  containerStagger,
  EASE_OUT_EXPO,
  fadeUp,
} from '@/common/styles/motion';
import type { BilibiliVideoStat } from '@/common/types/bilibili';
import { formatCompact } from '@/common/utils/format';

interface AnalizationProps {
  stat: BilibiliVideoStat;
}

type Metric = {
  key: keyof BilibiliVideoStat;
  label: string;
  value: number;
  icon: ReactNode;
  iconColor: string;
  iconBg: string;
};

const STAT_METRICS: ReadonlyArray<Omit<Metric, 'value'>> = [
  {
    key: 'view',
    label: '观看次数',
    icon: <FaEye />,
    iconColor: '#03C9D7',
    iconBg: '#E5FAFB',
  },
  {
    key: 'danmaku',
    label: '弹幕数量',
    icon: <FaComments />,
    iconColor: 'rgb(228, 106, 118)',
    iconBg: 'rgb(255, 244, 229)',
  },
  {
    key: 'reply',
    label: '评论数',
    icon: <FaCommentDots />,
    iconColor: 'rgb(228, 106, 118)',
    iconBg: 'rgb(255, 244, 229)',
  },
  {
    key: 'favorite',
    label: '收藏数',
    icon: <BsFillCollectionPlayFill />,
    iconColor: 'rgb(0, 194, 146)',
    iconBg: 'rgb(235, 250, 242)',
  },
  {
    key: 'coin',
    label: '投币数',
    icon: <BsCurrencyDollar />,
    iconColor: 'rgb(254, 201, 15)',
    iconBg: 'rgb(255, 244, 229)',
  },
  {
    key: 'share',
    label: '分享数',
    icon: <FaShareFromSquare />,
    iconColor: 'rgb(15, 201, 65)',
    iconBg: 'rgb(215, 232, 218)',
  },
  {
    key: 'like',
    label: '点赞数',
    icon: <FaRegThumbsUp />,
    iconColor: 'rgb(95, 91, 215)',
    iconBg: 'rgb(246, 246, 246)',
  },
];

const Analization: React.FC<AnalizationProps> = React.memo(({ stat }) => {
  const metrics: Metric[] = STAT_METRICS.map((m) => ({
    ...m,
    value: stat[m.key],
  }));

  return (
    <motion.div
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7"
      variants={containerStagger(0.05, 0.04)}
      initial="hidden"
      animate="show"
    >
      {metrics.map((item) => (
        <motion.div
          key={item.key}
          variants={fadeUp}
          whileHover={{ y: -2 }}
          transition={{ duration: 0.2, ease: EASE_OUT_EXPO }}
        >
          <Card className="hover:border-primary/50 transition-base flex cursor-default flex-col items-start gap-3 p-5 hover:shadow-md">
            <motion.div
              whileHover={{ scale: 1.1, rotate: -6 }}
              transition={{ duration: 0.2, ease: EASE_OUT_EXPO }}
              className="rounded-full p-3 text-2xl"
              style={{ color: item.iconColor, backgroundColor: item.iconBg }}
            >
              {item.icon}
            </motion.div>
            <div>
              <p className="text-xl font-semibold tabular-nums">
                {formatCompact(item.value)}
              </p>
              <p className="text-muted-foreground text-xs">{item.label}</p>
            </div>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
});

export default Analization;

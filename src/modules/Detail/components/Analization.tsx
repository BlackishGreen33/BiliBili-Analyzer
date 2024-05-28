'use client';

import React from 'react';
import { BsCurrencyDollar, BsFillCollectionPlayFill } from 'react-icons/bs';
import {
  FaComments,
  FaEye,
  FaRegThumbsUp,
  FaShareSquare,
} from 'react-icons/fa';
import { FaCommentDots } from 'react-icons/fa6';

import { Card } from '@/common/components/ui/card';

interface AnalizationProps {
  videoInfo: any;
}

const Analization: React.FC<AnalizationProps> = React.memo(({ videoInfo }) => {
  const AnalizationData = [
    {
      icon: <FaEye />,
      amount: videoInfo.stat.view,
      percentage: '-4%',
      title: '观看次数',
      iconColor: '#03C9D7',
      iconBg: '#E5FAFB',
      pcColor: 'red-600',
    },
    {
      icon: <FaComments />,
      amount: videoInfo.stat.danmaku,
      percentage: '+23%',
      title: '弹幕数量',
      iconColor: 'rgb(255, 244, 229)',
      iconBg: 'rgb(241, 199, 164)',
      pcColor: 'green-600',
    },
    {
      icon: <FaCommentDots />,
      amount: videoInfo.stat.reply,
      percentage: '+38%',
      title: '评论数',
      iconColor: 'rgb(228, 106, 118)',
      iconBg: 'rgb(255, 244, 229)',

      pcColor: 'green-600',
    },
    {
      icon: <BsFillCollectionPlayFill />,
      amount: videoInfo.stat.favorite,
      percentage: '-12%',
      title: '收藏数',
      iconColor: 'rgb(0, 194, 146)',
      iconBg: 'rgb(235, 250, 242)',
      pcColor: 'red-600',
    },
    {
      icon: <BsCurrencyDollar />,
      amount: videoInfo.stat.coin,
      percentage: '-12%',
      title: '投币数',
      iconColor: 'rgb(255, 244, 229)',
      iconBg: 'rgb(254, 201, 15)',
      pcColor: 'red-600',
    },
    {
      icon: <FaShareSquare />,
      amount: videoInfo.stat.share,
      percentage: '-12%',
      title: '分享数',
      iconColor: 'rgb(215, 232, 218)',
      iconBg: 'rgb(15, 201, 65)',
      pcColor: 'red-600',
    },
    {
      icon: <FaRegThumbsUp />,
      amount: videoInfo.stat.like,
      percentage: '-12%',
      title: '点赞数',
      iconColor: 'rgb(246, 246, 246)',
      iconBg: 'rgb(95, 91, 215)',
      pcColor: 'red-600',
    },
  ];

  return (
    <div className="flex flex-wrap justify-center lg:flex-nowrap ">
      <div className="m-3 flex flex-wrap items-center justify-center gap-1">
        {AnalizationData.map((item) => (
          <Card
            key={item.title}
            className="h-44 rounded-2xl bg-white p-4 pt-9  dark:bg-secondary-dark-bg dark:text-gray-200 md:w-56 "
          >
            <button
              type="button"
              style={{ color: item.iconColor, backgroundColor: item.iconBg }}
              className="opacity-0.9 rounded-full p-4  text-2xl hover:drop-shadow-xl"
            >
              {item.icon}
            </button>
            <p className="mt-3">
              <span className="text-lg font-semibold">{item.amount}</span>
              <span className={`text-sm text-${item.pcColor} ml-2`}>
                {item.percentage}
              </span>
            </p>
            <p className="mt-1 text-sm  text-gray-400">{item.title}</p>
          </Card>
        ))}
      </div>
    </div>
  );
});

export default Analization;

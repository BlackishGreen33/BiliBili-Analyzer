import React from 'react';

import {
  ChartsHeader,
  Stacked as StackedChart,
} from '@/common/components/elements';

interface StackedChartProps {
  videoInfo: any;
}

const Stacked: React.FC<StackedChartProps> = React.memo(({ videoInfo }) => {
  const stackedChartData = [
    [
      { x: '观看次数', y: videoInfo.stat.view },
      { x: '弹幕数量', y: videoInfo.stat.danmaku },
      { x: '评论数', y: videoInfo.stat.reply },
      { x: '收藏数', y: videoInfo.stat.favorite },
      { x: '投币数', y: videoInfo.stat.coin },
      { x: '分享数', y: videoInfo.stat.share },
      { x: '点赞数', y: videoInfo.stat.like },
    ],
  ];
  const stackedCustomSeries = [
    {
      dataSource: stackedChartData[0],
      xName: 'x',
      yName: 'y',
      name: '次数',
      type: 'StackingColumn',
      background: 'blue',
    },
  ];

  return (
    <div className="m-4 mt-24 rounded-3xl bg-white p-10 dark:bg-secondary-dark-bg md:m-10">
      <ChartsHeader category="长条图" title="视频统计数据图表" />
      <div className="w-full">
        <StackedChart stackedCustomSeries={stackedCustomSeries} />
      </div>
    </div>
  );
});

export default Stacked;

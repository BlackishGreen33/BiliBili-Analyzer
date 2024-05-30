import React from 'react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/common/components/ui/card';

import { Stacked as StackedChart } from './Stacked';

interface StackedChartProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    <Card className="flex-1">
      <CardHeader>
        <CardTitle>长条图</CardTitle>
        <CardDescription>视频统计数据图表</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="w-full">
          <StackedChart stackedCustomSeries={stackedCustomSeries} />
        </div>
      </CardContent>
    </Card>
  );
});

export default Stacked;

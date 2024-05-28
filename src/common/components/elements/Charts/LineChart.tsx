'use client';

import {
  ChartComponent,
  DateTime,
  Inject,
  Legend,
  LineSeries,
  SeriesCollectionDirective,
  SeriesDirective,
  Tooltip,
} from '@syncfusion/ej2-react-charts';
import { useTheme } from 'next-themes';
import React from 'react';

import {
  lineCustomSeries,
  LinePrimaryXAxis,
  LinePrimaryYAxis,
} from '@/common/assets/dummy';

const LineChart: React.FC = React.memo(() => {
  const { theme } = useTheme();

  return (
    <ChartComponent
      id="line-chart"
      height="420px"
      // @ts-ignore
      primaryXAxis={LinePrimaryXAxis}
      // @ts-ignore
      primaryYAxis={LinePrimaryYAxis}
      chartArea={{ border: { width: 0 } }}
      tooltip={{ enable: true }}
      background={theme === 'dark' ? '#33373E' : '#fff'}
      legendSettings={{ background: 'white' }}
    >
      <Inject services={[LineSeries, DateTime, Legend, Tooltip]} />
      <SeriesCollectionDirective>
        {/* eslint-disable-next-line react/jsx-props-no-spreading */}
        {lineCustomSeries.map((item, index) => (
          <SeriesDirective key={index} {...item} />
        ))}
      </SeriesCollectionDirective>
    </ChartComponent>
  );
});

export default LineChart;

'use client';

import { useTheme } from 'next-themes';
import React from 'react';

import {
  stackedPrimaryXAxis,
  stackedPrimaryYAxis,
} from '@/common/dummy/StackedData';
import {
  Category,
  ChartComponent,
  Inject,
  Legend,
  SeriesCollectionDirective,
  SeriesDirective,
  StackingColumnSeries,
  Tooltip,
} from '@syncfusion/ej2-react-charts';

interface StackedProps {
  width?: string;
  height?: string;
  stackedCustomSeries: any[];
}

const Stacked: React.FC<StackedProps> = React.memo(
  ({ width, height, stackedCustomSeries }) => {
    const { theme } = useTheme();

    return (
      <ChartComponent
        id="charts"
        // @ts-ignore
        primaryXAxis={stackedPrimaryXAxis}
        primaryYAxis={stackedPrimaryYAxis}
        width={width}
        height={height}
        chartArea={{ border: { width: 0 } }}
        tooltip={{ enable: true }}
        background={theme === 'dark' ? '#33373E' : '#fff'}
        legendSettings={{ background: 'white' }}
      >
        <Inject services={[StackingColumnSeries, Category, Legend, Tooltip]} />
        <SeriesCollectionDirective>
          {/* eslint-disable-next-line react/jsx-props-no-spreading */}
          {stackedCustomSeries.map((item, index) => (
            <SeriesDirective key={index} {...item} />
          ))}
        </SeriesCollectionDirective>
      </ChartComponent>
    );
  }
);

export default Stacked;

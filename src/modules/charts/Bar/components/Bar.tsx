'use client';

import {
  Category,
  ChartComponent,
  ColumnSeries,
  DataLabel,
  Inject,
  Legend,
  SeriesCollectionDirective,
  SeriesDirective,
  Tooltip,
} from '@syncfusion/ej2-react-charts';
import { useTheme } from 'next-themes';
import React from 'react';

import {
  barCustomSeries,
  barPrimaryXAxis,
  barPrimaryYAxis,
} from '@/common/assets/dummy';
import { ChartsHeader } from '@/common/components/elements';

const Bar: React.FC = React.memo(() => {
  const { theme } = useTheme();

  return (
    <div className="m-4 mt-24 rounded-3xl bg-white p-10 dark:bg-secondary-dark-bg md:m-10">
      <ChartsHeader category="Bar" title="Olympic Medal Counts - RIO" />
      <div className=" w-full">
        <ChartComponent
          id="charts"
          // @ts-ignore
          primaryXAxis={barPrimaryXAxis}
          primaryYAxis={barPrimaryYAxis}
          chartArea={{ border: { width: 0 } }}
          tooltip={{ enable: true }}
          background={theme === 'dark' ? '#33373E' : '#fff'}
          legendSettings={{ background: 'white' }}
        >
          <Inject
            services={[ColumnSeries, Legend, Tooltip, Category, DataLabel]}
          />
          <SeriesCollectionDirective>
            {/* eslint-disable-next-line react/jsx-props-no-spreading */}
            {barCustomSeries.map((item, index) => (
              <SeriesDirective key={index} {...item} />
            ))}
          </SeriesCollectionDirective>
        </ChartComponent>
      </div>
    </div>
  );
});

export default Bar;

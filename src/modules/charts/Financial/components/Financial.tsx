'use client';

import {
  ChartComponent,
  Crosshair,
  DateTime,
  HiloSeries,
  Inject,
  Logarithmic,
  SeriesCollectionDirective,
  SeriesDirective,
  Tooltip,
  Zoom,
} from '@syncfusion/ej2-react-charts';
import { useTheme } from 'next-themes';
import React from 'react';

import {
  financialChartData,
  FinancialPrimaryXAxis,
  FinancialPrimaryYAxis,
} from '@/common/assets/dummy';
import { ChartsHeader } from '@/common/components/elements';

const date1 = new Date('2017, 1, 1');

// @ts-ignore eslint-disable-next-line consistent-return
function filterValue(value) {
  if (value.x >= date1) {
    // eslint-disable-next-line no-sequences
    return value.x, value.high, value.low;
  }
}
const returnValue = financialChartData.filter(filterValue);

const Financial: React.FC = React.memo(() => {
  const { theme } = useTheme();

  return (
    <div className="m-4 mt-24 rounded-3xl bg-white p-10 dark:bg-secondary-dark-bg md:m-10">
      <ChartsHeader category="Financial" title="AAPLE Historical" />
      <div className="w-full">
        <ChartComponent
          id="charts"
          // @ts-ignore
          primaryXAxis={FinancialPrimaryXAxis}
          primaryYAxis={FinancialPrimaryYAxis}
          chartArea={{ border: { width: 0 } }}
          tooltip={{ enable: true, shared: true }}
          crosshair={{ enable: true, lineType: 'Vertical', line: { width: 0 } }}
          background={theme === 'dark' ? '#33373E' : '#fff'}
        >
          <Inject
            services={[
              HiloSeries,
              Tooltip,
              DateTime,
              Logarithmic,
              Crosshair,
              Zoom,
            ]}
          />
          <SeriesCollectionDirective>
            <SeriesDirective
              dataSource={returnValue}
              xName="x"
              yName="low"
              name="Apple Inc"
              type="Hilo"
              low="low"
              high="high"
            />
          </SeriesCollectionDirective>
        </ChartComponent>
      </div>
    </div>
  );
});

export default Financial;

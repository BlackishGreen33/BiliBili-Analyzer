import React from 'react';

import { ChartsHeader, Pie as PieChart } from '@/common/components/elements';
import { pieChartData } from '../../../../common/dummy/dummy';

const Pie: React.FC = React.memo(() => (
  <div className="m-4 mt-24 rounded-3xl bg-white p-10 dark:bg-secondary-dark-bg md:m-10">
    <ChartsHeader category="Pie" title="Project Cost Breakdown" />
    <div className="w-full">
      <PieChart
        id="chart-pie"
        data={pieChartData}
        legendVisiblity
        height="full"
      />
    </div>
  </div>
));

export default Pie;

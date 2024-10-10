import React from 'react';

interface ChartsHeaderProps {
  category: string;
  title: string;
}

const ChartsHeader: React.FC<ChartsHeaderProps> = React.memo(
  ({ category, title }) => (
    <div className="mb-10">
      <div>
        <p className="text-lg text-gray-400">统计图表</p>
        <p className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-gray-200">
          {category}
        </p>
      </div>
      <p className="mb-2 mt-3 text-center text-xl dark:text-gray-200">
        {title}
      </p>
    </div>
  )
);

export default ChartsHeader;

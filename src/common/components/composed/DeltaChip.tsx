'use client';

import React from 'react';

import { cn } from '@/common/utils';

type DeltaChipProps = {
  delta: number;
  formatter: (n: number) => string;
};

const DeltaChip: React.FC<DeltaChipProps> = React.memo(
  ({ delta, formatter }) => {
    if (delta === 0) {
      return (
        <span className="text-muted-foreground text-xs tabular-nums">—</span>
      );
    }
    const positive = delta > 0;
    return (
      <span
        className={cn(
          'rounded-full px-2 py-0.5 text-xs font-medium tabular-nums',
          positive
            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
            : 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
        )}
      >
        {positive ? '+' : ''}
        {formatter(delta)}
      </span>
    );
  }
);
DeltaChip.displayName = 'DeltaChip';

export default DeltaChip;

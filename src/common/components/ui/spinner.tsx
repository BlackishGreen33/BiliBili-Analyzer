import React from 'react';
import { ImSpinner8 } from 'react-icons/im';

import { cn } from '@/common/utils';

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-10 w-10',
};

const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  className,
  ...props
}) => {
  return (
    <div
      role="status"
      aria-label="加载中"
      className={cn('flex items-center justify-center', className)}
      {...props}
    >
      <ImSpinner8
        className={cn('text-muted-foreground animate-spin', sizeMap[size])}
      />
      <span className="sr-only">加载中…</span>
    </div>
  );
};

export { Spinner };

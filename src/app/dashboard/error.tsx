'use client';

import { NextPage } from 'next';

import { Button } from '@/common/components/ui/button';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

const DashboardError: NextPage<ErrorProps> = ({ error, reset }) => {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 p-8 text-center">
      <p className="text-muted-foreground text-sm font-medium">
        聚合分析加载失败
      </p>
      <p className="text-muted-foreground max-w-md text-xs">
        {error.message || '请检查网络后重试'}
      </p>
      <Button size="sm" onClick={reset}>
        重试
      </Button>
    </div>
  );
};

export default DashboardError;

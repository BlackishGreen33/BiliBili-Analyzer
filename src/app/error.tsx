'use client';

import { NextPage } from 'next';
import Link from 'next/link';
import React from 'react';

import { Button } from '@/common/components/ui/button';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

const GlobalError: NextPage<ErrorProps> = ({ error, reset }) => {
  React.useEffect(() => {
    console.error('Global error boundary caught:', error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-3xl font-bold">页面出错了</h1>
      <p className="text-muted-foreground max-w-md text-sm">
        {error.message || '发生了一些意料之外的错误。'}
      </p>
      {error.digest && (
        <p className="text-muted-foreground font-mono text-xs">
          digest: {error.digest}
        </p>
      )}
      <div className="mt-2 flex gap-3">
        <Button onClick={reset}>重试</Button>
        <Button variant="outline" asChild>
          <Link href="/">回到首页</Link>
        </Button>
      </div>
    </div>
  );
};

export default GlobalError;

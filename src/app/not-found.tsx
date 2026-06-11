'use client';

import { NextPage } from 'next';
import Link from 'next/link';

const NotFound: NextPage = () => {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center gap-4 py-20 text-center">
      <h1
        title="404"
        className="relative inline-block animate-pulse text-7xl font-bold tracking-tight"
      >
        404
      </h1>
      <p className="text-muted-foreground text-lg">
        哎呀，这里好像什么都没有啊！
      </p>
      <Link
        href="/"
        className="text-primary mt-2 text-sm underline-offset-4 hover:underline"
      >
        回到首页
      </Link>
    </div>
  );
};

export default NotFound;

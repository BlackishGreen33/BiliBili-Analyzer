'use client';

import dynamic from 'next/dynamic';

const TitleWordCloud = dynamic(
  () => import('./TitleWordCloudImpl').then((m) => m.default),
  {
    ssr: false,
    loading: () => (
      <div className="text-muted-foreground flex items-center justify-center text-sm">
        …
      </div>
    ),
  }
);

export default TitleWordCloud;

'use client';

import dynamic from 'next/dynamic';
import React from 'react';

const Search = dynamic(
  () => import('@/modules/Search').then((mod) => ({ default: mod.default })),
  {
    ssr: false,
    loading: () => null,
  }
);

const Home: React.FC = React.memo(() => <Search />);

export default Home;

'use client';

import React from 'react';

import useStore from '@/common/hooks/useStore';

import Navigation from './Navigation';
import TopArea from './TopArea';

const Sidebar: React.FC = React.memo(() => {
  const { activeMenu } = useStore();

  return (
    <div className="ml-3 h-screen overflow-auto pb-10 md:overflow-hidden md:hover:overflow-auto">
      {activeMenu && (
        <>
          <TopArea />
          <Navigation />
        </>
      )}
    </div>
  );
});

export default Sidebar;

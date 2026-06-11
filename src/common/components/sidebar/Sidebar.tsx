'use client';

import React from 'react';

import { useLayoutStore } from '@/common/hooks/useLayoutStore';

import Logo from './Logo';
import Navigation from './Navigation';

const Sidebar: React.FC = React.memo(() => {
  const { activeMenu } = useLayoutStore();

  if (!activeMenu) return null;

  return (
    <aside className="ml-3 flex h-screen flex-col overflow-y-auto pb-10 md:overflow-hidden md:hover:overflow-auto">
      <Logo />
      <Navigation />
    </aside>
  );
});

export default Sidebar;

'use client';

import Link from 'next/link';
import React from 'react';
import { FaBilibili } from 'react-icons/fa6';

import { useLayoutStore } from '@/common/hooks/useLayoutStore';
import { useThemeStore } from '@/common/hooks/useThemeStore';

const Logo: React.FC = React.memo(() => {
  const { setActiveMenu, screenSize } = useLayoutStore();
  const { currentColor } = useThemeStore();

  const handleCloseSideBar = () => {
    if (screenSize !== undefined && screenSize <= 900) {
      setActiveMenu(false);
    }
  };

  return (
    <Link
      href="/"
      onClick={handleCloseSideBar}
      className="mt-6 ml-3 flex items-center gap-2.5 text-base font-bold tracking-tight"
      style={{ color: currentColor }}
    >
      <FaBilibili className="h-5 w-5" />
      <span>分类检索系统</span>
    </Link>
  );
});

export default Logo;

'use client';

import Link from 'next/link';
import React from 'react';
import { FaBilibili } from 'react-icons/fa6';

import useStore from '@/common/hooks/useStore';

const Logo: React.FC = React.memo(() => {
  const { activeMenu, setActiveMenu, screenSize, currentColor } = useStore();

  const handleCloseSideBar = () => {
    if (activeMenu !== undefined && screenSize! <= 900) {
      setActiveMenu(false);
    }
  };

  return (
    <Link
      href="/"
      onClick={handleCloseSideBar}
      className="ml-3 mt-6 flex items-center gap-3 text-xl font-extrabold tracking-tight"
      style={{ color: currentColor }}
    >
      <FaBilibili /> <span>分类检索系统</span>
    </Link>
  );
});

export default Logo;

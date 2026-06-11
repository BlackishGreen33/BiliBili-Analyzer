'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import React from 'react';
import { FaBilibili } from 'react-icons/fa6';

import { useLayoutStore } from '@/common/hooks/useLayoutStore';
import { useThemeStore } from '@/common/hooks/useThemeStore';
import { EASE_OUT_EXPO, fadeUp } from '@/common/styles/motion';

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
      className="group transition-base mt-6 ml-3 flex items-center gap-2.5 text-base font-bold tracking-tight"
      style={{ color: currentColor }}
    >
      <motion.span
        whileHover={{
          rotate: [0, -12, 12, -8, 8, 0],
          transition: { duration: 0.6, ease: EASE_OUT_EXPO },
        }}
        whileTap={{ scale: 0.9 }}
        className="inline-flex"
      >
        <FaBilibili className="h-5 w-5" />
      </motion.span>
      <motion.span
        variants={fadeUp}
        initial="hidden"
        animate="show"
        className="inline-block transition-transform duration-200 group-hover:translate-x-0.5"
      >
        分类检索系统
      </motion.span>
    </Link>
  );
});

export default Logo;

'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import React, { useCallback, useEffect } from 'react';
import { AiOutlineMenu } from 'react-icons/ai';
import { FaDownload, FaGithub } from 'react-icons/fa';

import { Download } from '@/common/components/elements';
import { useLayoutStore } from '@/common/hooks/useLayoutStore';
import { useThemeStore } from '@/common/hooks/useThemeStore';
import { useUiStore } from '@/common/hooks/useUiStore';

import NavButton from './NavButton';

const Navbar: React.FC = React.memo(() => {
  const router = useRouter();
  const { currentColor } = useThemeStore();
  const { activeMenu, setActiveMenu, setScreenSize, screenSize } =
    useLayoutStore();
  const { downloadOpen, toggleDownload } = useUiStore();

  const handleResize = useCallback(() => {
    setScreenSize(window.innerWidth);
  }, [setScreenSize]);

  useEffect(() => {
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  useEffect(() => {
    if (screenSize === undefined) return;
    setActiveMenu(screenSize > 900);
  }, [screenSize, setActiveMenu]);

  const handleActiveMenu = useCallback(
    () => setActiveMenu(!activeMenu),
    [activeMenu, setActiveMenu]
  );

  return (
    <div className="relative flex items-center justify-between p-2 md:mr-6 md:ml-6">
      <NavButton
        title="菜单"
        customFunc={handleActiveMenu}
        color={currentColor}
        icon={<AiOutlineMenu />}
      />
      <div className="flex items-center gap-1">
        <NavButton
          title="下载应用"
          dotColor="rgb(254, 201, 15)"
          customFunc={toggleDownload}
          color={currentColor}
          icon={<FaDownload />}
        />
        <motion.button
          type="button"
          onClick={() =>
            router.push('https://github.com/BlackishGreen33/BiliBili-Analyzer')
          }
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          className="text-muted-foreground hover:bg-muted hover:text-foreground group flex cursor-pointer items-center gap-2 rounded-lg p-1 px-2 text-sm transition-colors"
        >
          <FaGithub className="h-7 w-7 transition-transform duration-200 group-hover:rotate-12" />
          <span className="font-bold">GitHub</span>
        </motion.button>
        <AnimatePresence>{downloadOpen && <Download />}</AnimatePresence>
      </div>
    </div>
  );
});

export default Navbar;

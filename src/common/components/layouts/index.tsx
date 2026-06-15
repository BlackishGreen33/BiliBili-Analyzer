'use client';

import React from 'react';

import {
  Footer,
  SkipToContent,
  ThemeSettings,
} from '@/common/components/elements';
import Navbar from '@/common/components/navbar/Navbar';
import Sidebar from '@/common/components/sidebar/Sidebar';
import { Toaster } from '@/common/components/ui/toaster';
import { useLayoutStore } from '@/common/hooks/useLayoutStore';
import { useThemeStore } from '@/common/hooks/useThemeStore';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = React.memo(({ children }) => {
  const { activeMenu } = useLayoutStore();
  const { themeSettings } = useThemeStore();

  return (
    <div className="bg-main-bg dark:bg-main-dark-bg relative flex min-h-screen">
      <SkipToContent />
      <div
        className={`dark:bg-secondary-dark-bg ${activeMenu ? 'fixed z-40 w-72 bg-white' : 'w-0'}`}
      >
        <Sidebar />
      </div>
      <div
        className={
          activeMenu
            ? 'bg-main-bg dark:bg-main-dark-bg min-h-screen w-full md:ml-72'
            : 'bg-main-bg dark:bg-main-dark-bg min-h-screen w-full flex-1'
        }
      >
        <div className="navbar bg-main-bg dark:bg-main-dark-bg sticky top-0 z-30 w-full">
          <Navbar />
        </div>
        <div id="main" tabIndex={-1}>
          {themeSettings && <ThemeSettings />}
          {children}
        </div>
        <Footer />
        <Toaster />
      </div>
    </div>
  );
});

export default Layout;

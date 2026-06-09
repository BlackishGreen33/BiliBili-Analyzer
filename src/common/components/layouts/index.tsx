'use client';

import { useTheme } from 'next-themes';
import React, { useEffect } from 'react';

import useStore from '@/common/hooks/useStore';

import { Footer, ThemeSettings } from '../elements';
import Navbar from '../navbar/Navbar';
import Sidebar from '../sidebar/Sidebar';
import { Toaster } from '../ui/toaster';

const CHATBASE_ID = 'WWELx6VqHYeHPfUGO8a2J';
const CHATBASE_DOMAIN = 'www.chatbase.co';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = React.memo(({ children }) => {
  const { setCurrentColor, activeMenu, themeSettings } = useStore();
  const { setTheme, theme } = useTheme();

  useEffect(() => {
    const currentThemeColor = localStorage.getItem('colorMode');
    const currentThemeMode =
      localStorage.getItem('theme') === 'light' ? 'light' : 'dark';
    if (currentThemeColor && currentThemeMode) {
      setCurrentColor(currentThemeColor);
      setTheme(currentThemeMode);
    }
  }, [setCurrentColor, setTheme]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    if (document.getElementById('chatbase-script')) {
      return;
    }
    (window as unknown as { embeddedChatbotConfig: unknown }).embeddedChatbotConfig =
      {
        chatbotId: CHATBASE_ID,
        domain: CHATBASE_DOMAIN,
      };
    const script = document.createElement('script');
    script.id = 'chatbase-script';
    script.src = 'https://www.chatbase.co/embed.min.js';
    script.setAttribute('chatbotId', CHATBASE_ID);
    script.setAttribute('domain', CHATBASE_DOMAIN);
    script.defer = true;
    document.body.appendChild(script);
  }, []);

  return (
    <>
      <div className={theme === 'Dark' ? 'dark' : ''}>
        <div className="relative flex dark:bg-main-dark-bg">
          <div
            className={`dark:bg-secondary-dark-bg ${activeMenu ? 'sidebar fixed w-72 bg-white' : 'w-0'}`}
          >
            <Sidebar />
          </div>
          <div
            className={
              activeMenu
                ? 'min-h-screen w-full bg-main-bg dark:bg-main-dark-bg md:ml-72'
                : 'flex-2 min-h-screen w-full bg-main-bg dark:bg-main-dark-bg'
            }
          >
            <div className="navbar fixed w-full bg-main-bg dark:bg-main-dark-bg md:static">
              <Navbar />
            </div>
            <div>
              {themeSettings && <ThemeSettings />}
              {children}
            </div>
            <Footer />
            <Toaster />
          </div>
        </div>
      </div>
    </>
  );
});

export default Layout;

'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';
import { BiBarChartAlt2, BiCommentDetail } from 'react-icons/bi';
import { FiSettings } from 'react-icons/fi';
import { LuSearch } from 'react-icons/lu';

import { useLayoutStore } from '@/common/hooks/useLayoutStore';
import { useThemeStore } from '@/common/hooks/useThemeStore';
import {
  containerStagger,
  EASE_OUT_EXPO,
  fadeUp,
} from '@/common/styles/motion';

type NavItem = {
  title: string;
  links: Array<{
    name: string;
    nav: string;
    icon: React.ReactNode;
  }>;
};

const NAV_GROUPS: NavItem[] = [
  {
    title: '检索系统',
    links: [
      { name: '热门视频分类检索', nav: '', icon: <LuSearch /> },
      { name: '视频详细信息', nav: 'details', icon: <BiCommentDetail /> },
      { name: '聚合分析', nav: 'dashboard', icon: <BiBarChartAlt2 /> },
    ],
  },
  {
    title: '个性化',
    links: [{ name: '设置中心', nav: 'settings', icon: <FiSettings /> }],
  },
];

const NavLinkRow: React.FC<{
  href: string;
  isActive: boolean;
  currentColor: string;
  onClick: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  label: string;
  children: React.ReactNode;
}> = React.memo(
  ({ href, isActive, currentColor, onClick, label, children }) => (
    <motion.div
      variants={fadeUp}
      whileHover={{ x: 2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2, ease: EASE_OUT_EXPO }}
      className="m-2"
    >
      <Link
        href={href}
        onClick={onClick}
        className={`group transition-base flex cursor-pointer items-center gap-5 rounded-lg px-4 pt-3 pb-2.5 text-sm ${
          isActive
            ? 'font-medium text-white shadow-sm'
            : 'hover:bg-light-gray text-gray-700 dark:text-gray-200 dark:hover:text-black'
        }`}
        style={{ backgroundColor: isActive ? currentColor : '' }}
      >
        <span className="text-lg transition-transform duration-200 group-hover:scale-110">
          {children}
        </span>
        <span className="capitalize">{label}</span>
      </Link>
    </motion.div>
  )
);
NavLinkRow.displayName = 'NavLinkRow';

const SettingsLink: React.FC<{
  active: boolean;
  currentColor: string;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}> = React.memo(({ active, currentColor, onClick, label, children }) => (
  <motion.div
    variants={fadeUp}
    whileHover={{ x: 2 }}
    whileTap={{ scale: 0.98 }}
    transition={{ duration: 0.2, ease: EASE_OUT_EXPO }}
    className="m-2"
  >
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`group transition-base flex w-[calc(100%-1rem)] cursor-pointer items-center gap-5 rounded-lg px-4 pt-3 pb-2.5 text-sm ${
        active
          ? 'font-medium text-white shadow-sm'
          : 'hover:bg-light-gray text-gray-700 dark:text-gray-200 dark:hover:text-black'
      }`}
      style={{ backgroundColor: active ? currentColor : '' }}
    >
      <span className="text-lg transition-transform duration-200 group-hover:scale-110 group-hover:rotate-12">
        {children}
      </span>
      <span className="capitalize">{label}</span>
    </button>
  </motion.div>
));
SettingsLink.displayName = 'SettingsLink';

const Navigation: React.FC = React.memo(() => {
  const { currentColor, themeSettings, setThemeSettings } = useThemeStore();
  const { setActiveMenu, screenSize } = useLayoutStore();
  const pathname = usePathname();

  const handleCloseSideBar = () => {
    if (screenSize !== undefined && screenSize <= 900) {
      setActiveMenu(false);
    }
  };

  return (
    <motion.div
      className="mt-10"
      variants={containerStagger(0.05, 0.04)}
      initial="hidden"
      animate="show"
    >
      {NAV_GROUPS.map((item) => (
        <div key={item.title}>
          <motion.p
            variants={fadeUp}
            className="m-3 mt-4 text-xs font-medium tracking-wider text-gray-400 uppercase dark:text-gray-400"
          >
            {item.title}
          </motion.p>
          {item.links.map((link) => {
            if (link.nav === 'settings') {
              return (
                <SettingsLink
                  key={link.nav}
                  active={themeSettings}
                  currentColor={currentColor}
                  onClick={() => {
                    setThemeSettings(true);
                    handleCloseSideBar();
                  }}
                  label={link.name}
                >
                  {link.icon}
                </SettingsLink>
              );
            }
            const isHome = link.nav === '';
            const href = link.nav ? `/${link.nav}` : '/';
            const isActive = isHome
              ? pathname === '/'
              : pathname.startsWith(href);
            return (
              <NavLinkRow
                key={link.nav}
                href={href}
                isActive={isActive}
                currentColor={currentColor}
                onClick={handleCloseSideBar}
                label={link.name}
              >
                {link.icon}
              </NavLinkRow>
            );
          })}
        </div>
      ))}
    </motion.div>
  );
});

export default Navigation;

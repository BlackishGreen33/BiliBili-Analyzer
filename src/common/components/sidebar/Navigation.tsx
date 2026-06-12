'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { BiBarChartAlt2, BiCommentDetail } from 'react-icons/bi';
import { FiSettings } from 'react-icons/fi';
import { LuGitCompareArrows, LuSearch } from 'react-icons/lu';

import { useLayoutStore } from '@/common/hooks/useLayoutStore';
import { useThemeStore } from '@/common/hooks/useThemeStore';
import {
  containerStagger,
  EASE_OUT_EXPO,
  fadeUp,
} from '@/common/styles/motion';

type NavItem = {
  titleKey: 'nav.groupSearch' | 'nav.groupPersonal';
  links: Array<{
    nameKey:
      | 'nav.home'
      | 'nav.detail'
      | 'nav.dashboard'
      | 'nav.compare'
      | 'nav.settings';
    nav: string;
    icon: React.ReactNode;
  }>;
};

const NAV_GROUPS: NavItem[] = [
  {
    titleKey: 'nav.groupSearch',
    links: [
      { nameKey: 'nav.home', nav: '', icon: <LuSearch /> },
      { nameKey: 'nav.detail', nav: 'details', icon: <BiCommentDetail /> },
      { nameKey: 'nav.dashboard', nav: 'dashboard', icon: <BiBarChartAlt2 /> },
      {
        nameKey: 'nav.compare',
        nav: 'dashboard/compare',
        icon: <LuGitCompareArrows />,
      },
    ],
  },
  {
    titleKey: 'nav.groupPersonal',
    links: [{ nameKey: 'nav.settings', nav: 'settings', icon: <FiSettings /> }],
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
  const { t } = useTranslation();

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
        <div key={item.titleKey}>
          <motion.p
            variants={fadeUp}
            className="m-3 mt-4 text-xs font-medium tracking-wider text-gray-400 uppercase dark:text-gray-400"
          >
            {t(item.titleKey)}
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
                  label={t(link.nameKey)}
                >
                  {link.icon}
                </SettingsLink>
              );
            }
            const isHome = link.nav === '';
            const href = link.nav ? `/${link.nav}` : '/';
            const isActive = isHome ? pathname === '/' : pathname === href;
            return (
              <NavLinkRow
                key={link.nav}
                href={href}
                isActive={isActive}
                currentColor={currentColor}
                onClick={handleCloseSideBar}
                label={t(link.nameKey)}
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

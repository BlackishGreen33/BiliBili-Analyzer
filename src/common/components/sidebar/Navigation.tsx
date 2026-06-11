'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';
import { BiBarChartAlt2, BiCommentDetail, BiHomeAlt2 } from 'react-icons/bi';
import { FiSettings } from 'react-icons/fi';
import { LuSearch } from 'react-icons/lu';

import { useLayoutStore } from '@/common/hooks/useLayoutStore';
import { useThemeStore } from '@/common/hooks/useThemeStore';

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
      { name: '热门视频分类检索', nav: 'search', icon: <LuSearch /> },
      { name: '视频详细信息', nav: 'details', icon: <BiCommentDetail /> },
      { name: '聚合分析', nav: 'dashboard', icon: <BiBarChartAlt2 /> },
    ],
  },
  {
    title: '首页',
    links: [{ name: '返回首页', nav: '', icon: <BiHomeAlt2 /> }],
  },
  {
    title: '个性化',
    links: [{ name: '设置中心', nav: 'settings', icon: <FiSettings /> }],
  },
];

const activeLink =
  'flex items-center gap-5 pl-4 pt-3 pb-2.5 rounded-lg text-white text-md m-2';
const normalLink =
  'flex items-center gap-5 pl-4 pt-3 pb-2.5 rounded-lg text-md text-gray-700 dark:text-gray-200 dark:hover:text-black hover:bg-light-gray m-2';

interface NavLinkProps {
  href: string;
  exact?: boolean;
  children: React.ReactNode;
  currentColor: string;
  className?: string;
  onClick?: (event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => void;
}

const NavLink: React.FC<NavLinkProps> = React.memo(
  ({ href, exact = false, children, currentColor, ...props }) => {
    const pathname = usePathname();
    const isActive = exact ? pathname === href : pathname.startsWith(href);

    return (
      <Link
        href={href}
        {...props}
        className={isActive ? `${activeLink} active` : normalLink}
        style={{ backgroundColor: isActive ? currentColor : '' }}
      >
        {children}
      </Link>
    );
  }
);

const Navigation: React.FC = React.memo(() => {
  const { currentColor, themeSettings, setThemeSettings } = useThemeStore();
  const { setActiveMenu, screenSize } = useLayoutStore();

  const handleCloseSideBar = () => {
    if (screenSize !== undefined && screenSize <= 900) {
      setActiveMenu(false);
    }
  };

  const activeSettings =
    'flex items-center gap-5 pl-4 pt-3 pb-2.5 rounded-lg text-white text-md m-2 cursor-pointer';
  const normalSettings =
    'flex items-center gap-5 pl-4 pt-3 pb-2.5 rounded-lg text-md text-gray-700 dark:text-gray-200 dark:hover:text-black hover:bg-light-gray m-2 cursor-pointer';

  return (
    <div className="mt-10">
      {NAV_GROUPS.map((item) => (
        <div key={item.title}>
          <p className="m-3 mt-4 text-gray-400 uppercase dark:text-gray-400">
            {item.title}
          </p>
          {item.links.map((link) =>
            link.nav === 'settings' ? (
              <div
                key={link.nav}
                className={
                  themeSettings ? `${activeSettings} active` : normalSettings
                }
                style={{ backgroundColor: themeSettings ? currentColor : '' }}
                onClick={() => setThemeSettings(true)}
              >
                {link.icon}
                <span className="capitalize">{link.name}</span>
              </div>
            ) : (
              <NavLink
                href={link.nav ? `/${link.nav}` : '/'}
                key={link.nav}
                onClick={handleCloseSideBar}
                currentColor={currentColor}
              >
                {link.icon}
                <span className="capitalize">{link.name}</span>
              </NavLink>
            )
          )}
        </div>
      ))}
    </div>
  );
});

export default Navigation;

'use client';

import React from 'react';

import useStore from '@/common/hooks/useStore';
import { links } from '../../dummy/dummy';

import NavLink from '../elements/NavLink';

const Navigation: React.FC = React.memo(() => {
  const { currentColor, activeMenu, setActiveMenu, screenSize } = useStore();

  const handleCloseSideBar = () => {
    if (activeMenu !== undefined && screenSize! <= 900) {
      setActiveMenu(false);
    }
  };

  return (
    <div className="mt-10 ">
      {links.map((item) => (
        <div key={item.title}>
          <p className="m-3 mt-4 uppercase text-gray-400 dark:text-gray-400">
            {item.title}
          </p>
          {item.links.map((link) => (
            <NavLink
              href={`/${link.name}`}
              key={link.name}
              onClick={handleCloseSideBar}
              currentColor={currentColor}
            >
              {link.icon}
              <span className="capitalize ">{link.name}</span>
            </NavLink>
          ))}
        </div>
      ))}
    </div>
  );
});

export default Navigation;

'use client';

import { TooltipComponent } from '@syncfusion/ej2-react-popups';
import { useRouter } from 'next/navigation';
import React, { useCallback, useEffect } from 'react';
import { AiOutlineMenu } from 'react-icons/ai';
import { CiLocationArrow1 } from 'react-icons/ci';
import { FaDownload, FaGithub } from 'react-icons/fa';

import { Notification } from '@/common/components/elements';
import useStore from '@/common/hooks/useStore';

import NavButton from './NavButton';

const Navbar: React.FC = React.memo(() => {
  const router = useRouter();
  const {
    currentColor,
    activeMenu,
    setActiveMenu,
    isClicked,
    setScreenSize,
    screenSize,
    handleClick,
  } = useStore();

  const handleResize = useCallback(() => {
    setScreenSize(window.innerWidth);
  }, [setScreenSize]);

  useEffect(() => {
    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  useEffect(() => {
    if (screenSize! <= 900) {
      setActiveMenu(false);
    } else {
      setActiveMenu(true);
    }
  }, [screenSize, setActiveMenu]);

  const handleActiveMenu = useCallback(
    () => setActiveMenu(!activeMenu),
    [activeMenu, setActiveMenu]
  );

  return (
    <div className="relative flex justify-between p-2 md:ml-6 md:mr-6">
      <NavButton
        title="菜单"
        customFunc={handleActiveMenu}
        color={currentColor}
        icon={<AiOutlineMenu />}
      />
      <div className="flex">
        <NavButton
          title="下载应用"
          dotColor="rgb(254, 201, 15)"
          customFunc={() => handleClick('notification')}
          color={currentColor}
          icon={<FaDownload />}
        />
        <TooltipComponent content="GitHub 仓库" position="BottomCenter">
          <div
            className="flex cursor-pointer items-center gap-2 rounded-lg p-1 hover:bg-light-gray"
            onClick={() =>
              router.push(
                'https://github.com/BlackishGreen33/BiliBili-Analyzer'
              )
            }
          >
            <FaGithub className="h-8 w-8 rounded-full" />
            <p>
              <span className="ml-1 text-lg font-bold text-gray-400">
                GitHub
              </span>
            </p>
            <CiLocationArrow1 className="text-md text-gray-400" />
          </div>
        </TooltipComponent>
        {isClicked.notification && <Notification />}
      </div>
    </div>
  );
});

export default Navbar;

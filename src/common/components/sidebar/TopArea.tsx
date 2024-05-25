'use client';

import { TooltipComponent } from '@syncfusion/ej2-react-popups';
import React from 'react';
import { MdOutlineCancel } from 'react-icons/md';

import useStore from '@/common/hooks/useStore';

import Logo from './Logo';

const TopArea: React.FC = React.memo(() => {
  const { currentColor, activeMenu, setActiveMenu } = useStore();

  return (
    <div className="flex items-center justify-between">
      <Logo />
      <TooltipComponent content="Menu" position="BottomCenter">
        <button
          type="button"
          onClick={() => setActiveMenu(!activeMenu)}
          style={{ color: currentColor }}
          className="mt-4 block rounded-full p-3 text-xl hover:bg-light-gray md:hidden"
        >
          <MdOutlineCancel />
        </button>
      </TooltipComponent>
    </div>
  );
});

export default TopArea;

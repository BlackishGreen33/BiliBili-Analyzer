'use client';

import Image from 'next/image';
import React from 'react';
import { MdOutlineCancel } from 'react-icons/md';

import useStore from '@/common/hooks/useStore';
import { chatData } from '../../dummy/dummy';

import { Button } from '.';

const Notification: React.FC = React.memo(() => {
  const { currentColor } = useStore();

  return (
    <div className="nav-item absolute right-5 top-16 w-96 rounded-lg bg-white p-8 dark:bg-[#42464D] md:right-40">
      <div className="flex items-center justify-between">
        <div className="flex gap-3">
          <p className="text-lg font-semibold dark:text-gray-200">
            Notifications
          </p>
          <button
            type="button"
            className="bg-orange-theme rounded p-1 px-2 text-xs text-white "
          >
            {' '}
            5 New
          </button>
        </div>
        <Button
          icon={<MdOutlineCancel />}
          color="rgb(153, 171, 180)"
          bgHoverColor="light-gray"
          size="2xl"
          borderRadius="50%"
        />
      </div>
      <div className="mt-5 ">
        {chatData?.map((item, index) => (
          <div
            key={index}
            className="flex items-center gap-5 border-b-1 border-color p-3 leading-8"
          >
            <Image
              className="h-10 w-10 rounded-full"
              src={item.image}
              alt={item.message}
              loading="lazy"
              width={200}
              height={200}
            />
            <div>
              <p className="font-semibold dark:text-gray-200">{item.message}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {' '}
                {item.desc}{' '}
              </p>
            </div>
          </div>
        ))}
        <div className="mt-5">
          <Button
            color="white"
            bgColor={currentColor}
            text="See all notifications"
            borderRadius="10px"
            width="full"
          />
        </div>
      </div>
    </div>
  );
});

export default Notification;

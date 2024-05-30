'use client';

import React from 'react';
import { MdOutlineCancel } from 'react-icons/md';

import useStore from '@/common/hooks/useStore';
import { useRouter } from 'next/navigation';

import Image from 'next/image';
import { Button } from '.';

const Download: React.FC = React.memo(() => {
  const router = useRouter();
  const { currentColor } = useStore();

  return (
    <div className="nav-item absolute right-5 top-16 w-96 rounded-lg bg-white p-8 dark:bg-[#42464D] md:right-40">
      <div className="flex items-center justify-between">
        <div className="flex gap-3">
          <p className="text-lg font-semibold dark:text-gray-200">下载应用</p>
        </div>
        <Button
          icon={<MdOutlineCancel />}
          color="rgb(153, 171, 180)"
          bgHoverColor="light-gray"
          size="2xl"
          borderRadius="50%"
        />
      </div>
      <div className="mt-5">
        <Image
          src="/qrcode.png"
          alt="qrcode"
          width={200}
          height={200}
          loading="lazy"
          className="h-full w-full"
        />
        <div
          className="mt-5"
          onClick={() =>
            router.push(
              'https://github.com/BlackishGreen33/BiliBili-Analyzer/releases'
            )
          }
        >
          <Button
            color="white"
            bgColor={currentColor}
            text="前往下载"
            borderRadius="10px"
            width="full"
          />
        </div>
      </div>
    </div>
  );
});

export default Download;

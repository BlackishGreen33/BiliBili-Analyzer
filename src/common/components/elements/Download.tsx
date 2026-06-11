'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import React from 'react';
import { FaXmark } from 'react-icons/fa6';

import { Button } from '@/common/components/ui/button';
import { useThemeStore } from '@/common/hooks/useThemeStore';
import { useUiStore } from '@/common/hooks/useUiStore';
import { EASE_OUT_EXPO } from '@/common/styles/motion';

const Download: React.FC = React.memo(() => {
  const router = useRouter();
  const { currentColor } = useThemeStore();
  const { setDownloadOpen } = useUiStore();

  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.96 }}
      transition={{ duration: 0.24, ease: EASE_OUT_EXPO }}
      className="bg-popover absolute top-16 right-5 w-80 rounded-xl border p-5 shadow-xl md:right-40 dark:bg-[#42464D]"
    >
      <div className="flex items-center justify-between">
        <p className="text-base font-semibold">下载应用</p>
        <Button
          variant="ghost"
          size="icon"
          aria-label="关闭"
          onClick={() => setDownloadOpen(false)}
          className="h-8 w-8 cursor-pointer"
        >
          <FaXmark />
        </Button>
      </div>
      <div className="mt-4 flex flex-col items-center gap-4">
        <Image
          src="/qrcode.png"
          alt="qrcode"
          width={180}
          height={180}
          loading="lazy"
          className="h-44 w-44"
        />
        <Button
          className="w-full cursor-pointer active:scale-95"
          style={{ backgroundColor: currentColor, color: 'white' }}
          onClick={() =>
            router.push(
              'https://github.com/BlackishGreen33/BiliBili-Analyzer/releases'
            )
          }
        >
          前往下载
        </Button>
      </div>
    </motion.div>
  );
});

export default Download;

'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { FaDice } from 'react-icons/fa';
import { IoSearchSharp } from 'react-icons/io5';

import { Button } from '@/common/components/ui/button';
import { Input } from '@/common/components/ui/input';
import { useToast } from '@/common/components/ui/use-toast';
import { useThemeStore } from '@/common/hooks/useThemeStore';
import { useRandomBvid } from '@/common/libs/result-data';
import { extractBvid } from '@/common/utils/format';

const SearchBar: React.FC = React.memo(() => {
  const router = useRouter();
  const { currentColor } = useThemeStore();
  const { toast } = useToast();
  const [value, setValue] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const {
    data: randomBvid,
    mutate: refetchRandom,
    isLoading,
  } = useRandomBvid();

  const navigateToBvid = (bvid: string | null | undefined) => {
    if (!bvid) {
      toast({
        variant: 'destructive',
        title: '暂无可用视频',
        description: '请稍后再试。',
      });
      return;
    }
    router.push('/details?bvid=' + bvid);
  };

  const handleSearch = () => {
    const bvid = extractBvid(value);
    if (!bvid) {
      toast({
        variant: 'destructive',
        title: '无法从 URL 中获取 BV 号',
        description: '请确认输入的链接是否正确。',
      });
      return;
    }
    router.push('/details?bvid=' + bvid);
  };

  const handleRandom = async () => {
    if (randomBvid) {
      navigateToBvid(randomBvid);
      return;
    }
    try {
      const result = await refetchRandom();
      navigateToBvid(result ?? null);
    } catch {
      navigateToBvid(null);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-3xl">
      <Image
        src="https://i0.hdslb.com/bfs/article/a9944bcb75fcd2d0aa67f1064b6287f1fe66c4c0.jpg@1320w_740h.avif"
        alt="background"
        width={1320}
        height={740}
        loading="lazy"
        referrerPolicy="no-referrer"
        className={`h-[40vh] w-full object-cover blur-md transition duration-300 ease-out md:h-[70vh] ${
          isInputFocused ? 'scale-150' : ''
        }`}
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 p-6">
        <Input
          className="h-12 w-1/2 max-w-xl rounded-full bg-gray-100/80 px-6 text-base backdrop-blur dark:bg-gray-900/80"
          placeholder="在此处输入视频链接"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setIsInputFocused(true)}
          onBlur={() => setIsInputFocused(false)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSearch();
          }}
        />
        <div className="flex flex-wrap justify-center gap-3">
          <Button
            className="h-11 gap-2 px-5"
            style={{ backgroundColor: currentColor, color: 'white' }}
            onClick={handleSearch}
          >
            <IoSearchSharp />
            搜索视频
          </Button>
          <Button
            className="h-11 gap-2 px-5"
            style={{ backgroundColor: currentColor, color: 'white' }}
            onClick={handleRandom}
            disabled={isLoading}
          >
            <FaDice />
            {isLoading ? '加载中…' : '随机'}
          </Button>
        </div>
      </div>
    </div>
  );
});

export default SearchBar;

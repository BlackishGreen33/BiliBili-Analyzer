'use client';

import Image from 'next/image';
import React, { useRef, useState } from 'react';
import { FaDice } from 'react-icons/fa';
import { IoSearchSharp } from 'react-icons/io5';

import { Button } from '@/common/components/ui/button';
import { Input } from '@/common/components/ui/input';
import { ToastAction } from '@/common/components/ui/toast';
import { useToast } from '@/common/components/ui/use-toast';
import useStore from '@/common/hooks/useStore';
import axios from 'axios';
import { useRouter } from 'next/navigation';

const SearchBar: React.FC = React.memo(() => {
  const router = useRouter();
  const imageRef = useRef(null);

  const [value, setValue] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const { currentColor } = useStore();
  const { toast } = useToast();

  const handleClicked = async (url: string) => {
    const pattern = /video\/([a-zA-Z0-9]+)/;
    const matchResult = url.match(pattern);
    if (matchResult && matchResult[1]) {
      const bvid = matchResult[1];
      router.push('/details?bvid=' + bvid);
    } else {
      toast({
        variant: 'destructive',
        title: '无法从 URL 中获取 BV 号',
        description: '请确认输入的链接是否正确。',
        action: <ToastAction altText="Try again">再试一次</ToastAction>,
      });
    }
  };

  const getVideoTags = async () => {
    const res = await axios.get('/api/randomBvid');
    router.push('/details?bvid=' + res.data);
  };

  return (
    <div className="relative overflow-hidden rounded-3xl">
      <Image
        ref={imageRef}
        src="https://i0.hdslb.com/bfs/article/a9944bcb75fcd2d0aa67f1064b6287f1fe66c4c0.jpg@1320w_740h.avif"
        alt="background"
        width={1320}
        height={740}
        loading="lazy"
        referrerPolicy="no-referrer"
        className={`h-[40vh] blur-md transition duration-300 ease-in-out md:h-[70vh] ${
          isInputFocused ? 'scale-150' : ''
        }`}
      />
      <div className="absolute left-0 top-0 flex h-[40vh] w-full flex-col items-center justify-center gap-[2vh] md:h-[70vh]">
        <Input
          className="h-[5vh] w-1/2 rounded-l-full rounded-r-full bg-gray-100 p-5 text-[2vh] dark:bg-gray-900"
          placeholder="在此处输入视频链接"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setIsInputFocused(true)}
          onBlur={() => setIsInputFocused(false)}
        />
        <div className="flex gap-[2vh]">
          <Button
            className="flex h-[4vh] gap-2 text-[1.6vh]"
            style={{ backgroundColor: currentColor }}
            onClick={() => {
              handleClicked(value);
            }}
          >
            <IoSearchSharp />
            搜索视频
          </Button>
          <Button
            className="flex h-[4vh] gap-2 text-[1.6vh]"
            style={{ backgroundColor: currentColor }}
            onClick={getVideoTags}
          >
            <FaDice />
            随机
          </Button>
        </div>
      </div>
    </div>
  );
});

export default SearchBar;

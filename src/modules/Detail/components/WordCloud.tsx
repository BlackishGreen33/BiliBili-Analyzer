'use client';

import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import React from 'react';
import D3WordCloud from 'react-d3-cloud';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/common/components/ui/card';

interface WordCloudProps {
  formattedTopics: { text: string; value: number }[];
}

const fontSizeMapper = (word: { value: number }) =>
  Math.log2(word.value) * 5 + 16;

const WordCloud: React.FC<WordCloudProps> = React.memo(
  ({ formattedTopics }) => {
    const theme = useTheme();
    const router = useRouter();

    return (
      <Card className="flex-1">
        <CardHeader>
          <CardTitle>标签云</CardTitle>
          <CardDescription>视频相关的搜索词</CardDescription>
        </CardHeader>
        <CardContent>
          <D3WordCloud
            data={formattedTopics}
            height={500}
            font="Times"
            fontSize={fontSizeMapper}
            rotate={0}
            padding={10}
            fill={theme.theme === 'dark' ? 'white' : 'black'}
            onWordClick={(e, d) => {
              router.push('/quiz?topic=' + d.text);
            }}
          />
        </CardContent>
      </Card>
    );
  }
);

export default WordCloud;

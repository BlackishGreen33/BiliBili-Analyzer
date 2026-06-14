'use client';

import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import React from 'react';
import D3WordCloud from 'react-d3-cloud';
import { useTranslation } from 'react-i18next';

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
    const { t } = useTranslation();

    return (
      <Card className="flex-1">
        <CardHeader>
          <CardTitle>{t('detail.tags.title')}</CardTitle>
          <CardDescription>{t('detail.tags.desc')}</CardDescription>
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
            onWordClick={(_e, d) => {
              router.push('/?tag=' + encodeURIComponent(d.text));
            }}
          />
        </CardContent>
      </Card>
    );
  }
);

export default WordCloud;

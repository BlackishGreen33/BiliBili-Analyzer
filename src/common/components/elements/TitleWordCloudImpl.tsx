'use client';

import { useTheme } from 'next-themes';
import React from 'react';
import D3WordCloud from 'react-d3-cloud';

import { useThemeStore } from '@/common/hooks/useThemeStore';

type WordCloudProps = {
  tokens: ReadonlyArray<{ word: string; count: number }>;
  /** Word cloud 高度（px） */
  height?: number;
  /** 最多顯示 token 數 */
  maxWords?: number;
};

const TitleWordCloudImpl: React.FC<WordCloudProps> = React.memo(
  ({ tokens, height = 280, maxWords = 80 }) => {
    const { theme } = useTheme();
    const { currentColor } = useThemeStore();
    const isDark = theme === 'dark';

    const data = React.useMemo(
      () =>
        tokens.slice(0, maxWords).map((t) => ({
          text: t.word,
          value: t.count,
        })),
      [tokens, maxWords]
    );

    if (data.length === 0) {
      return (
        <div
          className="text-muted-foreground flex items-center justify-center text-sm"
          style={{ height }}
        >
          —
        </div>
      );
    }

    return (
      <div style={{ height }}>
        <D3WordCloud
          data={data as { text: string; value: number }[]}
          height={height}
          font="Times"
          fontWeight={600}
          spiral="archimedean"
          rotate={0}
          padding={2}
          random={() => 0.5}
          fill={isDark ? '#e4e4e7' : currentColor}
        />
      </div>
    );
  }
);
TitleWordCloudImpl.displayName = 'TitleWordCloudImpl';

export default TitleWordCloudImpl;

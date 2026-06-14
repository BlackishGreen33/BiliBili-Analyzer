import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import WordCloud from '@/modules/Detail/components/WordCloud';
import { renderWithProviders } from '@/test/test-utils';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

// Mock next-themes (WordCloud 用到 useTheme)
vi.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'light' }),
}));

type CloudWord = { text: string; value: number };

// 攔截 react-d3-cloud 的 onWordClick
let lastOnWordClick: ((e: unknown, d: CloudWord) => void) | null = null;
let lastData: ReadonlyArray<CloudWord> = [];

vi.mock('react-d3-cloud', () => ({
  default: (props: {
    data: ReadonlyArray<CloudWord>;
    onWordClick?: (e: unknown, d: CloudWord) => void;
  }) => {
    lastOnWordClick = props.onWordClick ?? null;
    lastData = props.data;
    return (
      <div data-testid="d3-wordcloud" data-len={String(props.data.length)} />
    );
  },
}));

const topics = [
  { text: '标签1', value: 200 },
  { text: '标签2', value: 100 },
];

describe('WordCloud', () => {
  it('forwards the data array to react-d3-cloud', () => {
    renderWithProviders(<WordCloud formattedTopics={[...topics]} />);
    const cloud = screen.getByTestId('d3-wordcloud');
    expect(cloud).toBeInTheDocument();
    expect(cloud.getAttribute('data-len')).toBe('2');
    expect(lastData).toEqual(topics);
  });

  it('routes to /?tag=... when a word is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<WordCloud formattedTopics={[...topics]} />);
    expect(lastOnWordClick).not.toBeNull();
    await user.click(screen.getByTestId('d3-wordcloud'));
    // 直接呼叫 callback（react-d3-cloud 內部觸發）
    lastOnWordClick!(null, topics[0]!);
    expect(mockPush).toHaveBeenCalledWith(
      '/?tag=' + encodeURIComponent('标签1')
    );
  });
});

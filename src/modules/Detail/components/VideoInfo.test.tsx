import { screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useThemeStore } from '@/common/hooks/useThemeStore';
import VideoInfo from '@/modules/Detail/components/VideoInfo';
import { renderWithProviders } from '@/test/test-utils';

const mockUseRelatedVideos = vi.fn();
const mockUseSWR = vi.fn();
const mockUseTranslation = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'light' }),
}));

vi.mock('react-i18next', async () => {
  const actual =
    await vi.importActual<typeof import('react-i18next')>('react-i18next');
  return {
    ...actual,
    useTranslation: () => mockUseTranslation(),
  };
});

vi.mock('@/common/libs/video-data', async () => {
  const actual = await vi.importActual<
    typeof import('@/common/libs/video-data')
  >('@/common/libs/video-data');
  return {
    ...actual,
    useRelatedVideos: (...args: unknown[]) => mockUseRelatedVideos(...args),
  };
});

vi.mock('swr', async () => {
  const actual = await vi.importActual<typeof import('swr')>('swr');
  return {
    ...actual,
    default: (key: unknown, fetcher: unknown) => mockUseSWR(key, fetcher),
  };
});

// 子組件 mock — 避免實際渲染 recharts / iframe 等
vi.mock('@/modules/Detail/components/Video', () => ({
  default: () => <div data-testid="video-frame" />,
}));
vi.mock('@/modules/Detail/components/Base', () => ({
  default: ({ videoInfo }: { videoInfo: { bvid: string } }) => (
    <div data-testid="base">Base:{videoInfo.bvid}</div>
  ),
}));
vi.mock('@/modules/Detail/components/StackedChart', () => ({
  default: () => <div data-testid="stacked-chart" />,
}));
vi.mock('@/modules/Detail/components/WordCloud', () => ({
  default: () => <div data-testid="wordcloud" />,
}));
vi.mock('@/modules/Detail/components/Analization', () => ({
  default: () => <div data-testid="analization" />,
}));
vi.mock('@/common/components/elements', async () => {
  const actual = await vi.importActual<
    typeof import('@/common/components/elements')
  >('@/common/components/elements');
  return {
    ...actual,
    LengthRecommendCard: ({ scope }: { scope: { value: string } }) => (
      <div data-testid="length-recommend">LengthCard:{scope.value}</div>
    ),
  };
});

const videoInfo = {
  bvid: 'BV1abc',
  aid: 1,
  cid: 1,
  title: 'Test Video',
  pic: 'https://example.com/pic.jpg',
  duration: 600,
  pubdate: 1700000000,
  owner: { mid: 100, name: 'TestUP', face: 'https://example.com/face.jpg' },
  stat: {
    aid: 1,
    view: 100,
    danmaku: 0,
    reply: 0,
    favorite: 0,
    coin: 0,
    share: 0,
    like: 0,
  },
};

const videoTags = {
  firstChannel: '游戏',
  secondChannel: '单机游戏',
  ordinaryTags: ['原神', '评测'],
};

describe('VideoInfo', () => {
  beforeEach(() => {
    mockUseRelatedVideos.mockReset();
    mockUseSWR.mockReset();
    mockUseTranslation.mockReset();
    useThemeStore.setState({ currentColor: '#FB7299' });

    mockUseTranslation.mockReturnValue({
      t: (k: string, params?: Record<string, unknown>) => {
        if (params) {
          let result = k;
          for (const [pk, pv] of Object.entries(params)) {
            result = result.replace(`{${pk}}`, String(pv));
          }
          return result;
        }
        return k;
      },
      i18n: { language: 'zh-CN' },
    });

    // 預設: 沒有 up / channel related videos
    mockUseRelatedVideos.mockReturnValue({ data: null, isLoading: false });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows Spinner while videoInfo and tags are loading', () => {
    mockUseSWR.mockReturnValue({ data: undefined, isLoading: true });
    renderWithProviders(<VideoInfo bvid="BV1abc" />);
    // 兩次 useSWR (videoInfo + tags) 都 loading → Spinner
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders the error state when videoInfo fails to load', () => {
    mockUseSWR
      .mockReturnValueOnce({ data: undefined, isLoading: false }) // videoInfo 失敗
      .mockReturnValueOnce({ data: videoTags, isLoading: false }); // tags 成功
    renderWithProviders(<VideoInfo bvid="BV1abc" />);
    expect(screen.getByText('detail.error.title')).toBeInTheDocument();
    expect(screen.getByText('detail.error.hint')).toBeInTheDocument();
  });

  it('renders all major sections when data is ready', async () => {
    mockUseSWR
      .mockReturnValueOnce({ data: videoInfo, isLoading: false })
      .mockReturnValueOnce({ data: videoTags, isLoading: false });

    mockUseRelatedVideos
      .mockReturnValueOnce({
        data: {
          video: [
            {
              bvid: 'BV1abc',
              url: '',
              cover: '',
              title: 'self',
              UP: 'me',
              views: 1,
            },
          ],
        },
        isLoading: false,
      })
      .mockReturnValueOnce({
        data: {
          video: [
            {
              bvid: 'BV2def',
              url: 'https://www.bilibili.com/video/BV2def',
              cover: '',
              title: 'other',
              UP: 'me2',
              views: 2,
            },
          ],
        },
        isLoading: false,
      });

    renderWithProviders(<VideoInfo bvid="BV1abc" />);

    await waitFor(() => {
      expect(screen.getByTestId('video-frame')).toBeInTheDocument();
    });
    expect(screen.getByTestId('base')).toHaveTextContent('Base:BV1abc');
    expect(screen.getByTestId('stacked-chart')).toBeInTheDocument();
    expect(screen.getByTestId('wordcloud')).toBeInTheDocument();
    expect(screen.getByTestId('analization')).toBeInTheDocument();
    expect(screen.getByTestId('length-recommend')).toBeInTheDocument();
  });

  it('skips related video lists when they are empty', () => {
    mockUseSWR
      .mockReturnValueOnce({ data: videoInfo, isLoading: false })
      .mockReturnValueOnce({ data: videoTags, isLoading: false });

    // 兩個 related 都是 null → 不渲染 RelatedVideoList
    mockUseRelatedVideos.mockReturnValue({ data: null, isLoading: false });

    renderWithProviders(<VideoInfo bvid="BV1abc" />);

    // 不應該出現 "More from" / "More in" 標題
    expect(screen.queryByText(/More from/i)).toBeNull();
    expect(screen.queryByText(/More in/i)).toBeNull();
  });
});

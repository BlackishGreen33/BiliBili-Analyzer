import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useLayoutStore } from '@/common/hooks/useLayoutStore';
import { useThemeStore } from '@/common/hooks/useThemeStore';
import Search from '@/modules/Search/components/Search';
import { renderWithProviders } from '@/test/test-utils';

const mockPush = vi.fn();
const mockToast = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

const mockUseResultList = vi.fn();
const mockUseLatestCrawl = vi.fn();
vi.mock('@/common/libs/result-data', async () => {
  const actual = await vi.importActual<
    typeof import('@/common/libs/result-data')
  >('@/common/libs/result-data');
  return {
    ...actual,
    useResultList: () => mockUseResultList(),
    useLatestCrawl: (...args: unknown[]) => mockUseLatestCrawl(...args),
  };
});

const mockUseSearchFilters = vi.fn();
const mockUseInfiniteScroll = vi.fn();
vi.mock('@/modules/Search/hooks', async () => {
  const actual = await vi.importActual<typeof import('@/modules/Search/hooks')>(
    '@/modules/Search/hooks'
  );
  return {
    ...actual,
    useSearchFilters: (...args: unknown[]) => mockUseSearchFilters(...args),
    useInfiniteScroll: (...args: unknown[]) => mockUseInfiniteScroll(...args),
  };
});

vi.mock('@/common/components/ui/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

// 預設 mock factory 設定
const defaultFilters = () => ({
  searchValue: '',
  selectedChannels: [],
  activeTag: null,
  selectedTime: null,
  effectiveTime: '2026-01-15',
  filtered: [],
  visible: [],
  setSearchValue: vi.fn(),
  setSelectedChannels: vi.fn(),
  setActiveTag: vi.fn(),
  handleReset: vi.fn(),
  handleChangeDate: vi.fn(),
  loadMore: vi.fn(),
});

const defaultResult = () => ({
  time: 1700000000000,
  video: [
    {
      bvid: 'BV1abc',
      url: 'https://www.bilibili.com/video/BV1abc',
      cover: 'https://i0.hdslb.com/bfs/archive/abc.jpg',
      title: 'Test video title',
      UP: 'TestUP',
      views: 100000,
      tags: {
        firstChannel: '游戏',
        secondChannel: '单机游戏',
        ordinaryTags: ['原神', '评测'],
      },
    },
  ],
});

beforeEach(() => {
  mockPush.mockReset();
  mockToast.mockReset();
  mockUseResultList.mockReset();
  mockUseLatestCrawl.mockReset();
  mockUseSearchFilters.mockReset();
  mockUseInfiniteScroll.mockReset();

  mockUseResultList.mockReturnValue({
    data: ['2026-01-15', '2026-01-14'],
  });
  mockUseLatestCrawl.mockReturnValue({
    data: defaultResult(),
    isLoading: false,
  });
  mockUseSearchFilters.mockImplementation(() => defaultFilters());
  mockUseInfiniteScroll.mockReturnValue(undefined);

  useThemeStore.setState({ currentColor: '#FB7299' });
  useLayoutStore.setState({ screenSize: 1280 });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Search', () => {
  it('renders hero title and filter card', () => {
    renderWithProviders(<Search />);
    expect(screen.getByText('哔哩哔哩近期热门视频')).toBeInTheDocument();
    expect(screen.getByText('筛选条件')).toBeInTheDocument();
  });

  it('shows empty state when no filtered videos', () => {
    mockUseSearchFilters.mockReturnValue({
      ...defaultFilters(),
      filtered: [],
      visible: [],
    });
    renderWithProviders(<Search />);
    expect(screen.getByText('没有匹配的视频')).toBeInTheDocument();
  });

  it('renders video cards when filtered list is non-empty', async () => {
    const video = {
      bvid: 'BV1abc',
      url: 'https://www.bilibili.com/video/BV1abc',
      cover: 'https://i0.hdslb.com/bfs/archive/abc.jpg',
      title: 'Test video',
      UP: 'TestUP',
      views: 100,
      tags: {
        firstChannel: '游戏',
        secondChannel: '单机',
        ordinaryTags: [],
      },
    };
    mockUseSearchFilters.mockReturnValue({
      ...defaultFilters(),
      filtered: [video],
      visible: [video],
    });
    renderWithProviders(<Search />);
    await waitFor(() => {
      expect(screen.getByText('Test video')).toBeInTheDocument();
    });
  });

  it('clicking a video card navigates to /details?bvid=...', async () => {
    const user = userEvent.setup();
    const video = {
      bvid: 'BV1xyz',
      url: 'https://www.bilibili.com/video/BV1xyz',
      cover: 'https://i0.hdslb.com/bfs/archive/abc.jpg',
      title: 'Click me',
      UP: 'TestUP',
      views: 100,
      tags: {
        firstChannel: '游戏',
        secondChannel: '单机',
        ordinaryTags: [],
      },
    };
    mockUseSearchFilters.mockReturnValue({
      ...defaultFilters(),
      filtered: [video],
      visible: [video],
    });
    renderWithProviders(<Search />);

    await waitFor(() => {
      expect(screen.getByText('Click me')).toBeInTheDocument();
    });
    await user.click(screen.getByText('Click me'));
    expect(mockPush).toHaveBeenCalledWith('/details?bvid=BV1xyz');
  });

  it('clicking a tag chip calls setActiveTag', async () => {
    const user = userEvent.setup();
    const setActiveTag = vi.fn();
    const video = {
      bvid: 'BV1xyz',
      url: 'https://www.bilibili.com/video/BV1xyz',
      cover: 'https://i0.hdslb.com/bfs/archive/abc.jpg',
      title: 'Click me',
      UP: 'TestUP',
      views: 100,
      tags: {
        firstChannel: '游戏',
        secondChannel: '单机',
        ordinaryTags: ['原神'],
      },
    };
    mockUseSearchFilters.mockReturnValue({
      ...defaultFilters(),
      filtered: [video],
      visible: [video],
      setActiveTag,
    });
    renderWithProviders(<Search />);
    await waitFor(() => {
      expect(screen.getByText('原神')).toBeInTheDocument();
    });
    await user.click(screen.getByText('原神'));
    expect(setActiveTag).toHaveBeenCalledWith('原神');
  });

  it('shows loading skeleton when result is undefined', () => {
    mockUseLatestCrawl.mockReturnValue({ data: null, isLoading: true });
    mockUseSearchFilters.mockReturnValue({
      ...defaultFilters(),
      filtered: [],
      visible: [],
    });
    const { container } = renderWithProviders(<Search />);
    // skeleton 有 animate-pulse 類別
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('clicking reset calls handleReset', async () => {
    const user = userEvent.setup();
    const handleReset = vi.fn();
    mockUseSearchFilters.mockReturnValue({
      ...defaultFilters(),
      searchValue: 'foo',
      handleReset,
    });
    renderWithProviders(<Search />);
    const resetBtn = screen.getByText('重置');
    await user.click(resetBtn);
    expect(handleReset).toHaveBeenCalled();
  });

  it('shows loading-more spinner when visible < filtered', () => {
    const video = {
      bvid: 'BV1xyz',
      url: 'https://www.bilibili.com/video/BV1xyz',
      cover: 'https://i0.hdslb.com/bfs/archive/abc.jpg',
      title: 'X',
      UP: 'U',
      views: 1,
      tags: {
        firstChannel: '游戏',
        secondChannel: '单机',
        ordinaryTags: [],
      },
    };
    mockUseSearchFilters.mockReturnValue({
      ...defaultFilters(),
      filtered: [video, video, video, video, video],
      visible: [video],
    });
    renderWithProviders(<Search />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('clicking the share button copies the URL and toasts success', async () => {
    const user = userEvent.setup();
    // mock clipboard
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });

    renderWithProviders(<Search />);
    const shareBtn = screen.getByTitle('分享筛选');
    await user.click(shareBtn);
    await waitFor(() => {
      expect(writeText).toHaveBeenCalled();
    });
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: '已复制分享链接' })
    );
  });
});

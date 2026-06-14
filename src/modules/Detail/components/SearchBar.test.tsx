import { screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useThemeStore } from '@/common/hooks/useThemeStore';
import SearchBar from '@/modules/Detail/components/SearchBar';
import { renderWithProviders } from '@/test/test-utils';

const mockUseRandomBvid = vi.fn();
const mockPush = vi.fn();
const mockToast = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn() }),
}));

vi.mock('@/common/libs/result-data', async () => {
  const actual = await vi.importActual<
    typeof import('@/common/libs/result-data')
  >('@/common/libs/result-data');
  return {
    ...actual,
    useRandomBvid: (...args: unknown[]) => mockUseRandomBvid(...args),
  };
});

vi.mock('@/common/components/ui/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

describe('SearchBar', () => {
  beforeEach(() => {
    mockUseRandomBvid.mockReset();
    mockPush.mockReset();
    mockToast.mockReset();
    useThemeStore.setState({ currentColor: '#FB7299' });
  });

  it('renders the input and 2 buttons', () => {
    mockUseRandomBvid.mockReturnValue({
      data: 'BV1abc',
      mutate: vi.fn(),
      isLoading: false,
    });
    renderWithProviders(<SearchBar />);
    expect(
      screen.getByPlaceholderText('在此处输入视频链接')
    ).toBeInTheDocument();
    expect(screen.getByText('搜索视频')).toBeInTheDocument();
    expect(screen.getByText('随机')).toBeInTheDocument();
  });

  it('clicking search with invalid input shows a toast and does not navigate', async () => {
    mockUseRandomBvid.mockReturnValue({
      data: undefined,
      mutate: vi.fn(),
      isLoading: false,
    });
    renderWithProviders(<SearchBar />);
    // 沒輸入時 click 搜尋 → 觸發 toast（無法抽取 BV 號）
    const searchBtn = screen.getByText('搜索视频');
    searchBtn.click();
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalled();
    });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('clicking search with a valid URL navigates to /details?bvid=...', async () => {
    mockUseRandomBvid.mockReturnValue({
      data: undefined,
      mutate: vi.fn(),
      isLoading: false,
    });
    renderWithProviders(<SearchBar />);
    const input = screen.getByPlaceholderText(
      '在此处输入视频链接'
    ) as HTMLInputElement;
    input.focus();
    // 用 fireEvent 模擬 onChange
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value'
    )!.set!;
    nativeInputValueSetter.call(input, 'https://www.bilibili.com/video/BV1abc');
    input.dispatchEvent(new Event('input', { bubbles: true }));
    // click 搜尋
    screen.getByText('搜索视频').click();
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/details?bvid=BV1abc');
    });
  });

  it('clicking random with existing data navigates immediately', async () => {
    mockUseRandomBvid.mockReturnValue({
      data: 'BV1random',
      mutate: vi.fn(),
      isLoading: false,
    });
    renderWithProviders(<SearchBar />);
    screen.getByText('随机').click();
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/details?bvid=BV1random');
    });
  });

  it('shows "加载中…" when random is loading', () => {
    mockUseRandomBvid.mockReturnValue({
      data: undefined,
      mutate: vi.fn(),
      isLoading: true,
    });
    renderWithProviders(<SearchBar />);
    expect(screen.getByText('加载中…')).toBeInTheDocument();
  });
});

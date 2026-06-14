import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import Detail from '@/modules/Detail/components/Detail';
import { renderWithProviders } from '@/test/test-utils';

const mockUseSearchParams = vi.fn();
vi.mock('next/navigation', () => ({
  useSearchParams: () => mockUseSearchParams(),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

// 各個子組件 mock — Detail 只負責 bvid routing，不渲染真正的 VideoInfo / SearchBar
vi.mock('@/modules/Detail/components/VideoInfo', () => ({
  default: ({ bvid }: { bvid: string }) => (
    <div data-testid="video-info">VideoInfo:{bvid}</div>
  ),
}));
vi.mock('@/modules/Detail/components/SearchBar', () => ({
  default: () => <div data-testid="search-bar">SearchBar</div>,
}));

describe('Detail (router)', () => {
  it('renders VideoInfo when bvid is present', () => {
    mockUseSearchParams.mockReturnValue(
      new URLSearchParams('bvid=BV1abc') as unknown as ReturnType<
        typeof mockUseSearchParams
      >
    );
    renderWithProviders(<Detail />);
    expect(screen.getByTestId('video-info')).toHaveTextContent(
      'VideoInfo:BV1abc'
    );
    expect(screen.queryByTestId('search-bar')).toBeNull();
  });

  it('renders SearchBar when bvid is missing', () => {
    mockUseSearchParams.mockReturnValue(
      new URLSearchParams('') as unknown as ReturnType<
        typeof mockUseSearchParams
      >
    );
    renderWithProviders(<Detail />);
    expect(screen.getByTestId('search-bar')).toBeInTheDocument();
    expect(screen.queryByTestId('video-info')).toBeNull();
  });
});

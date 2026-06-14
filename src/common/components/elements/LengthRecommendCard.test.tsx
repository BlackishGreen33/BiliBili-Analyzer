import { screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import LengthRecommendCard from '@/common/components/elements/LengthRecommendCard';
import { renderWithProviders } from '@/test/test-utils';

// Mock SWR fetcher responses
const mockUseLengthRecommend = vi.fn();
vi.mock('@/common/libs/use-length-recommend', async () => {
  const actual = await vi.importActual<
    typeof import('@/common/libs/use-length-recommend')
  >('@/common/libs/use-length-recommend');
  return {
    ...actual,
    useLengthRecommend: (...args: unknown[]) => mockUseLengthRecommend(...args),
  };
});

describe('LengthRecommendCard', () => {
  beforeEach(() => {
    mockUseLengthRecommend.mockReset();
  });

  it('renders nothing while loading (returns null)', () => {
    mockUseLengthRecommend.mockReturnValue({
      data: undefined,
      isLoading: true,
    });
    const { container } = renderWithProviders(
      <LengthRecommendCard scope={{ type: 'up', value: 'UP1' }} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders the recommendation when data is present', async () => {
    mockUseLengthRecommend.mockReturnValue({
      data: {
        scope: { type: 'up', value: 'UP1' },
        window: 30,
        primary: { label: '5-10 分钟', share: 0.4, count: 4 },
        distribution: [
          { label: '<1 分钟', min: 0, max: 60, share: 0.1, count: 1 },
          { label: '1-3 分钟', min: 60, max: 180, share: 0.2, count: 2 },
          { label: '3-5 分钟', min: 180, max: 300, share: 0.3, count: 3 },
          { label: '5-10 分钟', min: 300, max: 600, share: 0.4, count: 4 },
          { label: '10-20 分钟', min: 600, max: 1200, share: 0, count: 0 },
          { label: '20-30 分钟', min: 1200, max: 1800, share: 0, count: 0 },
          { label: '>30 分钟', min: 1800, max: Infinity, share: 0, count: 0 },
        ],
        sampleSize: 10,
        confidence: 'low',
      },
      isLoading: false,
    });
    renderWithProviders(
      <LengthRecommendCard
        scope={{ type: 'up', value: 'UP1', label: '某UP主' }}
      />
    );
    await waitFor(() => {
      expect(screen.getByText('最佳发布时长建议')).toBeInTheDocument();
    });
    // primary bucket should be visible
    expect(screen.getByText('5-10 分钟')).toBeInTheDocument();
  });

  it('shows "low confidence" badge when confidence is low', async () => {
    mockUseLengthRecommend.mockReturnValue({
      data: {
        scope: { type: 'up', value: 'UP1' },
        window: 30,
        primary: { label: '5-10 分钟', share: 0.5, count: 1 },
        distribution: [
          { label: '<1 分钟', min: 0, max: 60, share: 0, count: 0 },
          { label: '1-3 分钟', min: 60, max: 180, share: 0, count: 0 },
          { label: '3-5 分钟', min: 180, max: 300, share: 0, count: 0 },
          { label: '5-10 分钟', min: 300, max: 600, share: 1, count: 2 },
          { label: '10-20 分钟', min: 600, max: 1200, share: 0, count: 0 },
          { label: '20-30 分钟', min: 1200, max: 1800, share: 0, count: 0 },
          { label: '>30 分钟', min: 1800, max: Infinity, share: 0, count: 0 },
        ],
        sampleSize: 2,
        confidence: 'low',
      },
      isLoading: false,
    });
    renderWithProviders(
      <LengthRecommendCard scope={{ type: 'up', value: 'UP1' }} />
    );
    await waitFor(() => {
      expect(screen.getByText('资料偏少，僅供參考')).toBeInTheDocument();
    });
  });

  it('shows empty state when sampleSize is 0', async () => {
    mockUseLengthRecommend.mockReturnValue({
      data: {
        scope: { type: 'up', value: 'unknown' },
        window: 30,
        primary: null,
        distribution: [
          { label: '<1 分钟', min: 0, max: 60, share: 0, count: 0 },
          { label: '1-3 分钟', min: 60, max: 180, share: 0, count: 0 },
          { label: '3-5 分钟', min: 180, max: 300, share: 0, count: 0 },
          { label: '5-10 分钟', min: 300, max: 600, share: 0, count: 0 },
          { label: '10-20 分钟', min: 600, max: 1200, share: 0, count: 0 },
          { label: '20-30 分钟', min: 1200, max: 1800, share: 0, count: 0 },
          { label: '>30 分钟', min: 1800, max: Infinity, share: 0, count: 0 },
        ],
        sampleSize: 0,
        confidence: 'low',
      },
      isLoading: false,
    });
    renderWithProviders(
      <LengthRecommendCard scope={{ type: 'up', value: 'unknown' }} />
    );
    await waitFor(() => {
      expect(screen.getByText('历史数据不足以给出建议')).toBeInTheDocument();
    });
  });

  it('does not show low-confidence badge when confidence is mid', async () => {
    mockUseLengthRecommend.mockReturnValue({
      data: {
        scope: { type: 'up', value: 'UP1' },
        window: 30,
        primary: { label: '5-10 分钟', share: 0.4, count: 40 },
        distribution: [
          { label: '<1 分钟', min: 0, max: 60, share: 0, count: 0 },
          { label: '1-3 分钟', min: 60, max: 180, share: 0, count: 0 },
          { label: '3-5 分钟', min: 180, max: 300, share: 0, count: 0 },
          { label: '5-10 分钟', min: 300, max: 600, share: 1, count: 50 },
          { label: '10-20 分钟', min: 600, max: 1200, share: 0, count: 0 },
          { label: '20-30 分钟', min: 1200, max: 1800, share: 0, count: 0 },
          { label: '>30 分钟', min: 1800, max: Infinity, share: 0, count: 0 },
        ],
        sampleSize: 50,
        confidence: 'mid',
      },
      isLoading: false,
    });
    renderWithProviders(
      <LengthRecommendCard scope={{ type: 'up', value: 'UP1' }} />
    );
    await waitFor(() => {
      expect(screen.getByText('最佳发布时长建议')).toBeInTheDocument();
    });
    expect(screen.queryByText('资料偏少，僅供參考')).toBeNull();
  });
});

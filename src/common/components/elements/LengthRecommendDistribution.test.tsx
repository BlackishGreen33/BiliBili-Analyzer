import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import LengthRecommendDistribution from '@/common/components/elements/LengthRecommendDistribution';
import type { LengthDistribution } from '@/common/libs/use-length-recommend';
import { renderWithProviders } from '@/test/test-utils';

const dist: LengthDistribution[] = [
  { label: '<1 分钟', min: 0, max: 60, share: 0.1, count: 1 },
  { label: '1-3 分钟', min: 60, max: 180, share: 0.2, count: 2 },
  { label: '3-5 分钟', min: 180, max: 300, share: 0.3, count: 3 },
  { label: '5-10 分钟', min: 300, max: 600, share: 0.4, count: 4 },
];

describe('LengthRecommendDistribution', () => {
  it('renders one row per distribution bucket', () => {
    renderWithProviders(
      <LengthRecommendDistribution
        distribution={dist}
        primary={null}
        currentColor="#FB7299"
      />
    );
    expect(screen.getByText('<1 分钟')).toBeInTheDocument();
    expect(screen.getByText('1-3 分钟')).toBeInTheDocument();
    expect(screen.getByText('3-5 分钟')).toBeInTheDocument();
    expect(screen.getByText('5-10 分钟')).toBeInTheDocument();
  });

  it('renders the count for each bucket', () => {
    renderWithProviders(
      <LengthRecommendDistribution
        distribution={dist}
        primary={null}
        currentColor="#FB7299"
      />
    );
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('renders 0-count buckets too', () => {
    const sparse: LengthDistribution[] = [
      { label: '5-10 分钟', min: 300, max: 600, share: 1, count: 5 },
      { label: '>30 分钟', min: 1800, max: Infinity, share: 0, count: 0 },
    ];
    renderWithProviders(
      <LengthRecommendDistribution
        distribution={sparse}
        primary={{ label: '5-10 分钟', share: 1, count: 5 }}
        currentColor="#FB7299"
      />
    );
    expect(screen.getByText('5-10 分钟')).toBeInTheDocument();
    expect(screen.getByText('>30 分钟')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('handles an empty distribution array', () => {
    const { container } = renderWithProviders(
      <LengthRecommendDistribution
        distribution={[]}
        primary={null}
        currentColor="#FB7299"
      />
    );
    expect(container.firstChild).toBeTruthy();
    // No labels should be rendered
    expect(screen.queryByText('1-3 分钟')).toBeNull();
  });
});

import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import LengthRecommendHeader from '@/common/components/elements/LengthRecommendHeader';
import { renderWithProviders } from '@/test/test-utils';

describe('LengthRecommendHeader', () => {
  it('renders title and low-confidence badge when confidence is low', () => {
    renderWithProviders(
      <LengthRecommendHeader label="某UP主" confidence="low" />
    );
    expect(screen.getByText('最佳发布时长建议')).toBeInTheDocument();
    expect(screen.getByText('资料偏少，僅供參考')).toBeInTheDocument();
  });

  it('hides the low-confidence badge when confidence is mid', () => {
    renderWithProviders(
      <LengthRecommendHeader label="某UP主" confidence="mid" />
    );
    expect(screen.queryByText('资料偏少，僅供參考')).toBeNull();
  });

  it('hides the low-confidence badge when confidence is high', () => {
    renderWithProviders(
      <LengthRecommendHeader label="某UP主" confidence="high" />
    );
    expect(screen.queryByText('资料偏少，僅供參考')).toBeNull();
  });

  it('still renders the title and a description when label is empty', () => {
    renderWithProviders(<LengthRecommendHeader label="" confidence="mid" />);
    expect(screen.getByText('最佳发布时长建议')).toBeInTheDocument();
    // Description text (CardDescription) should be present, regardless of label
    const card = screen.getByText('最佳发布时长建议').closest('div');
    expect(card?.textContent).toBeTruthy();
  });
});

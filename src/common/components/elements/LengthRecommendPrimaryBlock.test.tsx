import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import LengthRecommendPrimaryBlock from '@/common/components/elements/LengthRecommendPrimaryBlock';
import { renderWithProviders } from '@/test/test-utils';

const basePrimary = {
  label: '5-10 分钟',
  share: 0.4,
  count: 4,
};

describe('LengthRecommendPrimaryBlock', () => {
  it('renders median + IQR when medianSeconds > 0', () => {
    renderWithProviders(
      <LengthRecommendPrimaryBlock
        primary={basePrimary}
        medianSeconds={420}
        p25={300}
        p75={600}
        rationaleKey="length.rationale.scope"
      />
    );
    expect(screen.getByText(/median/)).toBeInTheDocument();
    expect(screen.getByText(/IQR/)).toBeInTheDocument();
  });

  it('hides median + IQR when medianSeconds is 0', () => {
    renderWithProviders(
      <LengthRecommendPrimaryBlock
        primary={basePrimary}
        medianSeconds={0}
        p25={0}
        p75={0}
        rationaleKey="length.rationale.notEnough"
      />
    );
    expect(screen.queryByText(/median/)).toBeNull();
    expect(screen.queryByText(/IQR/)).toBeNull();
  });

  it('sets the title attribute from the rationale key', () => {
    renderWithProviders(
      <LengthRecommendPrimaryBlock
        primary={basePrimary}
        medianSeconds={300}
        p25={200}
        p75={500}
        rationaleKey="length.rationale.scope"
      />
    );
    const median = screen.getByText(/median/);
    expect(median.closest('p')).toHaveAttribute('title');
  });
});

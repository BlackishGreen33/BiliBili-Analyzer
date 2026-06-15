import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import LengthRecommendEmpty from '@/common/components/elements/LengthRecommendEmpty';
import { renderWithProviders } from '@/test/test-utils';

describe('LengthRecommendEmpty', () => {
  it('renders the empty-state message', () => {
    renderWithProviders(<LengthRecommendEmpty />);
    expect(screen.getByText('历史数据不足以给出建议')).toBeInTheDocument();
  });
});

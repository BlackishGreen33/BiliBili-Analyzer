import { describe, expect, it, vi } from 'vitest';

import Home from '@/modules/Home/components/Home';
import { renderWithProviders } from '@/test/test-utils';

vi.mock('@/modules/Search', () => ({
  default: () => <div data-testid="search-component" />,
}));

vi.mock('next/dynamic', async () => {
  const React = await import('react');
  return {
    default(
      _loader: () => Promise<{ default: React.ComponentType }>,
      _opts?: { ssr?: boolean; loading?: () => React.ReactNode }
    ) {
      return (props: Record<string, unknown>) =>
        React.createElement('div', {
          ...props,
          'data-testid': 'dynamic-wrapper',
        });
    },
  };
});

describe('Home', () => {
  it('renders without crashing', () => {
    const { container } = renderWithProviders(<Home />);
    expect(container).toBeInTheDocument();
  });
});

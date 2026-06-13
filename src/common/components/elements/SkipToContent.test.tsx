import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import SkipToContent from '@/common/components/elements/SkipToContent';
import { renderWithProviders } from '@/test/test-utils';

describe('SkipToContent', () => {
  it('renders an anchor with href="#main"', () => {
    renderWithProviders(<SkipToContent />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '#main');
  });

  it('is visually hidden by default (sr-only)', () => {
    renderWithProviders(<SkipToContent />);
    const link = screen.getByRole('link');
    expect(link.className).toMatch(/sr-only/);
  });

  it('has a focus class that overrides sr-only', () => {
    renderWithProviders(<SkipToContent />);
    const link = screen.getByRole('link');
    expect(link.className).toMatch(/focus:not-sr-only/);
  });

  it('renders the localized "skip to main content" text', () => {
    renderWithProviders(<SkipToContent />);
    expect(screen.getByText('跳到主要内容')).toBeInTheDocument();
  });
});

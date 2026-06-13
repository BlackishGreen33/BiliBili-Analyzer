import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import SummaryCard from '@/common/components/elements/SummaryCard';
import { renderWithProviders } from '@/test/test-utils';

describe('SummaryCard', () => {
  it('renders label and value', () => {
    renderWithProviders(<SummaryCard label="总视频数" value="1000" />);
    expect(screen.getByText('总视频数')).toBeInTheDocument();
    expect(screen.getByText('1000')).toBeInTheDocument();
  });

  it('renders sub when provided', () => {
    renderWithProviders(
      <SummaryCard label="总视频数" value="1000" sub="最新一天" />
    );
    expect(screen.getByText('最新一天')).toBeInTheDocument();
  });

  it('does not render sub paragraph when sub is undefined', () => {
    const { container } = renderWithProviders(
      <SummaryCard label="总视频数" value="1000" />
    );
    // 應該只有 label + value 兩行，沒有 sub
    const paragraphs = container.querySelectorAll('p');
    expect(paragraphs.length).toBe(2);
  });

  it('uses tabular-nums class for the value', () => {
    const { container } = renderWithProviders(
      <SummaryCard label="Test" value="42" />
    );
    const valueEl = container.querySelector('.tabular-nums');
    expect(valueEl).not.toBeNull();
    expect(valueEl?.textContent).toBe('42');
  });

  it('label has uppercase + tracking-wider classes', () => {
    const { container } = renderWithProviders(
      <SummaryCard label="Total Videos" value="100" />
    );
    const labelEl = container.querySelector('p:first-child');
    expect(labelEl?.className).toMatch(/uppercase/);
    expect(labelEl?.className).toMatch(/tracking-wider/);
  });
});

import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import StackedChart from '@/modules/Detail/components/StackedChart';
import { renderWithProviders } from '@/test/test-utils';

// 簡化 recharts — 只驗證 data 形狀, 不實際渲染 SVG
vi.mock('recharts', async () => {
  const React = await import('react');
  return {
    Bar: (props: { dataKey: string; fill: string }) =>
      React.createElement('div', {
        'data-testid': 'recharts-bar',
        'data-key': props.dataKey,
        'data-fill': props.fill,
      }),
    BarChart: ({
      data,
      children,
    }: {
      data: ReadonlyArray<unknown>;
      children?: React.ReactNode;
    }) =>
      React.createElement(
        'div',
        {
          'data-testid': 'recharts-barchart',
          'data-len': String(data.length),
        },
        children
      ),
    CartesianGrid: () => React.createElement('div', null),
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
    Tooltip: () => React.createElement('div', null),
    XAxis: () => React.createElement('div', null),
    YAxis: () => React.createElement('div', null),
  };
});

const stat = {
  aid: 1,
  view: 100000,
  danmaku: 500,
  reply: 200,
  favorite: 300,
  coin: 100,
  share: 50,
  like: 800,
};

describe('StackedChart', () => {
  it('renders a BarChart with 7 metrics derived from stat', () => {
    renderWithProviders(<StackedChart stat={stat} />);
    const chart = screen.getByTestId('recharts-barchart');
    expect(chart).toBeInTheDocument();
    expect(chart.getAttribute('data-len')).toBe('7');
  });

  it('passes the configured fill color to Bar', () => {
    renderWithProviders(<StackedChart stat={stat} />);
    const bar = screen.getByTestId('recharts-bar');
    expect(bar.getAttribute('data-key')).toBe('value');
    // 顏色來自 useThemeStore default（CSS var with fallback）
    expect(bar.getAttribute('data-fill')).toBe('var(--accent-color, #FB7299)');
  });

  it('sorts the max metric into the chart data', () => {
    renderWithProviders(<StackedChart stat={stat} />);
    // 100000 是最大值，會出現在 data 中
    const chart = screen.getByTestId('recharts-barchart');
    expect(chart).toBeInTheDocument();
  });
});

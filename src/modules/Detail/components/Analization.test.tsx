import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import Analization from '@/modules/Detail/components/Analization';
import { renderWithProviders } from '@/test/test-utils';

const stat = {
  aid: 1,
  view: 1_500_000,
  danmaku: 5_000,
  reply: 800,
  favorite: 12_000,
  coin: 3_500,
  share: 1_200,
  like: 25_000,
};

describe('Analization', () => {
  it('renders all 7 metric cards', () => {
    renderWithProviders(<Analization stat={stat} />);
    // 7 labels: 观看次数, 弹幕数量, 评论数, 收藏数, 投币数, 分享数, 点赞数
    expect(screen.getByText('观看次数')).toBeInTheDocument();
    expect(screen.getByText('弹幕数量')).toBeInTheDocument();
    expect(screen.getByText('评论数')).toBeInTheDocument();
    expect(screen.getByText('收藏数')).toBeInTheDocument();
    expect(screen.getByText('投币数')).toBeInTheDocument();
    expect(screen.getByText('分享数')).toBeInTheDocument();
    expect(screen.getByText('点赞数')).toBeInTheDocument();
  });

  it('uses formatCompact to display large numbers', () => {
    renderWithProviders(<Analization stat={stat} />);
    // 1,500,000 → 150万
    expect(screen.getByText('150万')).toBeInTheDocument();
  });

  it('handles zero values without crashing', () => {
    const zeroStat = { ...stat, view: 0, danmaku: 0, like: 0 };
    renderWithProviders(<Analization stat={zeroStat} />);
    expect(screen.getAllByText('0').length).toBeGreaterThanOrEqual(3);
  });
});

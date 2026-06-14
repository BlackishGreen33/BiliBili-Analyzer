import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import Base from '@/modules/Detail/components/Base';
import { renderWithProviders } from '@/test/test-utils';

const videoInfo = {
  bvid: 'BV1wEEg62EDP',
  aid: 12345,
  cid: 67890,
  title: '测试视频标题',
  pic: 'https://i0.hdslb.com/bfs/archive/abc.jpg',
  duration: 3661,
  pubdate: 1700000000, // 2023-11-14
  owner: {
    mid: 100,
    name: '某UP主',
    face: 'https://i0.hdslb.com/bfs/face/abc.jpg',
  },
  stat: {
    aid: 12345,
    view: 1,
    danmaku: 0,
    reply: 0,
    favorite: 0,
    coin: 0,
    share: 0,
    like: 0,
  },
};

describe('Base', () => {
  it('renders the UP master name', () => {
    renderWithProviders(<Base videoInfo={videoInfo} />);
    expect(screen.getByText('某UP主')).toBeInTheDocument();
  });

  it('renders the video title as a link', () => {
    renderWithProviders(<Base videoInfo={videoInfo} />);
    const link = screen.getByText('测试视频标题');
    expect(link).toBeInTheDocument();
    expect(link.closest('a')).toHaveAttribute(
      'href',
      'https://www.bilibili.com/video/BV1wEEg62EDP'
    );
    expect(link.closest('a')).toHaveAttribute('target', '_blank');
  });

  it('renders the formatted duration', () => {
    renderWithProviders(<Base videoInfo={videoInfo} />);
    // 3661s → 1:01:01
    expect(screen.getByText('1:01:01')).toBeInTheDocument();
  });

  it('renders the publish date', () => {
    renderWithProviders(<Base videoInfo={videoInfo} />);
    // pubdate 1700000000 → 2023/11/14 中文格式
    expect(screen.getByText(/2023/)).toBeInTheDocument();
  });
});

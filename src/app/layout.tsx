import type { Metadata } from 'next';
import { JetBrains_Mono, Noto_Sans_SC, Space_Grotesk } from 'next/font/google';

import '@/common/styles/globals.css';

import Providers from '@/common/providers/Providers';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

const notoSansSC = Noto_Sans_SC({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-noto-sans-sc',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: '哔哩哔哩近期热门视频分类检索分析系统',
  description:
    '基于 B 站每日热门榜单的多维检索与聚合分析系统：分区筛选、UP 主排行、互动率、时段分布、时长分布、标签云。',
  keywords: [
    'B 站',
    'Bilibili',
    '热门视频',
    '数据可视化',
    'UP 主排行',
    '分区统计',
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${spaceGrotesk.variable} ${notoSansSC.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body className={notoSansSC.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

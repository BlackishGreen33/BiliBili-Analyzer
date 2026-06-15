import { GeistMono } from 'geist/font/mono';
import { GeistSans } from 'geist/font/sans';
import type { Metadata } from 'next';
import { Noto_Sans_SC } from 'next/font/google';
import { cookies } from 'next/headers';

import '@/common/styles/globals.css';

import { isSupportedLocale } from '@/common/i18n/locales';
import Providers from '@/common/providers/Providers';

const notoSC = Noto_Sans_SC({
  subsets: ['latin', 'chinese-simplified'],
  weight: ['400', '500', '700'],
  variable: '--font-noto-sc',
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const raw = cookieStore.get('bili-analyzer-locale')?.value;
  const locale = isSupportedLocale(raw) ? raw : 'zh-CN';
  const colorCookie = cookieStore.get('bili-analyzer-color')?.value;
  const accentStyle = colorCookie
    ? ({ '--accent-color': colorCookie } as React.CSSProperties)
    : undefined;
  return (
    <html
      lang={locale}
      className={`${GeistSans.variable} ${GeistMono.variable} ${notoSC.variable}`}
      style={accentStyle}
      suppressHydrationWarning
    >
      <body className={`${GeistSans.className} ${notoSC.className}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

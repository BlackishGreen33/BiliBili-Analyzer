import { GeistMono } from 'geist/font/mono';
import { GeistSans } from 'geist/font/sans';
import type { Metadata } from 'next';
import { Noto_Sans_SC } from 'next/font/google';
import { cookies } from 'next/headers';

import '@/common/styles/globals.css';

import Providers from '@/common/providers/Providers';

const notoSC = Noto_Sans_SC({
  subsets: ['latin'],
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

const SUPPORTED_LOCALES = ['zh-CN', 'zh-TW', 'en'] as const;
type Locale = (typeof SUPPORTED_LOCALES)[number];

function isSupportedLocale(value: string | undefined): value is Locale {
  return !!value && (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const raw = cookieStore.get('bili-analyzer-locale')?.value;
  const locale: Locale = isSupportedLocale(raw) ? raw : 'zh-CN';
  return (
    <html
      lang={locale}
      className={`${GeistSans.variable} ${GeistMono.variable} ${notoSC.variable}`}
      suppressHydrationWarning
    >
      <body className={`${GeistSans.className} ${notoSC.className}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

import type { Metadata } from 'next';
import { Inter, Noto_Sans_SC } from 'next/font/google';

import Providers from '@/common/providers/Providers';

import '@/common/styles/globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const notoSansSC = Noto_Sans_SC({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-noto-sans-sc',
  display: 'swap',
});

export const metadata: Metadata = {
  title: '哔哩哔哩近期热门视频分类检索分析系统',
  description: '哔哩哔哩近期热门视频分类检索分析系统',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={`${inter.variable} ${notoSansSC.variable}`}>
      <body className={notoSansSC.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

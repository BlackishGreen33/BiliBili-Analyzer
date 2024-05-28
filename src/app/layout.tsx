import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

import Providers from '@/common/providers/Providers';

import '@/common/styles/globals.scss';

// import ProgressBar from '@/common/components/elements/ProgressBar';
// import { ModalProvider } from '@/common/components/providers/modal-provider';

const inter = Inter({ subsets: ['latin'] });

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
    <html lang="zh-CN">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

import '@/common/styles/globals.scss';

// import ProgressBar from '@/common/components/elements/ProgressBar';
import Layout from '@/common/components/layouts';
// import { ModalProvider } from '@/common/components/providers/modal-provider';
import StyledComponentsRegistry from '@/common/libs/registry';
import GlobalStyles from '@/common/styles/GlobalStyles';

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
        <StyledComponentsRegistry>
          <GlobalStyles />
          {/* <ModalProvider /> */}
          <Layout>
            {children}
            {/* <ProgressBar /> */}
          </Layout>
        </StyledComponentsRegistry>
      </body>
    </html>
  );
}

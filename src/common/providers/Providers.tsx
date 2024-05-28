import { ThemeProvider as NextThemesProvider } from 'next-themes';
import React from 'react';

// import ProgressBar from '@/common/components/elements/ProgressBar';
import Layout from '@/common/components/layouts';
// import { ModalProvider } from '@/common/components/providers/modal-provider';
import StyledComponentsRegistry from '@/common/libs/registry';
import GlobalStyles from '@/common/styles/GlobalStyles';

// import { type ThemeProviderProps } from "next-themes/dist/types";

type Props = {
  children: React.ReactNode;
};

const Providers: React.FC<Props> = React.memo(({ children }) => {
  return (
    <StyledComponentsRegistry>
      <GlobalStyles />
      <NextThemesProvider attribute="class" defaultTheme="light">
        {/* <ModalProvider /> */}
        <Layout>{children}</Layout>
      </NextThemesProvider>
    </StyledComponentsRegistry>
  );
});

export default Providers;

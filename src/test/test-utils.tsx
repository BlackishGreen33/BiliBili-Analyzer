import {
  render,
  type RenderOptions,
  type RenderResult,
} from '@testing-library/react';
import i18next from 'i18next';
import React from 'react';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { SWRConfig } from 'swr';
import { beforeAll } from 'vitest';

import zhCN from '@/common/i18n/dictionaries/zh-CN';

void initReactI18next;

beforeAll(() => {
  if (!i18next.isInitialized) {
    void i18next.init({
      lng: 'zh-CN',
      fallbackLng: 'zh-CN',
      ns: ['translation'],
      defaultNS: 'translation',
      resources: {
        'zh-CN': { translation: zhCN },
      },
      interpolation: { escapeValue: false },
    });
  }
});

const AllProviders: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <I18nextProvider i18n={i18next}>
    <SWRConfig value={{ dedupingInterval: 0, revalidateOnFocus: false }}>
      {children}
    </SWRConfig>
  </I18nextProvider>
);

export function renderWithProviders(
  ui: React.ReactElement,
  options?: RenderOptions
): RenderResult {
  return render(ui, { wrapper: AllProviders, ...options });
}

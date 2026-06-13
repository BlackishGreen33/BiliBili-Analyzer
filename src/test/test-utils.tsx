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

void initReactI18next;

beforeAll(() => {
  if (!i18next.isInitialized) {
    void i18next.init({
      lng: 'zh-CN',
      fallbackLng: 'zh-CN',
      ns: ['translation'],
      defaultNS: 'translation',
      resources: {
        'zh-CN': {
          translation: {
            'a11y.skipToContent': '跳到主要内容',
            'common.retry': '重试',
            'common.close': '关闭',
            'common.swap': '交换',
            'theme.title': '设置中心',
            'theme.color': '主题颜色',
            'theme.language': '语言',
            'theme.languageOptions.zh-CN': '简体中文',
            'theme.languageOptions.zh-TW': '繁體中文',
            'theme.languageOptions.en': 'English',
            'length.recommendTitle': '最佳发布时长建议',
            'length.recommendDesc':
              '基于历史 N 天数据，{name} 上榜的时长分布如下',
            'length.recommendPrimary': '推荐：{bucket}（{share} 上榜率）',
            'length.recommendEmpty': '历史数据不足以给出建议',
            'length.recommendLowConfidence': '资料偏少，僅供參考',
            'length.bucketShare': '{count} 支 / 占比 {share}',
            'length.globalTitle': '全局时长偏好',
            'length.globalDesc': '所有上榜视频的时长分布',
          },
        },
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

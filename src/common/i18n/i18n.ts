import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
import './types';

import en from './dictionaries/en';
import zhCN from './dictionaries/zh-CN';
import zhTW from './dictionaries/zh-TW';

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      'zh-CN': { translation: zhCN },
      'zh-TW': { translation: zhTW },
      en: { translation: en },
    },
    fallbackLng: 'zh-CN',
    supportedLngs: ['zh-CN', 'zh-TW', 'en'],
    interpolation: { escapeValue: false, prefix: '{', suffix: '}' },
    detection: {
      order: ['cookie', 'localStorage', 'navigator'],
      lookupCookie: 'bili-analyzer-locale',
      lookupLocalStorage: 'bili-analyzer-locale',
      caches: ['cookie', 'localStorage'],
    },
    returnNull: false,
  });

export default i18n;

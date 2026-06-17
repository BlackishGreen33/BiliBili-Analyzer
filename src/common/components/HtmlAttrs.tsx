'use client';

import { useEffect } from 'react';

import { resolveAccentColor } from '@/common/hooks/useThemeStore';
import { isSupportedLocale } from '@/common/i18n/locales';

const LOCALE_COOKIE = 'bili-analyzer-locale';
const COLOR_COOKIE = 'bili-analyzer-color';

const readCookie = (name: string): string | undefined => {
  if (typeof document === 'undefined') return undefined;
  const prefix = `${name}=`;
  for (const part of document.cookie.split(';')) {
    const trimmed = part.trim();
    if (trimmed.startsWith(prefix)) {
      return decodeURIComponent(trimmed.slice(prefix.length));
    }
  }
  return undefined;
};

/**
 * `output: "export"`（mobile build）不允許 layout 在 server 階段讀 `cookies()`。
 * Web build 仍然在 layout 裡讀；此 component 為 mobile / 純靜態 export 提供等價的
 * 客戶端 fallback —— 在 hydration 後把 locale 與 accent color 同步到 `<html>`，
 * 避免首次渲染時 FOUC。預設值（zh-CN / `#FB7299`）在 SSR / static HTML 中已先寫好。
 */
const HtmlAttrs: React.FC = () => {
  useEffect(() => {
    const locale = readCookie(LOCALE_COOKIE);
    if (
      locale &&
      isSupportedLocale(locale) &&
      document.documentElement.lang !== locale
    ) {
      document.documentElement.lang = locale;
    }
    const color = readCookie(COLOR_COOKIE);
    if (color) {
      const resolved = resolveAccentColor(color);
      document.documentElement.style.setProperty('--accent-color', resolved);
    }
  }, []);
  return null;
};

export default HtmlAttrs;

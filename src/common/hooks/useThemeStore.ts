import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/**
 * `currentColor` 既要是 hex（給 persist 比對、ThemeSettings 反白使用），
 * 又要在 SSR 階段就能正確解析。解法：預設值用 `var(--accent-color, #FB7299)`，
 * cookie / localStorage 內保存實際 hex；Layout 從 cookie 讀出後注入
 * `<html style="--accent-color: {hex}">`，browser 直接用 CSS var 解析。
 */

const COLOR_COOKIE = 'bili-analyzer-color';
const COLOR_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year
const DEFAULT_COLOR = '#FB7299';

interface ThemeState {
  currentColor: string;
  themeSettings: boolean;
  setCurrentColor: (color: string) => void;
  setThemeSettings: (settings: boolean) => void;
}

function writeColorCookie(color: string) {
  if (typeof document === 'undefined') return;
  document.cookie = `${COLOR_COOKIE}=${encodeURIComponent(color)};path=/;max-age=${COLOR_COOKIE_MAX_AGE};SameSite=Lax`;
}

export function resolveAccentColor(value: string): string {
  const match = value.match(/^var\([^,]+,\s*(.+?)\s*\)$/);
  return match ? match[1]! : value;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      currentColor: `var(--accent-color, ${DEFAULT_COLOR})`,
      themeSettings: false,
      setCurrentColor: (color) => {
        set({ currentColor: color });
        writeColorCookie(color);
      },
      setThemeSettings: (settings) => set({ themeSettings: settings }),
    }),
    {
      name: 'bili-analyzer-theme',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ currentColor: state.currentColor }),
    }
  )
);

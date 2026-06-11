import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface ThemeState {
  currentColor: string;
  themeSettings: boolean;
  setCurrentColor: (color: string) => void;
  setThemeSettings: (settings: boolean) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      currentColor: '#FB7299',
      themeSettings: false,
      setCurrentColor: (color) => set({ currentColor: color }),
      setThemeSettings: (settings) => set({ themeSettings: settings }),
    }),
    {
      name: 'bili-analyzer-theme',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ currentColor: state.currentColor }),
    }
  )
);

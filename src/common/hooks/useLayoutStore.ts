import { create } from 'zustand';

interface LayoutState {
  screenSize: number | undefined;
  activeMenu: boolean;
  setScreenSize: (size: number | undefined) => void;
  setActiveMenu: (active: boolean) => void;
}

export const useLayoutStore = create<LayoutState>((set) => ({
  screenSize: undefined,
  activeMenu: true,
  setScreenSize: (size) => set({ screenSize: size }),
  setActiveMenu: (active) => set({ activeMenu: active }),
}));

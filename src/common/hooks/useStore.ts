import { create } from 'zustand';

interface State {
  screenSize: undefined | number;
  currentColor: string;
  themeSettings: boolean;
  activeMenu: boolean;
  isClicked: {
    notification: boolean;
  };
  setScreenSize: (size: undefined | number) => void;
  setCurrentColor: (color: string) => void;
  setActiveMenu: (active: boolean) => void;
  setThemeSettings: (settings: boolean) => void;
  toggleNotification: () => void;
}

const useStore = create<State>((set) => ({
  screenSize: undefined,
  currentColor: '#03C9D7',
  themeSettings: false,
  activeMenu: true,
  isClicked: { notification: false },

  setScreenSize: (size) => set({ screenSize: size }),
  setCurrentColor: (color) => {
    set({ currentColor: color });
    localStorage.setItem('colorMode', color);
  },
  setActiveMenu: (active) => set({ activeMenu: active }),
  setThemeSettings: (settings) => set({ themeSettings: settings }),
  toggleNotification: () =>
    set((state) => ({
      isClicked: {
        notification: !state.isClicked.notification,
      },
    })),
}));

export default useStore;

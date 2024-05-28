import { create } from 'zustand';

interface State {
  screenSize: undefined | number;
  currentColor: string;
  themeSettings: boolean;
  activeMenu: boolean;
  isClicked: {
    chat: boolean;
    cart: boolean;
    userProfile: boolean;
    notification: boolean;
  };
  setScreenSize: (size: undefined | number) => void;
  setCurrentColor: (color: string) => void;
  setActiveMenu: (active: boolean) => void;
  setIsClicked: (clicked: {
    chat: boolean;
    cart: boolean;
    userProfile: boolean;
    notification: boolean;
  }) => void;
  setThemeSettings: (settings: boolean) => void;
  handleClick: (clicked: keyof State['isClicked']) => void;
}

export const initialState = {
  chat: false,
  cart: false,
  userProfile: false,
  notification: false,
};

const useStore = create<State>((set) => ({
  screenSize: undefined,
  currentColor: '#03C9D7',
  themeSettings: false,
  activeMenu: true,
  isClicked: initialState,

  setScreenSize: (size) => set({ screenSize: size }),
  setCurrentColor: (color) => {
    set({ currentColor: color });
    localStorage.setItem('colorMode', color);
  },
  setActiveMenu: (active) => set({ activeMenu: active }),
  setIsClicked: (clicked) => {
    set({ isClicked: clicked });
  },
  setThemeSettings: (settings) => set({ themeSettings: settings }),
  handleClick: (clicked) => {
    set((state) => ({
      isClicked: {
        ...state.isClicked,
        [clicked]: !state.isClicked[clicked],
      },
    }));
  },
}));

export default useStore;

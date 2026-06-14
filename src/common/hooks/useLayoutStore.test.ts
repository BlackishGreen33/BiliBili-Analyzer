import { beforeEach, describe, expect, it } from 'vitest';

import { useLayoutStore } from '@/common/hooks/useLayoutStore';

describe('useLayoutStore', () => {
  beforeEach(() => {
    useLayoutStore.setState({
      screenSize: undefined,
      activeMenu: true,
    });
  });

  it('has the expected initial state', () => {
    const s = useLayoutStore.getState();
    expect(s.screenSize).toBeUndefined();
    expect(s.activeMenu).toBe(true);
  });

  it('setScreenSize updates the size', () => {
    useLayoutStore.getState().setScreenSize(1280);
    expect(useLayoutStore.getState().screenSize).toBe(1280);
  });

  it('setActiveMenu toggles the menu', () => {
    useLayoutStore.getState().setActiveMenu(false);
    expect(useLayoutStore.getState().activeMenu).toBe(false);
  });
});

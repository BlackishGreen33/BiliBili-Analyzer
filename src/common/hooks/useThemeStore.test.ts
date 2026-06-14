import { beforeEach, describe, expect, it } from 'vitest';

import { useThemeStore } from '@/common/hooks/useThemeStore';

describe('useThemeStore', () => {
  beforeEach(() => {
    // 重置為初始狀態
    useThemeStore.setState({
      currentColor: '#FB7299',
      themeSettings: false,
    });
  });

  it('has the expected initial state', () => {
    const s = useThemeStore.getState();
    expect(s.currentColor).toBe('#FB7299');
    expect(s.themeSettings).toBe(false);
  });

  it('setCurrentColor updates the color', () => {
    useThemeStore.getState().setCurrentColor('#03C9D7');
    expect(useThemeStore.getState().currentColor).toBe('#03C9D7');
  });

  it('setThemeSettings toggles the modal', () => {
    useThemeStore.getState().setThemeSettings(true);
    expect(useThemeStore.getState().themeSettings).toBe(true);
    useThemeStore.getState().setThemeSettings(false);
    expect(useThemeStore.getState().themeSettings).toBe(false);
  });
});

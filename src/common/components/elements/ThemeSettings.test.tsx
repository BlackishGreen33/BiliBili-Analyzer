import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';

import ThemeSettings from '@/common/components/elements/ThemeSettings';
import { useThemeStore } from '@/common/hooks/useThemeStore';
import { renderWithProviders } from '@/test/test-utils';

describe('ThemeSettings', () => {
  beforeEach(() => {
    // 重置 store 為初始狀態
    useThemeStore.setState({
      currentColor: '#FB7299',
      themeSettings: true,
    });
  });

  it('does not render when themeSettings is false', () => {
    useThemeStore.setState({ themeSettings: false });
    renderWithProviders(<ThemeSettings />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('renders a dialog when themeSettings is true', async () => {
    renderWithProviders(<ThemeSettings />);
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('shows the localized settings title', async () => {
    renderWithProviders(<ThemeSettings />);
    await waitFor(() => {
      expect(screen.getByText('设置中心')).toBeInTheDocument();
    });
  });

  it('shows all 6 accent color buttons', async () => {
    renderWithProviders(<ThemeSettings />);
    await waitFor(() => {
      const buttons = screen.getAllByRole('button', {
        name: /粉色|青色|蓝紫|橙红|深蓝|橘黄/,
      });
      expect(buttons.length).toBe(6);
    });
  });

  it('clicking the close button calls setThemeSettings(false)', async () => {
    const setThemeSettings = vi.fn();
    useThemeStore.setState({ setThemeSettings });
    const user = userEvent.setup();
    renderWithProviders(<ThemeSettings />);
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
    const closeBtn = screen.getByRole('button', { name: '关闭' });
    await user.click(closeBtn);
    expect(setThemeSettings).toHaveBeenCalledWith(false);
  });

  it('shows the light/dark theme radio buttons', async () => {
    renderWithProviders(<ThemeSettings />);
    await waitFor(() => {
      expect(screen.getByText('浅色模式')).toBeInTheDocument();
      expect(screen.getByText('深色模式')).toBeInTheDocument();
    });
  });
});

// vitest's globals need to be referenced for tree-shake guard
import { vi } from 'vitest';

import { beforeEach, describe, expect, it } from 'vitest';

import { useUiStore } from '@/common/hooks/useUiStore';

describe('useUiStore', () => {
  beforeEach(() => {
    useUiStore.setState({ downloadOpen: false });
  });

  it('has the expected initial state', () => {
    expect(useUiStore.getState().downloadOpen).toBe(false);
  });

  it('setDownloadOpen updates the flag', () => {
    useUiStore.getState().setDownloadOpen(true);
    expect(useUiStore.getState().downloadOpen).toBe(true);
  });

  it('toggleDownload flips the flag', () => {
    useUiStore.getState().toggleDownload();
    expect(useUiStore.getState().downloadOpen).toBe(true);
    useUiStore.getState().toggleDownload();
    expect(useUiStore.getState().downloadOpen).toBe(false);
  });
});

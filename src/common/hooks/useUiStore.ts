import { create } from 'zustand';

interface UiState {
  downloadOpen: boolean;
  setDownloadOpen: (open: boolean) => void;
  toggleDownload: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  downloadOpen: false,
  setDownloadOpen: (open) => set({ downloadOpen: open }),
  toggleDownload: () => set((s) => ({ downloadOpen: !s.downloadOpen })),
}));

import { create } from "zustand";

interface UIState {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  commandOpen: boolean;
  setCommandOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  searchQuery: "",
  setSearchQuery: (q) => set({ searchQuery: q }),
  commandOpen: false,
  setCommandOpen: (open) => set({ commandOpen: open }),
}));

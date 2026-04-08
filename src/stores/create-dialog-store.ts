import { create } from "zustand";

interface CreateDialogStore {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

export const useCreateDialogStore = create<CreateDialogStore>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}));

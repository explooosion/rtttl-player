import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { RtttlEntry } from "@/utils/rtttl-parser";

export type SortMode = "a-z" | "z-a" | "artist-a-z" | "artist-z-a";

interface CollectionState {
  items: RtttlEntry[];
  userItems: RtttlEntry[];
  searchQuery: string;
  sortMode: SortMode;
  activeLetter: string | null;
  isLoading: boolean;
  setItems: (items: RtttlEntry[]) => void;
  addUserItem: (item: RtttlEntry) => void;
  setSearchQuery: (query: string) => void;
  setSortMode: (mode: SortMode) => void;
  setActiveLetter: (letter: string | null) => void;
  setIsLoading: (loading: boolean) => void;
}

export const useCollectionStore = create<CollectionState>()(
  persist(
    (set) => ({
      items: [],
      userItems: [],
      searchQuery: "",
      sortMode: "a-z",
      activeLetter: null,
      isLoading: true,
      setItems: (items) => set({ items, isLoading: false }),
      addUserItem: (item) =>
        set((state) => ({ userItems: [...state.userItems, item] })),
      setSearchQuery: (searchQuery) => set({ searchQuery }),
      setSortMode: (sortMode) => set({ sortMode }),
      setActiveLetter: (activeLetter) => set({ activeLetter }),
      setIsLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: "rtttl-user-items",
      partialize: (state) => ({ userItems: state.userItems }),
    },
  ),
);

function matchesSearch(item: RtttlEntry, query: string): boolean {
  const q = query.toLowerCase();
  return (
    item.title.toLowerCase().includes(q) ||
    item.artist.toLowerCase().includes(q) ||
    item.code.toLowerCase().includes(q)
  );
}

function sortItems(items: RtttlEntry[], mode: SortMode): RtttlEntry[] {
  const sorted = [...items];
  if (mode === "a-z") {
    sorted.sort((a, b) => a.title.localeCompare(b.title));
  } else if (mode === "z-a") {
    sorted.sort((a, b) => b.title.localeCompare(a.title));
  } else if (mode === "artist-a-z") {
    sorted.sort(
      (a, b) => a.artist.localeCompare(b.artist) || a.title.localeCompare(b.title),
    );
  } else if (mode === "artist-z-a") {
    sorted.sort(
      (a, b) => b.artist.localeCompare(a.artist) || a.title.localeCompare(b.title),
    );
  }
  return sorted;
}

export function useFilteredItems(): RtttlEntry[] {
  const items = useCollectionStore((s) => s.items);
  const userItems = useCollectionStore((s) => s.userItems);
  const searchQuery = useCollectionStore((s) => s.searchQuery);
  const sortMode = useCollectionStore((s) => s.sortMode);
  const activeLetter = useCollectionStore((s) => s.activeLetter);

  const allItems = [...items, ...userItems];

  let filtered = allItems;

  if (searchQuery.trim()) {
    filtered = filtered.filter((item) => matchesSearch(item, searchQuery));
  }

  if (activeLetter) {
    filtered = filtered.filter((item) => item.firstLetter === activeLetter);
  }

  return sortItems(filtered, sortMode);
}

export function useAvailableLetters(): string[] {
  const items = useCollectionStore((s) => s.items);
  const userItems = useCollectionStore((s) => s.userItems);
  const allItems = [...items, ...userItems];
  const letters = new Set(allItems.map((item) => item.firstLetter));
  return Array.from(letters).sort((a, b) => {
    if (a === "0-9") { return -1; }
    if (b === "0-9") { return 1; }
    if (a === "#") { return 1; }
    if (b === "#") { return -1; }
    return a.localeCompare(b);
  });
}

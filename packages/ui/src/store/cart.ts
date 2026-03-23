import { create } from "zustand";
import { persist } from "zustand/middleware";

/** Buyer cart — expand when CampaignItem / Cart models ship (Sprint 3+). */
export type CartLine = {
  campaignItemId: string;
  quantity: number;
};

type CartState = {
  lines: CartLine[];
  addLine: (line: CartLine) => void;
  clear: () => void;
};

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      addLine: (line) =>
        set((s) => ({
          lines: [...s.lines.filter((l) => l.campaignItemId !== line.campaignItemId), line],
        })),
      clear: () => set({ lines: [] }),
    }),
    { name: "joe-perks-cart" }
  )
);

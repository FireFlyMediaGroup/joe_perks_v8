import { create } from "zustand";
import { persist } from "zustand/middleware";

const MAX_QTY = 99;

declare global {
  interface Window {
    __JOE_PERKS_CART_STORE__?: typeof useCartStore;
  }
}

/** Display + checkout identity — prices are cents (`CampaignItem.retailPrice`). */
export interface CartLine {
  campaignItemId: string;
  imageUrl?: string;
  productName: string;
  quantity: number;
  retailPrice: number;
  variantDesc: string;
}

export interface AddLineContext {
  campaignId: string;
  orgSlug: string;
}

interface CartState {
  activeCampaignId: string | null;
  activeOrgSlug: string | null;
  addLine: (ctx: AddLineContext, line: CartLine) => void;
  clear: () => void;
  getLineCount: () => number;
  getSubtotalCents: () => number;
  getTotalQuantity: () => number;
  lines: CartLine[];
  removeLine: (campaignItemId: string) => void;
  updateQuantity: (campaignItemId: string, quantity: number) => void;
}

function mergeLine(lines: CartLine[], line: CartLine): CartLine[] {
  const nextQty = Math.min(
    MAX_QTY,
    (lines.find((l) => l.campaignItemId === line.campaignItemId)?.quantity ??
      0) + line.quantity
  );
  const without = lines.filter((l) => l.campaignItemId !== line.campaignItemId);
  if (nextQty <= 0) {
    return without;
  }
  return [...without, { ...line, quantity: nextQty }];
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      activeCampaignId: null,
      activeOrgSlug: null,
      lines: [],

      addLine: (ctx, line) => {
        const qty = Math.min(MAX_QTY, Math.max(1, line.quantity));
        const normalized: CartLine = { ...line, quantity: qty };
        set((s) => {
          const switchCampaign =
            s.activeCampaignId !== null &&
            s.activeCampaignId !== ctx.campaignId;
          const linesAfterSwitch = switchCampaign ? [] : s.lines;
          const nextLines = mergeLine(linesAfterSwitch, normalized);
          return {
            activeCampaignId: ctx.campaignId,
            activeOrgSlug: ctx.orgSlug,
            lines: nextLines,
          };
        });
      },

      removeLine: (campaignItemId) =>
        set((s) => ({
          lines: s.lines.filter((l) => l.campaignItemId !== campaignItemId),
        })),

      updateQuantity: (campaignItemId, quantity) => {
        if (quantity <= 0) {
          get().removeLine(campaignItemId);
          return;
        }
        set((s) => ({
          lines: s.lines.map((l) =>
            l.campaignItemId === campaignItemId
              ? { ...l, quantity: Math.min(MAX_QTY, quantity) }
              : l
          ),
        }));
      },

      clear: () =>
        set({
          lines: [],
          activeCampaignId: null,
          activeOrgSlug: null,
        }),

      getLineCount: () => get().lines.length,

      getTotalQuantity: () =>
        get().lines.reduce((sum, l) => sum + l.quantity, 0),

      getSubtotalCents: () =>
        get().lines.reduce((sum, l) => sum + l.retailPrice * l.quantity, 0),
    }),
    {
      name: "joe-perks-cart",
      onRehydrateStorage: () => (state) => {
        if (!state?.lines) {
          return;
        }
        const bad = state.lines.some(
          (l) =>
            typeof (l as CartLine).productName !== "string" ||
            typeof (l as CartLine).retailPrice !== "number"
        );
        if (bad && typeof state.clear === "function") {
          state.clear();
        }
      },
    }
  )
);

if (
  typeof window !== "undefined" &&
  (process.env.NODE_ENV !== "production" ||
    process.env.NEXT_PUBLIC_E2E_TEST_MODE === "1")
) {
  window.__JOE_PERKS_CART_STORE__ = useCartStore;
}

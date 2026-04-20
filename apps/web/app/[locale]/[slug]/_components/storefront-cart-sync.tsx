"use client";

import { useCartStore } from "@joe-perks/ui";
import { useEffect } from "react";

/** Clears the cart when navigating to a different org storefront (MVP single-campaign cart). */
export function StorefrontCartSync({ orgSlug }: { orgSlug: string }) {
  const clear = useCartStore((s) => s.clear);
  const activeOrgSlug = useCartStore((s) => s.activeOrgSlug);
  const lines = useCartStore((s) => s.lines);

  useEffect(() => {
    if (lines.length === 0) {
      return;
    }
    if (activeOrgSlug && activeOrgSlug !== orgSlug) {
      clear();
    }
  }, [orgSlug, activeOrgSlug, lines.length, clear]);

  return null;
}

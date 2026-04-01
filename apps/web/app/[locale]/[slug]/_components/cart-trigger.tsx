"use client";

import { Button } from "@repo/design-system/components/ui/button";
import { ShoppingBag } from "lucide-react";
import { forwardRef } from "react";

export interface CartTriggerButtonProps {
  className?: string;
  lineCount: number;
}

/** Header cart control — min 44×44px touch target; pairs with `SheetTrigger asChild`. */
export const CartTriggerButton = forwardRef<
  HTMLButtonElement,
  CartTriggerButtonProps
>(function CartTriggerButton({ lineCount, className }, ref) {
  return (
    <Button
      aria-label={
        lineCount > 0
          ? `Shopping cart, ${lineCount} items`
          : "Shopping cart, empty"
      }
      className={`relative size-11 shrink-0 touch-manipulation ${className ?? ""}`}
      ref={ref}
      type="button"
      variant="outline"
    >
      <ShoppingBag aria-hidden className="size-5" />
      {lineCount > 0 ? (
        <span className="absolute -top-1 -right-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[#D4603A] px-1 font-mono font-semibold text-[10px] text-white">
          {lineCount > 99 ? "99+" : lineCount}
        </span>
      ) : null}
    </Button>
  );
});

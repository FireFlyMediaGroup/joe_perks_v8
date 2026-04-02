"use client";

import type { ComponentPropsWithoutRef } from "react";
import { Button } from "@repo/design-system/components/ui/button";
import { ShoppingBag } from "lucide-react";
import { forwardRef } from "react";

export interface CartTriggerButtonProps
  extends Omit<ComponentPropsWithoutRef<"button">, "children"> {
  lineCount: number;
}

export const CartTriggerButton = forwardRef<
  HTMLButtonElement,
  CartTriggerButtonProps
>(function CartTriggerButton({ lineCount, className, ...rest }, ref) {
  return (
    <Button
      {...rest}
      aria-label={
        lineCount > 0
          ? `Shopping cart, ${lineCount} items`
          : "Shopping cart, empty"
      }
      className={`relative size-11 shrink-0 touch-manipulation border-jp-border ${className ?? ""}`}
      ref={ref}
      type="button"
      variant="outline"
    >
      <ShoppingBag aria-hidden className="size-5 text-jp-text" />
      {lineCount > 0 ? (
        <span className="absolute -top-1.5 -right-1.5 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-jp-terra px-1 font-jp-mono font-semibold text-[10px] text-white shadow-sm">
          {lineCount > 99 ? "99+" : lineCount}
        </span>
      ) : null}
    </Button>
  );
});

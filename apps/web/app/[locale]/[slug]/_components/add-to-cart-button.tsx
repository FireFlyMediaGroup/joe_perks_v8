"use client";

import {
  type AddLineContext,
  type CartLine,
  useCartStore,
} from "@joe-perks/ui";
import { Button } from "@repo/design-system/components/ui/button";
import { useCallback, useState } from "react";

export interface AddToCartButtonProps {
  className?: string;
  ctx: AddLineContext;
  disabled?: boolean;
  line: Omit<CartLine, "quantity">;
}

function addToCartLabel(
  added: boolean,
  existingQty: number,
  disabled: boolean
): string {
  if (disabled) {
    return "Unavailable";
  }
  if (added) {
    return "Added";
  }
  if (existingQty > 0) {
    return `Add another (${existingQty} in cart)`;
  }
  return "Add to cart";
}

export function AddToCartButton({
  ctx,
  line,
  className,
  disabled = false,
}: AddToCartButtonProps) {
  const addLine = useCartStore((s) => s.addLine);
  const lines = useCartStore((s) => s.lines);
  const [added, setAdded] = useState(false);

  const existingQty =
    lines.find((l) => l.campaignItemId === line.campaignItemId)?.quantity ?? 0;

  const handleAdd = useCallback(() => {
    if (disabled) {
      return;
    }
    addLine(ctx, { ...line, quantity: 1 });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2000);
  }, [addLine, ctx, disabled, line]);

  return (
    <Button
      className={`min-h-11 w-full touch-manipulation ${className ?? ""}`}
      disabled={disabled}
      onClick={handleAdd}
      title={
        disabled
          ? "Purchases temporarily unavailable — shipping is not set up for this store."
          : undefined
      }
      type="button"
      variant={added ? "secondary" : "default"}
    >
      {addToCartLabel(added, existingQty, disabled)}
    </Button>
  );
}

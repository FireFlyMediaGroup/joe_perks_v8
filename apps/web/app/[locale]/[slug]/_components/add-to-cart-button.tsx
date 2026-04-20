"use client";

import {
  type AddLineContext,
  type CartLine,
  useCartStore,
} from "@joe-perks/ui";
import { Button } from "@repo/design-system/components/ui/button";
import { Check, ShoppingBag } from "lucide-react";
import { useCallback, useState } from "react";

export interface AddToCartButtonProps {
  className?: string;
  ctx: AddLineContext;
  disabled?: boolean;
  line: Omit<CartLine, "quantity">;
}

function getButtonColorClass(added: boolean, disabled: boolean): string {
  if (added) {
    return "bg-jp-teal text-white hover:bg-jp-teal-dark";
  }
  if (disabled) {
    return "";
  }
  return "bg-jp-terra text-white hover:bg-jp-terra-dark";
}

function renderLabel(added: boolean, existingQty: number, disabled: boolean) {
  if (disabled) {
    return "Unavailable";
  }
  if (added) {
    return (
      <>
        <Check className="mr-1.5 size-4" />
        Added
      </>
    );
  }
  if (existingQty > 0) {
    return (
      <>
        <ShoppingBag className="mr-1.5 size-4" />
        Add another ({existingQty} in cart)
      </>
    );
  }
  return (
    <>
      <ShoppingBag className="mr-1.5 size-4" />
      Add to cart
    </>
  );
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
      className={[
        "min-h-11 w-full touch-manipulation font-body",
        getButtonColorClass(added, disabled),
        className ?? "",
      ].join(" ")}
      disabled={disabled}
      onClick={handleAdd}
      title={
        disabled
          ? "Purchases temporarily unavailable — shipping is not set up for this store."
          : undefined
      }
      type="button"
      variant={disabled ? "secondary" : "default"}
    >
      {renderLabel(added, existingQty, disabled)}
    </Button>
  );
}

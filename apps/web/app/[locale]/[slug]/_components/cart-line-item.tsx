"use client";

import { type CartLine, useCartStore } from "@joe-perks/ui";
import { Button } from "@repo/design-system/components/ui/button";
import Image from "next/image";
import { formatCentsAsDollars } from "../_lib/format";

interface CartLineItemProps {
  line: CartLine;
}

export function CartLineItem({ line }: CartLineItemProps) {
  const removeLine = useCartStore((s) => s.removeLine);
  const updateQuantity = useCartStore((s) => s.updateQuantity);

  const lineTotalCents = line.retailPrice * line.quantity;
  const title = `${line.productName} — ${line.variantDesc}`;

  return (
    <li className="flex gap-3 border-border/60 border-b py-4 last:border-b-0">
      <div className="relative size-16 shrink-0 overflow-hidden rounded-md bg-muted">
        {line.imageUrl ? (
          <Image
            alt={line.productName}
            className="object-cover"
            fill
            sizes="64px"
            src={line.imageUrl}
            unoptimized
          />
        ) : (
          <div
            aria-hidden
            className="flex h-full w-full items-center justify-center bg-linear-to-br from-muted to-muted/60"
          />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-foreground text-sm leading-snug">
          {title}
        </p>
        <p className="mt-0.5 text-muted-foreground text-xs tabular-nums">
          {formatCentsAsDollars(line.retailPrice)} ea
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <div className="flex items-center rounded-md border border-border bg-background">
            <Button
              aria-label="Decrease quantity"
              className="size-11 min-h-11 min-w-11 touch-manipulation"
              onClick={() =>
                updateQuantity(line.campaignItemId, line.quantity - 1)
              }
              type="button"
              variant="ghost"
            >
              −
            </Button>
            <span className="min-w-8 text-center font-mono text-sm tabular-nums">
              {line.quantity}
            </span>
            <Button
              aria-label="Increase quantity"
              className="size-11 min-h-11 min-w-11 touch-manipulation"
              disabled={line.quantity >= 99}
              onClick={() =>
                updateQuantity(line.campaignItemId, line.quantity + 1)
              }
              type="button"
              variant="ghost"
            >
              +
            </Button>
          </div>
          <Button
            aria-label={`Remove ${line.productName} from cart`}
            className="min-h-11 touch-manipulation"
            onClick={() => removeLine(line.campaignItemId)}
            type="button"
            variant="ghost"
          >
            Remove
          </Button>
        </div>
      </div>
      <div className="shrink-0 text-right">
        <p className="font-semibold text-foreground tabular-nums">
          {formatCentsAsDollars(lineTotalCents)}
        </p>
      </div>
    </li>
  );
}

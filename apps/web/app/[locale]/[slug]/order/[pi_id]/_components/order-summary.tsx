"use client";

import { useCartStore } from "@joe-perks/ui";
import { Button } from "@repo/design-system/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { formatCentsAsDollars } from "../../../_lib/format";

export interface OrderLine {
  lineTotal: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  variantDesc: string;
}

export interface OrderSummaryProps {
  grossAmount: number;
  items: OrderLine[];
  locale: string;
  orderNumber: string;
  orgAmount: number;
  orgName: string;
  orgPctSnapshot: number;
  productSubtotal: number;
  shippingAmount: number;
  slug: string;
}

export function OrderSummary({
  grossAmount,
  items,
  locale,
  orderNumber,
  orgAmount,
  orgName,
  orgPctSnapshot,
  productSubtotal,
  shippingAmount,
  slug,
}: OrderSummaryProps) {
  const clear = useCartStore((s) => s.clear);

  useEffect(() => {
    clear();
  }, [clear]);

  const pctDisplay = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 1,
    minimumFractionDigits: 0,
  }).format(orgPctSnapshot * 100);

  return (
    <div className="space-y-8">
      <div className="flex flex-col items-center gap-3 text-center">
        <CheckCircle2
          aria-hidden
          className="size-12 text-emerald-600 dark:text-emerald-400"
        />
        <h1 className="font-bold text-2xl text-foreground tracking-tight">
          Thank you!
        </h1>
        <p className="max-w-md text-muted-foreground text-sm leading-relaxed">
          Your order supports{" "}
          <span className="font-medium text-foreground">{orgName}</span> —{" "}
          <span className="font-medium text-foreground">{pctDisplay}%</span> (
          {formatCentsAsDollars(orgAmount)}) goes to the fundraiser from your
          coffee subtotal.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
          Order number
        </p>
        <p className="mt-1 font-bold font-mono text-2xl text-foreground tracking-tight">
          {orderNumber}
        </p>

        <ul className="mt-6 divide-y divide-border">
          {items.map((item, index) => (
            <li
              className="flex flex-col gap-1 py-4 first:pt-0"
              key={`${item.productName}-${item.variantDesc}-${String(index)}`}
            >
              <div className="flex justify-between gap-4">
                <span className="font-medium text-foreground text-sm">
                  {item.productName}
                </span>
                <span className="shrink-0 font-medium text-foreground text-sm tabular-nums">
                  {formatCentsAsDollars(item.lineTotal)}
                </span>
              </div>
              <p className="text-muted-foreground text-xs">
                {item.variantDesc}
              </p>
              <p className="text-muted-foreground text-xs">
                {formatCentsAsDollars(item.unitPrice)} x {item.quantity}
              </p>
            </li>
          ))}
        </ul>

        <div className="mt-4 space-y-2 border-border border-t pt-4 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="tabular-nums">
              {formatCentsAsDollars(productSubtotal)}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Shipping</span>
            <span className="tabular-nums">
              {formatCentsAsDollars(shippingAmount)}
            </span>
          </div>
          <div className="flex justify-between gap-4 font-semibold text-foreground">
            <span>Total</span>
            <span className="tabular-nums">
              {formatCentsAsDollars(grossAmount)}
            </span>
          </div>
        </div>
      </div>

      <Button
        asChild
        className="min-h-11 w-full touch-manipulation"
        variant="outline"
      >
        <Link href={`/${locale}/${slug}`}>Continue shopping</Link>
      </Button>
    </div>
  );
}

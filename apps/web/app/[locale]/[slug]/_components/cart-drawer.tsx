"use client";

import { calculateSplits } from "@joe-perks/stripe/splits";
import { useCartStore } from "@joe-perks/ui";
import { Button } from "@repo/design-system/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@repo/design-system/components/ui/sheet";
import { useIsMobile } from "@repo/design-system/hooks/use-mobile";
import { cn } from "@repo/design-system/lib/utils";
import Link from "next/link";
import { useMemo } from "react";
import { formatCentsAsDollars } from "../_lib/format";
import type { SplitPreviewDefaults } from "../_lib/queries";
import { CartLineItem } from "./cart-line-item";
import { CartTriggerButton } from "./cart-trigger";

export interface CartDrawerProps {
  campaignName: string;
  locale: string;
  orgName: string;
  purchasesEnabled: boolean;
  slug: string;
  splitPreviewDefaults: SplitPreviewDefaults;
}

/**
 * Sliding cart — desktop: right drawer; mobile: bottom sheet.
 * Visual rhythm aligned with roaster fulfillment line-item layout (label + list + totals).
 */
export function CartDrawer({
  campaignName,
  locale,
  orgName,
  purchasesEnabled,
  slug,
  splitPreviewDefaults,
}: CartDrawerProps) {
  const isMobile = useIsMobile();
  const lines = useCartStore((s) => s.lines);
  const clear = useCartStore((s) => s.clear);
  const lineCount = lines.length;
  const subtotalCents = useMemo(
    () => lines.reduce((sum, l) => sum + l.retailPrice * l.quantity, 0),
    [lines]
  );

  const shippingForCalc = splitPreviewDefaults.estimatedShippingCents ?? 0;

  const splitPreview = useMemo(() => {
    if (lines.length === 0 || subtotalCents <= 0) {
      return null;
    }
    try {
      return calculateSplits({
        orgPct: splitPreviewDefaults.orgPct,
        orgPctMax: splitPreviewDefaults.orgPctMax,
        orgPctMin: splitPreviewDefaults.orgPctMin,
        platformFeeFloorCents: splitPreviewDefaults.platformFeeFloorCents,
        platformFeePct: splitPreviewDefaults.platformFeePct,
        productSubtotalCents: subtotalCents,
        shippingAmountCents: shippingForCalc,
      });
    } catch {
      return null;
    }
  }, [lines.length, shippingForCalc, splitPreviewDefaults, subtotalCents]);

  const orgPctDisplay = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 1,
    minimumFractionDigits: 0,
  }).format(splitPreviewDefaults.orgPct * 100);

  const hasShippingEstimate =
    splitPreviewDefaults.estimatedShippingCents !== null;
  const estimatedTotalLabel = hasShippingEstimate
    ? "Est. order total"
    : "Subtotal (before shipping)";
  let estimatedTotalCents = subtotalCents;
  if (splitPreview) {
    estimatedTotalCents = hasShippingEstimate
      ? splitPreview.grossAmount
      : splitPreview.productSubtotal;
  }

  const checkoutHref = `/${locale}/${slug}/checkout`;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <CartTriggerButton lineCount={lineCount} />
      </SheetTrigger>
      <SheetContent
        className={cn(
          "flex w-full flex-col gap-0 p-0 sm:max-w-md",
          isMobile && "max-h-[min(88vh,720px)] rounded-t-2xl"
        )}
        side={isMobile ? "bottom" : "right"}
      >
        <SheetHeader className="border-border/60 border-b bg-[#FDF9F4] px-4 py-5 text-left">
          <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
            {orgName}
          </p>
          <SheetTitle className="font-bold text-foreground text-xl leading-snug">
            Your cart
          </SheetTitle>
          <div className="mt-3 rounded-lg border border-border/60 bg-background/80 px-3 py-2">
            <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
              Campaign
            </p>
            <p className="font-semibold text-foreground text-sm leading-snug">
              {campaignName}
            </p>
          </div>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4">
          {lines.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 py-16 text-center">
              <p className="max-w-xs text-muted-foreground text-sm leading-relaxed">
                Your cart is empty. Add coffee from the menu to support{" "}
                {orgName}.
              </p>
              <SheetTrigger asChild>
                <Button className="min-h-11 touch-manipulation" type="button">
                  Continue shopping
                </Button>
              </SheetTrigger>
            </div>
          ) : (
            <>
              <p className="pt-5 font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
                Items
              </p>
              <ul className="mt-1">
                {lines.map((line) => (
                  <CartLineItem key={line.campaignItemId} line={line} />
                ))}
              </ul>
            </>
          )}
        </div>

        {lines.length > 0 ? (
          <SheetFooter className="border-border/60 border-t bg-background">
            <div className="flex w-full flex-col gap-3">
              <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
                Estimate
              </p>
              <div className="flex flex-col gap-2.5 text-sm">
                <div className="flex items-baseline justify-between gap-4">
                  <span className="text-muted-foreground">Coffee subtotal</span>
                  <span className="font-medium text-foreground tabular-nums">
                    {formatCentsAsDollars(subtotalCents)}
                  </span>
                </div>
                <div className="flex items-baseline justify-between gap-4">
                  <span className="text-muted-foreground">Shipping</span>
                  {splitPreviewDefaults.estimatedShippingCents !== null ? (
                    <span className="font-medium text-foreground tabular-nums">
                      {formatCentsAsDollars(
                        splitPreviewDefaults.estimatedShippingCents
                      )}
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-xs">
                      At checkout
                    </span>
                  )}
                </div>
                {splitPreview ? (
                  <div className="rounded-lg bg-emerald-50/90 px-3 py-2.5 dark:bg-emerald-950/30">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-emerald-900 text-sm dark:text-emerald-100">
                        Est. fundraiser for {orgName}
                      </span>
                      <span className="font-semibold text-emerald-900 tabular-nums dark:text-emerald-100">
                        {formatCentsAsDollars(splitPreview.orgAmount)}
                      </span>
                    </div>
                    <p className="mt-1 text-emerald-800/90 text-xs dark:text-emerald-200/90">
                      {orgPctDisplay}% of coffee subtotal (before card fees).
                    </p>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-xs">
                    Fundraiser estimate unavailable for this cart.
                  </p>
                )}
                <div className="flex items-baseline justify-between gap-4 border-border/60 border-t pt-2">
                  <span className="font-medium text-foreground">
                    {estimatedTotalLabel}
                  </span>
                  <span className="font-bold text-foreground text-lg tabular-nums">
                    {formatCentsAsDollars(estimatedTotalCents)}
                  </span>
                </div>
              </div>
              {splitPreviewDefaults.estimatedShippingCents === null ? (
                <p className="text-muted-foreground text-xs leading-relaxed">
                  Shipping is selected at checkout; your card is charged for
                  coffee plus the rate you choose.
                </p>
              ) : (
                <p className="text-muted-foreground text-xs leading-relaxed">
                  Uses this store&apos;s default shipping rate. Final total is
                  confirmed at checkout.
                </p>
              )}
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  className="min-h-11 flex-1 touch-manipulation"
                  onClick={() => clear()}
                  type="button"
                  variant="outline"
                >
                  Clear cart
                </Button>
                {purchasesEnabled ? (
                  <Button asChild className="min-h-11 flex-1 touch-manipulation">
                    <Link href={checkoutHref}>Checkout</Link>
                  </Button>
                ) : (
                  <Button
                    className="min-h-11 flex-1 touch-manipulation"
                    disabled
                    title="Purchases are unavailable until the roaster configures shipping rates."
                    type="button"
                  >
                    Checkout unavailable
                  </Button>
                )}
              </div>
            </div>
          </SheetFooter>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

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
import { Heart, ShoppingBag } from "lucide-react";
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
          "flex w-full flex-col gap-0 border-jp-border p-0 sm:max-w-md",
          isMobile && "max-h-[min(88vh,720px)] rounded-t-2xl"
        )}
        side={isMobile ? "bottom" : "right"}
      >
        <SheetHeader className="border-jp-border border-b bg-jp-bg-page px-5 py-5 text-left">
          <p className="font-jp-mono text-[10px] text-jp-muted uppercase tracking-[0.14em]">
            {orgName}
          </p>
          <SheetTitle className="font-bold font-display text-jp-text text-xl leading-snug">
            Your cart
          </SheetTitle>
          <div className="mt-3 rounded-(--jp-radius-sm) border border-jp-border bg-jp-bg-card px-3 py-2">
            <p className="font-jp-mono text-[10px] text-jp-light uppercase tracking-[0.12em]">
              Campaign
            </p>
            <p className="font-body font-semibold text-jp-text text-sm leading-snug">
              {campaignName}
            </p>
          </div>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-jp-bg-card px-5">
          {lines.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 py-16 text-center">
              <ShoppingBag className="size-10 text-jp-light" />
              <p className="max-w-xs font-body text-jp-muted text-sm leading-relaxed">
                Your cart is empty. Add coffee from the menu to support{" "}
                {orgName}.
              </p>
              <SheetTrigger asChild>
                <Button
                  className="min-h-11 touch-manipulation bg-jp-terra text-white hover:bg-jp-terra-dark"
                  type="button"
                >
                  Continue shopping
                </Button>
              </SheetTrigger>
            </div>
          ) : (
            <>
              <p className="pt-5 font-jp-mono text-[10px] text-jp-muted uppercase tracking-[0.14em]">
                Items ({lineCount})
              </p>
              <ul className="mt-1 divide-y divide-jp-border">
                {lines.map((line) => (
                  <CartLineItem key={line.campaignItemId} line={line} />
                ))}
              </ul>
            </>
          )}
        </div>

        {lines.length > 0 ? (
          <SheetFooter className="border-jp-border border-t bg-jp-bg-page px-5 pt-4 pb-5">
            <div className="flex w-full flex-col gap-3">
              <p className="font-jp-mono text-[10px] text-jp-muted uppercase tracking-[0.14em]">
                Estimate
              </p>
              <div className="flex flex-col gap-2.5 font-body text-sm">
                <div className="flex items-baseline justify-between gap-4">
                  <span className="text-jp-muted">Coffee subtotal</span>
                  <span className="font-medium text-jp-text tabular-nums">
                    {formatCentsAsDollars(subtotalCents)}
                  </span>
                </div>
                <div className="flex items-baseline justify-between gap-4">
                  <span className="text-jp-muted">Shipping</span>
                  {splitPreviewDefaults.estimatedShippingCents !== null ? (
                    <span className="font-medium text-jp-text tabular-nums">
                      {formatCentsAsDollars(
                        splitPreviewDefaults.estimatedShippingCents
                      )}
                    </span>
                  ) : (
                    <span className="text-jp-light text-xs">At checkout</span>
                  )}
                </div>

                {splitPreview ? (
                  <div className="rounded-(--jp-radius-sm) bg-jp-terra/8 px-3 py-2.5">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="flex items-center gap-1.5 text-jp-terra-dark text-sm">
                        <Heart className="size-3.5" />
                        Est. fundraiser for {orgName}
                      </span>
                      <span className="font-semibold text-jp-terra-dark tabular-nums">
                        {formatCentsAsDollars(splitPreview.orgAmount)}
                      </span>
                    </div>
                    <p className="mt-1 text-jp-terra/80 text-xs">
                      {orgPctDisplay}% of coffee subtotal (before card fees).
                    </p>
                  </div>
                ) : (
                  <p className="text-jp-light text-xs">
                    Fundraiser estimate unavailable for this cart.
                  </p>
                )}

                <div className="flex items-baseline justify-between gap-4 border-jp-border border-t pt-2.5">
                  <span className="font-medium text-jp-text">
                    {estimatedTotalLabel}
                  </span>
                  <span className="font-bold text-jp-text text-lg tabular-nums">
                    {formatCentsAsDollars(estimatedTotalCents)}
                  </span>
                </div>
              </div>

              {splitPreviewDefaults.estimatedShippingCents === null ? (
                <p className="font-body text-jp-light text-xs leading-relaxed">
                  Shipping is selected at checkout; your card is charged for
                  coffee plus the rate you choose.
                </p>
              ) : (
                <p className="font-body text-jp-light text-xs leading-relaxed">
                  Uses this store&apos;s default shipping rate. Final total is
                  confirmed at checkout.
                </p>
              )}

              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  className="min-h-11 flex-1 touch-manipulation border-jp-border"
                  onClick={() => clear()}
                  type="button"
                  variant="outline"
                >
                  Clear cart
                </Button>
                {purchasesEnabled ? (
                  <Button
                    asChild
                    className="min-h-11 flex-1 touch-manipulation bg-jp-terra text-white hover:bg-jp-terra-dark"
                  >
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

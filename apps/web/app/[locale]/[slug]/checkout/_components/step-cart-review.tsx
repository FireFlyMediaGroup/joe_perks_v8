"use client";

import { useCartStore } from "@joe-perks/ui";
import { Button } from "@repo/design-system/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { CartLineItem } from "../../_components/cart-line-item";
import { formatCentsAsDollars } from "../../_lib/format";

export interface StepCartReviewProps {
  campaignId: string;
  locale: string;
  onContinue: () => void;
  slug: string;
}

export function StepCartReview({
  locale,
  slug,
  campaignId,
  onContinue,
}: StepCartReviewProps) {
  const router = useRouter();
  const lines = useCartStore((s) => s.lines);
  const activeCampaignId = useCartStore((s) => s.activeCampaignId);
  const activeOrgSlug = useCartStore((s) => s.activeOrgSlug);

  useEffect(() => {
    if (lines.length === 0) {
      router.replace(`/${locale}/${slug}`);
      return;
    }
    if (activeCampaignId !== campaignId || activeOrgSlug !== slug) {
      router.replace(`/${locale}/${slug}`);
    }
  }, [
    activeCampaignId,
    activeOrgSlug,
    campaignId,
    lines.length,
    locale,
    router,
    slug,
  ]);

  if (lines.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">Redirecting to the store…</p>
    );
  }

  const subtotal = lines.reduce(
    (sum, l) => sum + l.retailPrice * l.quantity,
    0
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-semibold text-foreground text-lg">
          Review your cart
        </h2>
        <p className="mt-1 text-muted-foreground text-sm">
          Adjust quantities before shipping and payment.
        </p>
      </div>
      <ul className="rounded-xl border border-border bg-card px-3">
        {lines.map((line) => (
          <CartLineItem key={line.campaignItemId} line={line} />
        ))}
      </ul>
      <div className="flex items-baseline justify-between border-border border-t pt-4">
        <span className="font-medium text-foreground">Subtotal</span>
        <span className="font-semibold text-foreground text-lg tabular-nums">
          {formatCentsAsDollars(subtotal)}
        </span>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
        <Button
          asChild
          className="min-h-11 touch-manipulation"
          type="button"
          variant="outline"
        >
          <Link href={`/${locale}/${slug}`}>Back to store</Link>
        </Button>
        <Button
          className="min-h-11 touch-manipulation"
          onClick={onContinue}
          type="button"
        >
          Continue to shipping
        </Button>
      </div>
    </div>
  );
}

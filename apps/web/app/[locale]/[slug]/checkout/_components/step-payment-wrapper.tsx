"use client";

import type { CartLine } from "@joe-perks/ui";
import { useCartStore } from "@joe-perks/ui";
import { Button } from "@repo/design-system/components/ui/button";
import { Heart } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { formatCentsAsDollars } from "../../_lib/format";
import type { ShippingFormValues } from "../_lib/schema";
import { StepPayment } from "./step-payment";

interface StepPaymentWrapperProps {
  campaignId: string;
  locale: string;
  onBack: () => void;
  orgName: string;
  selectedShippingCents: number;
  shippingValues: ShippingFormValues;
  slug: string;
  subtotalCents: number;
}

interface CheckoutResult {
  clientSecret: string;
  grossAmount: number;
  paymentIntentId: string;
}

function OrderSummary({
  lines,
  orgName,
  selectedShippingCents,
  shippingValues,
  subtotalCents,
}: {
  lines: CartLine[];
  orgName: string;
  selectedShippingCents: number;
  shippingValues: ShippingFormValues;
  subtotalCents: number;
}) {
  return (
    <div className="rounded-(--jp-radius-md) border border-jp-border bg-jp-bg-page p-5">
      <p className="font-jp-mono text-[10px] text-jp-muted uppercase tracking-[0.14em]">
        Order summary
      </p>
      <ul className="mt-3 divide-y divide-jp-border font-body text-sm">
        {lines.map((l) => (
          <li
            className="flex justify-between gap-4 py-2.5 first:pt-0"
            key={l.campaignItemId}
          >
            <span className="min-w-0 text-jp-muted">
              {l.productName}{" "}
              <span className="text-jp-light text-xs">x{l.quantity}</span>
            </span>
            <span className="shrink-0 text-jp-text tabular-nums">
              {formatCentsAsDollars(l.retailPrice * l.quantity)}
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-3 space-y-1.5 border-jp-border border-t pt-3 font-body text-sm">
        <div className="flex justify-between gap-4">
          <span className="text-jp-muted">Subtotal</span>
          <span className="text-jp-text tabular-nums">
            {formatCentsAsDollars(subtotalCents)}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-jp-muted">Shipping</span>
          <span className="text-jp-text tabular-nums">
            {formatCentsAsDollars(selectedShippingCents)}
          </span>
        </div>
        <div className="flex justify-between gap-4 border-jp-border border-t pt-2 font-semibold text-jp-text">
          <span>Total</span>
          <span className="tabular-nums">
            {formatCentsAsDollars(subtotalCents + selectedShippingCents)}
          </span>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-1.5 text-jp-muted text-xs">
        <Heart className="size-3 text-jp-terra" />A portion of your purchase
        supports {orgName}
      </div>
      <p className="mt-2 font-body text-jp-light text-xs">
        {shippingValues.buyerName} · {shippingValues.buyerEmail}
      </p>
    </div>
  );
}

function resolveErrorMessage(status: number, data: { error?: string }): string {
  if (status === 429) {
    return "Too many checkout attempts. Please wait and try again.";
  }
  if (typeof data.error === "string") {
    return data.error;
  }
  return "Could not start payment.";
}

async function createPaymentIntent(
  payload: {
    buyerEmail: string;
    buyerName: string;
    campaignId: string;
    items: { campaignItemId: string; quantity: number }[];
    shippingRateId: string;
  },
  signal: AbortSignal
): Promise<{ ok: true; data: CheckoutResult } | { ok: false; error: string }> {
  const res = await fetch("/api/checkout/create-intent", {
    body: JSON.stringify(payload),
    headers: { "Content-Type": "application/json" },
    method: "POST",
    signal,
  });
  const data = (await res.json().catch(() => ({}))) as {
    clientSecret?: string;
    error?: string;
    grossAmount?: number;
    paymentIntentId?: string;
  };
  if (!res.ok) {
    return { ok: false, error: resolveErrorMessage(res.status, data) };
  }
  const hasRequired =
    data.clientSecret &&
    data.paymentIntentId &&
    typeof data.grossAmount === "number";
  if (!hasRequired) {
    return { ok: false, error: "Invalid response from checkout." };
  }
  return {
    ok: true,
    data: {
      clientSecret: data.clientSecret,
      grossAmount: data.grossAmount,
      paymentIntentId: data.paymentIntentId,
    },
  };
}

export function StepPaymentWrapper({
  campaignId,
  locale,
  onBack,
  orgName,
  selectedShippingCents,
  shippingValues,
  slug,
  subtotalCents,
}: StepPaymentWrapperProps) {
  const lines = useCartStore((s) => s.lines);
  const [intentLoading, setIntentLoading] = useState(false);
  const [intentError, setIntentError] = useState<string | null>(null);
  const [checkout, setCheckout] = useState<CheckoutResult | null>(null);

  useEffect(() => {
    const ac = new AbortController();
    let cancelled = false;
    setIntentLoading(true);
    setIntentError(null);
    setCheckout(null);

    createPaymentIntent(
      {
        buyerEmail: shippingValues.buyerEmail,
        buyerName: shippingValues.buyerName,
        campaignId,
        items: lines.map((l) => ({
          campaignItemId: l.campaignItemId,
          quantity: l.quantity,
        })),
        shippingRateId: shippingValues.shippingRateId,
      },
      ac.signal
    )
      .then((result) => {
        if (cancelled) {
          return;
        }
        if (result.ok) {
          setCheckout(result.data);
        } else {
          setIntentError(result.error);
        }
      })
      .catch((e: unknown) => {
        if (e instanceof Error && e.name === "AbortError") {
          return;
        }
        if (!cancelled) {
          setIntentError("Network error. Check your connection and try again.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIntentLoading(false);
        }
      });

    return () => {
      cancelled = true;
      ac.abort();
    };
  }, [campaignId, lines, shippingValues]);

  const goBack = useCallback(() => {
    setCheckout(null);
    setIntentError(null);
    onBack();
  }, [onBack]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button
          className="min-h-11 w-fit touch-manipulation border-jp-border font-body"
          onClick={goBack}
          type="button"
          variant="outline"
        >
          Back to shipping
        </Button>
        <Link
          className="font-body text-jp-muted text-sm underline-offset-4 hover:text-jp-text hover:underline"
          href={`/${locale}/${slug}`}
        >
          Return to store
        </Link>
      </div>

      <OrderSummary
        lines={lines}
        orgName={orgName}
        selectedShippingCents={selectedShippingCents}
        shippingValues={shippingValues}
        subtotalCents={subtotalCents}
      />

      {intentLoading ? (
        <div className="flex items-center gap-2 font-body text-jp-muted text-sm">
          <div className="size-4 animate-spin rounded-full border-2 border-jp-terra border-t-transparent" />
          Securing your order…
        </div>
      ) : null}
      {intentError ? (
        <div
          className="rounded-(--jp-radius-sm) border border-destructive/40 bg-destructive/10 px-4 py-3 font-body text-destructive text-sm"
          role="alert"
        >
          {intentError}
        </div>
      ) : null}
      {checkout && !intentLoading ? (
        <StepPayment
          clientSecret={checkout.clientSecret}
          grossAmountCents={checkout.grossAmount}
          locale={locale}
          paymentIntentId={checkout.paymentIntentId}
          slug={slug}
        />
      ) : null}
    </div>
  );
}

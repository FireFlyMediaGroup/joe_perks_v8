"use client";

import type { ShippingFormValues } from "../_lib/schema";
import type { ShippingRateOption } from "../../_lib/queries";
import { useCartStore } from "@joe-perks/ui";
import { Button } from "@repo/design-system/components/ui/button";
import { cn } from "@repo/design-system/lib/utils";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { formatCentsAsDollars } from "../../_lib/format";
import { StepCartReview } from "./step-cart-review";
import { StepPayment } from "./step-payment";
import { StepShipping } from "./step-shipping";

export interface CheckoutFormProps {
  campaignId: string;
  defaultShippingRateId: string | null;
  locale: string;
  orgName: string;
  shippingRates: ShippingRateOption[];
  slug: string;
}

export function CheckoutForm({
  campaignId,
  defaultShippingRateId,
  locale,
  orgName,
  shippingRates,
  slug,
}: CheckoutFormProps) {
  const lines = useCartStore((s) => s.lines);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [shippingValues, setShippingValues] = useState<ShippingFormValues | null>(
    null
  );
  const [intentLoading, setIntentLoading] = useState(false);
  const [intentError, setIntentError] = useState<string | null>(null);
  const [checkout, setCheckout] = useState<{
    clientSecret: string;
    grossAmount: number;
    paymentIntentId: string;
  } | null>(null);

  const subtotalCents = useMemo(
    () => lines.reduce((sum, l) => sum + l.retailPrice * l.quantity, 0),
    [lines]
  );

  const selectedShippingCents = useMemo(() => {
    if (!shippingValues) return 0;
    const rate = shippingRates.find((r) => r.id === shippingValues.shippingRateId);
    return rate?.flatRate ?? 0;
  }, [shippingRates, shippingValues]);

  const intentKey = useMemo(() => {
    if (step !== 3 || !shippingValues) {
      return null;
    }
    return JSON.stringify({
      campaignId,
      email: shippingValues.buyerEmail,
      items: lines.map((l) => ({
        id: l.campaignItemId,
        q: l.quantity,
      })),
      rate: shippingValues.shippingRateId,
    });
  }, [campaignId, lines, shippingValues, step]);

  useEffect(() => {
    if (step !== 3 || !intentKey || !shippingValues) {
      return;
    }
    const ac = new AbortController();
    let cancelled = false;
    setIntentLoading(true);
    setIntentError(null);
    setCheckout(null);

    (async () => {
      try {
        const res = await fetch("/api/checkout/create-intent", {
          body: JSON.stringify({
            buyerEmail: shippingValues.buyerEmail,
            buyerName: shippingValues.buyerName,
            campaignId,
            items: lines.map((l) => ({
              campaignItemId: l.campaignItemId,
              quantity: l.quantity,
            })),
            shippingRateId: shippingValues.shippingRateId,
          }),
          headers: { "Content-Type": "application/json" },
          method: "POST",
          signal: ac.signal,
        });
        const data = (await res.json().catch(() => ({}))) as {
          clientSecret?: string;
          error?: string;
          grossAmount?: number;
          paymentIntentId?: string;
        };
        if (cancelled) {
          return;
        }
        if (!res.ok) {
          if (res.status === 429) {
            setIntentError(
              "Too many checkout attempts. Please wait and try again."
            );
          } else {
            setIntentError(
              typeof data.error === "string"
                ? data.error
                : "Could not start payment."
            );
          }
          setIntentLoading(false);
          return;
        }
        if (
          !data.clientSecret ||
          !data.paymentIntentId ||
          typeof data.grossAmount !== "number"
        ) {
          setIntentError("Invalid response from checkout.");
          setIntentLoading(false);
          return;
        }
        setCheckout({
          clientSecret: data.clientSecret,
          grossAmount: data.grossAmount,
          paymentIntentId: data.paymentIntentId,
        });
      } catch (e) {
        if (e instanceof Error && e.name === "AbortError") {
          return;
        }
        if (!cancelled) {
          setIntentError("Network error. Check your connection and try again.");
        }
      }
      if (!cancelled) {
        setIntentLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      ac.abort();
    };
  }, [campaignId, intentKey, lines, shippingValues, step]);

  const goBackFromPayment = useCallback(() => {
    setStep(2);
    setCheckout(null);
    setIntentError(null);
  }, []);

  const steps = [
    { id: 1 as const, label: "Cart" },
    { id: 2 as const, label: "Shipping" },
    { id: 3 as const, label: "Payment" },
  ];

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8 border-border border-b pb-6">
        <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
          {orgName}
        </p>
        <h1 className="mt-1 font-bold text-2xl text-foreground tracking-tight">
          Checkout
        </h1>
        <ol className="mt-6 flex gap-2">
          {steps.map((s) => (
            <li className="flex flex-1 items-center gap-2" key={s.id}>
              <span
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-full font-semibold text-sm",
                  step === s.id
                    ? "bg-[#D4603A] text-white"
                    : step > s.id
                      ? "bg-emerald-600 text-white"
                      : "bg-muted text-muted-foreground"
                )}
              >
                {s.id}
              </span>
              <span
                className={cn(
                  "hidden font-medium text-sm sm:inline",
                  step === s.id ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {s.label}
              </span>
            </li>
          ))}
        </ol>
      </div>

      {step === 1 ? (
        <StepCartReview
          campaignId={campaignId}
          locale={locale}
          onContinue={() => setStep(2)}
          slug={slug}
        />
      ) : null}

      {step === 2 ? (
        <StepShipping
          defaultRateId={defaultShippingRateId}
          onBack={() => setStep(1)}
          onContinue={(values) => {
            setShippingValues(values);
            setStep(3);
          }}
          shippingRates={shippingRates}
          subtotalCents={subtotalCents}
        />
      ) : null}

      {step === 3 && shippingValues ? (
        <div className="space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button
              className="min-h-11 w-fit touch-manipulation"
              onClick={goBackFromPayment}
              type="button"
              variant="outline"
            >
              Back to shipping
            </Button>
            <Link
              className="text-muted-foreground text-sm underline-offset-4 hover:underline"
              href={`/${locale}/${slug}`}
            >
              Return to store
            </Link>
          </div>

          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
              Order summary
            </p>
            <ul className="mt-3 divide-y divide-border/60 text-sm">
              {lines.map((l) => (
                <li
                  className="flex justify-between gap-4 py-2 first:pt-0"
                  key={l.campaignItemId}
                >
                  <span className="min-w-0 text-muted-foreground">
                    {l.productName}{" "}
                    <span className="text-xs">x{l.quantity}</span>
                  </span>
                  <span className="shrink-0 tabular-nums">
                    {formatCentsAsDollars(l.retailPrice * l.quantity)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-3 space-y-1 border-border/60 border-t pt-3 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="tabular-nums">
                  {formatCentsAsDollars(subtotalCents)}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Shipping</span>
                <span className="tabular-nums">
                  {formatCentsAsDollars(selectedShippingCents)}
                </span>
              </div>
              <div className="flex justify-between gap-4 border-border/60 border-t pt-1 font-semibold text-foreground">
                <span>Total</span>
                <span className="tabular-nums">
                  {formatCentsAsDollars(subtotalCents + selectedShippingCents)}
                </span>
              </div>
            </div>
            <p className="mt-2 text-muted-foreground text-xs">
              {shippingValues.buyerName} · {shippingValues.buyerEmail}
            </p>
          </div>

          {intentLoading ? (
            <p className="text-muted-foreground text-sm">
              Securing your order…
            </p>
          ) : null}
          {intentError ? (
            <div
              className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-destructive text-sm"
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
      ) : null}
    </div>
  );
}

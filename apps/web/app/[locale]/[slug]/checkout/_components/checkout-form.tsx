"use client";

import { useCartStore } from "@joe-perks/ui";
import { Button } from "@repo/design-system/components/ui/button";
import { cn } from "@repo/design-system/lib/utils";
import { Check, Loader2, LogOut } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import type { ShippingRateOption } from "../../_lib/queries";
import type { CheckoutBuyerContext } from "../_lib/buyer-context";
import type { ShippingFormValues } from "../_lib/schema";
import { StepCartReview } from "./step-cart-review";
import { StepPaymentWrapper } from "./step-payment-wrapper";
import { StepShipping } from "./step-shipping";

export interface CheckoutFormProps {
  buyerContext: CheckoutBuyerContext | null;
  campaignId: string;
  defaultShippingRateId: string | null;
  locale: string;
  orgName: string;
  shippingRates: ShippingRateOption[];
  slug: string;
}

const STEPS = [
  { id: 1 as const, label: "Cart" },
  { id: 2 as const, label: "Shipping" },
  { id: 3 as const, label: "Payment" },
];

function StepIndicator({ current }: { current: 1 | 2 | 3 }) {
  return (
    <ol className="mt-6 flex gap-2">
      {STEPS.map((s) => (
        <li className="flex flex-1 items-center gap-2" key={s.id}>
          <span
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-full font-body font-semibold text-sm transition-colors",
              current === s.id && "bg-jp-terra text-white",
              current > s.id && "bg-jp-teal text-white",
              current < s.id && "bg-jp-bg-alt text-jp-light"
            )}
          >
            {current > s.id ? <Check className="size-4" /> : s.id}
          </span>
          <span
            className={cn(
              "hidden font-body font-medium text-sm sm:inline",
              current === s.id ? "text-jp-text" : "text-jp-muted"
            )}
          >
            {s.label}
          </span>
          {s.id < 3 ? (
            <div
              className={cn(
                "mx-1 hidden h-px flex-1 sm:block",
                current > s.id ? "bg-jp-teal/40" : "bg-jp-border"
              )}
            />
          ) : null}
        </li>
      ))}
    </ol>
  );
}

export function CheckoutForm({
  buyerContext: initialBuyerContext,
  campaignId,
  defaultShippingRateId,
  locale,
  orgName,
  shippingRates,
  slug,
}: CheckoutFormProps) {
  const lines = useCartStore((s) => s.lines);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [buyerContext, setBuyerContext] = useState(initialBuyerContext);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const [shippingValues, setShippingValues] =
    useState<ShippingFormValues | null>(
      initialBuyerContext?.shippingPrefill ?? null
    );

  const subtotalCents = useMemo(
    () => lines.reduce((sum, l) => sum + l.retailPrice * l.quantity, 0),
    [lines]
  );

  const selectedShippingCents = useMemo(() => {
    if (!shippingValues) {
      return 0;
    }
    const rate = shippingRates.find(
      (r) => r.id === shippingValues.shippingRateId
    );
    return rate?.flatRate ?? 0;
  }, [shippingRates, shippingValues]);

  const handleSignOut = useCallback(async () => {
    setIsSigningOut(true);
    setSignOutError(null);

    try {
      const response = await fetch("/api/account/session", {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("sign_out_failed");
      }

      setBuyerContext(null);
    } catch {
      setSignOutError("We couldn't sign you out right now. Please try again.");
    } finally {
      setIsSigningOut(false);
    }
  }, []);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8 border-jp-border border-b pb-6">
        <p className="font-jp-mono text-[10px] text-jp-muted uppercase tracking-[0.14em]">
          {orgName}
        </p>
        <h1 className="mt-1 font-bold font-display text-2xl text-jp-text tracking-tight">
          Checkout
        </h1>
        <StepIndicator current={step} />
      </div>

      {buyerContext ? (
        <div className="mb-6 rounded-(--jp-radius-md) border border-jp-border bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <p className="font-body font-medium text-jp-text text-sm">
                Signed in as {buyerContext.buyerEmail}
              </p>
              <p className="font-body text-jp-muted text-sm leading-6">
                {buyerContext.hasPrefill
                  ? "We prefilled your most recent shipping details. You can edit anything before you pay."
                  : "You're signed in for faster future access. Checkout still stays guest-friendly and fully editable."}
              </p>
            </div>
            <Button
              className="min-h-[44px] w-full shrink-0 touch-manipulation sm:w-auto"
              disabled={isSigningOut}
              onClick={handleSignOut}
              type="button"
              variant="outline"
            >
              {isSigningOut ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" />
                  Signing out...
                </>
              ) : (
                <>
                  <LogOut className="h-4 w-4" />
                  Sign out
                </>
              )}
            </Button>
          </div>

          {signOutError ? (
            <div
              className="mt-3 rounded-(--jp-radius-sm) border border-destructive/40 bg-destructive/10 px-3 py-2 font-body text-destructive text-sm"
              role="alert"
            >
              {signOutError}
            </div>
          ) : null}
        </div>
      ) : null}

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
          hasPrefill={buyerContext?.hasPrefill ?? false}
          initialValues={shippingValues}
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
        <StepPaymentWrapper
          campaignId={campaignId}
          locale={locale}
          onBack={() => {
            setStep(2);
          }}
          orgName={orgName}
          selectedShippingCents={selectedShippingCents}
          shippingValues={shippingValues}
          slug={slug}
          subtotalCents={subtotalCents}
        />
      ) : null}
    </div>
  );
}

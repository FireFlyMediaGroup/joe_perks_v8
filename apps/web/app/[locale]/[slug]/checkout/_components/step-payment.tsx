"use client";

import { Button } from "@repo/design-system/components/ui/button";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useCallback, useEffect, useState } from "react";
import { env } from "@/env";
import { formatCentsAsDollars } from "../../_lib/format";

const stripePk = env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripePk ? loadStripe(stripePk) : null;

function PaymentConfirmForm({
  returnUrl,
  grossAmountCents,
}: {
  returnUrl: string;
  grossAmountCents: number;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!(stripe && elements)) {
        return;
      }
      setError(null);
      setSubmitting(true);
      const { error: confirmError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: returnUrl,
        },
      });
      setSubmitting(false);
      if (confirmError) {
        setError(confirmError.message ?? "Payment could not be completed.");
      }
    },
    [elements, returnUrl, stripe]
  );

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="rounded-xl border border-border bg-card p-3">
        <PaymentElement />
      </div>
      {error ? (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      ) : null}
      <Button
        className="min-h-11 w-full touch-manipulation sm:w-auto"
        disabled={!(stripe && elements) || submitting}
        type="submit"
      >
        {submitting
          ? "Processing…"
          : `Pay ${formatCentsAsDollars(grossAmountCents)}`}
      </Button>
    </form>
  );
}

export interface StepPaymentProps {
  clientSecret: string;
  grossAmountCents: number;
  locale: string;
  paymentIntentId: string;
  slug: string;
}

export function StepPayment({
  clientSecret,
  grossAmountCents,
  locale,
  paymentIntentId,
  slug,
}: StepPaymentProps) {
  const [returnUrl, setReturnUrl] = useState<string | null>(null);
  useEffect(() => {
    setReturnUrl(
      `${window.location.origin}/${locale}/${slug}/order/${paymentIntentId}`
    );
  }, [locale, paymentIntentId, slug]);

  if (!stripePromise) {
    return (
      <p className="text-destructive text-sm">
        Payments are not configured. Add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.
      </p>
    );
  }

  if (!returnUrl) {
    return <p className="text-muted-foreground text-sm">Preparing payment…</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-semibold text-foreground text-lg">Payment</h2>
        <p className="mt-1 text-muted-foreground text-sm">
          Pay securely with your card. Additional authentication may be required
          by your bank.
        </p>
      </div>
      <Elements
        key={clientSecret}
        options={{ clientSecret }}
        stripe={stripePromise}
      >
        <PaymentConfirmForm
          grossAmountCents={grossAmountCents}
          returnUrl={returnUrl}
        />
      </Elements>
    </div>
  );
}

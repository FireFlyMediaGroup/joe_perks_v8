"use client";

import { Button } from "@repo/design-system/components/ui/button";
import { useState } from "react";

import { fetchStripeConnectUrl } from "../_lib/fetch-stripe-connect-url";

interface StartOnboardingButtonProps {
  readonly label: string;
}

export function StartOnboardingButton({ label }: StartOnboardingButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setError(null);
    setLoading(true);
    try {
      const url = await fetchStripeConnectUrl();
      window.location.href = url;
    } catch (caught) {
      setLoading(false);
      setError(
        caught instanceof Error ? caught.message : "Something went wrong"
      );
    }
  }

  return (
    <div className="mt-6">
      <Button disabled={loading} onClick={handleClick} size="lg" type="button">
        {loading ? "Opening Stripe…" : label}
      </Button>
      {error ? (
        <p className="mt-2 text-destructive text-sm" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

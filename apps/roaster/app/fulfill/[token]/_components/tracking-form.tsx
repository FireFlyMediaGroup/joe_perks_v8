"use client";

import { useState } from "react";

import { submitTracking } from "../_actions/submit-tracking";

const CARRIERS = ["USPS", "UPS", "FedEx", "DHL", "Other"] as const;

interface Props {
  readonly orderNumber: string;
  readonly token: string;
}

export function TrackingForm({ orderNumber, token }: Props) {
  const [carrier, setCarrier] = useState<(typeof CARRIERS)[number]>("USPS");
  const [otherCarrier, setOtherCarrier] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [saved, setSaved] = useState<{
    carrier: string;
    tracking: string;
  } | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const c = carrier === "Other" ? otherCarrier.trim() : carrier;
    if (!c) {
      setError("Please enter a carrier.");
      return;
    }
    const t = trackingNumber.trim();
    if (!t) {
      setError("Tracking number is required.");
      return;
    }
    setPending(true);
    const res = await submitTracking(token, t, c);
    setPending(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setSaved({ carrier: c, tracking: t });
    setDone(true);
  }

  if (done && saved) {
    return (
      <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-6 dark:border-emerald-900 dark:bg-emerald-950/40">
        <h3 className="font-semibold text-emerald-900 text-lg dark:text-emerald-100">
          Shipped — thank you
        </h3>
        <p className="mt-2 text-emerald-900/90 text-sm dark:text-emerald-100/90">
          Order {orderNumber} is marked shipped. Tracking{" "}
          <span className="font-mono">{saved.tracking}</span> via{" "}
          {saved.carrier}. The buyer has been notified.
        </p>
      </section>
    );
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <h3 className="font-semibold text-lg">Add tracking</h3>
      {error ? (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      ) : null}

      <label className="block space-y-1">
        <span className="font-medium text-sm">Tracking number</span>
        <input
          autoComplete="off"
          className="flex min-h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          name="trackingNumber"
          onChange={(ev) => setTrackingNumber(ev.target.value)}
          required
          value={trackingNumber}
        />
      </label>

      <div className="space-y-1">
        <span className="font-medium text-sm">Carrier</span>
        <select
          className="flex min-h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onChange={(ev) =>
            setCarrier(ev.target.value as (typeof CARRIERS)[number])
          }
          value={carrier}
        >
          {CARRIERS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {carrier === "Other" ? (
        <label className="block space-y-1">
          <span className="font-medium text-sm">Carrier name</span>
          <input
            className="flex min-h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onChange={(ev) => setOtherCarrier(ev.target.value)}
            value={otherCarrier}
          />
        </label>
      ) : null}

      <button
        className="inline-flex min-h-11 min-w-44 items-center justify-center rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground text-sm hover:bg-primary/90 disabled:opacity-50"
        disabled={pending}
        type="submit"
      >
        {pending ? "Submitting…" : "Mark as shipped"}
      </button>
    </form>
  );
}

"use client";

import { useState } from "react";

import { submitTrackingFromPortal } from "../_actions/submit-tracking-from-portal";

const CARRIERS = ["USPS", "UPS", "FedEx", "DHL", "Other"] as const;

interface Props {
  readonly orderId: string;
  readonly orderNumber: string;
}

export function PortalTrackingForm({ orderId, orderNumber }: Props) {
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
    const res = await submitTrackingFromPortal(orderId, t, c);
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
      <p className="text-emerald-700 text-sm dark:text-emerald-400">
        Shipped — {saved.tracking} via {saved.carrier}. Buyer notified.
      </p>
    );
  }

  return (
    <form
      className="flex flex-col gap-2 border-zinc-200 border-t pt-3 md:flex-row md:flex-wrap md:items-end md:gap-3 md:border-t-0 md:pt-0 dark:border-zinc-800"
      onSubmit={onSubmit}
    >
      {error ? (
        <p className="w-full text-destructive text-sm" role="alert">
          {error}
        </p>
      ) : null}
      <label className="flex min-w-[140px] flex-1 flex-col gap-1">
        <span className="text-muted-foreground text-xs">Tracking #</span>
        <input
          autoComplete="off"
          className="min-h-9 w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
          name={`tracking-${orderNumber}`}
          onChange={(ev) => setTrackingNumber(ev.target.value)}
          value={trackingNumber}
        />
      </label>
      <label className="flex w-full min-w-[100px] flex-col gap-1 md:w-32">
        <span className="text-muted-foreground text-xs">Carrier</span>
        <select
          className="min-h-9 w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
          onChange={(ev) =>
            setCarrier(ev.target.value as (typeof CARRIERS)[number])
          }
          value={carrier}
        >
          {CARRIERS.map((x) => (
            <option key={x} value={x}>
              {x}
            </option>
          ))}
        </select>
      </label>
      {carrier === "Other" ? (
        <label className="flex min-w-[120px] flex-1 flex-col gap-1">
          <span className="text-muted-foreground text-xs">Carrier name</span>
          <input
            className="min-h-9 w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
            onChange={(ev) => setOtherCarrier(ev.target.value)}
            value={otherCarrier}
          />
        </label>
      ) : null}
      <button
        className="min-h-9 rounded-md bg-primary px-3 py-1.5 font-medium text-primary-foreground text-sm hover:bg-primary/90 disabled:opacity-50"
        disabled={pending}
        type="submit"
      >
        {pending ? "…" : "Mark shipped"}
      </button>
    </form>
  );
}

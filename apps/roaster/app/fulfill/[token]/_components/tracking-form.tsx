"use client";

import { useEffect, useRef, useState } from "react";

import { submitTracking } from "../_actions/submit-tracking";

const CARRIERS = ["USPS", "UPS", "FedEx", "DHL", "Other"] as const;
const MAX_NOTE_LENGTH = 200;

interface Props {
  readonly orderNumber: string;
  readonly token: string;
}

export function TrackingForm({ orderNumber, token }: Props) {
  const [carrier, setCarrier] = useState<(typeof CARRIERS)[number]>("USPS");
  const [otherCarrier, setOtherCarrier] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [fulfillmentNote, setFulfillmentNote] = useState("");
  const [showNoteField, setShowNoteField] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [saved, setSaved] = useState<{
    carrier: string;
    note: string | null;
    tracking: string;
  } | null>(null);
  const errorRef = useRef<HTMLParagraphElement | null>(null);
  const successRef = useRef<HTMLElement | null>(null);

  const normalizedCarrier = carrier === "Other" ? otherCarrier.trim() : carrier;
  const trimmedTracking = trackingNumber.trim();
  const trimmedNote = fulfillmentNote.trim();
  const canSubmit = Boolean(normalizedCarrier && trimmedTracking) && !pending;

  useEffect(() => {
    if (error) {
      errorRef.current?.focus();
    }
  }, [error]);

  useEffect(() => {
    if (done && saved) {
      successRef.current?.focus();
    }
  }, [done, saved]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!normalizedCarrier) {
      setError("Please enter a carrier.");
      return;
    }
    if (!trimmedTracking) {
      setError("Tracking number is required.");
      return;
    }
    if (trimmedNote.length > MAX_NOTE_LENGTH) {
      setError(`Notes must be ${MAX_NOTE_LENGTH} characters or fewer.`);
      return;
    }
    setPending(true);
    const res = await submitTracking(
      token,
      trimmedTracking,
      normalizedCarrier,
      trimmedNote
    );
    setPending(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setSaved({
      carrier: normalizedCarrier,
      note: trimmedNote || null,
      tracking: trimmedTracking,
    });
    setDone(true);
  }

  if (done && saved) {
    return (
      <section
        aria-live="polite"
        className="rounded-lg border border-emerald-200 bg-emerald-50 p-6 dark:border-emerald-900 dark:bg-emerald-950/40"
        ref={successRef}
        tabIndex={-1}
      >
        <h3 className="font-semibold text-emerald-900 text-lg dark:text-emerald-100">
          Shipped — thank you
        </h3>
        <p className="mt-2 text-emerald-900/90 text-sm dark:text-emerald-100/90">
          Order {orderNumber} is marked shipped. Tracking{" "}
          <span className="font-mono">{saved.tracking}</span> via{" "}
          {saved.carrier}. The buyer has been notified.
        </p>
        {saved.note ? (
          <p className="mt-3 rounded-md bg-white/60 p-3 text-emerald-950 text-sm dark:bg-black/20 dark:text-emerald-50">
            <span className="font-medium">Note to buyer:</span> {saved.note}
          </p>
        ) : null}
      </section>
    );
  }

  return (
    <form className="space-y-5" onSubmit={onSubmit}>
      <div className="space-y-1">
        <h3 className="font-semibold text-lg">Add tracking</h3>
        <p className="text-muted-foreground text-sm">
          Mark this order as shipped once the package is on its way.
        </p>
      </div>
      {error ? (
        <p className="text-destructive text-sm" ref={errorRef} role="alert" tabIndex={-1}>
          {error}
        </p>
      ) : null}

      <div className="space-y-2">
        <span className="font-medium text-sm">Carrier</span>
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {CARRIERS.map((carrierOption) => {
            const selected = carrier === carrierOption;

            return (
              <button
                aria-pressed={selected}
                className={`min-h-11 rounded-full border px-4 py-2 text-sm transition-colors motion-reduce:transition-none ${
                  selected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-input bg-background hover:bg-muted"
                }`}
                key={carrierOption}
                onClick={() => setCarrier(carrierOption)}
                type="button"
              >
                {carrierOption}
              </button>
            );
          })}
        </div>
      </div>

      <label className="block space-y-1">
        <span className="font-medium text-sm" id="tracking-number-label">
          Tracking number
        </span>
        <input
          autoComplete="off"
          className="flex min-h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-labelledby="tracking-number-label"
          id="tracking-number"
          inputMode="text"
          name="trackingNumber"
          onChange={(ev) => setTrackingNumber(ev.target.value)}
          required
          spellCheck={false}
          value={trackingNumber}
        />
        <span className="text-muted-foreground text-xs">
          Tip: copy from your carrier&apos;s app, then paste here.
        </span>
      </label>

      {carrier === "Other" ? (
        <label className="block space-y-1">
          <span className="font-medium text-sm" id="carrier-name-label">
            Carrier name
          </span>
          <input
            aria-labelledby="carrier-name-label"
            className="flex min-h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            id="carrier-name"
            onChange={(ev) => setOtherCarrier(ev.target.value)}
            value={otherCarrier}
          />
        </label>
      ) : null}

      <div className="space-y-3 rounded-lg border border-dashed p-4">
        <button
          className="min-h-11 text-left font-medium text-primary text-sm underline-offset-4 hover:underline"
          onClick={() => setShowNoteField((current) => !current)}
          type="button"
        >
          {showNoteField ? "Hide note for the buyer" : "+ Add a note for the buyer"}
        </button>
        {showNoteField ? (
          <label className="block space-y-1">
            <span className="font-medium text-sm" id="fulfillment-note-label">
              Optional note
            </span>
            <textarea
              aria-labelledby="fulfillment-note-label"
              className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              id="fulfillment-note"
              maxLength={MAX_NOTE_LENGTH}
              onChange={(ev) => setFulfillmentNote(ev.target.value)}
              placeholder="Optional delivery or packing note for the buyer."
              value={fulfillmentNote}
            />
            <div className="flex justify-between gap-3 text-muted-foreground text-xs">
              <span>This note appears in the shipped email.</span>
              <span>{fulfillmentNote.length}/{MAX_NOTE_LENGTH}</span>
            </div>
          </label>
        ) : null}
      </div>

      <button
        className="inline-flex min-h-14 w-full items-center justify-center rounded-md bg-primary px-4 py-3 font-medium text-primary-foreground text-sm hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={!canSubmit}
        type="submit"
      >
        {pending ? "Submitting…" : "Mark as shipped"}
      </button>
    </form>
  );
}

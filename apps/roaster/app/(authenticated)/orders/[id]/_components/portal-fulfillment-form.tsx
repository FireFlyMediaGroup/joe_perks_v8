"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { shipOrder } from "../_actions/ship-order";
import {
  MAX_FULFILLMENT_NOTE_LENGTH,
  portalShipmentCarriers,
  type PortalShipmentCarrier,
} from "../_lib/shipment-form";

interface PortalFulfillmentFormProps {
  readonly orderId: string;
  readonly orderNumber: string;
}

export function PortalFulfillmentForm({
  orderId,
  orderNumber,
}: PortalFulfillmentFormProps) {
  const router = useRouter();
  const [carrier, setCarrier] = useState<PortalShipmentCarrier>("USPS");
  const [otherCarrier, setOtherCarrier] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [fulfillmentNote, setFulfillmentNote] = useState("");
  const [showNoteField, setShowNoteField] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const errorRef = useRef<HTMLParagraphElement | null>(null);
  const successRef = useRef<HTMLOutputElement | null>(null);

  const normalizedCarrier = carrier === "Other" ? otherCarrier.trim() : carrier;

  useEffect(() => {
    if (error) {
      errorRef.current?.focus();
      return;
    }

    if (success) {
      successRef.current?.focus();
    }
  }, [error, success]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setPending(true);

    const result = await shipOrder(
      orderId,
      trackingNumber,
      normalizedCarrier,
      fulfillmentNote
    );

    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }

    setSuccess(`Order ${orderNumber} is now marked shipped.`);
    router.refresh();
  }

  return (
    <form className="space-y-5" onSubmit={onSubmit}>
      <div className="space-y-1">
        <h2 className="font-semibold text-lg">Fulfill this order</h2>
        <p className="text-muted-foreground text-sm">
          Use the same shipment details you would add from the magic-link flow.
        </p>
      </div>

      {error ? (
        <p className="text-destructive text-sm" ref={errorRef} role="alert" tabIndex={-1}>
          {error}
        </p>
      ) : null}
      {success ? (
        <output
          aria-live="polite"
          className="block text-emerald-700 text-sm"
          ref={successRef}
          tabIndex={-1}
        >
          {success}
        </output>
      ) : null}

      <div className="space-y-2">
        <span className="font-medium text-sm">Carrier</span>
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {portalShipmentCarriers.map((carrierOption) => {
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

      {carrier === "Other" ? (
        <label className="block space-y-1">
          <span className="font-medium text-sm" id="portal-carrier-name-label">
            Carrier name
          </span>
          <input
            aria-labelledby="portal-carrier-name-label"
            className="flex min-h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            id="portal-carrier-name"
            onChange={(event) => setOtherCarrier(event.target.value)}
            value={otherCarrier}
          />
        </label>
      ) : null}

      <label className="block space-y-1">
        <span className="font-medium text-sm" id="portal-tracking-number-label">
          Tracking number
        </span>
        <input
          aria-labelledby="portal-tracking-number-label"
          className="flex min-h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          id="portal-tracking-number"
          onChange={(event) => setTrackingNumber(event.target.value)}
          required
          value={trackingNumber}
        />
      </label>

      <div className="space-y-3 rounded-xl border border-dashed p-4">
        <button
          className="min-h-11 text-left font-medium text-primary text-sm underline-offset-4 hover:underline"
          onClick={() => setShowNoteField((current) => !current)}
          type="button"
        >
          {showNoteField ? "Hide note for the buyer" : "+ Add a note for the buyer"}
        </button>
        {showNoteField ? (
          <label className="block space-y-1">
            <span className="font-medium text-sm" id="portal-optional-note-label">
              Optional note
            </span>
            <textarea
              aria-labelledby="portal-optional-note-label"
              className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              id="portal-optional-note"
              maxLength={MAX_FULFILLMENT_NOTE_LENGTH}
              onChange={(event) => setFulfillmentNote(event.target.value)}
              placeholder="Optional delivery or packing note for the buyer."
              value={fulfillmentNote}
            />
            <div className="flex justify-between gap-3 text-muted-foreground text-xs">
              <span>This note appears in the shipped email.</span>
              <span>
                {fulfillmentNote.length}/{MAX_FULFILLMENT_NOTE_LENGTH}
              </span>
            </div>
          </label>
        ) : null}
      </div>

      <button
        className="inline-flex min-h-14 w-full items-center justify-center rounded-md bg-primary px-4 py-3 font-medium text-primary-foreground text-sm hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={pending}
        type="submit"
      >
        {pending ? "Submitting…" : "Mark as shipped"}
      </button>
    </form>
  );
}

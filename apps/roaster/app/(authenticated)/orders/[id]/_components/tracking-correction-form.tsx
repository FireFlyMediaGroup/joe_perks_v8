"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { updateTracking } from "../_actions/update-tracking";
import {
  portalShipmentCarriers,
  type PortalShipmentCarrier,
} from "../_lib/shipment-form";

interface TrackingCorrectionFormProps {
  readonly carrier: string;
  readonly orderId: string;
  readonly trackingNumber: string;
}

function startingCarrier(
  carrier: string
): {
  readonly carrier: PortalShipmentCarrier;
  readonly otherCarrier: string;
} {
  const matched = portalShipmentCarriers.find((option) => option === carrier);
  if (matched) {
    return { carrier: matched, otherCarrier: "" };
  }

  return { carrier: "Other", otherCarrier: carrier };
}

export function TrackingCorrectionForm({
  carrier,
  orderId,
  trackingNumber,
}: TrackingCorrectionFormProps) {
  const router = useRouter();
  const initialCarrier = startingCarrier(carrier);

  const [selectedCarrier, setSelectedCarrier] = useState<PortalShipmentCarrier>(
    initialCarrier.carrier
  );
  const [otherCarrier, setOtherCarrier] = useState(initialCarrier.otherCarrier);
  const [nextTrackingNumber, setNextTrackingNumber] = useState(trackingNumber);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const errorRef = useRef<HTMLParagraphElement | null>(null);
  const successRef = useRef<HTMLOutputElement | null>(null);

  const normalizedCarrier =
    selectedCarrier === "Other" ? otherCarrier.trim() : selectedCarrier;

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

    const result = await updateTracking(
      orderId,
      nextTrackingNumber,
      normalizedCarrier
    );

    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }

    setSuccess("Tracking details updated. The buyer has been notified.");
    router.refresh();
  }

  return (
    <form className="space-y-5" onSubmit={onSubmit}>
      <div className="space-y-1">
        <h2 className="font-semibold text-lg">Correct tracking details</h2>
        <p className="text-muted-foreground text-sm">
          Use this only if the shipped order needs an updated carrier or tracking
          number.
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
            const isSelected = selectedCarrier === carrierOption;

            return (
              <button
                aria-pressed={isSelected}
                className={`min-h-11 rounded-full border px-4 py-2 text-sm transition-colors motion-reduce:transition-none ${
                  isSelected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-input bg-background hover:bg-muted"
                }`}
                key={carrierOption}
                onClick={() => setSelectedCarrier(carrierOption)}
                type="button"
              >
                {carrierOption}
              </button>
            );
          })}
        </div>
      </div>

      {selectedCarrier === "Other" ? (
        <label className="block space-y-1">
          <span className="font-medium text-sm" id="tracking-update-carrier-name-label">
            Carrier name
          </span>
          <input
            aria-labelledby="tracking-update-carrier-name-label"
            className="flex min-h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            id="tracking-update-carrier-name"
            onChange={(event) => setOtherCarrier(event.target.value)}
            value={otherCarrier}
          />
        </label>
      ) : null}

      <label className="block space-y-1">
        <span className="font-medium text-sm" id="tracking-update-number-label">
          Tracking number
        </span>
        <input
          aria-labelledby="tracking-update-number-label"
          className="flex min-h-11 w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          id="tracking-update-number"
          onChange={(event) => setNextTrackingNumber(event.target.value)}
          required
          value={nextTrackingNumber}
        />
      </label>

      <button
        className="inline-flex min-h-11 items-center justify-center rounded-md border px-4 py-2 font-medium text-sm hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
        disabled={pending}
        type="submit"
      >
        {pending ? "Saving…" : "Save tracking update"}
      </button>
    </form>
  );
}

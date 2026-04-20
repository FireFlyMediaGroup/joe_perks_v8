"use client";

import { Button } from "@repo/design-system/components/ui/button";
import { Input } from "@repo/design-system/components/ui/input";
import { Label } from "@repo/design-system/components/ui/label";
import { Switch } from "@repo/design-system/components/ui/switch";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  formatCentsAsDollars,
  parseDollarsToCents,
} from "../../../products/_lib/money";
import {
  createRate,
  type ShippingRateActionResult,
  updateRate,
} from "../_actions/shipping-actions";

function primaryLabel(pending: boolean, mode: "create" | "edit"): string {
  if (pending) {
    return "Saving…";
  }
  return mode === "create" ? "Add rate" : "Save";
}

export interface RateFormProps {
  /** When this is the first rate for the roaster, it must be default. */
  readonly isFirstRate: boolean;
  readonly mode: "create" | "edit";
  readonly onDone?: () => void;
  readonly rate?: {
    id: string;
    label: string;
    carrier: string;
    flatRate: number;
    isDefault: boolean;
  };
}

export function RateForm({ mode, rate, onDone, isFirstRate }: RateFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [label, setLabel] = useState(rate?.label ?? "");
  const [carrier, setCarrier] = useState(rate?.carrier ?? "");
  const [flatDollars, setFlatDollars] = useState(
    rate ? formatCentsAsDollars(rate.flatRate) : ""
  );
  const [isDefault, setIsDefault] = useState(
    isFirstRate ? true : (rate?.isDefault ?? false)
  );

  function handleSubmit() {
    setError(null);

    const flatParsed = parseDollarsToCents(flatDollars);
    if (!flatParsed.ok) {
      setError(flatParsed.error);
      return;
    }

    const payload = {
      label,
      carrier,
      flatRateDollars: flatDollars,
      isDefault: isFirstRate ? true : isDefault,
    };

    startTransition(async () => {
      let result: ShippingRateActionResult;
      if (mode === "create") {
        result = await createRate(payload);
      } else if (rate) {
        result = await updateRate(rate.id, payload);
      } else {
        setError("Missing rate.");
        return;
      }

      if (result.success) {
        onDone?.();
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="ship-label">Label</Label>
        <Input
          autoComplete="off"
          id="ship-label"
          onChange={(e) => setLabel(e.target.value)}
          placeholder="e.g. Standard 3–5 days"
          value={label}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="ship-carrier">Carrier</Label>
        <Input
          autoComplete="off"
          id="ship-carrier"
          onChange={(e) => setCarrier(e.target.value)}
          placeholder="e.g. USPS"
          value={carrier}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="ship-flat">Flat rate (USD)</Label>
        <Input
          autoComplete="off"
          className="tabular-nums"
          id="ship-flat"
          inputMode="decimal"
          onChange={(e) => setFlatDollars(e.target.value)}
          placeholder="8.95"
          value={flatDollars}
        />
        <p className="text-muted-foreground text-xs">
          Stored in cents; shown to buyers at checkout as a flat shipping
          charge.
        </p>
      </div>
      <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
        <div className="space-y-0.5">
          <Label className="text-base" htmlFor="ship-default">
            Default at checkout
          </Label>
          <p className="text-muted-foreground text-xs">
            {isFirstRate
              ? "Your first rate is the default until you add more."
              : "Only one rate can be default. Buyers can still pick others if you offer multiple."}
          </p>
        </div>
        <Switch
          checked={isFirstRate ? true : isDefault}
          disabled={isFirstRate}
          id="ship-default"
          onCheckedChange={(v) => setIsDefault(v)}
        />
      </div>
      {error ? (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      ) : null}
      <Button
        disabled={pending || !label.trim() || !carrier.trim()}
        onClick={() => handleSubmit()}
        type="button"
      >
        {primaryLabel(pending, mode)}
      </Button>
    </div>
  );
}

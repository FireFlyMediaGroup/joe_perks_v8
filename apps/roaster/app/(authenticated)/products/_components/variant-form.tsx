"use client";

import type { GrindOption } from "@joe-perks/db";
import { Button } from "@repo/design-system/components/ui/button";
import { Input } from "@repo/design-system/components/ui/input";
import { Label } from "@repo/design-system/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/design-system/components/ui/select";
import { Switch } from "@repo/design-system/components/ui/switch";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  createVariant,
  updateVariant,
  type VariantActionResult,
} from "../_actions/variant-actions";
import {
  formatCentsAsDollars,
  isLowMarginWarning,
  parseDollarsToCents,
} from "../_lib/money";
import { GRIND_OPTIONS } from "../_lib/schema";

function variantPrimaryLabel(pending: boolean, isEdit: boolean): string {
  if (pending) {
    return "Saving…";
  }
  if (isEdit) {
    return "Save variant";
  }
  return "Add variant";
}

interface VariantFormProps {
  readonly onDone?: () => void;
  readonly productId: string;
  readonly variant?: {
    id: string;
    sizeOz: number;
    grind: GrindOption;
    wholesalePrice: number;
    retailPrice: number;
    sku: string | null;
    isAvailable: boolean;
  };
}

export function VariantForm({ productId, variant, onDone }: VariantFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [sizeOz, setSizeOz] = useState(String(variant?.sizeOz ?? 12));
  const [grind, setGrind] = useState<GrindOption>(
    variant?.grind ?? "WHOLE_BEAN"
  );
  const [wholesaleDollars, setWholesaleDollars] = useState(
    variant ? formatCentsAsDollars(variant.wholesalePrice) : ""
  );
  const [retailDollars, setRetailDollars] = useState(
    variant ? formatCentsAsDollars(variant.retailPrice) : ""
  );
  const [sku, setSku] = useState(variant?.sku ?? "");
  const [isAvailable, setIsAvailable] = useState(variant?.isAvailable ?? true);

  const wholesaleParsed = parseDollarsToCents(wholesaleDollars);
  const retailParsed = parseDollarsToCents(retailDollars);
  const showMarginWarning =
    wholesaleParsed.ok &&
    retailParsed.ok &&
    isLowMarginWarning(wholesaleParsed.cents, retailParsed.cents);

  function handleSubmit() {
    setError(null);

    const size = Number.parseInt(sizeOz, 10);
    if (Number.isNaN(size) || size < 1) {
      setError("Enter a valid size in ounces (whole number).");
      return;
    }

    const w = parseDollarsToCents(wholesaleDollars);
    const r = parseDollarsToCents(retailDollars);
    if (!w.ok) {
      setError(w.error);
      return;
    }
    if (!r.ok) {
      setError(r.error);
      return;
    }
    if (r.cents <= w.cents) {
      setError("Retail price must be greater than wholesale price.");
      return;
    }

    const base = {
      productId,
      sizeOz: size,
      grind,
      wholesalePriceCents: w.cents,
      retailPriceCents: r.cents,
      sku: sku.trim() || undefined,
      isAvailable,
    };

    startTransition(async () => {
      let result: VariantActionResult;
      if (variant) {
        result = await updateVariant({
          ...base,
          id: variant.id,
        });
      } else {
        result = await createVariant(base);
      }

      if (result.success) {
        if (!variant) {
          setSizeOz("12");
          setGrind("WHOLE_BEAN");
          setWholesaleDollars("");
          setRetailDollars("");
          setSku("");
          setIsAvailable(true);
        }
        router.refresh();
        onDone?.();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="variant-size">Size (oz)</Label>
          <Input
            id="variant-size"
            inputMode="numeric"
            min={1}
            onChange={(e) => setSizeOz(e.target.value)}
            type="number"
            value={sizeOz}
          />
        </div>
        <div className="space-y-2">
          <Label>Grind</Label>
          <Select
            onValueChange={(v) => setGrind(v as GrindOption)}
            value={grind}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {GRIND_OPTIONS.map((g) => (
                <SelectItem key={g} value={g}>
                  {g.replaceAll("_", " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="variant-wholesale">Wholesale price ($)</Label>
          <Input
            id="variant-wholesale"
            inputMode="decimal"
            onChange={(e) => setWholesaleDollars(e.target.value)}
            placeholder="0.00"
            value={wholesaleDollars}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="variant-retail">Retail price ($)</Label>
          <Input
            id="variant-retail"
            inputMode="decimal"
            onChange={(e) => setRetailDollars(e.target.value)}
            placeholder="0.00"
            value={retailDollars}
          />
        </div>
      </div>

      {showMarginWarning ? (
        <p className="text-amber-600 text-sm dark:text-amber-400">
          Margin is under 20% of retail. Consider raising retail or lowering
          wholesale.
        </p>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="variant-sku">SKU (optional)</Label>
        <Input
          autoComplete="off"
          id="variant-sku"
          onChange={(e) => setSku(e.target.value)}
          value={sku}
        />
      </div>

      <div className="flex items-center gap-2">
        <Switch
          checked={isAvailable}
          id="variant-available"
          onCheckedChange={setIsAvailable}
        />
        <Label className="cursor-pointer" htmlFor="variant-available">
          Available for sale
        </Label>
      </div>

      {error ? (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      ) : null}

      <Button disabled={pending} onClick={() => handleSubmit()} type="button">
        {variantPrimaryLabel(pending, Boolean(variant))}
      </Button>
    </div>
  );
}

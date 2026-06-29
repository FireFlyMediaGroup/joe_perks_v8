"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@repo/design-system/components/ui/button";
import { Input } from "@repo/design-system/components/ui/input";
import { Label } from "@repo/design-system/components/ui/label";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { formatCentsAsDollars } from "../../_lib/format";
import type { ShippingRateOption } from "../../_lib/queries";
import type { ShippingFormValues } from "../_lib/schema";
import { shippingFormSchema } from "../_lib/schema";

export interface StepShippingProps {
  defaultRateId: string | null;
  hasPrefill: boolean;
  initialValues: ShippingFormValues | null;
  onBack: () => void;
  onContinue: (values: ShippingFormValues) => void;
  shippingRates: ShippingRateOption[];
  subtotalCents: number;
}

export function StepShipping({
  defaultRateId,
  hasPrefill,
  initialValues,
  shippingRates,
  subtotalCents,
  onBack,
  onContinue,
}: StepShippingProps) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<ShippingFormValues>({
    resolver: zodResolver(shippingFormSchema),
    defaultValues: initialValues ?? {
      buyerName: "",
      buyerEmail: "",
      street: "",
      street2: "",
      city: "",
      country: "US",
      state: "",
      zip: "",
      shippingRateId:
        defaultRateId ??
        shippingRates.find((r) => r.isDefault)?.id ??
        shippingRates[0]?.id ??
        "",
    },
  });

  useEffect(() => {
    if (initialValues) {
      reset(initialValues);
      return;
    }

    reset({
      buyerName: "",
      buyerEmail: "",
      street: "",
      street2: "",
      city: "",
      country: "US",
      state: "",
      zip: "",
      shippingRateId:
        defaultRateId ??
        shippingRates.find((r) => r.isDefault)?.id ??
        shippingRates[0]?.id ??
        "",
    });
  }, [defaultRateId, initialValues, reset, shippingRates]);

  const selectedRateId = watch("shippingRateId");
  const selectedRate = shippingRates.find((r) => r.id === selectedRateId);
  const shippingCents = selectedRate?.flatRate ?? 0;
  const estimatedTotal = subtotalCents + shippingCents;

  return (
    <form
      className="space-y-6"
      onSubmit={handleSubmit((values) => onContinue(values))}
    >
      <div>
        <h2 className="font-semibold text-foreground text-lg">
          Shipping &amp; contact
        </h2>
        <p className="mt-1 text-muted-foreground text-sm">
          Where should we send the order confirmation and shipment updates?
        </p>
        {hasPrefill ? (
          <p className="mt-2 text-muted-foreground text-sm">
            We used your latest order snapshot to prefill these details. Review
            and update anything you want before paying.
          </p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <input type="hidden" {...register("country")} />
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="buyerName">Full name</Label>
          <Input
            autoComplete="name"
            className="min-h-11"
            id="buyerName"
            {...register("buyerName")}
          />
          {errors.buyerName ? (
            <p className="text-destructive text-xs">
              {errors.buyerName.message}
            </p>
          ) : null}
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="buyerEmail">Email</Label>
          <Input
            autoComplete="email"
            className="min-h-11"
            id="buyerEmail"
            inputMode="email"
            type="email"
            {...register("buyerEmail")}
          />
          {errors.buyerEmail ? (
            <p className="text-destructive text-xs">
              {errors.buyerEmail.message}
            </p>
          ) : null}
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="street">Street address</Label>
          <Input
            autoComplete="street-address"
            className="min-h-11"
            id="street"
            {...register("street")}
          />
          {errors.street ? (
            <p className="text-destructive text-xs">{errors.street.message}</p>
          ) : null}
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="street2">Apt, suite, etc. (optional)</Label>
          <Input
            autoComplete="address-line2"
            className="min-h-11"
            id="street2"
            {...register("street2")}
          />
          {errors.street2 ? (
            <p className="text-destructive text-xs">{errors.street2.message}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input className="min-h-11" id="city" {...register("city")} />
          {errors.city ? (
            <p className="text-destructive text-xs">{errors.city.message}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="state">State</Label>
          <Input
            autoComplete="address-level1"
            className="min-h-11"
            id="state"
            {...register("state")}
          />
          {errors.state ? (
            <p className="text-destructive text-xs">{errors.state.message}</p>
          ) : null}
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="zip">ZIP / postal code</Label>
          <Input
            autoComplete="postal-code"
            className="min-h-11"
            id="zip"
            {...register("zip")}
          />
          {errors.zip ? (
            <p className="text-destructive text-xs">{errors.zip.message}</p>
          ) : null}
        </div>
      </div>

      <div className="space-y-3">
        <p className="font-medium text-foreground text-sm">Shipping method</p>
        <fieldset className="space-y-2">
          {shippingRates.map((rate) => (
            <label
              className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-card p-3 has-focus-visible:ring-2 has-focus-visible:ring-ring"
              key={rate.id}
            >
              <input
                className="mt-1 size-4 shrink-0"
                type="radio"
                value={rate.id}
                {...register("shippingRateId")}
              />
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="font-medium text-foreground text-sm">
                  {rate.label}
                </span>
                <span className="text-muted-foreground text-xs">
                  {rate.carrier}
                </span>
                <span className="font-semibold text-foreground text-sm tabular-nums">
                  {formatCentsAsDollars(rate.flatRate)}
                </span>
              </span>
            </label>
          ))}
        </fieldset>
        {errors.shippingRateId ? (
          <p className="text-destructive text-xs">
            {errors.shippingRateId.message}
          </p>
        ) : null}
      </div>

      <div className="rounded-xl border border-border bg-muted/40 p-4">
        <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
          Order summary
        </p>
        <div className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="tabular-nums">
              {formatCentsAsDollars(subtotalCents)}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Shipping</span>
            <span className="tabular-nums">
              {selectedRate ? formatCentsAsDollars(selectedRate.flatRate) : "—"}
            </span>
          </div>
          <div className="flex justify-between gap-4 border-border border-t pt-2 font-semibold text-foreground">
            <span>Estimated total</span>
            <span className="tabular-nums">
              {formatCentsAsDollars(estimatedTotal)}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
        <Button
          className="min-h-11 touch-manipulation"
          onClick={onBack}
          type="button"
          variant="outline"
        >
          Back to cart
        </Button>
        <Button className="min-h-11 touch-manipulation" type="submit">
          Continue to payment
        </Button>
      </div>
    </form>
  );
}

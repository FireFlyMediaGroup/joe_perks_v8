"use client";

import { Button } from "@repo/design-system/components/ui/button";
import { Input } from "@repo/design-system/components/ui/input";
import { Label } from "@repo/design-system/components/ui/label";
import { Loader2, Search } from "lucide-react";
import Link from "next/link";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { buildBuyerSignInPath } from "@/lib/buyer-auth/redirect";
import {
  type GuestOrderLookupOrderPayload,
  hydrateGuestOrderLookupOrder,
  normalizeGuestOrderLookupEmail,
  normalizeGuestOrderLookupOrderNumber,
} from "@/lib/orders/guest-order-lookup";
import { OrderDeliveryCard } from "../../account/orders/[id]/_components/order-delivery-card";
import { OrderDetailHeader } from "../../account/orders/[id]/_components/order-detail-header";
import { OrderItemsCard } from "../../account/orders/[id]/_components/order-items-card";
import { OrderSummaryCard } from "../../account/orders/[id]/_components/order-summary-card";
import { ShippingCard } from "../../account/orders/[id]/_components/shipping-card";
import { getBuyerOrderTrackingStateCopy } from "../../account/orders/[id]/_lib/order-detail";

interface OrderLookupFormProps {
  readonly locale: string;
}

interface OrderLookupResponseBody {
  readonly error?: string;
  readonly order?: GuestOrderLookupOrderPayload;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALIDATION_ERROR =
  "Enter the email from your order and your order number.";

function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value);
}

export function OrderLookupForm({ locale }: OrderLookupFormProps) {
  const [email, setEmail] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [result, setResult] = useState<GuestOrderLookupOrderPayload | null>(
    null
  );

  const emailInputRef = useRef<HTMLInputElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const resultHeadingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (error) {
      errorRef.current?.focus();
    }
  }, [error]);

  useEffect(() => {
    if (result) {
      resultHeadingRef.current?.focus();
    }
  }, [result]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedEmail = normalizeGuestOrderLookupEmail(email);
    const normalizedOrderNumber =
      normalizeGuestOrderLookupOrderNumber(orderNumber);

    if (!(isValidEmail(normalizedEmail) && normalizedOrderNumber)) {
      setResult(null);
      setError(VALIDATION_ERROR);
      return;
    }

    setError(null);
    setIsPending(true);

    try {
      const response = await fetch("/api/order-lookup", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          email: normalizedEmail,
          orderNumber: normalizedOrderNumber,
        }),
      });

      const data = (await response
        .json()
        .catch(() => null)) as OrderLookupResponseBody | null;

      if (!(response.ok && data?.order)) {
        setResult(null);
        setError(
          data?.error ??
            "We couldn't look up that order right now. Please try again."
        );
        return;
      }

      setResult(data.order);
    } catch {
      setResult(null);
      setError("We couldn't look up that order right now. Please try again.");
    } finally {
      setIsPending(false);
    }
  }

  const signInHref = buildBuyerSignInPath(
    locale,
    `/${locale}/account?focus=orders-heading`
  );
  const hydratedOrder = result ? hydrateGuestOrderLookupOrder(result) : null;
  const trackingState = hydratedOrder
    ? getBuyerOrderTrackingStateCopy(hydratedOrder, { locale })
    : null;

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border bg-card p-6 shadow-sm sm:p-8">
        <div className="max-w-2xl space-y-3">
          <p className="font-medium text-muted-foreground text-sm uppercase tracking-[0.18em]">
            Guest order lookup
          </p>
          <h1 className="font-semibold text-3xl text-foreground tracking-tight sm:text-4xl">
            Find your order without creating an account.
          </h1>
          <p className="text-muted-foreground text-sm leading-6 sm:text-base">
            Use the email from checkout and your order number to see shipping
            details, tracking updates, and a snapshot of what you ordered.
          </p>
        </div>

        <form
          aria-busy={isPending}
          className="mt-6 grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)_auto]"
          onSubmit={onSubmit}
        >
          <div className="space-y-2">
            <Label htmlFor="order-lookup-email">Email address</Label>
            <Input
              aria-describedby={
                error
                  ? "order-lookup-hint order-lookup-error"
                  : "order-lookup-hint"
              }
              aria-invalid={Boolean(error)}
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
              className="min-h-[44px]"
              id="order-lookup-email"
              inputMode="email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              ref={emailInputRef}
              type="email"
              value={email}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="order-lookup-number">Order number</Label>
            <Input
              aria-describedby={
                error
                  ? "order-lookup-hint order-lookup-error"
                  : "order-lookup-hint"
              }
              aria-invalid={Boolean(error)}
              autoCapitalize="characters"
              autoCorrect="off"
              className="min-h-[44px]"
              id="order-lookup-number"
              onChange={(event) => setOrderNumber(event.target.value)}
              placeholder="JP-00042"
              spellCheck={false}
              type="text"
              value={orderNumber}
            />
          </div>

          <div className="flex items-end">
            <Button
              className="min-h-[44px] w-full md:w-auto"
              disabled={isPending}
              type="submit"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" />
                  Looking up order...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  Find order
                </>
              )}
            </Button>
          </div>
        </form>

        <p
          className="mt-3 text-muted-foreground text-xs"
          id="order-lookup-hint"
        >
          No account required. We keep the lookup inside this page so your email
          and order number do not end up in the URL.
        </p>

        {error ? (
          <div
            className="mt-4 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-destructive text-sm outline-none"
            id="order-lookup-error"
            ref={errorRef}
            role="alert"
            tabIndex={-1}
          >
            {error}
          </div>
        ) : null}
      </section>

      {hydratedOrder && trackingState ? (
        <section
          aria-labelledby="guest-order-result-heading"
          className="space-y-6"
        >
          <div className="rounded-3xl border bg-card p-6 shadow-sm sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2">
                <p className="font-medium text-muted-foreground text-sm">
                  Lookup result
                </p>
                <h2
                  className="font-semibold text-2xl text-foreground outline-none"
                  id="guest-order-result-heading"
                  ref={resultHeadingRef}
                  tabIndex={-1}
                >
                  We found your order.
                </h2>
                <p className="max-w-2xl text-muted-foreground text-sm leading-6">
                  This is the order snapshot saved at checkout, plus the latest
                  shipment details we have on file.
                </p>
              </div>

              <Button
                className="min-h-[44px] w-full sm:w-auto"
                onClick={() => {
                  setResult(null);
                  setError(null);
                  setOrderNumber("");
                  emailInputRef.current?.focus();
                }}
                type="button"
                variant="outline"
              >
                Look up another order
              </Button>
            </div>
          </div>

          <OrderDetailHeader
            fundraiserName={hydratedOrder.fundraiserName}
            locale={locale}
            orderNumber={hydratedOrder.orderNumber}
            placedAt={hydratedOrder.placedAt}
            trackingState={trackingState}
          />

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.9fr)]">
            <OrderDeliveryCard locale={locale} order={hydratedOrder} />
            <ShippingCard
              buyerEmail={hydratedOrder.buyerEmail}
              shipToAddress1={hydratedOrder.shipToAddress1}
              shipToAddress2={hydratedOrder.shipToAddress2}
              shipToCity={hydratedOrder.shipToCity}
              shipToCountry={hydratedOrder.shipToCountry}
              shipToName={hydratedOrder.shipToName}
              shipToPostalCode={hydratedOrder.shipToPostalCode}
              shipToState={hydratedOrder.shipToState}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.9fr)]">
            <OrderItemsCard items={hydratedOrder.items} />
            <OrderSummaryCard
              fundraiserName={hydratedOrder.fundraiserName}
              grossAmount={hydratedOrder.grossAmount}
              orgAmount={hydratedOrder.orgAmount}
              orgPctSnapshot={hydratedOrder.orgPctSnapshot}
              productSubtotal={hydratedOrder.productSubtotal}
              shippingAmount={hydratedOrder.shippingAmount}
            />
          </div>

          <section className="rounded-3xl border bg-card p-6 shadow-sm sm:p-8">
            <div className="space-y-2">
              <h3 className="font-semibold text-foreground text-xl tracking-tight">
                Want faster access next time?
              </h3>
              <p className="max-w-2xl text-muted-foreground text-sm leading-6">
                Buyer sign-in stays optional, but it gives you one place to
                check every order and future tracking update.
              </p>
            </div>

            <div className="mt-4">
              <Link
                className="inline-flex min-h-11 items-center justify-center rounded-xl border px-4 py-3 font-medium text-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                href={signInHref}
              >
                Sign in to see all my orders
              </Link>
            </div>
          </section>
        </section>
      ) : null}
    </div>
  );
}

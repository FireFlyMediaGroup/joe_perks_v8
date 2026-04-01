"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { OrderProcessing } from "./order-processing";
import { OrderSummary, type OrderLine } from "./order-summary";

type ApiOrder = {
  grossAmount: number;
  items: OrderLine[];
  orderNumber: string;
  orgAmount: number;
  orgName: string;
  orgPctSnapshot: number;
  productSubtotal: number;
  shippingAmount: number;
  status: string;
};

export interface OrderStatusPollerProps {
  locale: string;
  piId: string;
  slug: string;
}

const POLL_MS = 2000;
const TIMEOUT_MS = 30_000;

export function OrderStatusPoller({
  locale,
  piId,
  slug,
}: OrderStatusPollerProps) {
  const [order, setOrder] = useState<ApiOrder | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const startRef = useRef(Date.now());

  const fetchOrder = useCallback(async () => {
    const res = await fetch(`/api/order-status?pi=${encodeURIComponent(piId)}`);
    if (!res.ok) {
      return null;
    }
    return (await res.json()) as ApiOrder;
  }, [piId]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;

    const tick = async () => {
      const data = await fetchOrder();
      if (!data) {
        return;
      }
      if (data.status !== "PENDING") {
        setOrder(data);
        if (interval) {
          clearInterval(interval);
        }
        return;
      }
      if (Date.now() - startRef.current >= TIMEOUT_MS) {
        setTimedOut(true);
        if (interval) {
          clearInterval(interval);
        }
      }
    };

    tick();
    interval = setInterval(tick, POLL_MS);
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [fetchOrder]);

  if (order && order.status !== "PENDING") {
    return (
      <OrderSummary
        grossAmount={order.grossAmount}
        items={order.items}
        locale={locale}
        orderNumber={order.orderNumber}
        orgAmount={order.orgAmount}
        orgName={order.orgName}
        orgPctSnapshot={order.orgPctSnapshot}
        productSubtotal={order.productSubtotal}
        shippingAmount={order.shippingAmount}
        slug={slug}
      />
    );
  }

  if (timedOut) {
    return (
      <div className="space-y-4 py-8 text-center">
        <p className="font-semibold text-foreground text-lg">
          We&apos;re still confirming your payment
        </p>
        <p className="text-muted-foreground text-sm leading-relaxed">
          This can take a moment. Check your email for order{" "}
          <span className="font-medium text-foreground">confirmation</span> —
          if you don&apos;t see it within a few minutes, contact support with
          your payment details from your card statement.
        </p>
      </div>
    );
  }

  return <OrderProcessing />;
}

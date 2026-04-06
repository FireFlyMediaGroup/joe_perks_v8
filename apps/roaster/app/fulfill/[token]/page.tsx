import { database, logOrderEvent } from "@joe-perks/db";
import Link from "next/link";
import type { ReactNode } from "react";

import { CantFulfillForm } from "./_components/cant-fulfill-form";
import { ExpiredLinkRecovery } from "./_components/expired-link-recovery";
import { FulfillmentDetails } from "./_components/fulfillment-details";
import { TrackingForm } from "./_components/tracking-form";

interface Props {
  params: Promise<{ token: string }>;
}

interface LoadedOrder {
  buyer: { name: string | null } | null;
  campaign: {
    name: string;
    org: {
      application: { orgName: string | null };
      slug: string;
    };
  };
  createdAt: Date;
  grossAmount: number;
  id: string;
  items: Array<{
    id: string;
    lineTotal: number;
    productName: string;
    quantity: number;
    unitPrice: number;
    variantDesc: string | null;
  }>;
  orderNumber: string;
  orgAmount: number;
  roasterAmount: number;
  roasterId: string;
  roasterTotal: number;
  shipToAddress1: string;
  shipToAddress2: string | null;
  shipToCity: string;
  shipToCountry: string;
  shipToName: string;
  shipToPostalCode: string;
  shipToState: string;
  shippingAmount: number;
  status: string;
  trackingNumber: string | null;
  carrier: string | null;
  shippedAt: Date | null;
  fulfillmentNote: string | null;
  flagReason: string | null;
  flagNote: string | null;
  resolutionOffered: string | null;
  flaggedAt: Date | null;
  flagResolvedAt: Date | null;
  adminAcknowledgedFlag: boolean;
}

type FulfillmentPageState =
  | { kind: "invalid" }
  | { kind: "expired"; order: LoadedOrder; token: string }
  | { kind: "flagged"; order: LoadedOrder }
  | { kind: "ready"; order: LoadedOrder; token: string }
  | { kind: "readonly"; order: LoadedOrder; tokenReason: "status" | "used" };

function TokenShell({
  children,
}: {
  readonly children: ReactNode;
}) {
  return <main className="mx-auto max-w-3xl p-6 md:p-8">{children}</main>;
}

function TokenMessage({
  action,
  message,
  title,
}: {
  readonly action?: ReactNode;
  readonly message: string;
  readonly title: string;
}) {
  return (
    <section className="rounded-xl border bg-card p-6">
      <h1 className="font-semibold text-2xl">{title}</h1>
      <p className="mt-2 text-muted-foreground">{message}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </section>
  );
}

function DashboardLink() {
  return (
    <Link
      className="inline-flex min-h-11 items-center justify-center rounded-md border px-4 py-2 font-medium text-sm hover:bg-muted"
      href="/dashboard"
    >
      View your dashboard
    </Link>
  );
}

function ReadOnlyStatus({
  order,
}: {
  readonly order: LoadedOrder;
}) {
  let statusCopy: { description: string; title: string };
  if (order.status === "SHIPPED") {
    statusCopy = {
      description:
        "This order has already been marked as shipped. The latest shipment details are below.",
      title: "Already shipped",
    };
  } else if (order.status === "DELIVERED") {
    statusCopy = {
      description:
        "This order has already been delivered. The shipment details below are read-only.",
      title: "Already delivered",
    };
  } else {
    statusCopy = {
      description: `This order is no longer awaiting shipment because it is currently ${order.status}.`,
      title: "Order update",
    };
  }

  return (
    <div className="space-y-6">
      <TokenMessage
        action={<DashboardLink />}
        message={statusCopy.description}
        title={statusCopy.title}
      />
      <FulfillmentDetails order={order} />
    </div>
  );
}

function FlaggedStatus({
  order,
}: {
  readonly order: LoadedOrder;
}) {
  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-amber-200 bg-amber-50/70 p-6 dark:border-amber-950 dark:bg-amber-950/20">
        <h1 className="font-semibold text-2xl">Issue reported</h1>
        <p className="mt-2 text-muted-foreground">
          {order.adminAcknowledgedFlag
            ? "Joe Perks has acknowledged this fulfillment issue and will follow up with the next step."
            : "Joe Perks has been notified and automated reminders for this order are paused while the issue is reviewed."}
        </p>
        <dl className="mt-5 space-y-3 text-sm">
          <div>
            <dt className="font-medium">Reason</dt>
            <dd className="mt-1 text-muted-foreground">{order.flagReason ?? "—"}</dd>
          </div>
          <div>
            <dt className="font-medium">Requested support</dt>
            <dd className="mt-1 text-muted-foreground">
              {order.resolutionOffered ?? "—"}
            </dd>
          </div>
          {order.flagNote ? (
            <div>
              <dt className="font-medium">Your note</dt>
              <dd className="mt-1 whitespace-pre-wrap text-muted-foreground">
                {order.flagNote}
              </dd>
            </div>
          ) : null}
        </dl>
      </section>
      <FulfillmentDetails order={order} />
    </div>
  );
}

async function loadOrder(orderId: string): Promise<LoadedOrder | null> {
  return database.order.findFirst({
    where: { id: orderId },
    include: {
      buyer: { select: { name: true } },
      campaign: {
        select: {
          name: true,
          org: {
            select: {
              slug: true,
              application: { select: { orgName: true } },
            },
          },
        },
      },
      items: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          lineTotal: true,
          productName: true,
          quantity: true,
          unitPrice: true,
          variantDesc: true,
        },
      },
    },
  });
}

async function getFulfillmentPageState(
  token: string
): Promise<FulfillmentPageState> {
  const link = await database.magicLink.findUnique({
    where: { token },
  });

  if (!link || link.purpose !== "ORDER_FULFILLMENT") {
    return { kind: "invalid" };
  }

  const raw = link.payload as { order_id?: unknown };
  const orderId = typeof raw.order_id === "string" ? raw.order_id : null;
  if (!orderId) {
    return { kind: "invalid" };
  }

  const order = await loadOrder(orderId);
  if (!order) {
    return { kind: "invalid" };
  }

  if (link.usedAt) {
    return { kind: "readonly", order, tokenReason: "used" };
  }

  if (order.flaggedAt && !order.flagResolvedAt) {
    return { kind: "flagged", order };
  }

  if (link.expiresAt <= new Date()) {
    if (order.status === "CONFIRMED") {
      return { kind: "expired", order, token };
    }

    return { kind: "readonly", order, tokenReason: "status" };
  }

  if (order.status !== "CONFIRMED") {
    return { kind: "readonly", order, tokenReason: "status" };
  }

  return { kind: "ready", order, token };
}

/** Magic link fulfillment — no auth (AGENTS.md). */
export default async function FulfillPage({ params }: Props) {
  const { token } = await params;

  if (!token) {
    return (
      <TokenShell>
        <TokenMessage
          message="Check the link in your email."
          title="Invalid link"
        />
      </TokenShell>
    );
  }

  const state = await getFulfillmentPageState(token);

  if (state.kind === "invalid") {
    return (
      <TokenShell>
        <TokenMessage
          message="Double-check the URL or open the latest email from Joe Perks."
          title="Invalid link"
        />
      </TokenShell>
    );
  }

  if (state.kind === "expired") {
    return (
      <TokenShell>
        <div className="space-y-6">
          <TokenMessage
            action={<ExpiredLinkRecovery token={state.token} />}
            message={`The fulfillment link for order ${state.order.orderNumber} has expired. If the order still needs to ship, request a fresh email below.`}
            title="This link has expired"
          />
          <FulfillmentDetails order={state.order} />
        </div>
      </TokenShell>
    );
  }

  if (state.kind === "readonly") {
    return (
      <TokenShell>
        <ReadOnlyStatus order={state.order} />
      </TokenShell>
    );
  }

  if (state.kind === "flagged") {
    return (
      <TokenShell>
        <FlaggedStatus order={state.order} />
      </TokenShell>
    );
  }

  const viewed = await database.orderEvent.findFirst({
    where: {
      orderId: state.order.id,
      eventType: "FULFILLMENT_VIEWED",
    },
  });
  if (!viewed) {
    await logOrderEvent(
      state.order.id,
      "FULFILLMENT_VIEWED",
      "ROASTER",
      state.order.roasterId,
      {},
      null
    );
  }

  return (
    <TokenShell>
      <FulfillmentDetails order={state.order} />
      <div className="mt-8 rounded-xl border p-5">
        <TrackingForm orderNumber={state.order.orderNumber} token={state.token} />
      </div>
      <div className="mt-6">
        <CantFulfillForm token={state.token} />
      </div>
    </TokenShell>
  );
}

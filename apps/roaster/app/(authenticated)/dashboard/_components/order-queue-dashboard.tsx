import { Badge } from "@repo/design-system/components/ui/badge";
import { Button } from "@repo/design-system/components/ui/button";
import { cn } from "@repo/design-system/lib/utils";
import { AlertTriangleIcon, ArrowRightIcon, Clock3Icon, TruckIcon } from "lucide-react";
import Link from "next/link";

import type { DashboardAccountStatus, DashboardCounts, DashboardOrderRow } from "../_lib/queries";
import {
  formatShortDate,
  getOrderQueueViewLabel,
  getOrderStatusBadgeVariant,
  getOrderStatusLabel,
  getOrderTimingLabel,
  getQueueEmptyStateCopy,
  getQueueHeading,
  type OrderQueueView,
  orderQueueViews,
} from "../_lib/order-queue";

interface OrderQueueDashboardProps {
  readonly account: DashboardAccountStatus;
  readonly counts: DashboardCounts;
  readonly orders: DashboardOrderRow[];
  readonly view: OrderQueueView;
}

export function OrderQueueDashboard({
  account,
  counts,
  orders,
  view,
}: OrderQueueDashboardProps) {
  return (
    <div className="space-y-6 p-6">
      <section className="space-y-2">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="font-semibold text-2xl">Dashboard</h1>
            <p className="mt-1 max-w-2xl text-muted-foreground text-sm">
              Keep up with the live fulfillment queue for your storefront orders.
              The default view stays focused on what needs to ship next.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <SummaryCard label="To ship" value={counts.toShip} />
            <SummaryCard label="Flagged" tone="warn" value={counts.flagged} />
            <SummaryCard label="Shipped" value={counts.shipped} />
            <SummaryCard label="Delivered" value={counts.delivered} />
          </div>
        </div>
      </section>

      {account.status === "SUSPENDED" ? (
        <SuspendedAccountPanel account={account} />
      ) : null}

      <section className="rounded-2xl border bg-card p-4 sm:p-5">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <h2 className="font-semibold text-lg">{getQueueHeading(view)}</h2>
            <p className="text-muted-foreground text-sm">
              {view === "to-ship"
                ? "Confirmed orders are sorted by fulfill-by date so the next shipment is obvious."
                : `Showing the ${getOrderQueueViewLabel(view).toLowerCase()} queue for this roaster account.`}
            </p>
          </div>

          <nav
            aria-label="Order queue filters"
            className="flex flex-wrap gap-2"
          >
            {orderQueueViews.map((item) => (
              <QueueFilterLink
                count={countForView(counts, item)}
                isActive={item === view}
                key={item}
                view={item}
              />
            ))}
          </nav>

          {orders.length === 0 ? (
            <div className="rounded-xl border border-dashed p-8 text-center">
              <p className="font-medium text-sm">
                {getQueueEmptyStateCopy(view)}
              </p>
              <p className="mt-2 text-muted-foreground text-sm">
                New storefront orders will appear here automatically.
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {orders.map((order) => (
                <OrderRowCard key={order.id} order={order} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function SummaryCard({
  label,
  tone = "default",
  value,
}: {
  readonly label: string;
  readonly tone?: "default" | "warn";
  readonly value: number;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-background px-3 py-3",
        tone === "warn" && "border-amber-200 bg-amber-50/60 dark:border-amber-950 dark:bg-amber-950/20"
      )}
    >
      <p className="text-muted-foreground text-xs uppercase tracking-wide">
        {label}
      </p>
      <p className="mt-1 font-semibold text-2xl tabular-nums">{value}</p>
    </div>
  );
}

function QueueFilterLink({
  count,
  isActive,
  view,
}: {
  readonly count: number;
  readonly isActive: boolean;
  readonly view: OrderQueueView;
}) {
  const href = view === "to-ship" ? "/dashboard" : `/dashboard?view=${view}`;

  return (
    <Link
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "inline-flex min-h-11 items-center gap-2 rounded-full border px-4 py-2 font-medium text-sm transition-colors motion-reduce:transition-none",
        isActive
          ? "border-primary bg-primary text-primary-foreground"
          : "bg-background hover:bg-muted"
      )}
      href={href}
    >
      <span>{getOrderQueueViewLabel(view)}</span>
      <span
        className={cn(
          "rounded-full px-2 py-0.5 text-xs tabular-nums",
          isActive
            ? "bg-primary-foreground/20 text-primary-foreground"
            : "bg-muted text-muted-foreground"
        )}
      >
        {count}
      </span>
    </Link>
  );
}

function OrderRowCard({ order }: { readonly order: DashboardOrderRow }) {
  const flagged = Boolean(order.flaggedAt && !order.flagResolvedAt);
  const destination = `${order.shipToCity}, ${order.shipToState}`;
  const orgName =
    order.campaign.org.application.orgName?.trim() || order.campaign.name;
  const buyerLabel = order.buyer?.name?.trim() || order.shipToName;

  return (
    <article
      className={cn(
        "rounded-xl border bg-background p-4 shadow-sm transition-colors motion-reduce:transition-none",
        flagged && "border-amber-300 bg-amber-50/40 dark:border-amber-900 dark:bg-amber-950/10"
      )}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              className="inline-flex min-h-11 items-center rounded-md font-semibold text-base hover:underline"
              href={`/orders/${order.id}`}
            >
              {order.orderNumber}
            </Link>
            <Badge variant={getOrderStatusBadgeVariant(order.status)}>
              {getOrderStatusLabel(order.status)}
            </Badge>
            {flagged ? (
              <Badge className="gap-1" variant="destructive">
                <AlertTriangleIcon className="size-3" />
                Action needed
              </Badge>
            ) : null}
          </div>

          <div className={cn("grid gap-2 sm:grid-cols-2", "text-muted-foreground text-sm")}>
            <p>
              <span className="font-medium text-foreground">Org:</span> {orgName}
            </p>
            <p>
              <span className="font-medium text-foreground">Buyer:</span>{" "}
              {buyerLabel}
            </p>
            <p>
              <span className="font-medium text-foreground">Ship to:</span>{" "}
              {destination}
            </p>
            <p>
              <span className="font-medium text-foreground">Created:</span>{" "}
              {formatShortDate(order.createdAt)}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Badge className="gap-1" variant={flagged ? "destructive" : "secondary"}>
              {order.status === "CONFIRMED" ? (
                <Clock3Icon className="size-3" />
              ) : (
                <TruckIcon className="size-3" />
              )}
              {getOrderTimingLabel(order)}
            </Badge>
            {order.trackingNumber ? (
              <span className="text-muted-foreground">
                Tracking:{" "}
                <span className="font-mono text-foreground">
                  {order.trackingNumber}
                </span>
              </span>
            ) : null}
            {flagged && order.flagReason ? (
              <span className="text-amber-900 dark:text-amber-100">
                Flag reason: {order.flagReason}
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 items-center">
          <Button asChild variant="outline">
            <Link href={`/orders/${order.id}`}>
              Open order
              <ArrowRightIcon className="size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
}

function SuspendedAccountPanel({
  account,
}: {
  readonly account: DashboardAccountStatus;
}) {
  return (
    <section className="rounded-2xl border border-amber-300 bg-amber-50/80 p-5 dark:border-amber-950 dark:bg-amber-950/20">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <h2 className="font-semibold text-lg">Account under review</h2>
          <p className="mt-2 text-sm">
            New orders and catalog changes stay blocked while this review is
            open, but you should still fulfill existing confirmed orders from the
            queue below.
          </p>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Business</dt>
              <dd className="font-medium text-foreground">
                {account.businessName}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Reason category</dt>
              <dd className="font-medium text-foreground">
                {account.suspensionReason ?? "Account review"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Stripe onboarding</dt>
              <dd className="font-medium text-foreground">
                {account.stripeOnboarding}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Charges / payouts</dt>
              <dd className="font-medium text-foreground">
                {account.chargesEnabled ? "charges on" : "charges off"} ·{" "}
                {account.payoutsEnabled ? "payouts on" : "payouts off"}
              </dd>
            </div>
          </dl>
          {account.latestRequestAt ? (
            <p className="mt-4 text-muted-foreground text-sm">
              Latest reactivation request:{" "}
              {account.latestRequestAt.toLocaleString()}
            </p>
          ) : null}
        </div>

        <div className="rounded-xl border bg-background p-4 text-sm shadow-sm lg:max-w-md">
          <p className="font-medium">Need review after fixing the issue?</p>
          <p className="mt-1 text-muted-foreground">
            Use the reactivation form below so the platform team can review the
            remediation steps you already completed.
          </p>
        </div>
      </div>
    </section>
  );
}

function countForView(counts: DashboardCounts, view: OrderQueueView): number {
  switch (view) {
    case "to-ship": {
      return counts.toShip;
    }
    case "shipped": {
      return counts.shipped;
    }
    case "delivered": {
      return counts.delivered;
    }
    case "all": {
      return counts.all;
    }
    default: {
      return counts.toShip;
    }
  }
}

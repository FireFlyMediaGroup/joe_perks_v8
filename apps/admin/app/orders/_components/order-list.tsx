import type { OrderStatus, PayoutStatus } from "@joe-perks/db";
import { getCarrierTrackingHref } from "@joe-perks/types";
import Link from "next/link";

import type { OrderSlaState } from "../_lib/sla";

interface Row {
  buyerName: string | null;
  campaignName: string;
  carrier: string | null;
  disputeRespondBy: Date | null;
  hasOpenDispute: boolean;
  id: string;
  orderDate: Date;
  orderNumber: string;
  orgLabel: string;
  payoutStatus: PayoutStatus;
  roasterLabel: string;
  shippedAt: Date | null;
  sla: OrderSlaState;
  status: OrderStatus;
  trackingNumber: string | null;
}

const statusLabels: Record<OrderStatus, string> = {
  CANCELLED: "Cancelled",
  CONFIRMED: "Confirmed",
  DELIVERED: "Delivered",
  PENDING: "Pending",
  REFUNDED: "Refunded",
  SHIPPED: "Shipped",
};

const payoutLabels: Record<PayoutStatus, string> = {
  FAILED: "Failed",
  HELD: "Held",
  PENDING: "Pending",
  TRANSFERRED: "Transferred",
};

function tabClass(active: boolean) {
  return `inline-flex min-h-11 items-center rounded-full border px-4 py-2 text-sm font-medium ${
    active
      ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
      : "border-zinc-200 bg-white text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
  }`;
}

function slaClass(tone: OrderSlaState["tone"]) {
  if (tone === "green") {
    return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200";
  }
  if (tone === "amber") {
    return "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-200";
  }
  if (tone === "red") {
    return "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-200";
  }

  return "bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300";
}

function getSlaDetailText(order: Row): string {
  if (order.sla.countsTowardSummary) {
    return `Breach at ${order.sla.breachAt.toLocaleDateString()}`;
  }

  if (order.shippedAt) {
    return `Shipped ${order.shippedAt.toLocaleDateString()}`;
  }

  return order.sla.description;
}

function renderTrackingNumber(
  carrier: string | null,
  trackingNumber: string | null
) {
  const trackingHref = getCarrierTrackingHref(carrier, trackingNumber);

  if (!(trackingHref && trackingNumber?.trim())) {
    return trackingNumber ?? "—";
  }

  return (
    <a
      className="underline underline-offset-2"
      href={trackingHref}
      rel="noreferrer"
      target="_blank"
    >
      {trackingNumber}
    </a>
  );
}

export function OrderList({
  currentPage,
  filters,
  orders,
  pageEnd,
  pageStart,
  slaSummary,
  statusFilter,
  totalCount,
  totalPages,
}: {
  readonly currentPage: number;
  readonly filters: {
    from: string;
    org: string;
    roaster: string;
    to: string;
  };
  readonly orders: Row[];
  readonly pageEnd: number;
  readonly pageStart: number;
  readonly slaSummary: {
    critical: number;
    onTrack: number;
    warning: number;
  };
  readonly statusFilter: OrderStatus | "ALL";
  readonly totalCount: number;
  readonly totalPages: number;
}) {
  const buildHref = (nextStatus: OrderStatus | "ALL", nextPage = 1): string => {
    const params = new URLSearchParams();
    if (nextStatus !== "ALL") {
      params.set("status", nextStatus);
    }
    if (filters.roaster) {
      params.set("roaster", filters.roaster);
    }
    if (filters.org) {
      params.set("org", filters.org);
    }
    if (filters.from) {
      params.set("from", filters.from);
    }
    if (filters.to) {
      params.set("to", filters.to);
    }
    if (nextPage > 1) {
      params.set("page", String(nextPage));
    }

    const query = params.toString();
    return query ? `/orders?${query}` : "/orders";
  };

  const tabs: Array<{
    href: string;
    label: string;
    value: OrderStatus | "ALL";
  }> = [
    { href: buildHref("ALL"), label: "All", value: "ALL" },
    { href: buildHref("CONFIRMED"), label: "Confirmed", value: "CONFIRMED" },
    { href: buildHref("SHIPPED"), label: "Shipped", value: "SHIPPED" },
    {
      href: buildHref("DELIVERED"),
      label: "Delivered",
      value: "DELIVERED",
    },
    {
      href: buildHref("REFUNDED"),
      label: "Refunded",
      value: "REFUNDED",
    },
    {
      href: buildHref("CANCELLED"),
      label: "Cancelled",
      value: "CANCELLED",
    },
  ];

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 dark:border-rose-950 dark:bg-rose-950/20">
          <p className="text-sm text-zinc-600 dark:text-zinc-300">Critical</p>
          <p className="mt-1 font-semibold text-2xl">{slaSummary.critical}</p>
          <p className="mt-1 text-xs text-zinc-500">
            Confirmed orders at or past breach.
          </p>
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-950 dark:bg-amber-950/20">
          <p className="text-sm text-zinc-600 dark:text-zinc-300">Warning</p>
          <p className="mt-1 font-semibold text-2xl">{slaSummary.warning}</p>
          <p className="mt-1 text-xs text-zinc-500">
            Confirmed orders approaching breach.
          </p>
        </div>
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-950 dark:bg-emerald-950/20">
          <p className="text-sm text-zinc-600 dark:text-zinc-300">On Track</p>
          <p className="mt-1 font-semibold text-2xl">{slaSummary.onTrack}</p>
          <p className="mt-1 text-xs text-zinc-500">
            Confirmed orders still inside the normal window.
          </p>
        </div>
      </section>

      <form className="grid gap-4 rounded-lg border border-zinc-200 p-4 md:grid-cols-5 dark:border-zinc-800">
        <input name="status" type="hidden" value={statusFilter} />
        <label className="block text-sm">
          <span className="mb-1 block text-zinc-600">Roaster</span>
          <input
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
            defaultValue={filters.roaster}
            name="roaster"
            placeholder="Business name or email"
            type="search"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-zinc-600">Org or campaign</span>
          <input
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
            defaultValue={filters.org}
            name="org"
            placeholder="Org, slug, or campaign"
            type="search"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-zinc-600">From</span>
          <input
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
            defaultValue={filters.from}
            name="from"
            type="date"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-zinc-600">To</span>
          <input
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
            defaultValue={filters.to}
            name="to"
            type="date"
          />
        </label>
        <div className="flex items-end gap-3">
          <button
            className="inline-flex min-h-11 items-center rounded-full bg-zinc-900 px-4 py-2 font-medium text-sm text-white dark:bg-zinc-100 dark:text-zinc-900"
            type="submit"
          >
            Apply filters
          </button>
          <Link className="text-sm text-zinc-600 underline" href="/orders">
            Reset
          </Link>
        </div>
      </form>

      <nav className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <Link
            className={tabClass(statusFilter === t.value)}
            href={t.href}
            key={t.value}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      <div className="flex flex-col gap-2 text-sm text-zinc-600 sm:flex-row sm:items-center sm:justify-between">
        <p>
          Showing {pageStart}-{pageEnd} of {totalCount} orders
        </p>
        <p>Pages are limited to 50 rows.</p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
        <table className="w-full min-w-[1180px] text-left text-sm">
          <thead className="bg-zinc-50 text-zinc-600 dark:bg-zinc-900/50 dark:text-zinc-400">
            <tr>
              <th className="px-3 py-2 font-medium">Order</th>
              <th className="px-3 py-2 font-medium">Org</th>
              <th className="px-3 py-2 font-medium">Campaign</th>
              <th className="px-3 py-2 font-medium">Roaster</th>
              <th className="px-3 py-2 font-medium">Buyer</th>
              <th className="px-3 py-2 font-medium">Created</th>
              <th className="px-3 py-2 font-medium">SLA</th>
              <th className="px-3 py-2 font-medium">Payout</th>
              <th className="px-3 py-2 font-medium">Tracking</th>
              <th className="px-3 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td
                  className="px-3 py-6 text-center text-zinc-500"
                  colSpan={10}
                >
                  No orders for this filter.
                </td>
              </tr>
            ) : (
              orders.map((o) => (
                <tr
                  className="border-zinc-100 border-t dark:border-zinc-800"
                  key={o.id}
                >
                  <td className="px-3 py-2 font-medium">
                    <Link
                      className="text-zinc-900 underline underline-offset-2 dark:text-zinc-50"
                      href={`/orders/${o.id}`}
                    >
                      {o.orderNumber}
                    </Link>
                    {o.hasOpenDispute ? (
                      <div className="mt-1 inline-flex rounded-full bg-rose-100 px-2 py-0.5 text-[11px] text-rose-800 dark:bg-rose-950/60 dark:text-rose-200">
                        Dispute open
                      </div>
                    ) : null}
                    {o.disputeRespondBy ? (
                      <div className="mt-1 text-xs text-zinc-500">
                        Respond by {o.disputeRespondBy.toLocaleDateString()}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-3 py-2">{o.orgLabel}</td>
                  <td className="px-3 py-2">{o.campaignName}</td>
                  <td className="px-3 py-2">{o.roasterLabel}</td>
                  <td className="px-3 py-2">{o.buyerName ?? "—"}</td>
                  <td className="px-3 py-2 text-zinc-600">
                    {o.orderDate.toLocaleDateString()}
                  </td>
                  <td className="px-3 py-2">
                    <div
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs ${slaClass(o.sla.tone)}`}
                    >
                      {o.sla.label}
                    </div>
                    <div className="mt-1 text-xs text-zinc-500">
                      {getSlaDetailText(o)}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs dark:bg-zinc-900">
                      {payoutLabels[o.payoutStatus]}
                    </span>
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">
                    {renderTrackingNumber(o.carrier, o.trackingNumber)}
                  </td>
                  <td className="px-3 py-2">
                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs dark:bg-zinc-900">
                      {statusLabels[o.status]}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-zinc-600">
          Page {currentPage} of {totalPages}
        </p>
        <div className="flex gap-2">
          <Link
            className={tabClass(currentPage === 1)}
            href={buildHref(statusFilter, Math.max(1, currentPage - 1))}
          >
            Previous
          </Link>
          <Link
            className={tabClass(currentPage >= totalPages)}
            href={buildHref(
              statusFilter,
              Math.min(totalPages, currentPage + 1)
            )}
          >
            Next
          </Link>
        </div>
      </div>
    </div>
  );
}

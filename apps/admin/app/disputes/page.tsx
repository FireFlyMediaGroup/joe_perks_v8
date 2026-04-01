import { database } from "@joe-perks/db";
import Link from "next/link";

import { FaultAttributionForm } from "./_components/fault-attribution-form";

function formatUsd(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function parseStatusFilter(raw: string | undefined): "ALL" | "CLOSED" | "OPEN" {
  if (raw === "CLOSED") {
    return "CLOSED";
  }

  if (raw === "OPEN") {
    return "OPEN";
  }

  return "ALL";
}

function buildHref(status: "ALL" | "CLOSED" | "OPEN"): string {
  return status === "ALL" ? "/disputes" : `/disputes?status=${status}`;
}

export default async function AdminDisputesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const sp = await searchParams;
  const statusFilter = parseStatusFilter(sp.status);

  const [summary, disputes] = await Promise.all([
    database.disputeRecord.groupBy({
      _count: { _all: true },
      by: ["outcome"],
    }),
    database.disputeRecord.findMany({
      include: {
        order: {
          select: {
            buyerIp: true,
            campaign: {
              select: {
                name: true,
                org: {
                  select: {
                    application: { select: { orgName: true } },
                    slug: true,
                  },
                },
              },
            },
            id: true,
            orderNumber: true,
            payoutStatus: true,
            roaster: {
              select: {
                application: { select: { businessName: true } },
                email: true,
              },
            },
            roasterTotal: true,
            shippedAt: true,
            status: true,
            stripeChargeId: true,
            stripePiId: true,
            trackingNumber: true,
          },
        },
      },
      orderBy: [{ updatedAt: "desc" }],
      where:
        statusFilter === "OPEN"
          ? { outcome: null }
          : statusFilter === "CLOSED"
            ? { outcome: { not: null } }
            : undefined,
    }),
  ]);

  const openCount = summary.find((row) => row.outcome === null)?._count._all ?? 0;
  const lostCount = summary.find((row) => row.outcome === "LOST")?._count._all ?? 0;
  const wonCount = summary.find((row) => row.outcome === "WON")?._count._all ?? 0;

  return (
    <main className="mx-auto max-w-7xl p-6 md:p-8">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-semibold text-3xl">Disputes</h1>
          <p className="mt-1 max-w-3xl text-sm text-zinc-600 dark:text-zinc-400">
            Review chargebacks, track respond-by deadlines, set fault
            attribution, and export the order evidence package for manual Stripe
            submission.
          </p>
        </div>
        <Link className="text-sm text-zinc-600 underline" href="/">
          Home
        </Link>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 dark:border-rose-950 dark:bg-rose-950/20">
          <p className="text-sm text-zinc-600 dark:text-zinc-300">Open</p>
          <p className="mt-1 font-semibold text-2xl">{openCount}</p>
          <p className="mt-1 text-xs text-zinc-500">Needs evidence review or final outcome.</p>
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-950 dark:bg-amber-950/20">
          <p className="text-sm text-zinc-600 dark:text-zinc-300">Lost</p>
          <p className="mt-1 font-semibold text-2xl">{lostCount}</p>
          <p className="mt-1 text-xs text-zinc-500">Check fault attribution and recovery state.</p>
        </div>
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-950 dark:bg-emerald-950/20">
          <p className="text-sm text-zinc-600 dark:text-zinc-300">Won</p>
          <p className="mt-1 font-semibold text-2xl">{wonCount}</p>
          <p className="mt-1 text-xs text-zinc-500">Funds can continue through the normal payout path.</p>
        </div>
      </section>

      <nav className="mt-6 flex flex-wrap gap-2">
        {(["ALL", "OPEN", "CLOSED"] as const).map((value) => (
          <Link
            className={`inline-flex min-h-11 items-center rounded-full border px-4 py-2 font-medium text-sm ${
              statusFilter === value
                ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                : "border-zinc-200 bg-white text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
            }`}
            href={buildHref(value)}
            key={value}
          >
            {value === "ALL" ? "All" : value === "OPEN" ? "Open" : "Closed"}
          </Link>
        ))}
      </nav>

      {disputes.length === 0 ? (
        <p className="mt-8 text-sm text-zinc-600 dark:text-zinc-400">
          No disputes in this view.
        </p>
      ) : (
        <div className="mt-8 space-y-6">
          {disputes.map((dispute) => {
            const orgLabel =
              dispute.order.campaign.org.application.orgName ??
              dispute.order.campaign.org.slug;
            const roasterLabel =
              dispute.order.roaster.application.businessName ??
              dispute.order.roaster.email;

            return (
              <section
                className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950"
                key={dispute.id}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold text-xl">
                        Order {dispute.order.orderNumber}
                      </h2>
                      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs dark:bg-zinc-900">
                        {dispute.outcome ?? "OPEN"}
                      </span>
                      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs dark:bg-zinc-900">
                        Fault {dispute.faultAttribution ?? "NOT_SET"}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      {orgLabel} · {dispute.order.campaign.name} · {roasterLabel}
                    </p>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      Stripe dispute ID:{" "}
                      <span className="font-mono text-zinc-900 dark:text-zinc-100">
                        {dispute.stripeDisputeId}
                      </span>
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Link
                      className="inline-flex min-h-11 items-center rounded-full border border-zinc-300 px-4 py-2 font-medium text-sm text-zinc-700 dark:border-zinc-700 dark:text-zinc-200"
                      href={`/orders/${dispute.orderId}`}
                    >
                      View order
                    </Link>
                    <a
                      className="inline-flex min-h-11 items-center rounded-full border border-zinc-300 px-4 py-2 font-medium text-sm text-zinc-700 dark:border-zinc-700 dark:text-zinc-200"
                      href={`/disputes/${dispute.id}/evidence`}
                    >
                      Export evidence JSON
                    </a>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 xl:grid-cols-[1.3fr_0.9fr]">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
                      <h3 className="mb-2 font-semibold text-sm">Dispute context</h3>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        Respond by:{" "}
                        {dispute.respondBy ? dispute.respondBy.toLocaleString() : "—"}
                      </p>
                      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                        Evidence submitted: {dispute.evidenceSubmitted ? "Yes" : "No"}
                      </p>
                      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                        Opened: {dispute.createdAt.toLocaleString()}
                      </p>
                      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                        Last updated: {dispute.updatedAt.toLocaleString()}
                      </p>
                    </div>
                    <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
                      <h3 className="mb-2 font-semibold text-sm">Order evidence basics</h3>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        Buyer IP:{" "}
                        <span className="font-mono text-zinc-900 dark:text-zinc-100">
                          {dispute.order.buyerIp}
                        </span>
                      </p>
                      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                        Charge: {dispute.order.stripeChargeId ?? "—"}
                      </p>
                      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                        Payment intent: {dispute.order.stripePiId}
                      </p>
                      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                        Tracking: {dispute.order.trackingNumber ?? "—"}
                      </p>
                    </div>
                    <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
                      <h3 className="mb-2 font-semibold text-sm">Financial context</h3>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        Roaster total transfer leg: {formatUsd(dispute.order.roasterTotal)}
                      </p>
                      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                        Order status: {dispute.order.status}
                      </p>
                      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                        Payout status: {dispute.order.payoutStatus}
                      </p>
                    </div>
                    <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
                      <h3 className="mb-2 font-semibold text-sm">Fulfillment context</h3>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        Shipped: {dispute.order.shippedAt ? dispute.order.shippedAt.toLocaleString() : "—"}
                      </p>
                      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                        Tracking available: {dispute.order.trackingNumber ? "Yes" : "No"}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
                    <FaultAttributionForm
                      currentFault={dispute.faultAttribution ?? ""}
                      disputeId={dispute.id}
                    />
                    <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
                      Saving `ROASTER` on a lost dispute will record the dispute fee
                      plus Stripe fee as debt, attempt a roaster transfer reversal
                      when one exists, and auto-suspend at 3+ lost roaster-fault
                      disputes in 90 days.
                    </p>
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      )}
    </main>
  );
}

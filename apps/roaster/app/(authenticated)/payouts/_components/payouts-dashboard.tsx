import { Badge } from "@repo/design-system/components/ui/badge";
import { Button } from "@repo/design-system/components/ui/button";
import { Separator } from "@repo/design-system/components/ui/separator";
import { cn } from "@repo/design-system/lib/utils";
import { ArrowRightIcon, BanknoteIcon, CircleAlertIcon } from "lucide-react";
import Link from "next/link";

import type { RoasterPayoutsPageData } from "../_lib/queries";
import {
  formatDebtReason,
  formatDisputeOutcome,
  formatFaultAttribution,
  formatUsd,
  getPayoutBadgeVariant,
  getPayoutDisplayLabel,
  getPayoutDisplayState,
  getPayoutEventNote,
  summarizeFinanceData,
} from "../_lib/payouts";

export function PayoutsDashboard({
  data,
}: {
  readonly data: RoasterPayoutsPageData;
}) {
  const summary = summarizeFinanceData(data.payouts, data.debts, data.disputes);
  const payoutsNeedSetup =
    !data.account.payoutsEnabled || data.account.stripeOnboarding !== "COMPLETE";

  return (
    <main className="space-y-6 p-6">
      <section className="space-y-2">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="font-semibold text-2xl">Payouts</h1>
            <p className="mt-1 max-w-2xl text-muted-foreground text-sm">
              Track what is still in the hold window, what is ready for release,
              and which debts or disputes need attention for{" "}
              {data.account.businessName}.
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Badge
              variant={data.account.payoutsEnabled ? "default" : "secondary"}
            >
              {data.account.payoutsEnabled ? "Payouts enabled" : "Payouts setup needed"}
            </Badge>
            <Badge variant="outline">Roaster {data.account.status.toLowerCase()}</Badge>
          </div>
        </div>
      </section>

      {payoutsNeedSetup ? (
        <section className="rounded-2xl border border-amber-300 bg-amber-50/70 p-5 dark:border-amber-950 dark:bg-amber-950/20">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CircleAlertIcon className="size-4 text-amber-700 dark:text-amber-300" />
                <h2 className="font-semibold text-lg">Finish Stripe payout setup</h2>
              </div>
              <p className="max-w-2xl text-sm">
                Orders can still appear here, but transfers stay blocked until Stripe
                onboarding is complete and payouts are enabled for this roaster
                account.
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href="/onboarding">
                Open onboarding
                <ArrowRightIcon className="size-4" />
              </Link>
            </Button>
          </div>
        </section>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <SummaryCard
          label="In hold period"
          sublabel={`${summary.inHold.count} order${summary.inHold.count === 1 ? "" : "s"}`}
          value={formatUsd(summary.inHold.amount)}
        />
        <SummaryCard
          label="Awaiting release"
          sublabel={`${summary.awaitingRelease.count} order${summary.awaitingRelease.count === 1 ? "" : "s"}`}
          value={formatUsd(summary.awaitingRelease.amount)}
        />
        <SummaryCard
          label="Paid"
          sublabel={`${summary.paid.count} order${summary.paid.count === 1 ? "" : "s"}`}
          value={formatUsd(summary.paid.amount)}
        />
        <SummaryCard
          label="Transfer failed"
          sublabel={`${summary.failed.count} order${summary.failed.count === 1 ? "" : "s"}`}
          tone="warn"
          value={formatUsd(summary.failed.amount)}
        />
        <SummaryCard
          label="Unsettled debt"
          sublabel={`${summary.unsettledDebtCount} item${summary.unsettledDebtCount === 1 ? "" : "s"}`}
          tone="warn"
          value={formatUsd(summary.unsettledDebtTotal)}
        />
        <SummaryCard
          label="Open disputes"
          sublabel="Orders under review"
          tone={summary.openDisputes > 0 ? "warn" : "default"}
          value={String(summary.openDisputes)}
        />
      </section>

      <section className="rounded-2xl border bg-card p-5">
        <div className="flex flex-col gap-2">
          <h2 className="font-semibold text-lg">Payout history</h2>
          <p className="text-muted-foreground text-sm">
            Labels stay aligned with the live payout model: hold period, awaiting
            release, paid, and transfer failed.
          </p>
        </div>
        <Separator className="my-4" />
        {data.payouts.length === 0 ? (
          <EmptyState copy="No payout-eligible orders have reached the finance ledger yet." />
        ) : (
          <div className="grid gap-3">
            {data.payouts.map((payout) => {
              const displayState = getPayoutDisplayState(
                payout.payoutStatus,
                payout.payoutEligibleAt
              );
              const orgName =
                payout.campaign.org.application.orgName?.trim() ||
                payout.campaign.org.slug;
              const eventNote = getPayoutEventNote(payout.latestPayoutEvent);

              return (
                <article
                  className="rounded-xl border bg-background p-4 shadow-sm"
                  key={payout.id}
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          className="inline-flex min-h-11 items-center rounded-md font-semibold text-base hover:underline"
                          href={`/orders/${payout.id}`}
                        >
                          {payout.orderNumber}
                        </Link>
                        <Badge variant={getPayoutBadgeVariant(displayState)}>
                          {getPayoutDisplayLabel(displayState)}
                        </Badge>
                      </div>

                      <div className="grid gap-2 text-sm sm:grid-cols-2">
                        <p>
                          <span className="font-medium">Org:</span> {orgName}
                        </p>
                        <p>
                          <span className="font-medium">Campaign:</span>{" "}
                          {payout.campaign.name}
                        </p>
                        <p>
                          <span className="font-medium">Delivered:</span>{" "}
                          {payout.deliveredAt
                            ? payout.deliveredAt.toLocaleDateString()
                            : "Not delivered yet"}
                        </p>
                        <p>
                          <span className="font-medium">Eligible:</span>{" "}
                          {payout.payoutEligibleAt
                            ? payout.payoutEligibleAt.toLocaleString()
                            : "Pending delivery"}
                        </p>
                      </div>

                      <div className="grid gap-2 text-muted-foreground text-sm sm:grid-cols-2">
                        <p>
                          Product share:{" "}
                          <span className="font-medium text-foreground">
                            {formatUsd(payout.roasterAmount)}
                          </span>
                        </p>
                        <p>
                          Shipping passthrough:{" "}
                          <span className="font-medium text-foreground">
                            {formatUsd(payout.shippingAmount)}
                          </span>
                        </p>
                      </div>

                      {eventNote ? (
                        <p className="rounded-lg bg-muted/50 px-3 py-2 text-sm">
                          {eventNote}
                        </p>
                      ) : null}

                      {payout.stripeTransferId ? (
                        <p className="text-muted-foreground text-xs">
                          Transfer ID:{" "}
                          <span className="font-mono text-foreground">
                            {payout.stripeTransferId}
                          </span>
                        </p>
                      ) : null}
                    </div>

                    <div className="flex shrink-0 flex-col items-start gap-3 lg:items-end">
                      <div className="text-left lg:text-right">
                        <p className="text-muted-foreground text-sm">
                          Total to roaster
                        </p>
                        <p className="font-semibold text-2xl">
                          {formatUsd(payout.roasterTotal)}
                        </p>
                      </div>
                      <Button asChild variant="outline">
                        <Link href={`/orders/${payout.id}`}>
                          Open order
                          <ArrowRightIcon className="size-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border bg-card p-5">
          <div className="flex items-center gap-2">
            <BanknoteIcon className="size-4 text-muted-foreground" />
            <h2 className="font-semibold text-lg">Unsettled debt</h2>
          </div>
          <p className="mt-2 text-muted-foreground text-sm">
            These items will reduce or block future roaster payouts until they are
            resolved by the platform.
          </p>
          <Separator className="my-4" />
          {data.debts.length === 0 ? (
            <EmptyState copy="No unsettled roaster debt is currently recorded." />
          ) : (
            <div className="grid gap-3">
              {data.debts.map((debt) => (
                <article className="rounded-xl border bg-background p-4" key={debt.id}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">{formatDebtReason(debt.reason)}</Badge>
                        {debt.order ? (
                          <Link
                            className="inline-flex min-h-11 items-center rounded-md font-medium text-sm hover:underline"
                            href={`/orders/${debt.order.id}`}
                          >
                            {debt.order.orderNumber}
                          </Link>
                        ) : null}
                      </div>
                      <p className="text-muted-foreground text-sm">
                        Logged {debt.createdAt.toLocaleString()}
                      </p>
                    </div>
                    <p className="font-semibold text-lg">{formatUsd(debt.amount)}</p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border bg-card p-5">
          <div className="flex items-center gap-2">
            <CircleAlertIcon className="size-4 text-muted-foreground" />
            <h2 className="font-semibold text-lg">Disputes</h2>
          </div>
          <p className="mt-2 text-muted-foreground text-sm">
            Dispute records are tied to your orders so you can see the current
            attribution and outcome without leaving the roaster portal.
          </p>
          <Separator className="my-4" />
          {data.disputes.length === 0 ? (
            <EmptyState copy="No dispute records are tied to this roaster's orders." />
          ) : (
            <div className="grid gap-3">
              {data.disputes.map((dispute) => (
                <article className="rounded-xl border bg-background p-4" key={dispute.id}>
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant={dispute.outcome === null ? "destructive" : "outline"}
                      >
                        {formatDisputeOutcome(dispute.outcome)}
                      </Badge>
                      <Badge variant="secondary">
                        {formatFaultAttribution(dispute.faultAttribution)}
                      </Badge>
                      <Link
                        className="inline-flex min-h-11 items-center rounded-md font-medium text-sm hover:underline"
                        href={`/orders/${dispute.order.id}`}
                      >
                        {dispute.order.orderNumber}
                      </Link>
                    </div>
                    <div className="grid gap-2 text-sm sm:grid-cols-2">
                      <p>
                        <span className="font-medium">Opened:</span>{" "}
                        {dispute.createdAt.toLocaleString()}
                      </p>
                      <p>
                        <span className="font-medium">Payout state:</span>{" "}
                        {getPayoutDisplayLabel(
                          getPayoutDisplayState(
                            dispute.order.payoutStatus,
                            dispute.order.payoutEligibleAt
                          )
                        )}
                      </p>
                      <p>
                        <span className="font-medium">Amount at risk:</span>{" "}
                        {formatUsd(dispute.order.roasterTotal)}
                      </p>
                      <p>
                        <span className="font-medium">Respond by:</span>{" "}
                        {dispute.respondBy
                          ? dispute.respondBy.toLocaleString()
                          : "Not set"}
                      </p>
                    </div>
                    <p className="text-muted-foreground text-xs">
                      Stripe dispute ID:{" "}
                      <span className="font-mono text-foreground">
                        {dispute.stripeDisputeId}
                      </span>
                    </p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function SummaryCard({
  label,
  sublabel,
  tone = "default",
  value,
}: {
  readonly label: string;
  readonly sublabel: string;
  readonly tone?: "default" | "warn";
  readonly value: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-card px-4 py-4",
        tone === "warn" &&
          "border-amber-200 bg-amber-50/60 dark:border-amber-950 dark:bg-amber-950/20"
      )}
    >
      <p className="text-muted-foreground text-xs uppercase tracking-wide">{label}</p>
      <p className="mt-2 font-semibold text-2xl tabular-nums">{value}</p>
      <p className="mt-1 text-muted-foreground text-sm">{sublabel}</p>
    </div>
  );
}

function EmptyState({ copy }: { readonly copy: string }) {
  return (
    <div className="rounded-xl border border-dashed p-8 text-center">
      <p className="font-medium text-sm">{copy}</p>
    </div>
  );
}

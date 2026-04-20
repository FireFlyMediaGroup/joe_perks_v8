import {
  ArrowRightIcon,
  CheckCircle2Icon,
  CircleDotIcon,
  CreditCardIcon,
  ExternalLinkIcon,
  MegaphoneIcon,
  StoreIcon,
  TargetIcon,
} from "lucide-react";
import Link from "next/link";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  currency: "USD",
  style: "currency",
});

function formatUsd(cents: number): string {
  return currencyFormatter.format(cents / 100);
}

function formatCount(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

function statusBadgeClass(status: string): string {
  switch (status) {
    case "ACTIVE":
      return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-400";
    case "SUSPENDED":
      return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-400";
    default:
      return "border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400";
  }
}

function cardAccentClass(
  accent: "blue" | "emerald" | "amber" | "zinc"
): string {
  const map = {
    blue: "border-blue-200 bg-blue-50 dark:border-blue-950 dark:bg-blue-950/20",
    emerald:
      "border-emerald-200 bg-emerald-50 dark:border-emerald-950 dark:bg-emerald-950/20",
    amber:
      "border-amber-200 bg-amber-50 dark:border-amber-950 dark:bg-amber-950/20",
    zinc: "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950",
  };
  return map[accent];
}

interface ActiveCampaign {
  readonly goalCents: number;
  readonly itemCount: number;
  readonly name: string;
  readonly orderCount: number;
  readonly status: string;
  readonly totalRaised: number;
}

interface RecentOrder {
  readonly campaignName: string;
  readonly createdAt: string;
  readonly grossAmountCents: number;
  readonly id: string;
  readonly orderNumber: string;
  readonly orgAmountCents: number;
  readonly status: string;
}

interface ActiveDashboardProps {
  readonly activeCampaign: ActiveCampaign | null;
  readonly chargesEnabled: boolean;
  readonly hasCampaign: boolean;
  readonly orderCount: number;
  readonly orgEarningsCents: number;
  readonly orgName: string;
  readonly orgPct: number;
  readonly orgSlug: string | null;
  readonly orgStatus: string;
  readonly payoutsEnabled: boolean;
  readonly recentOrders: RecentOrder[];
  readonly stripeOnboarding: string;
}

export function ActiveDashboard({
  orgName,
  orgSlug,
  orgStatus,
  stripeOnboarding,
  chargesEnabled,
  payoutsEnabled,
  orgPct,
  activeCampaign,
  hasCampaign,
  orderCount,
  orgEarningsCents,
  recentOrders,
}: ActiveDashboardProps) {
  const stripeComplete =
    stripeOnboarding === "COMPLETE" && chargesEnabled && payoutsEnabled;
  const hasActiveCampaign = !!activeCampaign;
  const setupComplete = stripeComplete && hasActiveCampaign;

  const totalRaisedCents = activeCampaign?.totalRaised ?? 0;
  const goalCents = activeCampaign?.goalCents ?? 0;
  const goalProgress =
    goalCents > 0 ? Math.min((totalRaisedCents / goalCents) * 100, 100) : 0;

  const metricCards: Array<{
    accent: "blue" | "emerald" | "amber" | "zinc";
    detail: string;
    title: string;
    value: string;
  }> = [
    {
      accent: "emerald",
      detail: activeCampaign
        ? `From "${activeCampaign.name}"`
        : "No active campaign yet",
      title: "Total Raised",
      value: formatUsd(totalRaisedCents),
    },
    {
      accent: "blue",
      detail: goalCents > 0 ? `Goal: ${formatUsd(goalCents)}` : "No goal set",
      title: "Goal Progress",
      value: goalCents > 0 ? `${goalProgress.toFixed(0)}%` : "—",
    },
    {
      accent: "zinc",
      detail: "All-time orders across your campaigns",
      title: "Total Orders",
      value: formatCount(orderCount),
    },
    {
      accent: "amber",
      detail: "Transferred payouts to your org",
      title: "Org Earnings",
      value: formatUsd(orgEarningsCents),
    },
  ];

  return (
    <main className="mx-auto max-w-5xl p-6 md:p-8">
      <DashboardHeader
        orgName={orgName}
        orgSlug={orgSlug}
        orgStatus={orgStatus}
        stripeComplete={stripeComplete}
      />

      {setupComplete ? null : (
        <SetupChecklist
          hasActiveCampaign={hasActiveCampaign}
          hasCampaign={hasCampaign}
          stripeComplete={stripeComplete}
        />
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((card) => (
          <div
            className={`rounded-xl border p-4 transition ${cardAccentClass(card.accent)}`}
            key={card.title}
          >
            <p className="text-sm text-zinc-600 dark:text-zinc-300">
              {card.title}
            </p>
            <p className="mt-2 font-semibold text-3xl">{card.value}</p>
            <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
              {card.detail}
            </p>
          </div>
        ))}
      </section>

      {activeCampaign && goalCents > 0 ? (
        <GoalProgressBar
          goalCents={goalCents}
          goalProgress={goalProgress}
          totalRaisedCents={totalRaisedCents}
        />
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <CampaignCard activeCampaign={activeCampaign} orgPct={orgPct} />
        <QuickActionsCard orgSlug={orgSlug} />
      </div>

      <RecentOrdersFeed orders={recentOrders} />

      <AccountDetails
        chargesEnabled={chargesEnabled}
        orgName={orgName}
        orgSlug={orgSlug}
        payoutsEnabled={payoutsEnabled}
        stripeOnboarding={stripeOnboarding}
      />
    </main>
  );
}

function DashboardHeader({
  orgName,
  orgSlug,
  orgStatus,
  stripeComplete,
}: {
  orgName: string;
  orgSlug: string | null;
  orgStatus: string;
  stripeComplete: boolean;
}) {
  return (
    <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="space-y-1">
        <p className="font-medium text-muted-foreground text-sm">Dashboard</p>
        <h1 className="font-semibold text-3xl tracking-tight">{orgName}</h1>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 font-medium text-xs ${statusBadgeClass(orgStatus)}`}
          >
            {orgStatus}
          </span>
          {stripeComplete ? (
            <span className="inline-flex items-center gap-1 text-emerald-600 text-xs dark:text-emerald-400">
              <CheckCircle2Icon className="size-3.5" />
              Payments active
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-amber-600 text-xs dark:text-amber-400">
              <CircleDotIcon className="size-3.5" />
              Payments setup required
            </span>
          )}
        </div>
      </div>
      {orgSlug ? (
        <Link
          className="inline-flex min-h-10 items-center gap-2 rounded-full border border-zinc-200 px-4 py-2 font-medium text-sm transition hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
          href="/storefront"
        >
          <StoreIcon className="size-4" />
          View storefront
        </Link>
      ) : null}
    </header>
  );
}

function SetupChecklist({
  stripeComplete,
  hasCampaign,
  hasActiveCampaign,
}: {
  stripeComplete: boolean;
  hasCampaign: boolean;
  hasActiveCampaign: boolean;
}) {
  return (
    <section className="mb-8 rounded-xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="font-semibold text-lg">Getting started</h2>
      <p className="mt-1 text-muted-foreground text-sm">
        Complete these steps to launch your fundraiser.
      </p>
      <ul className="mt-4 space-y-3">
        <SetupStep
          complete={stripeComplete}
          href="/onboarding"
          label="Connect Stripe for payments"
        />
        <SetupStep
          complete={hasCampaign}
          href="/campaign"
          label="Create your first campaign"
        />
        <SetupStep
          complete={hasActiveCampaign}
          href="/campaign"
          label="Activate a campaign to start selling"
        />
      </ul>
    </section>
  );
}

function SetupStep({
  label,
  complete,
  href,
}: {
  label: string;
  complete: boolean;
  href: string;
}) {
  return (
    <li className="flex items-center gap-3">
      {complete ? (
        <CheckCircle2Icon className="size-5 shrink-0 text-emerald-500" />
      ) : (
        <CircleDotIcon className="size-5 shrink-0 text-zinc-400" />
      )}
      {complete ? (
        <span className="text-sm text-zinc-500 line-through">{label}</span>
      ) : (
        <Link className="font-medium text-sm hover:underline" href={href}>
          {label}
        </Link>
      )}
    </li>
  );
}

function GoalProgressBar({
  totalRaisedCents,
  goalCents,
  goalProgress,
}: {
  totalRaisedCents: number;
  goalCents: number;
  goalProgress: number;
}) {
  return (
    <section className="mt-6 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-base">Fundraiser progress</h2>
        <span className="font-medium text-sm">
          {formatUsd(totalRaisedCents)} of {formatUsd(goalCents)}
        </span>
      </div>
      <div className="mt-3 h-3 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all dark:bg-emerald-400"
          style={{ width: `${goalProgress}%` }}
        />
      </div>
      <p className="mt-2 text-muted-foreground text-xs">
        {goalProgress.toFixed(1)}% of goal reached
      </p>
    </section>
  );
}

function CampaignCard({
  activeCampaign,
  orgPct,
}: {
  activeCampaign: ActiveCampaign | null;
  orgPct: number;
}) {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-center gap-2">
        <MegaphoneIcon className="size-5 text-muted-foreground" />
        <h2 className="font-semibold text-lg">Campaign</h2>
      </div>
      {activeCampaign ? (
        <div className="mt-4 space-y-3 text-sm">
          <DetailRow label="Name" value={activeCampaign.name} />
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Status</span>
            <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700 text-xs dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-400">
              {activeCampaign.status}
            </span>
          </div>
          <DetailRow
            label="Products listed"
            value={String(activeCampaign.itemCount)}
          />
          <DetailRow label="Orders" value={String(activeCampaign.orderCount)} />
          <DetailRow label="Your share" value={`${orgPct}%`} />
        </div>
      ) : (
        <p className="mt-4 text-muted-foreground text-sm">
          No active campaign. Create one to start your fundraiser.
        </p>
      )}
      <Link
        className="mt-4 inline-flex items-center gap-1 text-primary text-sm hover:underline"
        href="/campaign"
      >
        {activeCampaign ? "Manage campaign" : "Create campaign"}
        <ArrowRightIcon className="size-3.5" />
      </Link>
    </section>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function QuickActionsCard({ orgSlug }: { orgSlug: string | null }) {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
      <h2 className="font-semibold text-lg">Quick actions</h2>
      <div className="mt-4 space-y-2">
        <QuickAction
          description="Set up or manage Stripe Connect"
          href="/onboarding"
          icon={CreditCardIcon}
          title="Payment settings"
        />
        <QuickAction
          description="Configure your campaign and products"
          href="/campaign"
          icon={MegaphoneIcon}
          title="Campaign management"
        />
        <QuickAction
          description="View fundraiser totals"
          href="/earnings"
          icon={TargetIcon}
          title="Earnings"
        />
        {orgSlug ? (
          <QuickAction
            description="Preview your public storefront"
            href="/storefront"
            icon={ExternalLinkIcon}
            title="Storefront preview"
          />
        ) : null}
      </div>
    </section>
  );
}

function QuickAction({
  title,
  description,
  href,
  icon: Icon,
}: {
  title: string;
  description: string;
  href: string;
  icon: typeof CreditCardIcon;
}) {
  return (
    <Link
      className="flex items-center gap-3 rounded-lg border border-transparent p-3 transition hover:border-zinc-200 hover:bg-zinc-50 dark:hover:border-zinc-700 dark:hover:bg-zinc-900"
      href={href}
    >
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
        <Icon className="size-4 text-zinc-600 dark:text-zinc-400" />
      </div>
      <div className="min-w-0">
        <p className="font-medium text-sm">{title}</p>
        <p className="truncate text-muted-foreground text-xs">{description}</p>
      </div>
    </Link>
  );
}

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

function orderStatusBadge(status: string): {
  className: string;
  label: string;
} {
  switch (status) {
    case "CONFIRMED":
      return {
        className:
          "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-400",
        label: "Confirmed",
      };
    case "SHIPPED":
      return {
        className:
          "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950/30 dark:text-indigo-400",
        label: "Shipped",
      };
    case "DELIVERED":
      return {
        className:
          "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-400",
        label: "Delivered",
      };
    case "CANCELLED":
    case "REFUNDED":
      return {
        className:
          "border-zinc-200 bg-zinc-50 text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400",
        label: status === "CANCELLED" ? "Cancelled" : "Refunded",
      };
    default:
      return {
        className:
          "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-400",
        label: status.charAt(0) + status.slice(1).toLowerCase(),
      };
  }
}

function RecentOrdersFeed({ orders }: { orders: RecentOrder[] }) {
  return (
    <section className="mt-6 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-lg">Recent orders</h2>
          <p className="mt-0.5 text-muted-foreground text-xs">
            Latest activity across your campaigns
          </p>
        </div>
      </div>

      {orders.length === 0 ? (
        <p className="py-6 text-center text-muted-foreground text-sm">
          No orders yet. Orders will appear here once buyers start purchasing
          from your storefront.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-zinc-100 border-b text-left dark:border-zinc-800">
                <th className="pr-4 pb-2 font-medium text-muted-foreground">
                  Order
                </th>
                <th className="hidden pr-4 pb-2 font-medium text-muted-foreground sm:table-cell">
                  Campaign
                </th>
                <th className="pr-4 pb-2 font-medium text-muted-foreground">
                  Status
                </th>
                <th className="pr-4 pb-2 text-right font-medium text-muted-foreground">
                  Total
                </th>
                <th className="pr-4 pb-2 text-right font-medium text-muted-foreground">
                  Your share
                </th>
                <th className="hidden pb-2 text-right font-medium text-muted-foreground md:table-cell">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {orders.map((order) => {
                const badge = orderStatusBadge(order.status);
                return (
                  <tr key={order.id}>
                    <td className="py-3 pr-4 font-mono text-xs">
                      {order.orderNumber}
                    </td>
                    <td className="hidden py-3 pr-4 sm:table-cell">
                      <span className="truncate">{order.campaignName}</span>
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 font-medium text-xs ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-right font-medium">
                      {formatUsd(order.grossAmountCents)}
                    </td>
                    <td className="py-3 pr-4 text-right font-medium text-emerald-600 dark:text-emerald-400">
                      {formatUsd(order.orgAmountCents)}
                    </td>
                    <td className="hidden py-3 text-right text-muted-foreground md:table-cell">
                      {dateTimeFormatter.format(new Date(order.createdAt))}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function AccountDetails({
  orgName,
  orgSlug,
  stripeOnboarding,
  chargesEnabled,
  payoutsEnabled,
}: {
  orgName: string;
  orgSlug: string | null;
  stripeOnboarding: string;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
}) {
  const chargePayoutLabel = `${chargesEnabled ? "Charges on" : "Charges off"} · ${payoutsEnabled ? "Payouts on" : "Payouts off"}`;

  return (
    <section className="mt-6 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
      <h2 className="font-semibold text-lg">Account details</h2>
      <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <dt className="text-muted-foreground">Organization</dt>
          <dd className="mt-0.5 font-medium">{orgName}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Slug</dt>
          <dd className="mt-0.5 font-mono text-xs">{orgSlug ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Stripe onboarding</dt>
          <dd className="mt-0.5 font-medium">{stripeOnboarding}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Charges / payouts</dt>
          <dd className="mt-0.5 font-medium">{chargePayoutLabel}</dd>
        </div>
      </dl>
    </section>
  );
}

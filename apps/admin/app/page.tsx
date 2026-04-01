import { database } from "@joe-perks/db";
import Link from "next/link";

import { DashboardRefreshButton } from "./_components/dashboard-refresh-button";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  currency: "USD",
  style: "currency",
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatCount(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatUsd(cents: number): string {
  return currencyFormatter.format(cents / 100);
}

function formatEventType(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getStartOfDay(input: Date): Date {
  const next = new Date(input);
  next.setHours(0, 0, 0, 0);
  return next;
}

function addDays(input: Date, days: number): Date {
  const next = new Date(input);
  next.setDate(next.getDate() + days);
  return next;
}

function getStartOfMonth(input: Date): Date {
  return new Date(input.getFullYear(), input.getMonth(), 1);
}

function formatDateParam(input: Date): string {
  const year = input.getFullYear();
  const month = String(input.getMonth() + 1).padStart(2, "0");
  const day = String(input.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function buildOrdersHref(from: Date, toExclusive: Date): string {
  const params = new URLSearchParams({
    from: formatDateParam(from),
    to: formatDateParam(addDays(toExclusive, -1)),
  });

  return `/orders?${params.toString()}`;
}

function cardClass(accent: "amber" | "blue" | "emerald" | "rose" | "zinc") {
  if (accent === "amber") {
    return "border-amber-200 bg-amber-50 dark:border-amber-950 dark:bg-amber-950/20";
  }
  if (accent === "blue") {
    return "border-blue-200 bg-blue-50 dark:border-blue-950 dark:bg-blue-950/20";
  }
  if (accent === "emerald") {
    return "border-emerald-200 bg-emerald-50 dark:border-emerald-950 dark:bg-emerald-950/20";
  }
  if (accent === "rose") {
    return "border-rose-200 bg-rose-50 dark:border-rose-950 dark:bg-rose-950/20";
  }

  return "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950";
}

export default async function Home() {
  const now = new Date();
  const todayStart = getStartOfDay(now);
  const tomorrowStart = addDays(todayStart, 1);
  const monthStart = getStartOfMonth(now);
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [
    ordersToday,
    gmvThisMonth,
    platformRevenueThisMonth,
    activeCampaigns,
    activeRoasters,
    pendingPayoutTotals,
    openDisputes,
    recentEvents,
  ] = await Promise.all([
    database.order.count({
      where: {
        createdAt: {
          gte: todayStart,
          lt: tomorrowStart,
        },
      },
    }),
    database.order.aggregate({
      _sum: { grossAmount: true },
      where: {
        createdAt: {
          gte: monthStart,
          lt: nextMonthStart,
        },
        status: { not: "CANCELLED" },
      },
    }),
    database.order.aggregate({
      _sum: { platformAmount: true },
      where: {
        createdAt: {
          gte: monthStart,
          lt: nextMonthStart,
        },
        payoutStatus: "TRANSFERRED",
      },
    }),
    database.campaign.count({
      where: { status: "ACTIVE" },
    }),
    database.roaster.count({
      where: { status: "ACTIVE" },
    }),
    database.order.aggregate({
      _sum: {
        orgAmount: true,
        roasterTotal: true,
      },
      where: {
        payoutEligibleAt: { lte: now },
        payoutStatus: { not: "TRANSFERRED" },
        status: {
          notIn: ["CANCELLED", "REFUNDED"],
        },
      },
    }),
    database.disputeRecord.count({
      where: { outcome: null },
    }),
    database.orderEvent.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        actorType: true,
        createdAt: true,
        eventType: true,
        id: true,
        order: {
          select: {
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
          },
        },
      },
      take: 20,
    }),
  ]);

  const pendingPayoutCents =
    (pendingPayoutTotals._sum.orgAmount ?? 0) +
    (pendingPayoutTotals._sum.roasterTotal ?? 0);

  const cards: Array<{
    accent: "amber" | "blue" | "emerald" | "rose" | "zinc";
    detail: string;
    href?: string;
    title: string;
    value: string;
  }> = [
    {
      accent: "blue",
      detail: "Orders created since midnight.",
      href: buildOrdersHref(todayStart, tomorrowStart),
      title: "Orders Today",
      value: formatCount(ordersToday),
    },
    {
      accent: "emerald",
      detail: "Non-cancelled order volume this month.",
      href: buildOrdersHref(monthStart, nextMonthStart),
      title: "GMV This Month",
      value: formatUsd(gmvThisMonth._sum.grossAmount ?? 0),
    },
    {
      accent: "emerald",
      detail: "Transferred platform share on this month's orders.",
      href: buildOrdersHref(monthStart, nextMonthStart),
      title: "Platform Revenue This Month",
      value: formatUsd(platformRevenueThisMonth._sum.platformAmount ?? 0),
    },
    {
      accent: "zinc",
      detail: "Campaigns currently visible to buyers.",
      title: "Active Campaigns",
      value: formatCount(activeCampaigns),
    },
    {
      accent: "zinc",
      detail: "Roasters in active lifecycle state.",
      title: "Roasters Active",
      value: formatCount(activeRoasters),
    },
    {
      accent: "amber",
      detail: "Eligible now and still awaiting transfer.",
      href: "/orders",
      title: "Pending Payouts ($)",
      value: formatUsd(pendingPayoutCents),
    },
    {
      accent: "rose",
      detail: "Disputes without a final outcome.",
      href: "/disputes",
      title: "Open Disputes",
      value: formatCount(openDisputes),
    },
  ];

  return (
    <main className="mx-auto max-w-7xl p-6 md:p-8">
      <header className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <p className="font-medium text-sm text-zinc-500">Admin dashboard</p>
          <h1 className="font-semibold text-3xl">Operational snapshot</h1>
          <p className="max-w-3xl text-sm text-zinc-600 dark:text-zinc-400">
            Monitor order flow, payout exposure, disputes, and the latest order
            activity from one place.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <DashboardRefreshButton />
          <Link
            className="inline-flex min-h-11 items-center rounded-full bg-zinc-900 px-4 py-2 font-medium text-sm text-white dark:bg-zinc-100 dark:text-zinc-900"
            href="/orders"
          >
            View orders
          </Link>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const content = (
            <>
              <p className="text-sm text-zinc-600 dark:text-zinc-300">
                {card.title}
              </p>
              <p className="mt-3 font-semibold text-3xl">{card.value}</p>
              <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                {card.detail}
              </p>
            </>
          );

          const className = `rounded-xl border p-4 transition ${cardClass(card.accent)} ${
            card.href ? "hover:shadow-sm" : ""
          }`;

          return card.href ? (
            <Link className={className} href={card.href} key={card.title}>
              {content}
            </Link>
          ) : (
            <div className={className} key={card.title}>
              {content}
            </div>
          );
        })}
      </section>

      <section className="mt-8 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold text-xl">Recent order activity</h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Latest 20 `OrderEvent` rows across the platform.
            </p>
          </div>
          <Link className="text-sm text-zinc-600 underline" href="/orders">
            Open order operations
          </Link>
        </div>

        {recentEvents.length === 0 ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            No order events recorded yet.
          </p>
        ) : (
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {recentEvents.map((event) => {
              const orgLabel =
                event.order.campaign.org.application.orgName ??
                event.order.campaign.org.slug;

              return (
                <li
                  className="flex flex-col gap-3 py-4 lg:flex-row lg:items-center lg:justify-between"
                  key={event.id}
                >
                  <div className="space-y-1">
                    <p className="font-medium text-sm text-zinc-900 dark:text-zinc-100">
                      {formatEventType(event.eventType)} for order{" "}
                      <Link
                        className="underline"
                        href={`/orders/${event.order.id}`}
                      >
                        {event.order.orderNumber}
                      </Link>
                    </p>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      {orgLabel} · {event.order.campaign.name} · {event.actorType}
                    </p>
                  </div>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    {dateTimeFormatter.format(event.createdAt)}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}

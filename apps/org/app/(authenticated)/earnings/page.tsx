import { database } from "@joe-perks/db";
import { DollarSignIcon } from "lucide-react";
import Link from "next/link";

import { requireOrgId } from "../_lib/require-org";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  currency: "USD",
  style: "currency",
});

function formatUsd(cents: number): string {
  return currencyFormatter.format(cents / 100);
}

export default async function OrgEarningsPage() {
  const session = await requireOrgId();
  if (!session.ok) {
    return (
      <main className="p-6 md:p-8">
        <h1 className="font-semibold text-2xl">Earnings</h1>
        <p className="mt-2 text-muted-foreground">
          Unable to load earnings. Please sign in again.
        </p>
      </main>
    );
  }

  const [orgEarnings, totalOrders, campaigns] = await Promise.all([
    database.order.aggregate({
      _sum: { orgAmount: true },
      where: {
        campaign: { orgId: session.orgId },
        payoutStatus: "TRANSFERRED",
      },
    }),
    database.order.count({
      where: { campaign: { orgId: session.orgId } },
    }),
    database.campaign.findMany({
      where: { orgId: session.orgId },
      select: {
        id: true,
        name: true,
        status: true,
        totalRaised: true,
        goalCents: true,
        _count: { select: { orders: true } },
      },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const totalEarningsCents = orgEarnings._sum.orgAmount ?? 0;

  return (
    <main className="mx-auto max-w-5xl p-6 md:p-8">
      <header className="mb-8">
        <p className="font-medium text-muted-foreground text-sm">Earnings</p>
        <h1 className="font-semibold text-3xl tracking-tight">
          Fundraiser totals
        </h1>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-950 dark:bg-emerald-950/20">
          <div className="flex items-center gap-2">
            <DollarSignIcon className="size-5 text-emerald-600 dark:text-emerald-400" />
            <p className="text-emerald-700 text-sm dark:text-emerald-300">
              Total org earnings
            </p>
          </div>
          <p className="mt-2 font-semibold text-3xl">
            {formatUsd(totalEarningsCents)}
          </p>
          <p className="mt-1 text-emerald-600 text-xs dark:text-emerald-400">
            From transferred payouts
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            Total orders
          </p>
          <p className="mt-2 font-semibold text-3xl">{totalOrders}</p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Across all campaigns
          </p>
        </div>
      </div>

      {campaigns.length > 0 ? (
        <section className="mt-8 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="font-semibold text-lg">Campaigns</h2>
          <div className="mt-4 divide-y divide-zinc-100 dark:divide-zinc-800">
            {campaigns.map((campaign) => (
              <div
                className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
                key={campaign.id}
              >
                <div>
                  <p className="font-medium text-sm">{campaign.name}</p>
                  <p className="text-muted-foreground text-xs">
                    {campaign._count.orders} orders · {campaign.status}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-sm">
                    {formatUsd(campaign.totalRaised)}
                  </p>
                  {campaign.goalCents ? (
                    <p className="text-muted-foreground text-xs">
                      of {formatUsd(campaign.goalCents)} goal
                    </p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <section className="mt-8 rounded-xl border border-zinc-200 bg-white p-5 text-center dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-muted-foreground text-sm">
            No campaigns yet.{" "}
            <Link className="text-primary hover:underline" href="/campaign">
              Create your first campaign
            </Link>{" "}
            to start earning.
          </p>
        </section>
      )}
    </main>
  );
}

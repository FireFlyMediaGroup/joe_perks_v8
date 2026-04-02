import { database } from "@joe-perks/db";
import {
  ExternalLinkIcon,
  Package,
  ShoppingBag,
  StoreIcon,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { env } from "@/env";

import { requireOrgId } from "../_lib/require-org";
import { CopyUrlButton } from "./_components/copy-url-button";

function formatDollars(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    style: "currency",
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

export default async function OrgStorefrontPage() {
  const session = await requireOrgId();
  if (!session.ok) {
    return (
      <main className="p-6 md:p-8">
        <h1 className="font-semibold text-2xl">Storefront</h1>
        <p className="mt-2 text-muted-foreground">
          Unable to load storefront. Please sign in again.
        </p>
      </main>
    );
  }

  const org = await database.org.findUnique({
    where: { id: session.orgId },
    select: {
      slug: true,
      status: true,
      application: { select: { orgName: true } },
      campaigns: {
        where: { status: "ACTIVE" },
        select: {
          id: true,
          name: true,
          goalCents: true,
          totalRaised: true,
          items: { select: { id: true } },
        },
        take: 1,
      },
    },
  });

  if (!org) {
    return (
      <main className="p-6 md:p-8">
        <h1 className="font-semibold text-2xl">Storefront</h1>
        <p className="mt-2 text-muted-foreground">Organization not found.</p>
      </main>
    );
  }

  const webUrl = env.NEXT_PUBLIC_WEB_URL ?? "http://localhost:3000";
  const storefrontUrl = `${webUrl}/${org.slug}`;
  const activeCampaign = org.campaigns[0] ?? null;

  const orderStats = activeCampaign
    ? await database.order.aggregate({
        where: {
          campaignId: activeCampaign.id,
          status: { not: "CANCELLED" },
        },
        _count: { id: true },
        _sum: { orgAmount: true },
      })
    : null;

  const orderCount = orderStats?._count?.id ?? 0;
  const totalOrgEarnings = orderStats?._sum?.orgAmount ?? 0;

  return (
    <main className="mx-auto max-w-5xl p-6 md:p-8">
      <header className="mb-8">
        <p className="font-medium text-muted-foreground text-sm">Storefront</p>
        <h1 className="font-semibold text-3xl tracking-tight">
          {org.application.orgName ?? org.slug}
        </h1>
      </header>

      <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
            <StoreIcon className="size-5 text-zinc-600 dark:text-zinc-400" />
          </div>
          <div>
            <h2 className="font-semibold text-lg">Public storefront</h2>
            <p className="text-muted-foreground text-sm">
              This is what buyers see when they visit your fundraiser.
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900">
          <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
            Shareable link
          </p>
          <div className="mt-1.5 flex items-center gap-2">
            <code className="min-w-0 flex-1 truncate font-mono text-sm text-zinc-700 dark:text-zinc-300">
              {storefrontUrl}
            </code>
            <CopyUrlButton url={storefrontUrl} />
          </div>
        </div>

        <div className="mt-6 space-y-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Status</span>
            <span className="font-medium">
              {org.status === "ACTIVE" ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 font-medium text-emerald-800 text-xs dark:bg-emerald-900/30 dark:text-emerald-300">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  Live
                </span>
              ) : (
                org.status
              )}
            </span>
          </div>
          {activeCampaign ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Active campaign</span>
                <span className="font-medium">{activeCampaign.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Products listed</span>
                <span className="font-medium">
                  {activeCampaign.items.length}
                </span>
              </div>
            </>
          ) : (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800 text-sm dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
              No active campaign. Your storefront won&apos;t display products
              until you{" "}
              <Link className="font-medium underline" href="/campaign">
                activate a campaign
              </Link>
              .
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <a
            className="inline-flex min-h-10 items-center gap-2 rounded-full bg-zinc-900 px-5 py-2 font-medium text-sm text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            href={storefrontUrl}
            rel="noopener noreferrer"
            target="_blank"
          >
            <ExternalLinkIcon className="size-4" />
            Open storefront
          </a>
          <Link
            className="inline-flex min-h-10 items-center gap-2 rounded-full border border-zinc-200 px-5 py-2 font-medium text-sm transition hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
            href="/campaign"
          >
            Manage campaign
          </Link>
        </div>
      </section>

      {activeCampaign ? (
        <section className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex items-center gap-2 text-muted-foreground">
              <ShoppingBag className="size-4" />
              <span className="font-medium text-xs uppercase tracking-wide">
                Orders
              </span>
            </div>
            <p className="mt-2 font-semibold text-3xl">{orderCount}</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex items-center gap-2 text-muted-foreground">
              <TrendingUp className="size-4" />
              <span className="font-medium text-xs uppercase tracking-wide">
                Fundraiser total
              </span>
            </div>
            <p className="mt-2 font-semibold text-3xl">
              {formatDollars(totalOrgEarnings)}
            </p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Package className="size-4" />
              <span className="font-medium text-xs uppercase tracking-wide">
                Products
              </span>
            </div>
            <p className="mt-2 font-semibold text-3xl">
              {activeCampaign.items.length}
            </p>
            {activeCampaign.goalCents ? (
              <div className="mt-3">
                <div className="mb-1 flex justify-between text-muted-foreground text-xs">
                  <span>Goal progress</span>
                  <span>
                    {Math.min(
                      100,
                      Math.round(
                        (activeCampaign.totalRaised /
                          activeCampaign.goalCents) *
                          100
                      )
                    )}
                    %
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-[width] duration-500"
                    style={{
                      width: `${Math.min(100, (activeCampaign.totalRaised / activeCampaign.goalCents) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}
    </main>
  );
}

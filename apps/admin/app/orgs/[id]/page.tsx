import {
  database,
  getSuspensionReasonCategoryFromAction,
  getSuspensionReasonLabel,
} from "@joe-perks/db";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AccountLifecycleControls } from "../../_components/account-lifecycle-controls";
import { getAccountReactivationReadiness } from "../../_lib/account-reactivation";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminOrgDetailPage({ params }: PageProps) {
  const { id } = await params;

  const org = await database.org.findUnique({
    include: {
      application: true,
    },
    where: { id },
  });

  if (!org) {
    notFound();
  }

  const [
    activeCampaignCount,
    openDisputesCount,
    openOrderCount,
    recentActions,
    recentOrders,
  ] = await Promise.all([
    database.campaign.count({
      where: { orgId: org.id, status: "ACTIVE" },
    }),
    database.disputeRecord.count({
      where: {
        order: { campaign: { orgId: org.id } },
        outcome: null,
      },
    }),
    database.order.count({
      where: {
        campaign: { orgId: org.id },
        status: { in: ["CONFIRMED", "SHIPPED"] },
      },
    }),
    database.adminActionLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      where: {
        targetId: org.id,
        targetType: "ORG",
      },
    }),
    database.order.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        orderNumber: true,
        payoutStatus: true,
        status: true,
      },
      take: 5,
      where: { campaign: { orgId: org.id } },
    }),
  ]);

  const readiness = getAccountReactivationReadiness({
    chargesEnabled: org.chargesEnabled,
    openDisputesCount,
    openOrderCount,
    payoutsEnabled: org.payoutsEnabled,
    stripeOnboarding: org.stripeOnboarding,
    unsettledDebtCount: 0,
  });

  const latestSuspension = recentActions.find((action) =>
    ["ORG_SUSPENDED"].includes(action.actionType)
  );
  const latestReactivationRequest = recentActions.find(
    (action) => action.actionType === "ORG_REACTIVATION_REQUESTED"
  );
  const suspensionReasonLabel = latestSuspension
    ? getSuspensionReasonLabel(
        getSuspensionReasonCategoryFromAction(latestSuspension)
      )
    : "Account review";

  return (
    <main className="mx-auto max-w-6xl p-6 md:p-8">
      <Link
        className="font-medium text-sm text-zinc-600 underline-offset-4 hover:text-zinc-900 hover:underline"
        href="/orgs"
      >
        ← Back to organizations
      </Link>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-semibold text-3xl">
            {org.application.orgName || org.slug}
          </h1>
          <p className="mt-1 text-sm text-zinc-600">{org.email}</p>
        </div>
        <span className="rounded-full bg-zinc-100 px-3 py-1 font-medium text-xs">
          {org.status}
        </span>
      </div>

      <section className="mt-8 grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-zinc-200 p-4">
          <p className="text-sm text-zinc-500">Active campaigns</p>
          <p className="mt-1 font-semibold text-2xl">{activeCampaignCount}</p>
        </div>
        <div className="rounded-lg border border-zinc-200 p-4">
          <p className="text-sm text-zinc-500">Open disputes</p>
          <p className="mt-1 font-semibold text-2xl">{openDisputesCount}</p>
        </div>
        <div className="rounded-lg border border-zinc-200 p-4">
          <p className="text-sm text-zinc-500">Open orders</p>
          <p className="mt-1 font-semibold text-2xl">{openOrderCount}</p>
        </div>
        <div className="rounded-lg border border-zinc-200 p-4">
          <p className="text-sm text-zinc-500">Stripe</p>
          <p className="mt-1 font-semibold text-lg">{org.stripeOnboarding}</p>
          <p className="mt-1 text-xs text-zinc-500">
            Charges {org.chargesEnabled ? "on" : "off"} · Payouts{" "}
            {org.payoutsEnabled ? "on" : "off"}
          </p>
        </div>
      </section>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="space-y-6">
          <div className="rounded-lg border border-zinc-200 bg-white p-5">
            <h2 className="font-semibold text-lg">Profile</h2>
            <dl className="mt-4 grid gap-4 text-sm md:grid-cols-2">
              <div>
                <dt className="text-zinc-500">Organization name</dt>
                <dd className="font-medium">{org.application.orgName}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Contact name</dt>
                <dd className="font-medium">{org.application.contactName}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Slug</dt>
                <dd className="font-medium">{org.slug}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Desired org share</dt>
                <dd className="font-medium">
                  {(org.application.desiredOrgPct * 100).toFixed(1)}%
                </dd>
              </div>
              <div>
                <dt className="text-zinc-500">Phone</dt>
                <dd className="font-medium">{org.application.phone ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Updated</dt>
                <dd className="font-medium">
                  {org.updatedAt.toLocaleString()}
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white p-5">
            <h2 className="font-semibold text-lg">Reactivation readiness</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-zinc-200 p-4">
                <p className="font-medium text-sm">Operational blockers</p>
                {readiness.blockers.length === 0 ? (
                  <p className="mt-2 text-emerald-700 text-sm">
                    None detected.
                  </p>
                ) : (
                  <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-zinc-700">
                    {readiness.blockers.map((blocker) => (
                      <li key={blocker}>{blocker}</li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="rounded-lg border border-zinc-200 p-4">
                <p className="font-medium text-sm">Stripe prerequisites</p>
                {readiness.stripeRequirements.length === 0 ? (
                  <p className="mt-2 text-emerald-700 text-sm">
                    Ready for ACTIVE.
                  </p>
                ) : (
                  <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-zinc-700">
                    {readiness.stripeRequirements.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                )}
                <p className="mt-3 text-xs text-zinc-500">
                  If reactivated now, next status will be {readiness.nextStatus}
                  .
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white p-5">
            <h2 className="font-semibold text-lg">Recent orders</h2>
            {recentOrders.length === 0 ? (
              <p className="mt-3 text-sm text-zinc-600">No orders yet.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {recentOrders.map((order) => (
                  <div
                    className="flex flex-col gap-2 rounded-lg border border-zinc-200 p-3 sm:flex-row sm:items-center sm:justify-between"
                    key={order.id}
                  >
                    <div>
                      <p className="font-medium text-sm">{order.orderNumber}</p>
                      <p className="text-xs text-zinc-500">
                        {order.status} · payout {order.payoutStatus}
                      </p>
                    </div>
                    <Link
                      className="text-sm underline"
                      href={`/orders/${order.id}`}
                    >
                      View order
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <aside className="space-y-6">
          <div className="rounded-lg border border-zinc-200 bg-white p-5">
            <h2 className="font-semibold text-lg">Lifecycle action</h2>
            <p className="mt-2 text-sm text-zinc-600">
              Latest suspension reason: {suspensionReasonLabel}
            </p>
            <div className="mt-4">
              <AccountLifecycleControls
                blockers={readiness.blockers}
                defaultCanReactivate={readiness.defaultCanReactivate}
                nextStatus={readiness.nextStatus}
                status={org.status}
                stripeRequirements={readiness.stripeRequirements}
                targetId={org.id}
                targetType="ORG"
              />
            </div>
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white p-5">
            <h2 className="font-semibold text-lg">Latest request</h2>
            {latestReactivationRequest ? (
              <>
                <p className="mt-2 text-sm text-zinc-600">
                  {latestReactivationRequest.createdAt.toLocaleString()} by{" "}
                  {latestReactivationRequest.actorLabel}
                </p>
                <p className="mt-3 whitespace-pre-wrap text-sm text-zinc-800">
                  {latestReactivationRequest.note ?? "No note provided."}
                </p>
              </>
            ) : (
              <p className="mt-2 text-sm text-zinc-600">
                No reactivation request has been submitted yet.
              </p>
            )}
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white p-5">
            <h2 className="font-semibold text-lg">Recent admin activity</h2>
            <div className="mt-4 space-y-3">
              {recentActions.length === 0 ? (
                <p className="text-sm text-zinc-600">
                  No admin actions logged.
                </p>
              ) : (
                recentActions.map((action) => (
                  <div
                    className="rounded-lg border border-zinc-200 p-3"
                    key={action.id}
                  >
                    <p className="font-medium text-sm">{action.actionType}</p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {action.createdAt.toLocaleString()} · {action.actorLabel}
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-700">
                      {action.note ?? "No note."}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}

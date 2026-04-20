import {
  database,
  getSuspensionReasonCategoryFromAction,
  getSuspensionReasonLabel,
} from "@joe-perks/db";
import { auth } from "@repo/auth/server";

import { ActiveDashboard } from "./_components/active-dashboard";
import { SuspendedDashboard } from "./_components/suspended-dashboard";

export default async function OrgDashboardPage() {
  const { userId } = await auth();
  const dbUser = userId
    ? await database.user.findUnique({
        where: { externalAuthId: userId },
        select: {
          email: true,
          org: {
            include: {
              application: {
                select: { orgName: true, desiredOrgPct: true },
              },
            },
          },
          orgId: true,
          role: true,
        },
      })
    : null;

  const org = dbUser?.org ?? null;

  if (org?.status === "SUSPENDED") {
    const [latestSuspension, latestRequest] = await Promise.all([
      database.adminActionLog.findFirst({
        orderBy: { createdAt: "desc" },
        where: {
          actionType: "ORG_SUSPENDED",
          targetId: org.id,
          targetType: "ORG",
        },
      }),
      database.adminActionLog.findFirst({
        orderBy: { createdAt: "desc" },
        where: {
          actionType: "ORG_REACTIVATION_REQUESTED",
          targetId: org.id,
          targetType: "ORG",
        },
      }),
    ]);

    const reasonLabel = latestSuspension
      ? getSuspensionReasonLabel(
          getSuspensionReasonCategoryFromAction(latestSuspension)
        )
      : "Account review";

    return (
      <SuspendedDashboard
        chargesEnabled={org.chargesEnabled}
        latestRequestDate={latestRequest?.createdAt ?? null}
        orgName={org.application.orgName || org.slug}
        payoutsEnabled={org.payoutsEnabled}
        reasonLabel={reasonLabel}
        status={org.status}
        stripeOnboarding={org.stripeOnboarding}
      />
    );
  }

  const orgId = dbUser?.orgId;

  const [campaigns, orderCount, orgEarnings, recentOrders] = orgId
    ? await Promise.all([
        database.campaign.findMany({
          where: { orgId },
          include: {
            items: true,
            _count: { select: { orders: true } },
          },
          orderBy: { updatedAt: "desc" },
        }),
        database.order.count({
          where: { campaign: { orgId } },
        }),
        database.order.aggregate({
          _sum: { orgAmount: true },
          where: {
            campaign: { orgId },
            payoutStatus: "TRANSFERRED",
          },
        }),
        database.order.findMany({
          where: { campaign: { orgId } },
          orderBy: { createdAt: "desc" },
          take: 15,
          select: {
            id: true,
            orderNumber: true,
            status: true,
            grossAmount: true,
            orgAmount: true,
            createdAt: true,
            campaign: { select: { name: true } },
          },
        }),
      ])
    : [[], 0, { _sum: { orgAmount: null } }, []];

  const activeCampaign = campaigns.find((c) => c.status === "ACTIVE") ?? null;

  return (
    <ActiveDashboard
      activeCampaign={
        activeCampaign
          ? {
              goalCents: activeCampaign.goalCents ?? 0,
              itemCount: activeCampaign.items.length,
              name: activeCampaign.name,
              orderCount: activeCampaign._count.orders,
              status: activeCampaign.status,
              totalRaised: activeCampaign.totalRaised,
            }
          : null
      }
      chargesEnabled={org?.chargesEnabled ?? false}
      hasCampaign={campaigns.length > 0}
      orderCount={orderCount}
      orgEarningsCents={orgEarnings._sum.orgAmount ?? 0}
      orgName={org?.application.orgName ?? org?.slug ?? "Your organization"}
      orgPct={(org?.application.desiredOrgPct ?? 0) * 100}
      orgSlug={org?.slug ?? null}
      orgStatus={org?.status ?? "UNKNOWN"}
      payoutsEnabled={org?.payoutsEnabled ?? false}
      recentOrders={recentOrders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        grossAmountCents: o.grossAmount,
        orgAmountCents: o.orgAmount,
        createdAt: o.createdAt.toISOString(),
        campaignName: o.campaign.name,
      }))}
      stripeOnboarding={org?.stripeOnboarding ?? "NOT_STARTED"}
    />
  );
}

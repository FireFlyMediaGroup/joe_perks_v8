import { database } from "@joe-perks/db";

/**
 * Org-scoped order reads.
 *
 * Orders have no direct `orgId` — tenant isolation goes through the campaign
 * relation (`where: { campaign: { orgId } }`). Centralizing the org-scoped order
 * reads here keeps that scope in one place that is unit-tested for cross-tenant
 * isolation (see `../__tests__/org-tenant-isolation.test.ts`). Callers pass the
 * orgId resolved from the session via `requireOrgId()` — never from user input.
 */

/** Total org earnings (sum of `orgAmount`) from transferred payouts, in cents. */
export async function getOrgEarningsCents(orgId: string): Promise<number> {
  const result = await database.order.aggregate({
    _sum: { orgAmount: true },
    where: { campaign: { orgId }, payoutStatus: "TRANSFERRED" },
  });
  return result._sum.orgAmount ?? 0;
}

/** Count of all orders across the org's campaigns. */
export function getOrgOrderCount(orgId: string): Promise<number> {
  return database.order.count({
    where: { campaign: { orgId } },
  });
}

/** Most recent orders across the org's campaigns (newest first). */
export function getOrgRecentOrders(orgId: string, limit = 15) {
  return database.order.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      campaign: { select: { name: true } },
      createdAt: true,
      grossAmount: true,
      id: true,
      orderNumber: true,
      orgAmount: true,
      status: true,
    },
    take: limit,
    where: { campaign: { orgId } },
  });
}

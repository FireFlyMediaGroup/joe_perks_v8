/**
 * Tenant isolation — org portal.
 *
 * Joe Perks enforces org tenant isolation at the APPLICATION layer: every
 * org-scoped query carries a `where` constrained to the session's orgId — there
 * is no Postgres row-level security. This test guards that invariant on the
 * cleanly-importable server actions: an org acting on another org's campaign is
 * filtered out by the orgId scope (sees "not found"), while it can still reach
 * its own; roaster-partnership access is scoped to the acting org's application.
 *
 * The mocked Prisma layer faithfully emulates `where` filtering for the queried
 * fields, so a regression that drops `orgId` from a scoped `where` clause fails
 * this test (org A would suddenly match org B's row).
 *
 * Covers two surfaces:
 *   1. Campaign mutations (server actions) — an org cannot activate/modify
 *      another org's campaign; roaster-partnership lookups are app-scoped.
 *   2. Order/payout READS (`_lib/org-orders.ts`, used by the dashboard/earnings
 *      RSCs) — earnings, order count, and recent orders return only the acting
 *      org's data via `where: { campaign: { orgId } }`.
 */
import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  database: {
    campaign: { findFirst: vi.fn(), update: vi.fn() },
    order: { aggregate: vi.fn(), count: vi.fn(), findMany: vi.fn() },
    org: { findUnique: vi.fn() },
    product: { findMany: vi.fn() },
    roasterOrgRequest: { findFirst: vi.fn() },
    roasterShippingRate: { count: vi.fn() },
  },
  requireOrgId: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("@joe-perks/db", () => ({ database: mocks.database }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("../_lib/require-org", () => ({ requireOrgId: mocks.requireOrgId }));

import {
  getOrgEarningsCents,
  getOrgOrderCount,
  getOrgRecentOrders,
} from "../_lib/org-orders";
import {
  activateCampaign,
  saveCampaignDraft,
} from "../campaign/_actions/campaign-actions";

const ORG_A = "org-a";
const ORG_B = "org-b";

// In-memory campaign table emulating Prisma `where` filtering for the fields
// activateCampaign queries (id, orgId, status).
interface CampaignRow {
  id: string;
  items: { productId: string }[];
  orgId: string;
  status: string;
}

let campaignRows: CampaignRow[] = [];

function findFirstCampaign(args: {
  include?: { items?: boolean };
  where: { id?: string; orgId?: string; status?: string };
}) {
  const { where } = args;
  const row = campaignRows.find(
    (r) =>
      (where.id === undefined || r.id === where.id) &&
      (where.orgId === undefined || r.orgId === where.orgId) &&
      (where.status === undefined || r.status === where.status)
  );
  if (!row) {
    return null;
  }
  return args.include?.items
    ? { ...row }
    : { id: row.id, orgId: row.orgId, status: row.status };
}

describe("org tenant isolation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireOrgId.mockResolvedValue({ ok: true, orgId: ORG_A });
    mocks.database.org.findUnique.mockResolvedValue({ status: "ACTIVE" });
    mocks.database.campaign.findFirst.mockImplementation(findFirstCampaign);
    mocks.database.campaign.update.mockResolvedValue({});
    mocks.database.product.findMany.mockResolvedValue([
      { id: "prod-a", roasterId: "roaster-a" },
    ]);
    mocks.database.roasterShippingRate.count.mockResolvedValue(1);

    campaignRows = [
      {
        id: "camp-a",
        items: [{ productId: "prod-a" }],
        orgId: ORG_A,
        status: "DRAFT",
      },
      {
        id: "camp-b",
        items: [{ productId: "prod-b" }],
        orgId: ORG_B,
        status: "DRAFT",
      },
    ];
  });

  test("org A cannot activate org B's campaign — scoped out, returns not found", async () => {
    const result = await activateCampaign("camp-b");

    expect(result).toEqual({
      error: "Draft campaign not found.",
      success: false,
    });
    // The lookup must be constrained to the acting org, never the target's.
    const call = mocks.database.campaign.findFirst.mock.calls[0][0];
    expect(call.where.orgId).toBe(ORG_A);
    expect(call.where.id).toBe("camp-b");
    // It must never mutate another org's campaign.
    expect(mocks.database.campaign.update).not.toHaveBeenCalled();
  });

  test("org A can activate its own campaign — positive control", async () => {
    const result = await activateCampaign("camp-a");

    expect(result).toEqual({ success: true });
    expect(mocks.database.campaign.update).toHaveBeenCalledWith({
      data: { status: "ACTIVE" },
      where: { id: "camp-a" },
    });
  });

  test("saveCampaignDraft scopes roaster-partnership lookup to the acting org's application", async () => {
    mocks.database.org.findUnique.mockResolvedValue({
      application: { desiredOrgPct: 0.15 },
      applicationId: "app-a",
      id: ORG_A,
      status: "ACTIVE",
    });
    mocks.database.roasterOrgRequest.findFirst.mockResolvedValue(null);

    const result = await saveCampaignDraft({
      items: [{ variantId: "var-1" }],
      name: "Fall Fundraiser",
    });

    // Returns early because org A has no approved partnership of its own.
    expect(result).toEqual({
      error: "No approved roaster partnership found.",
      success: false,
    });
    // Org loaded by the session org id; partnership scoped to that org's application.
    expect(mocks.database.org.findUnique).toHaveBeenCalledWith({
      include: { application: true },
      where: { id: ORG_A },
    });
    const reqCall = mocks.database.roasterOrgRequest.findFirst.mock.calls[0][0];
    expect(reqCall.where.applicationId).toBe("app-a");
  });
});

// In-memory order table emulating Prisma `where` filtering for org-scoped order
// READS. Orders isolate via `where: { campaign: { orgId } }` (no direct orgId).
interface OrderRow {
  createdAt: Date;
  grossAmount: number;
  id: string;
  orderNumber: string;
  orgAmount: number;
  orgId: string;
  payoutStatus: string;
  status: string;
}

let orderRows: OrderRow[] = [];

function matchOrder(
  row: OrderRow,
  where: { campaign?: { orgId?: string }; payoutStatus?: string } | undefined
): boolean {
  if (
    where?.campaign?.orgId !== undefined &&
    row.orgId !== where.campaign.orgId
  ) {
    return false;
  }
  if (
    where?.payoutStatus !== undefined &&
    row.payoutStatus !== where.payoutStatus
  ) {
    return false;
  }
  return true;
}

describe("org order reads — tenant isolation", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    orderRows = [
      {
        createdAt: new Date("2026-06-01T00:00:00Z"),
        grossAmount: 11_000,
        id: "ord-a",
        orderNumber: "JP-00001",
        orgAmount: 1500,
        orgId: ORG_A,
        payoutStatus: "TRANSFERRED",
        status: "DELIVERED",
      },
      {
        createdAt: new Date("2026-06-02T00:00:00Z"),
        grossAmount: 99_999,
        id: "ord-b",
        orderNumber: "JP-09999",
        orgAmount: 9999,
        orgId: ORG_B,
        payoutStatus: "TRANSFERRED",
        status: "DELIVERED",
      },
    ];

    mocks.database.order.aggregate.mockImplementation(
      (args: { where?: Parameters<typeof matchOrder>[1] }) => {
        const sum = orderRows
          .filter((r) => matchOrder(r, args.where))
          .reduce((acc, r) => acc + r.orgAmount, 0);
        return { _sum: { orgAmount: sum === 0 ? null : sum } };
      }
    );
    mocks.database.order.count.mockImplementation(
      (args: { where?: Parameters<typeof matchOrder>[1] }) =>
        orderRows.filter((r) => matchOrder(r, args.where)).length
    );
    mocks.database.order.findMany.mockImplementation(
      (args: { where?: Parameters<typeof matchOrder>[1] }) =>
        orderRows
          .filter((r) => matchOrder(r, args.where))
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    );
  });

  test("getOrgEarningsCents sums only the acting org's transferred payouts", async () => {
    const cents = await getOrgEarningsCents(ORG_A);

    // Org A's 1500 only — never org B's 9999.
    expect(cents).toBe(1500);
    const call = mocks.database.order.aggregate.mock.calls[0][0];
    expect(call.where.campaign.orgId).toBe(ORG_A);
    expect(call.where.payoutStatus).toBe("TRANSFERRED");
  });

  test("getOrgOrderCount counts only the acting org's orders", async () => {
    expect(await getOrgOrderCount(ORG_A)).toBe(1);
    const call = mocks.database.order.count.mock.calls[0][0];
    expect(call.where.campaign.orgId).toBe(ORG_A);
  });

  test("getOrgRecentOrders returns only the acting org's orders", async () => {
    const rows = await getOrgRecentOrders(ORG_A);

    // Only org A's order — org B's "ord-b" / JP-09999 must not appear.
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe("ord-a");
    expect(rows[0].orderNumber).toBe("JP-00001");
    const call = mocks.database.order.findMany.mock.calls[0][0];
    expect(call.where.campaign.orgId).toBe(ORG_A);
  });

  test("an org with no orders earns 0 and sees nothing (no cross-tenant bleed)", async () => {
    expect(await getOrgEarningsCents("org-empty")).toBe(0);
    expect(await getOrgOrderCount("org-empty")).toBe(0);
    expect(await getOrgRecentOrders("org-empty")).toHaveLength(0);
  });
});

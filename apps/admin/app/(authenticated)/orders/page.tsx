import type { OrderStatus, Prisma } from "@joe-perks/db";

import { database } from "@joe-perks/db";
import Link from "next/link";

import { OrderList } from "./_components/order-list";
import { getOrderSlaState } from "./_lib/sla";

const PAGE_SIZE = 50;

function parseStatusFilter(raw: string | undefined): OrderStatus | "ALL" {
  if (raw === "ALL") {
    return "ALL";
  }
  if (
    raw === "CANCELLED" ||
    raw === "CONFIRMED" ||
    raw === "DELIVERED" ||
    raw === "PENDING" ||
    raw === "REFUNDED" ||
    raw === "SHIPPED"
  ) {
    return raw;
  }
  return "ALL";
}

function parsePage(raw: string | undefined): number {
  const parsed = Number.parseInt(raw ?? "", 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1;
  }

  return parsed;
}

function parseDateStart(raw: string | undefined): Date | null {
  if (!raw) {
    return null;
  }

  const parsed = new Date(`${raw}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseDateEndExclusive(raw: string | undefined): Date | null {
  const start = parseDateStart(raw);
  if (!start) {
    return null;
  }

  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return end;
}

function combineWhere(
  ...clauses: Prisma.OrderWhereInput[]
): Prisma.OrderWhereInput {
  const filtered = clauses.filter((clause) => Object.keys(clause).length > 0);
  if (filtered.length === 0) {
    return {};
  }

  return { AND: filtered };
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{
    from?: string;
    org?: string;
    page?: string;
    roaster?: string;
    status?: string;
    to?: string;
  }>;
}) {
  const sp = await searchParams;
  const currentPage = parsePage(sp.page);
  const fromDate = parseDateStart(sp.from);
  const orgFilter = sp.org?.trim() ?? "";
  const roasterFilter = sp.roaster?.trim() ?? "";
  const statusFilter = parseStatusFilter(sp.status);
  const toDateExclusive = parseDateEndExclusive(sp.to);

  const baseWhere = combineWhere(
    roasterFilter
      ? {
          roaster: {
            is: {
              OR: [
                { email: { contains: roasterFilter, mode: "insensitive" } },
                {
                  application: {
                    is: {
                      businessName: {
                        contains: roasterFilter,
                        mode: "insensitive",
                      },
                    },
                  },
                },
              ],
            },
          },
        }
      : {},
    orgFilter
      ? {
          campaign: {
            is: {
              OR: [
                { name: { contains: orgFilter, mode: "insensitive" } },
                {
                  org: {
                    is: {
                      slug: { contains: orgFilter, mode: "insensitive" },
                    },
                  },
                },
                {
                  org: {
                    is: {
                      application: {
                        is: {
                          orgName: {
                            contains: orgFilter,
                            mode: "insensitive",
                          },
                        },
                      },
                    },
                  },
                },
              ],
            },
          },
        }
      : {},
    fromDate || toDateExclusive
      ? {
          createdAt: {
            ...(fromDate ? { gte: fromDate } : {}),
            ...(toDateExclusive ? { lt: toDateExclusive } : {}),
          },
        }
      : {}
  );

  const listWhere = combineWhere(
    baseWhere,
    statusFilter === "ALL" ? {} : { status: statusFilter }
  );

  const [settings, totalCount, summaryRows] = await Promise.all([
    database.platformSettings.findUniqueOrThrow({
      where: { id: "singleton" },
    }),
    database.order.count({ where: listWhere }),
    database.order.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        fulfillBy: true,
        status: true,
      },
      where: combineWhere(baseWhere, { status: "CONFIRMED" }),
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const page = Math.min(currentPage, totalPages);

  const rows = await database.order.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      buyer: { select: { name: true } },
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
      createdAt: true,
      carrier: true,
      dispute: {
        select: {
          outcome: true,
          respondBy: true,
        },
      },
      fulfillBy: true,
      id: true,
      orderNumber: true,
      payoutStatus: true,
      roaster: {
        select: {
          application: { select: { businessName: true } },
          email: true,
        },
      },
      shippedAt: true,
      status: true,
      trackingNumber: true,
    },
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    where: listWhere,
  });

  const orders = rows.map((o) => ({
    buyerName: o.buyer?.name ?? null,
    campaignName: o.campaign.name,
    carrier: o.carrier,
    disputeRespondBy: o.dispute?.respondBy ?? null,
    hasOpenDispute: o.dispute != null && o.dispute.outcome == null,
    id: o.id,
    orderDate: o.createdAt,
    orderNumber: o.orderNumber,
    orgLabel: o.campaign.org.application.orgName ?? o.campaign.org.slug,
    payoutStatus: o.payoutStatus,
    roasterLabel: o.roaster.application.businessName ?? o.roaster.email,
    shippedAt: o.shippedAt,
    sla: getOrderSlaState({
      fulfillBy: o.fulfillBy,
      settings,
      status: o.status,
    }),
    status: o.status,
    trackingNumber: o.trackingNumber,
  }));

  const slaSummary = summaryRows.reduce(
    (summary, row) => {
      const state = getOrderSlaState({
        fulfillBy: row.fulfillBy,
        settings,
        status: row.status,
      });
      if (state.summaryBucket === "critical") {
        summary.critical += 1;
      }
      if (state.summaryBucket === "on_track") {
        summary.onTrack += 1;
      }
      if (state.summaryBucket === "warning") {
        summary.warning += 1;
      }

      return summary;
    },
    { critical: 0, onTrack: 0, warning: 0 }
  );

  const pageStart = totalCount === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const pageEnd = totalCount === 0 ? 0 : Math.min(page * PAGE_SIZE, totalCount);

  return (
    <div className="mx-auto max-w-7xl p-6 md:p-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-semibold text-3xl">Orders</h1>
          <p className="mt-1 max-w-3xl text-sm text-zinc-600">
            Monitor active fulfillment SLAs, review payout and dispute context,
            and use the detail page for `Mark Delivered` or `Contact Roaster`.
          </p>
        </div>
        <Link className="text-sm text-zinc-600 underline" href="/">
          Home
        </Link>
      </div>
      <OrderList
        currentPage={page}
        filters={{
          from: sp.from ?? "",
          org: orgFilter,
          roaster: roasterFilter,
          to: sp.to ?? "",
        }}
        orders={orders}
        pageEnd={pageEnd}
        pageStart={pageStart}
        slaSummary={slaSummary}
        statusFilter={statusFilter}
        totalCount={totalCount}
        totalPages={totalPages}
      />
    </div>
  );
}

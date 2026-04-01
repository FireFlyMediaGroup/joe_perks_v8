import type { OrderStatus } from "@joe-perks/db";

import { database } from "@joe-perks/db";
import Link from "next/link";

import { OrderList } from "./_components/order-list";

function parseStatusFilter(raw: string | undefined): OrderStatus | "ALL" {
  if (raw === "ALL") {
    return "ALL";
  }
  if (
    raw === "CONFIRMED" ||
    raw === "DELIVERED" ||
    raw === "SHIPPED" ||
    raw === "PENDING" ||
    raw === "REFUNDED" ||
    raw === "CANCELLED"
  ) {
    return raw;
  }
  return "SHIPPED";
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const sp = await searchParams;
  const statusFilter = parseStatusFilter(sp.status);

  const where =
    statusFilter === "ALL" ? {} : { status: statusFilter as OrderStatus };

  const rows = await database.order.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      buyer: { select: { name: true } },
      createdAt: true,
      id: true,
      orderNumber: true,
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
    take: 200,
    where,
  });

  const orders = rows.map((o) => ({
    buyerName: o.buyer?.name ?? null,
    id: o.id,
    orderDate: o.createdAt,
    orderNumber: o.orderNumber,
    roasterLabel: o.roaster.application.businessName ?? o.roaster.email,
    shippedAt: o.shippedAt,
    status: o.status,
    trackingNumber: o.trackingNumber,
  }));

  return (
    <div className="mx-auto max-w-6xl p-6 md:p-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-semibold text-3xl">Orders</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Confirm delivery for shipped orders. Default view shows orders
            awaiting delivery confirmation.
          </p>
        </div>
        <Link className="text-sm text-zinc-600 underline" href="/">
          Home
        </Link>
      </div>
      <OrderList orders={orders} statusFilter={statusFilter} />
    </div>
  );
}

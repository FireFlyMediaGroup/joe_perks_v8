import { database } from "@joe-perks/db";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ConfirmDeliveryButton } from "../_components/confirm-delivery-button";
import { OrderDetail } from "../_components/order-detail";
import { EventTimeline } from "./_components/event-timeline";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminOrderDetailPage({ params }: Props) {
  const { id } = await params;

  const order = await database.order.findUnique({
    include: {
      buyer: { select: { email: true, name: true } },
      campaign: {
        include: {
          org: {
            include: {
              application: { select: { orgName: true } },
            },
          },
        },
      },
      events: { orderBy: { createdAt: "asc" } },
      items: true,
      roaster: {
        include: {
          application: { select: { businessName: true } },
        },
      },
    },
    where: { id },
  });

  if (!order) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-4xl p-6 md:p-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <Link className="text-sm text-zinc-600 underline" href="/orders">
          ← Orders
        </Link>
        {order.status === "SHIPPED" ? (
          <ConfirmDeliveryButton orderId={order.id} />
        ) : null}
      </div>

      <OrderDetail order={order} />

      <section className="mt-10 border-zinc-200 border-t pt-8 dark:border-zinc-800">
        <h2 className="mb-4 font-semibold text-lg">Event timeline</h2>
        <EventTimeline events={order.events} />
      </section>
    </div>
  );
}

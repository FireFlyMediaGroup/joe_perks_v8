import { database } from "@joe-perks/db";
import Link from "next/link";
import { notFound } from "next/navigation";

import { NoRoasterProfile } from "../../products/_components/no-roaster-profile";
import { requireRoasterId } from "../../products/_lib/require-roaster";
import { EventTimeline } from "./_components/event-timeline";
import { OrderDetail } from "./_components/order-detail";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function RoasterOrderDetailPage({ params }: Props) {
  const session = await requireRoasterId();
  if (!session.ok) {
    if (session.error === "unauthorized") {
      return null;
    }
    return <NoRoasterProfile />;
  }

  const { id } = await params;

  const order = await database.order.findFirst({
    where: { id, roasterId: session.roasterId },
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
  });

  if (!order) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-5xl p-6 md:p-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <Link
          className="text-muted-foreground text-sm underline"
          href="/dashboard"
        >
          ← Dashboard
        </Link>
      </div>

      <OrderDetail order={order} />

      <section className="mt-10 border-t pt-8">
        <h2 className="mb-4 font-semibold text-lg">Event timeline</h2>
        <EventTimeline events={order.events} />
      </section>
    </div>
  );
}

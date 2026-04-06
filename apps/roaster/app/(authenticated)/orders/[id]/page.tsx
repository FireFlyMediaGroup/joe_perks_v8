import { Badge } from "@repo/design-system/components/ui/badge";
import { Button } from "@repo/design-system/components/ui/button";
import { Separator } from "@repo/design-system/components/ui/separator";
import Link from "next/link";
import { notFound } from "next/navigation";

import { requireRoasterId } from "../../products/_lib/require-roaster";
import {
  getOrderStatusBadgeVariant,
  getOrderStatusLabel,
} from "../../dashboard/_lib/order-queue";
import { OrderEventTimeline } from "./_components/order-event-timeline";
import { OrderOverview } from "./_components/order-overview";
import { PortalFulfillmentForm } from "./_components/portal-fulfillment-form";
import { TrackingCorrectionForm } from "./_components/tracking-correction-form";
import { getRoasterOrderDetail } from "./_lib/queries";

interface OrderQueueDetailPageProperties {
  readonly params: Promise<{
    readonly id: string;
  }>;
}

export default async function OrderQueueDetailPage({
  params,
}: OrderQueueDetailPageProperties) {
  const session = await requireRoasterId();
  if (!session.ok) {
    return null;
  }

  const { id } = await params;
  const order = await getRoasterOrderDetail(id, session.roasterId);

  if (!order) {
    notFound();
  }

  const orgName =
    order.campaign.org.application.orgName ?? order.campaign.org.slug;
  const isFlagged = Boolean(order.flaggedAt && !order.flagResolvedAt);
  const actionPanel = (() => {
    if (order.status === "CONFIRMED" && !isFlagged) {
      return (
        <PortalFulfillmentForm
          orderId={order.id}
          orderNumber={order.orderNumber}
        />
      );
    }

    if (order.status === "SHIPPED" && order.trackingNumber && order.carrier) {
      return (
        <TrackingCorrectionForm
          carrier={order.carrier}
          orderId={order.id}
          trackingNumber={order.trackingNumber}
        />
      );
    }

    return (
      <ReadOnlyOrderState
        isFlagged={isFlagged}
        status={order.status}
        trackingNumber={order.trackingNumber}
      />
    );
  })();

  return (
    <main className="space-y-6 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-semibold text-2xl">{order.orderNumber}</h1>
            <Badge variant={getOrderStatusBadgeVariant(order.status)}>
              {getOrderStatusLabel(order.status)}
            </Badge>
            {isFlagged ? <Badge variant="destructive">Action needed</Badge> : null}
          </div>
          <p className="mt-2 text-muted-foreground text-sm">
            {orgName} · {order.campaign.name}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/dashboard">Back to dashboard</Link>
        </Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,0.8fr)]">
        <OrderOverview order={order} />

        <aside className="space-y-6">
          <section className="rounded-2xl border bg-card p-5">{actionPanel}</section>

          <section className="rounded-2xl border bg-card p-5">
            <h2 className="font-semibold text-lg">Status snapshot</h2>
            <Separator className="my-4" />
            <dl className="grid gap-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Placed</dt>
                <dd className="font-medium">{order.createdAt.toLocaleString()}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Fulfill by</dt>
                <dd className="font-medium">{order.fulfillBy.toLocaleString()}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Current status</dt>
                <dd className="font-medium">{getOrderStatusLabel(order.status)}</dd>
              </div>
              {order.shippedAt ? (
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Shipped at</dt>
                  <dd className="font-medium">{order.shippedAt.toLocaleString()}</dd>
                </div>
              ) : null}
              {order.deliveredAt ? (
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Delivered at</dt>
                  <dd className="font-medium">
                    {order.deliveredAt.toLocaleString()}
                  </dd>
                </div>
              ) : null}
            </dl>
          </section>
        </aside>
      </div>

      <section className="space-y-4">
        <div>
          <h2 className="font-semibold text-lg">Event history</h2>
          <p className="mt-1 text-muted-foreground text-sm">
            Timeline labels use the live order event names mapped to roaster-facing
            copy.
          </p>
        </div>
        <OrderEventTimeline events={order.events} />
      </section>
    </main>
  );
}

function ReadOnlyOrderState({
  isFlagged,
  status,
  trackingNumber,
}: {
  readonly isFlagged: boolean;
  readonly status: string;
  readonly trackingNumber: string | null;
}) {
  if (isFlagged) {
    return (
      <div className="space-y-2">
        <h2 className="font-semibold text-lg">Awaiting issue resolution</h2>
        <p className="text-muted-foreground text-sm">
          Portal fulfillment stays paused while this reported issue is unresolved.
        </p>
      </div>
    );
  }

  if (status === "SHIPPED") {
    return (
      <div className="space-y-2">
        <h2 className="font-semibold text-lg">Already shipped</h2>
        <p className="text-muted-foreground text-sm">
          This order is already marked shipped. You can correct the carrier or
          tracking number here if needed.
        </p>
        {trackingNumber ? (
          <p className="text-sm">
            Current tracking: <span className="font-mono">{trackingNumber}</span>
          </p>
        ) : null}
      </div>
    );
  }

  if (status === "DELIVERED") {
    return (
      <div className="space-y-2">
        <h2 className="font-semibold text-lg">Delivered</h2>
        <p className="text-muted-foreground text-sm">
          This order is complete and remains read-only in the roaster portal.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h2 className="font-semibold text-lg">Read-only order state</h2>
      <p className="text-muted-foreground text-sm">
        This order is currently {status}, so there is no fulfillment action on
        this page.
      </p>
    </div>
  );
}

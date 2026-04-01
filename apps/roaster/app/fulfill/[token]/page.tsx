import { database, logOrderEvent } from "@joe-perks/db";

import { FulfillmentDetails } from "./_components/fulfillment-details";
import { TrackingForm } from "./_components/tracking-form";
import { validateFulfillmentToken } from "./_lib/validate-token";

interface Props {
  params: Promise<{ token: string }>;
}

function TokenError({
  message,
  title,
}: {
  readonly message: string;
  readonly title: string;
}) {
  return (
    <main className="mx-auto max-w-prose p-6 md:p-8">
      <h1 className="font-semibold text-2xl">{title}</h1>
      <p className="mt-2 text-muted-foreground">{message}</p>
    </main>
  );
}

/** Magic link fulfillment — no auth (AGENTS.md). */
export default async function FulfillPage({ params }: Props) {
  const { token } = await params;

  if (!token) {
    return (
      <TokenError
        message="Check the link in your email."
        title="Invalid link"
      />
    );
  }

  const validated = await validateFulfillmentToken(token);
  if (!validated.ok) {
    if (validated.reason === "expired") {
      return (
        <TokenError
          message="Request a new link from Joe Perks support if you still need access."
          title="This link has expired"
        />
      );
    }
    if (validated.reason === "used") {
      return (
        <TokenError
          message="Tracking was already submitted for this order."
          title="This link has already been used"
        />
      );
    }
    return (
      <TokenError
        message="Double-check the URL or open the latest email from Joe Perks."
        title="Invalid link"
      />
    );
  }

  const order = await database.order.findFirst({
    where: { id: validated.orderId },
    include: {
      buyer: { select: { name: true } },
      campaign: {
        include: {
          org: {
            include: {
              application: { select: { orgName: true } },
            },
          },
        },
      },
      items: true,
    },
  });

  if (!order) {
    return (
      <TokenError
        message="This order could not be loaded."
        title="Invalid link"
      />
    );
  }

  const viewed = await database.orderEvent.findFirst({
    where: {
      orderId: order.id,
      eventType: "FULFILLMENT_VIEWED",
    },
  });
  if (!viewed) {
    await logOrderEvent(
      order.id,
      "FULFILLMENT_VIEWED",
      "ROASTER",
      order.roasterId,
      {},
      null
    );
  }

  if (order.status !== "CONFIRMED") {
    return (
      <main className="mx-auto max-w-prose p-6 md:p-8">
        <h1 className="font-semibold text-2xl">Order update</h1>
        <p className="mt-2 text-muted-foreground">
          This order is no longer awaiting shipment (status: {order.status}).
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl p-6 md:p-8">
      <FulfillmentDetails order={order} />
      <div className="mt-10 border-t pt-8">
        <TrackingForm orderNumber={order.orderNumber} token={token} />
      </div>
    </main>
  );
}

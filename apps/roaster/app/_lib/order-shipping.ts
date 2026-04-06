import { database, type Prisma } from "@joe-perks/db";
import { sendEmail } from "@joe-perks/email/send";
import OrderShippedEmail from "@joe-perks/email/templates/order-shipped";
import { createElement } from "react";

export const MAX_FULFILLMENT_NOTE_LENGTH = 200;

interface ShipmentInputs {
  readonly carrier: string;
  readonly fulfillmentNote?: string;
  readonly trackingNumber: string;
}

interface NormalizedShipmentInputs {
  readonly carrier: string;
  readonly fulfillmentNote: string | null;
  readonly trackingNumber: string;
}

interface ShipConfirmedOrderInput extends NormalizedShipmentInputs {
  readonly orderId: string;
  readonly roasterId?: string;
}

interface UpdateShipmentTrackingInput {
  readonly carrier: string;
  readonly orderId: string;
  readonly roasterId: string;
  readonly trackingNumber: string;
}

type ShipmentEmailKind = "initial" | "tracking-updated";
type TransactionClient = Prisma.TransactionClient;

export function normalizeShipmentInputs(
  input: ShipmentInputs
):
  | { ok: true; value: NormalizedShipmentInputs }
  | { ok: false; error: string } {
  const trackingNumber = input.trackingNumber.trim();
  const carrier = input.carrier.trim();
  const fulfillmentNote = input.fulfillmentNote?.trim() || null;

  if (!(trackingNumber && carrier)) {
    return {
      ok: false,
      error: "Tracking number and carrier are required.",
    };
  }

  if ((fulfillmentNote?.length ?? 0) > MAX_FULFILLMENT_NOTE_LENGTH) {
    return {
      ok: false,
      error: `Notes must be ${MAX_FULFILLMENT_NOTE_LENGTH} characters or fewer.`,
    };
  }

  return {
    ok: true,
    value: {
      carrier,
      fulfillmentNote,
      trackingNumber,
    },
  };
}

export async function shipConfirmedOrder(
  tx: TransactionClient,
  input: ShipConfirmedOrderInput
): Promise<{ ok: true } | { ok: false; error: "ORDER_STATE" }> {
  const current = await tx.order.findFirst({
    where: {
      id: input.orderId,
      ...(input.roasterId ? { roasterId: input.roasterId } : {}),
      status: "CONFIRMED",
    },
    select: {
      roasterId: true,
    },
  });

  if (!current) {
    return { ok: false, error: "ORDER_STATE" };
  }

  await tx.order.update({
    where: { id: input.orderId },
    data: {
      status: "SHIPPED",
      trackingNumber: input.trackingNumber,
      carrier: input.carrier,
      fulfillmentNote: input.fulfillmentNote,
      shippedAt: new Date(),
    },
  });

  await tx.orderEvent.create({
    data: {
      orderId: input.orderId,
      eventType: "SHIPPED",
      actorType: "ROASTER",
      actorId: current.roasterId,
      payload: {
        carrier: input.carrier,
        fulfillment_note: input.fulfillmentNote,
        tracking_number: input.trackingNumber,
      },
    },
  });

  return { ok: true };
}

export async function updateShipmentTracking(
  tx: TransactionClient,
  input: UpdateShipmentTrackingInput
): Promise<
  | { ok: true; eventId: string; fulfillmentNote: string | null }
  | { ok: false; error: "NO_CHANGE" | "ORDER_STATE" }
> {
  const current = await tx.order.findFirst({
    where: {
      id: input.orderId,
      roasterId: input.roasterId,
      status: "SHIPPED",
    },
    select: {
      carrier: true,
      fulfillmentNote: true,
      roasterId: true,
      trackingNumber: true,
    },
  });

  if (!current) {
    return { ok: false, error: "ORDER_STATE" };
  }

  if (
    current.carrier === input.carrier &&
    current.trackingNumber === input.trackingNumber
  ) {
    return { ok: false, error: "NO_CHANGE" };
  }

  await tx.order.update({
    where: { id: input.orderId },
    data: {
      carrier: input.carrier,
      trackingNumber: input.trackingNumber,
    },
  });

  const event = await tx.orderEvent.create({
    data: {
      orderId: input.orderId,
      eventType: "TRACKING_UPDATED",
      actorType: "ROASTER",
      actorId: current.roasterId,
      payload: {
        carrier: input.carrier,
        previous_carrier: current.carrier,
        previous_tracking_number: current.trackingNumber,
        tracking_number: input.trackingNumber,
      },
    },
    select: {
      id: true,
    },
  });

  return {
    ok: true,
    eventId: event.id,
    fulfillmentNote: current.fulfillmentNote,
  };
}

export async function sendBuyerShipmentEmail(input: {
  readonly carrier: string;
  readonly entityId: string;
  readonly entityType: string;
  readonly fulfillmentNote?: string | null;
  readonly kind: ShipmentEmailKind;
  readonly orderId: string;
  readonly trackingNumber: string;
}): Promise<void> {
  const order = await database.order.findUnique({
    where: { id: input.orderId },
    include: {
      buyer: true,
      campaign: {
        include: {
          org: {
            include: {
              application: { select: { orgName: true } },
            },
          },
        },
      },
    },
  });

  if (!order?.buyer?.email) {
    return;
  }

  const orgName =
    order.campaign.org.application.orgName ?? order.campaign.org.slug;

  await sendEmail({
    entityId: input.entityId,
    entityType: input.entityType,
    react: createElement(OrderShippedEmail, {
      buyerName: order.buyer.name ?? "Customer",
      carrier: input.carrier,
      fulfillmentNote: input.fulfillmentNote || undefined,
      kind: input.kind,
      orderNumber: order.orderNumber,
      orgName,
      trackingNumber: input.trackingNumber,
    }),
    subject:
      input.kind === "initial"
        ? `Your Joe Perks order ${order.orderNumber} has shipped`
        : `Updated: Your Joe Perks order ${order.orderNumber} tracking details`,
    template:
      input.kind === "initial" ? "order_shipped" : "order_tracking_updated",
    to: order.buyer.email,
  });
}

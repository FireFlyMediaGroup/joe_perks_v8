import { database } from "@joe-perks/db";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const dispute = await database.disputeRecord.findUnique({
    include: {
      order: {
        include: {
          campaign: {
            include: {
              org: {
                include: {
                  application: { select: { orgName: true } },
                },
              },
            },
          },
          events: {
            orderBy: { createdAt: "asc" },
          },
          items: {
            orderBy: { createdAt: "asc" },
          },
          roaster: {
            include: {
              application: { select: { businessName: true } },
            },
          },
        },
      },
    },
    where: { id },
  });

  if (!dispute) {
    return Response.json({ error: "Dispute not found." }, { status: 404 });
  }

  const orgLabel =
    dispute.order.campaign.org.application.orgName ??
    dispute.order.campaign.org.slug;
  const roasterLabel =
    dispute.order.roaster.application.businessName ??
    dispute.order.roaster.email;

  const evidencePacket = {
    dispute: {
      createdAt: dispute.createdAt.toISOString(),
      evidenceSubmitted: dispute.evidenceSubmitted,
      faultAttribution: dispute.faultAttribution,
      id: dispute.id,
      outcome: dispute.outcome,
      respondBy: dispute.respondBy?.toISOString() ?? null,
      stripeDisputeId: dispute.stripeDisputeId,
      updatedAt: dispute.updatedAt.toISOString(),
    },
    order: {
      amounts: {
        grossAmount: dispute.order.grossAmount,
        orgAmount: dispute.order.orgAmount,
        platformAmount: dispute.order.platformAmount,
        productSubtotal: dispute.order.productSubtotal,
        roasterAmount: dispute.order.roasterAmount,
        roasterTotal: dispute.order.roasterTotal,
        shippingAmount: dispute.order.shippingAmount,
        stripeFee: dispute.order.stripeFee,
      },
      buyerIp: dispute.order.buyerIp,
      campaignName: dispute.order.campaign.name,
      carrier: dispute.order.carrier,
      deliveredAt: dispute.order.deliveredAt?.toISOString() ?? null,
      fulfillBy: dispute.order.fulfillBy.toISOString(),
      fundraiser: orgLabel,
      items: dispute.order.items.map((item) => ({
        lineTotal: item.lineTotal,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        variantDesc: item.variantDesc,
      })),
      orderId: dispute.order.id,
      orderNumber: dispute.order.orderNumber,
      payoutStatus: dispute.order.payoutStatus,
      paymentIntentId: dispute.order.stripePiId,
      roaster: roasterLabel,
      shippedAt: dispute.order.shippedAt?.toISOString() ?? null,
      status: dispute.order.status,
      stripeChargeId: dispute.order.stripeChargeId,
      trackingNumber: dispute.order.trackingNumber,
      transferGroup: dispute.order.transferGroup,
    },
    timeline: dispute.order.events.map((event) => ({
      actorId: event.actorId,
      actorType: event.actorType,
      createdAt: event.createdAt.toISOString(),
      eventType: event.eventType,
      payload: event.payload,
    })),
  };

  return new Response(JSON.stringify(evidencePacket, null, 2), {
    headers: {
      "Content-Disposition": `attachment; filename="dispute-${dispute.order.orderNumber}.json"`,
      "Content-Type": "application/json; charset=utf-8",
    },
    status: 200,
  });
}

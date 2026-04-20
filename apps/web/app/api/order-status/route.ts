import { database } from "@joe-perks/db";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Lookup order status for post-checkout confirmation.
 * Query params: ?pi=pi_xxx (Stripe PI id) or ?id=orderId
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const piId = searchParams.get("pi");
  const orderId = searchParams.get("id");

  if (!(piId || orderId)) {
    return NextResponse.json(
      { error: "Missing pi or id parameter" },
      { status: 400 }
    );
  }

  const where = piId ? { stripePiId: piId } : { id: orderId as string };

  const order = await database.order.findUnique({
    where,
    select: {
      id: true,
      orderNumber: true,
      status: true,
      grossAmount: true,
      productSubtotal: true,
      shippingAmount: true,
      orgAmount: true,
      orgPctSnapshot: true,
      trackingNumber: true,
      carrier: true,
      createdAt: true,
      campaign: {
        select: {
          org: {
            select: {
              application: { select: { orgName: true } },
              slug: true,
            },
          },
        },
      },
      items: {
        select: {
          productName: true,
          variantDesc: true,
          quantity: true,
          unitPrice: true,
          lineTotal: true,
        },
      },
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const orgName =
    order.campaign.org.application.orgName ?? order.campaign.org.slug;

  return NextResponse.json({
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    grossAmount: order.grossAmount,
    productSubtotal: order.productSubtotal,
    shippingAmount: order.shippingAmount,
    orgAmount: order.orgAmount,
    orgPctSnapshot: order.orgPctSnapshot,
    orgName,
    trackingNumber: order.trackingNumber,
    carrier: order.carrier,
    createdAt: order.createdAt,
    items: order.items,
  });
}

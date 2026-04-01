import { database, generateOrderNumber } from "@joe-perks/db";
import { calculateSplits, getStripe, limitCheckout } from "@joe-perks/stripe";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const checkoutSchema = z.object({
  campaignId: z.string().min(1),
  items: z
    .array(
      z.object({
        campaignItemId: z.string().min(1),
        quantity: z.number().int().min(1).max(99),
      })
    )
    .min(1)
    .max(50),
  buyerEmail: z.string().email(),
  buyerName: z.string().max(200).optional(),
  shippingRateId: z.string().min(1),
});

const GRIND_LABELS: Record<string, string> = {
  WHOLE_BEAN: "Whole Bean",
  GROUND_DRIP: "Ground (Drip)",
  GROUND_ESPRESSO: "Ground (Espresso)",
  GROUND_FRENCH_PRESS: "Ground (French Press)",
};

function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip")?.trim() ?? "0.0.0.0";
}

export async function POST(request: Request) {
  let body: z.infer<typeof checkoutSchema>;
  try {
    body = checkoutSchema.parse(await request.json());
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const buyerIp = getClientIp(request);

  const { success: allowed } = await limitCheckout(buyerIp);
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const campaign = await database.campaign.findUnique({
    where: { id: body.campaignId },
    include: { org: true },
  });
  if (!campaign || campaign.status !== "ACTIVE") {
    return NextResponse.json(
      { error: "Campaign not found or inactive" },
      { status: 404 }
    );
  }

  const campaignItemIds = body.items.map((i) => i.campaignItemId);
  const campaignItems = await database.campaignItem.findMany({
    where: { id: { in: campaignItemIds }, campaignId: campaign.id },
    include: { product: true, variant: true },
  });
  if (campaignItems.length !== campaignItemIds.length) {
    return NextResponse.json(
      { error: "One or more items not found in this campaign" },
      { status: 400 }
    );
  }

  for (const ci of campaignItems) {
    if (
      ci.product.deletedAt ||
      ci.variant.deletedAt ||
      !ci.variant.isAvailable
    ) {
      return NextResponse.json(
        { error: `Item "${ci.product.name}" is no longer available` },
        { status: 400 }
      );
    }
  }

  const roasterIds = new Set(campaignItems.map((ci) => ci.product.roasterId));
  if (roasterIds.size !== 1) {
    return NextResponse.json(
      { error: "Multi-roaster orders are not supported" },
      { status: 400 }
    );
  }
  const roasterId = campaignItems[0].product.roasterId;

  const roaster = await database.roaster.findUnique({
    where: { id: roasterId },
  });
  if (!roaster || roaster.status !== "ACTIVE") {
    return NextResponse.json(
      { error: "Roaster is unavailable" },
      { status: 400 }
    );
  }

  const shippingRate = await database.roasterShippingRate.findUnique({
    where: { id: body.shippingRateId },
  });
  if (!shippingRate || shippingRate.roasterId !== roasterId) {
    return NextResponse.json(
      { error: "Invalid shipping rate" },
      { status: 400 }
    );
  }

  const quantityMap = new Map(
    body.items.map((i) => [i.campaignItemId, i.quantity])
  );
  const orderItemsData = campaignItems.map((ci) => {
    const qty = quantityMap.get(ci.id)!;
    return {
      variantId: ci.variantId,
      productName: ci.product.name,
      variantDesc: `${ci.variant.sizeOz}oz, ${GRIND_LABELS[ci.variant.grind] ?? ci.variant.grind}`,
      quantity: qty,
      unitPrice: ci.retailPrice,
      lineTotal: ci.retailPrice * qty,
    };
  });

  const productSubtotalCents = orderItemsData.reduce(
    (sum, item) => sum + item.lineTotal,
    0
  );
  const shippingAmountCents = shippingRate.flatRate;

  const settings = await database.platformSettings.findUniqueOrThrow({
    where: { id: "singleton" },
  });

  let splits: ReturnType<typeof calculateSplits>;
  try {
    splits = calculateSplits({
      productSubtotalCents,
      shippingAmountCents,
      orgPct: campaign.orgPct,
      platformFeePct: settings.platformFeePct,
      platformFeeFloorCents: settings.platformFeeFloor,
      orgPctMin: settings.orgPctMin,
      orgPctMax: settings.orgPctMax,
    });
  } catch (err) {
    const message =
      err instanceof RangeError ? err.message : "Split calculation failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const orderId = crypto.randomUUID();
  const orderNumber = await generateOrderNumber();

  const stripe = getStripe();
  let pi: Awaited<ReturnType<typeof stripe.paymentIntents.create>>;
  try {
    pi = await stripe.paymentIntents.create({
      amount: splits.grossAmount,
      currency: "usd",
      transfer_group: orderId,
      metadata: {
        order_id: orderId,
        order_number: orderNumber,
        campaign_id: campaign.id,
        roaster_id: roasterId,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Payment setup failed" },
      { status: 500 }
    );
  }

  try {
    await database.$transaction(async (tx) => {
      const buyer = await tx.buyer.upsert({
        where: { email: body.buyerEmail },
        create: { email: body.buyerEmail, name: body.buyerName },
        update: {},
      });

      await tx.order.create({
        data: {
          id: orderId,
          orderNumber,
          campaignId: campaign.id,
          roasterId,
          buyerId: buyer.id,
          fulfillerType: roaster.fulfillerType,
          productSubtotal: splits.productSubtotal,
          shippingAmount: splits.shippingAmount,
          grossAmount: splits.grossAmount,
          stripeFee: splits.stripeFee,
          orgPctSnapshot: splits.orgPctSnapshot,
          orgAmount: splits.orgAmount,
          platformAmount: splits.platformAmount,
          roasterAmount: splits.roasterAmount,
          roasterTotal: splits.roasterTotal,
          status: "PENDING",
          fulfillBy: new Date(
            Date.now() + settings.slaBreachHours * 60 * 60 * 1000
          ),
          payoutStatus: "PENDING",
          stripePiId: pi.id,
          transferGroup: orderId,
          buyerIp,
        },
      });

      await tx.orderItem.createMany({
        data: orderItemsData.map((item) => ({ orderId, ...item })),
      });

      // OrderEvent must stay inside this transaction with order + line items (atomic create).
      await tx.orderEvent.create({
        data: {
          orderId,
          eventType: "PAYMENT_INTENT_CREATED",
          actorType: "BUYER",
          ipAddress: buyerIp,
          payload: { stripe_pi_id: pi.id },
        },
      });
    });
  } catch (err) {
    await stripe.paymentIntents.cancel(pi.id).catch(() => {});
    console.error("checkout db transaction failed", {
      order_id: orderId,
      stripe_pi_id: pi.id,
      error: err instanceof Error ? err.message : "unknown",
    });
    return NextResponse.json(
      { error: "Order creation failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    clientSecret: pi.client_secret,
    grossAmount: splits.grossAmount,
    orderId,
    orderNumber,
    paymentIntentId: pi.id,
  });
}

import { database, generateOrderNumber } from "@joe-perks/db";
import { calculateSplits, getStripe, limitCheckout } from "@joe-perks/stripe";
import { NextResponse } from "next/server";
import {
  buildOrderSnapshotData,
  checkoutSchema,
  type CheckoutRequestBody,
} from "./_lib/checkout-payload";

export const runtime = "nodejs";

const GRIND_LABELS: Record<string, string> = {
  WHOLE_BEAN: "Whole Bean",
  GROUND_DRIP: "Ground (Drip)",
  GROUND_ESPRESSO: "Ground (Espresso)",
  GROUND_FRENCH_PRESS: "Ground (French Press)",
};

interface CheckoutOrderItemData {
  lineTotal: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  variantDesc: string;
  variantId: string;
}

function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return request.headers.get("x-real-ip")?.trim() ?? "0.0.0.0";
}

async function loadActiveCampaign(campaignId: string) {
  const campaign = await database.campaign.findUnique({
    where: { id: campaignId },
    include: { org: true },
  });

  if (!campaign) {
    return null;
  }

  if (campaign.status !== "ACTIVE" || campaign.org.status !== "ACTIVE") {
    return null;
  }

  return campaign;
}

async function loadCampaignItemsForCheckout(input: {
  campaignId: string;
  items: Array<{ campaignItemId: string; quantity: number }>;
}) {
  const campaignItemIds = input.items.map((item) => item.campaignItemId);
  const campaignItems = await database.campaignItem.findMany({
    where: { id: { in: campaignItemIds }, campaignId: input.campaignId },
    include: { product: true, variant: true },
  });

  if (campaignItems.length !== campaignItemIds.length) {
    return { campaignItems: null, error: "One or more items not found in this campaign" };
  }

  for (const campaignItem of campaignItems) {
    if (
      campaignItem.product.deletedAt ||
      campaignItem.variant.deletedAt ||
      !campaignItem.variant.isAvailable
    ) {
      return {
        campaignItems: null,
        error: `Item "${campaignItem.product.name}" is no longer available`,
      };
    }
  }

  return { campaignItems, error: null };
}

function buildOrderItemsData(
  campaignItems: Awaited<ReturnType<typeof loadCampaignItemsForCheckout>> extends {
    campaignItems: infer T;
  }
    ? NonNullable<T>
    : never,
  items: Array<{ campaignItemId: string; quantity: number }>
) {
  const quantityMap = new Map(items.map((item) => [item.campaignItemId, item.quantity]));

  const orderItemsData: CheckoutOrderItemData[] = [];
  for (const campaignItem of campaignItems) {
    const quantity = quantityMap.get(campaignItem.id);
    if (!quantity) {
      return { error: "One or more checkout quantities are invalid", orderItemsData: null };
    }

    orderItemsData.push({
      lineTotal: campaignItem.retailPrice * quantity,
      productName: campaignItem.product.name,
      quantity,
      unitPrice: campaignItem.retailPrice,
      variantDesc: `${campaignItem.variant.sizeOz}oz, ${GRIND_LABELS[campaignItem.variant.grind] ?? campaignItem.variant.grind}`,
      variantId: campaignItem.variantId,
    });
  }

  return { error: null, orderItemsData };
}

async function loadCheckoutContext(
  body: CheckoutRequestBody
): Promise<
  | {
      campaign: NonNullable<Awaited<ReturnType<typeof loadActiveCampaign>>>;
      orderItemsData: CheckoutOrderItemData[];
      roaster: NonNullable<Awaited<ReturnType<typeof database.roaster.findUnique>>>;
      roasterId: string;
      shippingRate: NonNullable<
        Awaited<ReturnType<typeof database.roasterShippingRate.findUnique>>
      >;
    }
  | { error: string; status: number }
> {
  const campaign = await loadActiveCampaign(body.campaignId);
  if (!campaign) {
    return { error: "Campaign not found or inactive", status: 404 };
  }

  const { campaignItems, error: campaignItemsError } =
    await loadCampaignItemsForCheckout({
      campaignId: campaign.id,
      items: body.items,
    });
  if (campaignItemsError || !campaignItems) {
    return {
      error: campaignItemsError ?? "Items are unavailable",
      status: 400,
    };
  }

  const roasterIds = new Set(campaignItems.map((ci) => ci.product.roasterId));
  if (roasterIds.size !== 1) {
    return { error: "Multi-roaster orders are not supported", status: 400 };
  }

  const [roasterId] = roasterIds;
  if (!roasterId) {
    return { error: "Roaster is unavailable", status: 400 };
  }

  const roaster = await database.roaster.findUnique({
    where: { id: roasterId },
  });
  if (!roaster || roaster.status !== "ACTIVE") {
    return { error: "Roaster is unavailable", status: 400 };
  }

  const shippingRate = await database.roasterShippingRate.findUnique({
    where: { id: body.shippingRateId },
  });
  if (!shippingRate || shippingRate.roasterId !== roasterId) {
    return { error: "Invalid shipping rate", status: 400 };
  }

  const { error: orderItemsError, orderItemsData } = buildOrderItemsData(
    campaignItems,
    body.items
  );
  if (orderItemsError || !orderItemsData) {
    return {
      error: orderItemsError ?? "Checkout items are invalid",
      status: 400,
    };
  }

  return {
    campaign,
    orderItemsData,
    roaster,
    roasterId,
    shippingRate,
  };
}

export async function POST(request: Request) {
  let body: CheckoutRequestBody;
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

  const context = await loadCheckoutContext(body);
  if ("error" in context) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }

  const { campaign, orderItemsData, roaster, roasterId, shippingRate } = context;

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
          ...buildOrderSnapshotData(body),
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
    await stripe.paymentIntents.cancel(pi.id).catch(() => undefined);
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

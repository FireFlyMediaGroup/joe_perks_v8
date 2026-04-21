/**
 * Seeds two synthetic paid orders for the E2E org campaign (CONFIRMED + SHIPPED)
 * so roaster/org dashboards and lists have data without Stripe checkout.
 *
 * Prerequisites: seed-e2e-roaster.ts and seed-e2e-org.ts (active campaign + items).
 *
 * Usage:
 *   cd packages/db && bun run ./scripts/seed-e2e-orders.ts
 *
 * Idempotent: skips creation if orders with the fixed `stripePiId` values already exist.
 */
import "../load-env-bootstrap";

import { calculateSplits } from "@joe-perks/stripe/splits";
import { database } from "../database";

import {
  E2E_ORG_SLUG,
  E2E_SEED_BUYER_EMAIL,
  E2E_SEED_ORDER_PI_CONFIRMED,
  E2E_SEED_ORDER_PI_SHIPPED,
} from "./e2e-seed-constants";

const GRIND_LABELS: Record<string, string> = {
  WHOLE_BEAN: "Whole Bean",
  GROUND_DRIP: "Ground (Drip)",
  GROUND_ESPRESSO: "Ground (Espresso)",
  GROUND_FRENCH_PRESS: "Ground (French Press)",
};

function variantDesc(grind: string, sizeOz: number): string {
  const g = GRIND_LABELS[grind] ?? grind;
  return `${sizeOz} oz · ${g}`;
}

const E2E_SEED_BUYER_NAME = "E2E Seed Buyer";

/**
 * Ensures the synthetic buyer row without using Prisma `buyer.upsert()`, so this still
 * runs when production has not applied `20260405134350_buyer_account_foundation`
 * (`Buyer.lastSignInAt`). Align prod schema with `pnpm migrate:deploy:prod` long-term.
 */
async function ensureSeededBuyerId(): Promise<string> {
  const rows = await database.$queryRaw<{ id: string }[]>`
    INSERT INTO "Buyer" (id, email, name, "createdAt", "updatedAt")
    VALUES (${crypto.randomUUID()}, ${E2E_SEED_BUYER_EMAIL}, ${E2E_SEED_BUYER_NAME}, NOW(), NOW())
    ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, "updatedAt" = NOW()
    RETURNING id
  `;
  return rows[0].id;
}

/** Same atomic rule as `generateOrderNumber` — inlined to avoid `server-only` in Bun scripts. */
async function allocateOrderNumber(): Promise<string> {
  const result = await database.$queryRaw<[{ nextVal: number }]>`
    UPDATE "OrderSequence"
    SET "nextVal" = "nextVal" + 1
    WHERE id = 'singleton'
    RETURNING "nextVal"
  `;
  const n = result[0].nextVal;
  return `JP-${String(n).padStart(5, "0")}`;
}

interface SeedOrderSpec {
  readonly stripePiId: string;
  readonly status: "CONFIRMED" | "SHIPPED";
  readonly trackingNumber?: string;
  readonly carrier?: string;
}

async function seedOneOrder(
  spec: SeedOrderSpec,
  input: {
    campaignId: string;
    roasterId: string;
    fulfillerType: "ROASTER" | "PLATFORM";
    campaignItem: {
      id: string;
      retailPrice: number;
      product: { name: string };
      variant: { id: string; grind: string; sizeOz: number };
    };
    shippingFlatCents: number;
    orgPct: number;
    settings: {
      platformFeePct: number;
      platformFeeFloor: number;
      orgPctMin: number;
      orgPctMax: number;
      slaBreachHours: number;
      payoutHoldDays: number;
    };
  }
): Promise<void> {
  const existing = await database.order.findUnique({
    where: { stripePiId: spec.stripePiId },
    select: { id: true, orderNumber: true },
  });
  if (existing) {
    console.log(
      `  Order already exists (${spec.stripePiId}) → ${existing.orderNumber}, skip`
    );
    return;
  }

  const quantity = 1;
  const productSubtotalCents = input.campaignItem.retailPrice * quantity;
  const splits = calculateSplits({
    productSubtotalCents,
    shippingAmountCents: input.shippingFlatCents,
    orgPct: input.orgPct,
    platformFeePct: input.settings.platformFeePct,
    platformFeeFloorCents: input.settings.platformFeeFloor,
    orgPctMin: input.settings.orgPctMin,
    orgPctMax: input.settings.orgPctMax,
  });

  const orderId = crypto.randomUUID();
  const orderNumber = await allocateOrderNumber();
  const now = Date.now();
  const fulfillBy = new Date(
    now + input.settings.slaBreachHours * 60 * 60 * 1000
  );
  const payoutEligibleAt = new Date(
    now + input.settings.payoutHoldDays * 24 * 60 * 60 * 1000
  );

  const buyerId = await ensureSeededBuyerId();

  const orderItem = {
    variantId: input.campaignItem.variant.id,
    productName: input.campaignItem.product.name,
    variantDesc: variantDesc(
      input.campaignItem.variant.grind,
      input.campaignItem.variant.sizeOz
    ),
    quantity,
    unitPrice: input.campaignItem.retailPrice,
    lineTotal: productSubtotalCents,
  };

  const piTail = spec.stripePiId.startsWith("pi_")
    ? spec.stripePiId.slice(3)
    : spec.stripePiId;
  const stripeChargeId = `ch_${piTail}`;

  await database.$transaction(async (tx) => {
    await tx.order.create({
      data: {
        id: orderId,
        orderNumber,
        campaignId: input.campaignId,
        roasterId: input.roasterId,
        buyerId,
        fulfillerType: input.fulfillerType,
        productSubtotal: splits.productSubtotal,
        shippingAmount: splits.shippingAmount,
        grossAmount: splits.grossAmount,
        stripeFee: splits.stripeFee,
        orgPctSnapshot: splits.orgPctSnapshot,
        orgAmount: splits.orgAmount,
        platformAmount: splits.platformAmount,
        roasterAmount: splits.roasterAmount,
        roasterTotal: splits.roasterTotal,
        status: spec.status,
        fulfillBy,
        payoutStatus: "HELD",
        payoutEligibleAt,
        stripePiId: spec.stripePiId,
        stripeChargeId,
        transferGroup: orderId,
        buyerEmail: E2E_SEED_BUYER_EMAIL,
        shipToName: "E2E Seed Buyer",
        shipToAddress1: "123 Seed Street",
        shipToAddress2: null,
        shipToCity: "Portland",
        shipToState: "OR",
        shipToPostalCode: "97201",
        shipToCountry: "US",
        buyerIp: "127.0.0.1",
        trackingNumber: spec.trackingNumber ?? null,
        carrier: spec.carrier ?? null,
        shippedAt:
          spec.status === "SHIPPED" ? new Date(now - 60 * 60 * 1000) : null,
        items: {
          create: [orderItem],
        },
        events: {
          create: [
            {
              eventType: "PAYMENT_INTENT_CREATED",
              actorType: "BUYER",
              ipAddress: "127.0.0.1",
              payload: { stripe_pi_id: spec.stripePiId },
            },
            {
              eventType: "PAYMENT_SUCCEEDED",
              actorType: "SYSTEM",
              payload: { stripe_pi_id: spec.stripePiId },
            },
            ...(spec.status === "SHIPPED"
              ? [
                  {
                    eventType: "SHIPPED" as const,
                    actorType: "ROASTER" as const,
                    actorId: input.roasterId,
                    payload: {
                      carrier: spec.carrier ?? "USPS",
                      tracking_number: spec.trackingNumber ?? "",
                    },
                  },
                ]
              : []),
          ],
        },
      },
    });

    await tx.campaign.update({
      where: { id: input.campaignId },
      data: { totalRaised: { increment: splits.orgAmount } },
    });
  });

  console.log(
    `  Created order ${orderNumber} (${spec.status}) pi=${spec.stripePiId}`
  );
}

async function main() {
  console.log("\n--- Seeding E2E orders ---\n");

  const org = await database.org.findFirst({
    where: { slug: E2E_ORG_SLUG, status: "ACTIVE" },
    select: { id: true },
  });
  if (!org) {
    console.error("  ERROR: No ACTIVE org with slug", E2E_ORG_SLUG);
    process.exit(1);
  }

  const campaign = await database.campaign.findFirst({
    where: { orgId: org.id, status: "ACTIVE" },
    include: {
      items: {
        take: 1,
        include: { product: true, variant: true },
      },
    },
  });

  if (!campaign?.items[0]) {
    console.error("  ERROR: No campaign items for E2E org.");
    process.exit(1);
  }

  const roaster = await database.roaster.findFirst({
    where: { id: campaign.items[0].product.roasterId, status: "ACTIVE" },
    select: { id: true, fulfillerType: true },
  });
  if (!roaster) {
    console.error("  ERROR: Roaster not found for campaign item.");
    process.exit(1);
  }

  const shipping = await database.roasterShippingRate.findFirst({
    where: { roasterId: roaster.id, isDefault: true },
    select: { flatRate: true },
  });
  const shippingFallback = await database.roasterShippingRate.findFirst({
    where: { roasterId: roaster.id },
    orderBy: { flatRate: "asc" },
    select: { flatRate: true },
  });
  const shippingFlat = shipping?.flatRate ?? shippingFallback?.flatRate;
  if (shippingFlat === undefined) {
    console.error("  ERROR: No shipping rate for roaster — run seed-e2e-roaster.");
    process.exit(1);
  }

  const settings = await database.platformSettings.findUniqueOrThrow({
    where: { id: "singleton" },
  });

  const payload = {
    campaignId: campaign.id,
    roasterId: roaster.id,
    fulfillerType: roaster.fulfillerType,
    campaignItem: campaign.items[0],
    shippingFlatCents: shippingFlat,
    orgPct: campaign.orgPct,
    settings: {
      platformFeePct: settings.platformFeePct,
      platformFeeFloor: settings.platformFeeFloor,
      orgPctMin: settings.orgPctMin,
      orgPctMax: settings.orgPctMax,
      slaBreachHours: settings.slaBreachHours,
      payoutHoldDays: settings.payoutHoldDays,
    },
  };

  await seedOneOrder(
    { stripePiId: E2E_SEED_ORDER_PI_CONFIRMED, status: "CONFIRMED" },
    payload
  );
  await seedOneOrder(
    {
      stripePiId: E2E_SEED_ORDER_PI_SHIPPED,
      status: "SHIPPED",
      trackingNumber: "9400111899223344556677",
      carrier: "USPS",
    },
    payload
  );

  console.log("\n--- E2E orders seed done ---\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

/**
 * Seeds a fully ACTIVE roaster with products, variants, and shipping rates
 * for Sprint 3 E2E testing.
 *
 * Usage:
 *   cd packages/db && bun run ./scripts/seed-e2e-roaster.ts
 */
import "../load-env-bootstrap";

import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import ws from "ws";
import { PrismaClient } from "../generated/client";

import { E2E_ROASTER_EMAIL } from "./e2e-seed-constants";

neonConfig.webSocketConstructor = ws;

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is missing.");
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: url }),
});

async function main() {
  const email = E2E_ROASTER_EMAIL;

  console.log("\n--- Seeding E2E Roaster ---\n");

  const app = await prisma.roasterApplication.upsert({
    where: { email },
    create: {
      status: "APPROVED",
      email,
      contactName: "E2E Test Roaster",
      businessName: "Sunrise Coffee Roasters",
      city: "Portland",
      state: "OR",
      termsAgreedAt: new Date(),
      termsVersion: "1.0",
    },
    update: {},
  });
  console.log("  RoasterApplication:", app.id, "status:", app.status);

  const stripeAccountId = `acct_e2e_roaster_${app.id.slice(0, 8)}`;

  const roaster = await prisma.roaster.upsert({
    where: { applicationId: app.id },
    create: {
      applicationId: app.id,
      status: "ACTIVE",
      email,
      stripeOnboarding: "COMPLETE",
      chargesEnabled: true,
      payoutsEnabled: true,
      fulfillerType: "ROASTER",
      stripeAccountId,
    },
    update: {
      status: "ACTIVE",
      stripeOnboarding: "COMPLETE",
      chargesEnabled: true,
      payoutsEnabled: true,
      stripeAccountId,
    },
  });
  console.log("  Roaster:", roaster.id, "status:", roaster.status);

  const user = await prisma.user.upsert({
    where: { email },
    create: {
      externalAuthId: `clerk_pending:${roaster.id}`,
      email,
      role: "ROASTER_ADMIN",
      roasterId: roaster.id,
    },
    update: {},
  });
  console.log("  User:", user.id);

  const products = [
    {
      name: "Morning Sunrise Blend",
      description:
        "A bright, citrusy medium roast perfect for morning brewing.",
      origin: "Ethiopia / Colombia",
      roastLevel: "MEDIUM" as const,
      variants: [
        {
          sizeOz: 12,
          grind: "WHOLE_BEAN" as const,
          retailPrice: 1899,
          wholesalePrice: 1100,
        },
        {
          sizeOz: 12,
          grind: "GROUND_DRIP" as const,
          retailPrice: 1899,
          wholesalePrice: 1100,
        },
        {
          sizeOz: 16,
          grind: "WHOLE_BEAN" as const,
          retailPrice: 2399,
          wholesalePrice: 1400,
        },
      ],
    },
    {
      name: "Dark Roast Reserve",
      description:
        "Bold and smoky with chocolate undertones. Our signature dark roast.",
      origin: "Sumatra",
      roastLevel: "DARK" as const,
      variants: [
        {
          sizeOz: 12,
          grind: "WHOLE_BEAN" as const,
          retailPrice: 2099,
          wholesalePrice: 1250,
        },
        {
          sizeOz: 12,
          grind: "GROUND_ESPRESSO" as const,
          retailPrice: 2099,
          wholesalePrice: 1250,
        },
      ],
    },
    {
      name: "Single Origin Kenya AA",
      description:
        "Juicy blackcurrant and grapefruit notes from high-altitude Kenyan farms.",
      origin: "Kenya",
      roastLevel: "LIGHT" as const,
      variants: [
        {
          sizeOz: 12,
          grind: "WHOLE_BEAN" as const,
          retailPrice: 2499,
          wholesalePrice: 1500,
        },
      ],
    },
  ];

  for (const p of products) {
    const existing = await prisma.product.findFirst({
      where: { roasterId: roaster.id, name: p.name, deletedAt: null },
    });

    const product =
      existing ??
      (await prisma.product.create({
        data: {
          roasterId: roaster.id,
          name: p.name,
          description: p.description,
          origin: p.origin,
          roastLevel: p.roastLevel,
          status: "ACTIVE",
        },
      }));
    console.log("  Product:", product.name, product.id);

    for (const v of p.variants) {
      const existingVariant = await prisma.productVariant.findFirst({
        where: {
          productId: product.id,
          sizeOz: v.sizeOz,
          grind: v.grind,
          deletedAt: null,
        },
      });
      if (existingVariant) {
        console.log(
          "    Variant:",
          v.sizeOz,
          "oz",
          v.grind,
          "→ already exists"
        );
      } else {
        const variant = await prisma.productVariant.create({
          data: {
            productId: product.id,
            sizeOz: v.sizeOz,
            grind: v.grind,
            retailPrice: v.retailPrice,
            wholesalePrice: v.wholesalePrice,
            isAvailable: true,
          },
        });
        console.log("    Variant:", v.sizeOz, "oz", v.grind, "→", variant.id);
      }
    }
  }

  const existingRate = await prisma.roasterShippingRate.findFirst({
    where: { roasterId: roaster.id },
  });
  if (existingRate) {
    console.log("  ShippingRates: already exist for this roaster");
  } else {
    const rate1 = await prisma.roasterShippingRate.create({
      data: {
        roasterId: roaster.id,
        label: "Standard Shipping",
        carrier: "USPS",
        flatRate: 595,
        isDefault: true,
      },
    });
    console.log("  ShippingRate:", rate1.label, rate1.id, "(default)");

    const rate2 = await prisma.roasterShippingRate.create({
      data: {
        roasterId: roaster.id,
        label: "Priority Shipping",
        carrier: "USPS",
        flatRate: 995,
        isDefault: false,
      },
    });
    console.log("  ShippingRate:", rate2.label, rate2.id);
  }

  console.log("\n--- E2E Roaster seeded successfully ---");
  console.log("  Roaster ID:", roaster.id);
  console.log("  Business:   Sunrise Coffee Roasters");
  console.log("  Status:     ACTIVE (Stripe Connect complete)");
  console.log("  Products:   3 (6 variants total)");
  console.log("  Shipping:   2 rates (Standard $5.95, Priority $9.95)\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

/**
 * Verifies the production smoke lane tenant exists and is checkout-ready.
 *
 * Usage:
 *   PRISMA_DATABASE_PROFILE=production pnpm smoke-lane:verify
 */
import "../load-env-bootstrap";

import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import ws from "ws";
import { PrismaClient } from "../generated/client";
import { assertProdDatabaseUrl } from "./assert-prod-database-url";
import {
  SMOKE_LANE_ORG_SLUG,
  SMOKE_LANE_ROASTER_EMAIL,
} from "./smoke-lane-constants";

neonConfig.webSocketConstructor = ws;

assertProdDatabaseUrl();

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is missing.");
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: url }),
});

function fail(message: string): never {
  console.error(`  FAIL: ${message}`);
  process.exit(1);
}

async function main() {
  console.log("\n--- Smoke lane verify ---\n");

  const roaster = await prisma.roaster.findFirst({
    where: { email: SMOKE_LANE_ROASTER_EMAIL, status: "ACTIVE" },
    select: {
      id: true,
      stripeAccountId: true,
      chargesEnabled: true,
      payoutsEnabled: true,
      stripeOnboarding: true,
    },
  });
  if (!roaster) {
    fail(`no ACTIVE roaster with email ${SMOKE_LANE_ROASTER_EMAIL} — run db:seed:smoke-lane:prod`);
  }
  if (!roaster.stripeAccountId?.startsWith("acct_")) {
    fail("roaster missing live stripeAccountId");
  }
  if (roaster.stripeAccountId.includes("e2e")) {
    fail("roaster stripeAccountId looks like E2E placeholder");
  }
  if (!roaster.chargesEnabled || !roaster.payoutsEnabled) {
    fail("roaster Connect flags not enabled");
  }
  console.log("  Roaster:", roaster.id, roaster.stripeAccountId);

  const shippingCount = await prisma.roasterShippingRate.count({
    where: { roasterId: roaster.id },
  });
  if (shippingCount === 0) {
    fail("roaster has no shipping rates");
  }

  const variantCount = await prisma.productVariant.count({
    where: {
      product: { roasterId: roaster.id, status: "ACTIVE", deletedAt: null },
      isAvailable: true,
      deletedAt: null,
    },
  });
  if (variantCount === 0) {
    fail("roaster has no active product variants");
  }
  console.log(`  Products: ${variantCount} active variant(s), ${shippingCount} shipping rate(s)`);

  const org = await prisma.org.findFirst({
    where: { slug: SMOKE_LANE_ORG_SLUG, status: "ACTIVE" },
    select: {
      id: true,
      slug: true,
      stripeAccountId: true,
      chargesEnabled: true,
      payoutsEnabled: true,
    },
  });
  if (!org) {
    fail(`no ACTIVE org with slug ${SMOKE_LANE_ORG_SLUG}`);
  }
  if (!org.stripeAccountId?.startsWith("acct_")) {
    fail("org missing live stripeAccountId");
  }
  console.log("  Org:", org.id, org.slug, org.stripeAccountId);

  const campaign = await prisma.campaign.findFirst({
    where: { orgId: org.id, status: "ACTIVE" },
    orderBy: { updatedAt: "desc" },
    select: { id: true, name: true },
  });
  if (!campaign) {
    fail("no ACTIVE campaign on smoke lane org");
  }

  const itemCount = await prisma.campaignItem.count({
    where: { campaignId: campaign.id },
  });
  if (itemCount === 0) {
    fail("campaign has no items");
  }
  console.log(`  Campaign: "${campaign.name}" (${itemCount} items)`);

  console.log("\n  PASS — smoke lane is ready for Browserbase live smoke.");
  console.log(`  Storefront: https://joeperks.com/en/${SMOKE_LANE_ORG_SLUG}\n`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

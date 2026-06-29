/**
 * Seeds the production smoke lane: ACTIVE roaster + org + campaign on Neon main.
 *
 * Requires live Connect account ids (no test-mode auto-create, no placeholders).
 *
 * Usage (via pnpm db:seed:smoke-lane:prod):
 *   JOE_PERKS_CONFIRM_SMOKE_LANE_SEED=1
 *   SMOKE_LANE_ROASTER_STRIPE_ACCOUNT_ID=acct_...
 *   SMOKE_LANE_ORG_STRIPE_ACCOUNT_ID=acct_...
 */
import { randomUUID } from "node:crypto";

import "../load-env-bootstrap";

import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import ws from "ws";
import { PrismaClient } from "../generated/client";
import { assertProdDatabaseUrl } from "./assert-prod-database-url";
import {
  SMOKE_LANE_CAMPAIGN_NAME,
  SMOKE_LANE_ORG_EMAIL,
  SMOKE_LANE_ORG_NAME,
  SMOKE_LANE_ORG_SLUG,
  SMOKE_LANE_ROASTER_BUSINESS_NAME,
  SMOKE_LANE_ROASTER_EMAIL,
} from "./smoke-lane-constants";

neonConfig.webSocketConstructor = ws;

if (process.env.JOE_PERKS_CONFIRM_SMOKE_LANE_SEED !== "1") {
  console.error(
    "Refusing: set JOE_PERKS_CONFIRM_SMOKE_LANE_SEED=1 (see docs/runbooks/prod-smoke-lane.md)."
  );
  process.exit(1);
}

assertProdDatabaseUrl();

function requireLiveConnectAccountId(
  envVar: "SMOKE_LANE_ROASTER_STRIPE_ACCOUNT_ID" | "SMOKE_LANE_ORG_STRIPE_ACCOUNT_ID",
  label: string
): string {
  const id = process.env[envVar]?.trim();
  if (!id?.startsWith("acct_")) {
    console.error(`  ERROR: ${envVar} must be a live Stripe Connect account id (acct_...).`);
    console.error(`  Onboard ${label} in Stripe live mode first, then re-run.`);
    process.exit(1);
  }
  if (id.includes("e2e") || id.includes("placeholder")) {
    console.error(`  ERROR: ${envVar} looks like a test/placeholder id — use live Connect.`);
    process.exit(1);
  }
  return id;
}

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is missing.");
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: url }),
});

const ROASTER_STRIPE_ACCOUNT_ID = requireLiveConnectAccountId(
  "SMOKE_LANE_ROASTER_STRIPE_ACCOUNT_ID",
  "smoke lane roaster"
);
const ORG_STRIPE_ACCOUNT_ID = requireLiveConnectAccountId(
  "SMOKE_LANE_ORG_STRIPE_ACCOUNT_ID",
  "smoke lane org"
);

const products = [
  {
    name: "Smoke Lane Morning Blend",
    description: "Internal-only medium roast for pre-beta live checkout proof.",
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
    ],
  },
  {
    name: "Smoke Lane Dark Reserve",
    description: "Internal-only dark roast for smoke lane verification.",
    origin: "Sumatra",
    roastLevel: "DARK" as const,
    variants: [
      {
        sizeOz: 12,
        grind: "WHOLE_BEAN" as const,
        retailPrice: 2099,
        wholesalePrice: 1250,
      },
    ],
  },
];

async function seedRoaster() {
  console.log("\n--- Smoke lane roaster ---\n");

  const app = await prisma.roasterApplication.upsert({
    where: { email: SMOKE_LANE_ROASTER_EMAIL },
    create: {
      status: "APPROVED",
      email: SMOKE_LANE_ROASTER_EMAIL,
      contactName: "Internal Smoke Roaster Admin",
      businessName: SMOKE_LANE_ROASTER_BUSINESS_NAME,
      city: "Portland",
      state: "OR",
      termsAgreedAt: new Date(),
      termsVersion: "1.0",
    },
    update: { status: "APPROVED" },
  });
  console.log("  RoasterApplication:", app.id);

  const roaster = await prisma.roaster.upsert({
    where: { applicationId: app.id },
    create: {
      applicationId: app.id,
      status: "ACTIVE",
      email: SMOKE_LANE_ROASTER_EMAIL,
      stripeOnboarding: "COMPLETE",
      chargesEnabled: true,
      payoutsEnabled: true,
      fulfillerType: "ROASTER",
      stripeAccountId: ROASTER_STRIPE_ACCOUNT_ID,
    },
    update: {
      status: "ACTIVE",
      stripeOnboarding: "COMPLETE",
      chargesEnabled: true,
      payoutsEnabled: true,
      stripeAccountId: ROASTER_STRIPE_ACCOUNT_ID,
    },
  });
  console.log("  Roaster:", roaster.id, "stripe:", roaster.stripeAccountId);

  const user = await prisma.user.upsert({
    where: { email: SMOKE_LANE_ROASTER_EMAIL },
    create: {
      externalAuthId: `clerk_pending:${roaster.id}`,
      email: SMOKE_LANE_ROASTER_EMAIL,
      role: "ROASTER_ADMIN",
      roasterId: roaster.id,
    },
    update: { roasterId: roaster.id },
  });
  console.log("  Roaster admin User:", user.id);

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
    console.log("  Product:", product.name);

    for (const v of p.variants) {
      const existingVariant = await prisma.productVariant.findFirst({
        where: {
          productId: product.id,
          sizeOz: v.sizeOz,
          grind: v.grind,
          deletedAt: null,
        },
      });
      if (!existingVariant) {
        await prisma.productVariant.create({
          data: {
            productId: product.id,
            sizeOz: v.sizeOz,
            grind: v.grind,
            retailPrice: v.retailPrice,
            wholesalePrice: v.wholesalePrice,
            isAvailable: true,
          },
        });
      }
    }
  }

  const existingRate = await prisma.roasterShippingRate.findFirst({
    where: { roasterId: roaster.id },
  });
  if (existingRate) {
    console.log("  ShippingRate: already exists");
  } else {
    await prisma.roasterShippingRate.create({
      data: {
        roasterId: roaster.id,
        label: "Smoke Lane Standard",
        carrier: "USPS",
        flatRate: 595,
        isDefault: true,
      },
    });
    console.log("  ShippingRate: Smoke Lane Standard (default)");
  }

  return roaster;
}

async function seedOrg(roasterId: string) {
  console.log("\n--- Smoke lane org + campaign ---\n");

  const orgApp = await prisma.orgApplication.upsert({
    where: { email: SMOKE_LANE_ORG_EMAIL },
    create: {
      status: "APPROVED",
      email: SMOKE_LANE_ORG_EMAIL,
      orgName: SMOKE_LANE_ORG_NAME,
      contactName: "Internal Smoke Org Admin",
      phone: "555-0199",
      description:
        "Isolated production tenant for pre-beta live checkout / fulfillment smoke only.",
      desiredSlug: SMOKE_LANE_ORG_SLUG,
      desiredOrgPct: 0.15,
      termsAgreedAt: new Date(),
      termsVersion: "1.0",
    },
    update: { status: "APPROVED" },
  });
  console.log("  OrgApplication:", orgApp.id);

  const existingRequest = await prisma.roasterOrgRequest.findUnique({
    where: {
      applicationId_roasterId: {
        applicationId: orgApp.id,
        roasterId,
      },
    },
  });

  const orgRequest =
    existingRequest ??
    (await prisma.roasterOrgRequest.create({
      data: {
        applicationId: orgApp.id,
        roasterId,
        status: "APPROVED",
        priority: 1,
      },
    }));

  if (existingRequest && existingRequest.status !== "APPROVED") {
    await prisma.roasterOrgRequest.update({
      where: { id: existingRequest.id },
      data: { status: "APPROVED" },
    });
  }
  console.log("  RoasterOrgRequest:", orgRequest.id);

  const org = await prisma.org.upsert({
    where: { applicationId: orgApp.id },
    create: {
      applicationId: orgApp.id,
      status: "ACTIVE",
      email: SMOKE_LANE_ORG_EMAIL,
      slug: SMOKE_LANE_ORG_SLUG,
      stripeAccountId: ORG_STRIPE_ACCOUNT_ID,
      stripeOnboarding: "COMPLETE",
      chargesEnabled: true,
      payoutsEnabled: true,
    },
    update: {
      status: "ACTIVE",
      slug: SMOKE_LANE_ORG_SLUG,
      stripeAccountId: ORG_STRIPE_ACCOUNT_ID,
      stripeOnboarding: "COMPLETE",
      chargesEnabled: true,
      payoutsEnabled: true,
    },
  });
  console.log("  Org:", org.id, "slug:", org.slug);

  const orgUser = await prisma.user.upsert({
    where: { email: SMOKE_LANE_ORG_EMAIL },
    create: {
      externalAuthId: `clerk_pending:${randomUUID()}`,
      email: SMOKE_LANE_ORG_EMAIL,
      role: "ORG_ADMIN",
      orgId: org.id,
    },
    update: { orgId: org.id },
  });
  console.log("  Org admin User:", orgUser.id);

  const roasterProducts = await prisma.product.findMany({
    where: { roasterId, status: "ACTIVE", deletedAt: null },
    include: {
      variants: {
        where: { isAvailable: true, deletedAt: null },
        orderBy: [{ sizeOz: "asc" }, { grind: "asc" }],
      },
    },
    orderBy: { name: "asc" },
  });

  const variantCount = roasterProducts.reduce(
    (sum, p) => sum + p.variants.length,
    0
  );
  if (variantCount === 0) {
    console.error("  ERROR: no active variants on smoke lane roaster.");
    process.exit(1);
  }

  const existingCampaign = await prisma.campaign.findFirst({
    where: { orgId: org.id },
    orderBy: { updatedAt: "desc" },
  });

  const campaign =
    existingCampaign ??
    (await prisma.campaign.create({
      data: {
        orgId: org.id,
        name: SMOKE_LANE_CAMPAIGN_NAME,
        status: "ACTIVE",
        orgPct: 0.15,
        goalCents: 50_000,
      },
    }));

  if (existingCampaign && existingCampaign.status !== "ACTIVE") {
    await prisma.campaign.update({
      where: { id: existingCampaign.id },
      data: { status: "ACTIVE" },
    });
  }
  console.log("  Campaign:", campaign.name, campaign.id);

  let created = 0;
  let existing = 0;
  for (const product of roasterProducts) {
    const isFeatured = product.name === "Smoke Lane Morning Blend";
    for (const variant of product.variants) {
      const row = await prisma.campaignItem.findUnique({
        where: {
          campaignId_variantId: {
            campaignId: campaign.id,
            variantId: variant.id,
          },
        },
      });
      if (row) {
        existing++;
      } else {
        await prisma.campaignItem.create({
          data: {
            campaignId: campaign.id,
            productId: product.id,
            variantId: variant.id,
            retailPrice: variant.retailPrice,
            wholesalePrice: variant.wholesalePrice,
            isFeatured,
          },
        });
        created++;
      }
    }
  }
  console.log(`  CampaignItems: ${created} created, ${existing} existed`);

  return { campaign, org };
}

async function main() {
  console.log("\n=== Production smoke lane seed ===");
  console.log(`  Org slug: ${SMOKE_LANE_ORG_SLUG}`);
  console.log(`  Storefront: https://joeperks.com/en/${SMOKE_LANE_ORG_SLUG}\n`);

  const roaster = await seedRoaster();
  const { org } = await seedOrg(roaster.id);

  console.log("\n--- Smoke lane ready ---");
  console.log(`  Roaster id: ${roaster.id}`);
  console.log(`  Org id:     ${org.id}`);
  console.log(`  Slug:       ${SMOKE_LANE_ORG_SLUG}`);
  console.log("\n  Next: pnpm smoke-lane:verify");
  console.log(
    "  Then:  JOE_PERKS_CONFIRM_LIVE_MONEY_PATH=1 pnpm test:e2e:browserbase:live-smoke\n"
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

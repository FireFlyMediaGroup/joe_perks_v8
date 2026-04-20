/**
 * Seeds a fully ACTIVE org with an approved application, campaign, and
 * campaign items for E2E testing of the org storefront and dashboard.
 *
 * Prerequisites:
 *   - seed-e2e-roaster.ts must have been run first (needs ACTIVE roaster + products)
 *   - PlatformSettings + OrderSequence singletons (prisma db seed)
 *
 * Usage:
 *   cd packages/db && bun run ./scripts/seed-e2e-org.ts
 *
 * After seeding, the storefront is accessible at:
 *   http://localhost:3000/en/e2e-test-org
 */
import { randomUUID } from "node:crypto";

import "../load-env-bootstrap";

import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import ws from "ws";
import { PrismaClient } from "../generated/client";

neonConfig.webSocketConstructor = ws;

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is missing.");
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: url }),
});

const ORG_EMAIL = "wearefireflymedia@gmail.com";
const ORG_SLUG = "e2e-test-org";
const ROASTER_EMAIL = "e2e-roaster@joeperks.test";

async function main() {
  console.log("\n--- Seeding E2E Org ---\n");

  // 1. Find the E2E roaster (must exist from seed-e2e-roaster.ts)
  const roaster = await prisma.roaster.findFirst({
    where: { email: ROASTER_EMAIL, status: "ACTIVE" },
    select: { id: true, email: true },
  });

  if (!roaster) {
    console.error("  ERROR: No ACTIVE roaster found with email", ROASTER_EMAIL);
    console.error(
      "  Run seed-e2e-roaster.ts first: bun run ./scripts/seed-e2e-roaster.ts"
    );
    process.exit(1);
  }
  console.log("  Found roaster:", roaster.id);

  // 2. OrgApplication (approved)
  const orgApp = await prisma.orgApplication.upsert({
    where: { email: ORG_EMAIL },
    create: {
      status: "APPROVED",
      email: ORG_EMAIL,
      orgName: "E2E Test Organization",
      contactName: "Jane E2E Smith",
      phone: "555-0200",
      description:
        "A test organization for full E2E testing of the org storefront and dashboard.",
      desiredSlug: ORG_SLUG,
      desiredOrgPct: 0.15,
      termsAgreedAt: new Date(),
      termsVersion: "1.0",
    },
    update: { status: "APPROVED" },
  });
  console.log("  OrgApplication:", orgApp.id, "status:", orgApp.status);

  // 3. RoasterOrgRequest (approved partnership)
  const existingRequest = await prisma.roasterOrgRequest.findUnique({
    where: {
      applicationId_roasterId: {
        applicationId: orgApp.id,
        roasterId: roaster.id,
      },
    },
  });

  const orgRequest =
    existingRequest ??
    (await prisma.roasterOrgRequest.create({
      data: {
        applicationId: orgApp.id,
        roasterId: roaster.id,
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
  console.log("  RoasterOrgRequest:", orgRequest.id, "status: APPROVED");

  // 4. Org (active with simulated Stripe Connect)
  const org = await prisma.org.upsert({
    where: { applicationId: orgApp.id },
    create: {
      applicationId: orgApp.id,
      status: "ACTIVE",
      email: ORG_EMAIL,
      slug: ORG_SLUG,
      stripeAccountId: `acct_e2e_org_${orgApp.id.slice(0, 8)}`,
      stripeOnboarding: "COMPLETE",
      chargesEnabled: true,
      payoutsEnabled: true,
    },
    update: {
      status: "ACTIVE",
      stripeOnboarding: "COMPLETE",
      chargesEnabled: true,
      payoutsEnabled: true,
    },
  });
  console.log("  Org:", org.id, "slug:", org.slug, "status:", org.status);

  // 5. ORG_ADMIN user (clerk_pending — merges on first Clerk sign-in)
  const orgUser = await prisma.user.upsert({
    where: { email: ORG_EMAIL },
    create: {
      externalAuthId: `clerk_pending:${randomUUID()}`,
      email: ORG_EMAIL,
      role: "ORG_ADMIN",
      orgId: org.id,
    },
    update: { orgId: org.id },
  });
  console.log("  User:", orgUser.id, "role:", orgUser.role);

  // 6. Load roaster products + variants for campaign items
  const products = await prisma.product.findMany({
    where: { roasterId: roaster.id, status: "ACTIVE", deletedAt: null },
    include: {
      variants: {
        where: { isAvailable: true, deletedAt: null },
        orderBy: [{ sizeOz: "asc" }, { grind: "asc" }],
      },
    },
    orderBy: { name: "asc" },
  });

  const totalVariants = products.reduce((sum, p) => sum + p.variants.length, 0);
  if (totalVariants === 0) {
    console.error("  ERROR: No active product variants found for roaster.");
    console.error("  Ensure seed-e2e-roaster.ts created products.");
    process.exit(1);
  }
  console.log(
    `  Found ${products.length} products with ${totalVariants} variants`
  );

  // 7. Campaign (active)
  const existingCampaign = await prisma.campaign.findFirst({
    where: { orgId: org.id },
    orderBy: { updatedAt: "desc" },
  });

  const campaign =
    existingCampaign ??
    (await prisma.campaign.create({
      data: {
        orgId: org.id,
        name: "E2E Test Fundraiser",
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
  console.log(
    "  Campaign:",
    campaign.id,
    `"${campaign.name}"`,
    "status:",
    campaign.status === "ACTIVE" ? "ACTIVE" : "→ ACTIVE"
  );

  // 8. CampaignItems — link all variants with price snapshots
  let itemsCreated = 0;
  let itemsExisting = 0;

  for (const product of products) {
    const isFeatured = product.name === "Morning Sunrise Blend";

    for (const variant of product.variants) {
      const existing = await prisma.campaignItem.findUnique({
        where: {
          campaignId_variantId: {
            campaignId: campaign.id,
            variantId: variant.id,
          },
        },
      });

      if (existing) {
        itemsExisting++;
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
        itemsCreated++;
      }
    }
  }
  console.log(
    `  CampaignItems: ${itemsCreated} created, ${itemsExisting} already existed`
  );

  // Summary
  console.log("\n--- E2E Org seeded successfully ---");
  console.log("  Org ID:      ", org.id);
  console.log("  Org slug:    ", org.slug);
  console.log("  Org email:   ", ORG_EMAIL);
  console.log("  Org status:   ACTIVE (Stripe Connect simulated)");
  console.log("  Campaign:    ", campaign.name);
  console.log(
    `  Items:        ${itemsCreated + itemsExisting} campaign items (${totalVariants} variants)`
  );
  console.log("  User:        ", orgUser.id, `(${orgUser.role})`);
  console.log("");
  console.log(`  Storefront:   http://localhost:3000/en/${ORG_SLUG}`);
  console.log("  Org portal:   http://localhost:3002 (needs Clerk auth)");
  console.log("");
  console.log("  To connect Clerk, update the User's externalAuthId:");
  console.log(
    `    UPDATE "User" SET "externalAuthId" = '<clerk-user-id>' WHERE email = '${ORG_EMAIL}';`
  );
  console.log("");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

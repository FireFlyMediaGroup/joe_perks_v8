import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import "../load-env-bootstrap";

import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import ws from "ws";
import { PrismaClient } from "../generated/client";

import { E2E_ORG_SLUG } from "./e2e-seed-constants";

const ORG_SLUG = E2E_ORG_SLUG;

const GRIND_LABELS: Record<string, string> = {
  WHOLE_BEAN: "Whole bean",
  GROUND_DRIP: "Ground — drip",
  GROUND_ESPRESSO: "Ground — espresso",
  GROUND_FRENCH_PRESS: "Ground — french press",
};

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
  const org = await prisma.org.findFirst({
    where: {
      slug: ORG_SLUG,
      status: "ACTIVE",
    },
    select: { id: true },
  });

  if (!org) {
    throw new Error("Missing active org for Playwright frontend E2E");
  }

  const campaign = await prisma.campaign.findFirst({
    where: {
      items: {
        some: {
          product: {
            deletedAt: null,
            roaster: { status: "ACTIVE" },
            status: "ACTIVE",
          },
          variant: { deletedAt: null, isAvailable: true },
        },
      },
      orgId: org.id,
      status: "ACTIVE",
    },
    include: {
      items: {
        where: {
          product: {
            deletedAt: null,
            roaster: { status: "ACTIVE" },
            status: "ACTIVE",
          },
          variant: { deletedAt: null, isAvailable: true },
        },
        include: {
          product: true,
          variant: true,
        },
        orderBy: [{ isFeatured: "desc" }, { id: "asc" }],
      },
    },
  });

  if (!campaign || campaign.items.length === 0) {
    throw new Error(
      "Missing seeded campaign/items for Playwright frontend E2E"
    );
  }

  const firstItem = campaign.items[0];
  if (!firstItem) {
    throw new Error("Missing first campaign item for Playwright frontend E2E");
  }

  const generatedDir = resolve(
    process.cwd(),
    "../../tests/e2e/frontend/.generated"
  );
  mkdirSync(generatedDir, { recursive: true });
  writeFileSync(
    resolve(generatedDir, "fixtures.json"),
    JSON.stringify(
      {
        cartState: {
          activeCampaignId: campaign.id,
          activeOrgSlug: ORG_SLUG,
          lines: [
            {
              campaignItemId: firstItem.id,
              imageUrl: firstItem.product.imageUrl ?? undefined,
              productName: firstItem.product.name,
              quantity: 1,
              retailPrice: firstItem.retailPrice,
              variantDesc: `${firstItem.variant.sizeOz} oz · ${GRIND_LABELS[firstItem.variant.grind] ?? firstItem.variant.grind}`,
            },
          ],
        },
        slug: ORG_SLUG,
      },
      null,
      2
    )
  );

  console.log("Playwright frontend fixtures written.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

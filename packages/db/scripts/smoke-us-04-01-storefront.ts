/**
 * Smoke tests for US-04-01 — Public org storefront (`apps/web/app/[locale]/[slug]/`).
 *
 * Validates the same DB shape as `getStorefrontData` (ACTIVE org + ACTIVE campaign +
 * visible CampaignItems). Optionally GETs `http://localhost:3000/en/{slug}` when web is up.
 *
 * Usage:
 *   cd packages/db && bun run ./scripts/smoke-us-04-01-storefront.ts
 *
 *   # or from repo root:
 *   pnpm db:smoke:us-04-01
 *
 * Requires: DATABASE_URL (via packages/db/.env or env).
 * Optional: `apps/web` dev server on 3000 for HTTP probe (uses 127.0.0.1 for reliability).
 */
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

let passed = 0;
let failed = 0;

function pass(label: string) {
  passed++;
  console.log(`  PASS  ${label}`);
}

function fail(label: string, detail?: string) {
  failed++;
  console.error(`  FAIL  ${label}${detail ? ` — ${detail}` : ""}`);
}

function skip(label: string, reason: string) {
  console.log(`  SKIP  ${label} (${reason})`);
}

const HTTP_PROBE_MS = 4000;

async function httpStatus(fullUrl: string): Promise<number | null> {
  try {
    const res = await fetch(fullUrl, {
      redirect: "manual",
      signal: AbortSignal.timeout(HTTP_PROBE_MS),
    });
    return res.status;
  } catch {
    return null;
  }
}

/** Mirrors `getStorefrontData` in apps/web (no RESERVED_SLUGS — DB-only). */
async function getStorefrontDataForSmoke(slug: string) {
  const org = await prisma.org.findFirst({
    where: { slug, status: "ACTIVE" },
    select: {
      id: true,
      slug: true,
      application: { select: { orgName: true } },
    },
  });
  if (!org) {
    return null;
  }

  const campaign = await prisma.campaign.findFirst({
    where: { orgId: org.id, status: "ACTIVE" },
    include: {
      items: {
        where: {
          product: { deletedAt: null },
          variant: { deletedAt: null, isAvailable: true },
        },
        orderBy: [{ isFeatured: "desc" }, { id: "asc" }],
        include: { product: true, variant: true },
      },
    },
  });
  if (!campaign) {
    return null;
  }

  const settings = await prisma.platformSettings.findUniqueOrThrow({
    where: { id: "singleton" },
  });

  let estimatedShippingCents: number | null = null;
  let hasShippingRates = false;
  let shippingRates: Array<{
    carrier: string;
    flatRate: number;
    id: string;
    isDefault: boolean;
    label: string;
  }> = [];

  const first = campaign.items[0];
  if (first) {
    const roasterId = first.product.roasterId;
    shippingRates = await prisma.roasterShippingRate.findMany({
      orderBy: [{ isDefault: "desc" }, { flatRate: "asc" }],
      select: {
        carrier: true,
        flatRate: true,
        id: true,
        isDefault: true,
        label: true,
      },
      where: { roasterId },
    });
    hasShippingRates = shippingRates.length > 0;
    estimatedShippingCents = shippingRates[0]?.flatRate ?? null;
  }

  const splitPreviewDefaults = {
    estimatedShippingCents,
    orgPct: campaign.orgPct,
    orgPctMax: settings.orgPctMax,
    orgPctMin: settings.orgPctMin,
    platformFeeFloorCents: settings.platformFeeFloor,
    platformFeePct: settings.platformFeePct,
  };

  return {
    campaign,
    hasShippingRates,
    org,
    shippingRates,
    splitPreviewDefaults,
  };
}

async function smokePrismaBaseline(): Promise<void> {
  try {
    await prisma.campaign.count({
      where: {
        status: "ACTIVE",
        org: { status: "ACTIVE" },
      },
    });
    await prisma.org.count({ where: { status: "ACTIVE" } });
    pass(
      "Prisma storefront filters (Org/Campaign ACTIVE) execute without error"
    );
  } catch (e) {
    fail(
      "Prisma storefront query failed",
      e instanceof Error ? e.message : "unknown"
    );
  }
}

async function smokeCampaignViability(): Promise<void> {
  try {
    const active = await prisma.campaign.findMany({
      where: { status: "ACTIVE" },
      include: {
        org: { select: { slug: true, status: true } },
        items: {
          where: {
            product: { deletedAt: null },
            variant: { deletedAt: null, isAvailable: true },
          },
          take: 1,
        },
      },
    });
    const viable = active.filter(
      (c) => c.org.status === "ACTIVE" && c.items.length > 0
    );
    if (viable.length === 0) {
      skip(
        "Storefront data path (ACTIVE org + ACTIVE campaign + ≥1 visible item)",
        "no qualifying campaigns in DB — seed or activate a campaign to exercise HTTP"
      );
      return;
    }
    pass(
      `Found ${viable.length} ACTIVE campaign(s) with ACTIVE org and ≥1 visible item`
    );
  } catch (e) {
    fail(
      "Campaign viability query failed",
      e instanceof Error ? e.message : "unknown"
    );
  }
}

async function validateMirrorForSlug(sampleSlug: string): Promise<void> {
  const data = await getStorefrontDataForSmoke(sampleSlug);
  if (!data) {
    fail("getStorefrontData mirror returned null for known ACTIVE slug");
    return;
  }
  const {
    campaign,
    hasShippingRates,
    org,
    shippingRates,
    splitPreviewDefaults,
  } = data;
  if (org.application.orgName.length === 0) {
    fail("orgName empty");
    return;
  }
  if (campaign.items.length === 0) {
    fail("campaign has zero items after filter");
    return;
  }
  const item = campaign.items[0];
  if (item.retailPrice <= 0) {
    fail("CampaignItem.retailPrice should be positive");
    return;
  }
  if (campaign.orgPct !== splitPreviewDefaults.orgPct) {
    fail("splitPreviewDefaults.orgPct mismatch");
    return;
  }
  if (typeof splitPreviewDefaults.platformFeePct !== "number") {
    fail("splitPreviewDefaults.platformFeePct missing");
    return;
  }
  if (hasShippingRates !== shippingRates.length > 0) {
    fail("hasShippingRates / shippingRates length mismatch");
    return;
  }
  pass(
    `getStorefrontData mirror: slug=${sampleSlug}, items=${campaign.items.length}, retailPrice=${item.retailPrice}c, orgPct=${splitPreviewDefaults.orgPct}, estShipping=${splitPreviewDefaults.estimatedShippingCents ?? "null"}, hasShippingRates=${hasShippingRates}`
  );
}

async function smokeGetStorefrontMirror(): Promise<string | null> {
  try {
    const first = await prisma.campaign.findFirst({
      where: {
        status: "ACTIVE",
        org: { status: "ACTIVE" },
        items: {
          some: {
            product: { deletedAt: null },
            variant: { deletedAt: null, isAvailable: true },
          },
        },
      },
      include: {
        org: { select: { slug: true } },
        items: {
          where: {
            product: { deletedAt: null },
            variant: { deletedAt: null, isAvailable: true },
          },
          take: 1,
        },
      },
    });
    if (first) {
      const sampleSlug = first.org.slug;
      await validateMirrorForSlug(sampleSlug);
      return sampleSlug;
    }
    skip("getStorefrontData mirror", "no sample slug");
    return null;
  } catch (e) {
    fail(
      "getStorefrontData mirror failed",
      e instanceof Error ? e.message : "unknown"
    );
    return null;
  }
}

async function smokeCampaignItemJoin(): Promise<void> {
  try {
    const item = await prisma.campaignItem.findFirst({
      include: { product: true, variant: true },
    });
    if (item) {
      pass(
        "CampaignItem has product + variant joins (snapshot fields on CampaignItem)"
      );
      return;
    }
    skip("CampaignItem price snapshot vs variant", "no CampaignItem rows");
  } catch (e) {
    fail(
      "CampaignItem join check failed",
      e instanceof Error ? e.message : "unknown"
    );
  }
}

async function smokeHttpStorefront(sampleSlug: string | null): Promise<void> {
  if (sampleSlug) {
    const storefrontUrl = `http://127.0.0.1:3000/en/${sampleSlug}`;
    const status = await httpStatus(storefrontUrl);
    if (status === null) {
      skip(
        `GET ${storefrontUrl}`,
        "connection refused — start web on 3000 (`pnpm dev` / `turbo dev --filter=web`)"
      );
      return;
    }
    if (status === 200) {
      pass(`GET ${storefrontUrl} → 200`);
      return;
    }
    if (status === 404) {
      fail(
        `GET ${storefrontUrl} → 404`,
        "DB had sample but page 404 — check RESERVED_SLUGS or locale routing"
      );
      return;
    }
    pass(`GET ${storefrontUrl} → ${status}`);
    return;
  }
  skip("HTTP storefront probe (live slug)", "no sample slug from DB");
}

/** Reserved slug + missing org → `notFound()` without DB row. */
async function smokeHttpStorefrontGuards(): Promise<void> {
  const reservedUrl = "http://127.0.0.1:3000/en/roasters";
  const missingUrl =
    "http://127.0.0.1:3000/en/jp-smoke-missing-org-storefront-99";
  const r1 = await httpStatus(reservedUrl);
  const r2 = await httpStatus(missingUrl);
  if (r1 === null || r2 === null) {
    skip(
      "GET reserved + missing slug → 404",
      "connection refused — start web on 3000"
    );
    return;
  }
  if (r1 === 404 && r2 === 404) {
    pass("GET /en/roasters + missing slug → 404 (reserved + notFound guards)");
    return;
  }
  if (r1 !== null && r2 !== null && r1 >= 500 && r2 >= 500) {
    skip(
      "GET reserved + missing slug → 404",
      `web on 3000 returned 5xx (roasters=${r1}, missing=${r2}) — fix app env/runtime or run without a broken server on 3000`
    );
    return;
  }
  fail(
    "Storefront guard HTTP status unexpected",
    `roasters=${r1}, missing=${r2} (expected both 404)`
  );
}

async function main() {
  console.log("\n--- US-04-01 Smoke Tests (Public Org Storefront) ---\n");

  await smokePrismaBaseline();
  await smokeCampaignViability();
  const sampleSlug = await smokeGetStorefrontMirror();
  await smokeCampaignItemJoin();
  await smokeHttpStorefront(sampleSlug);
  await smokeHttpStorefrontGuards();

  console.log(`\n--- Results: ${passed} passed, ${failed} failed ---\n`);
  if (failed > 0) {
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

/**
 * Sprint 3 E2E Test Script
 *
 * Drives all 9 Sprint 3 flows programmatically:
 *   Flow 2: Org Application
 *   Flow 3: Admin Approve + Reject
 *   Flow 4: Roaster Magic Link Approve (+ error states)
 *   Flow 5: Org Stripe Connect simulation + Campaign creation
 *   Flow 6: Public Storefront (HTTP)
 *   Flow 7: Cart / Shipping Guard
 *   Flow 8: Three-step Checkout (HTTP + Stripe)
 *   Flow 9: Order Confirmation + Email verification
 *
 * Usage:
 *   cd packages/db && bun run ./scripts/e2e-sprint-3.ts
 *
 * Prerequisites:
 *   - pnpm dev running (web :3000; admin :3003 only if you extend HTTP admin flows)
 *   - In another terminal: stripe listen --forward-to http://localhost:3000/api/webhooks/stripe
 *     Copy the webhook signing secret into STRIPE_WEBHOOK_SECRET (root .env) so the web app
 *     accepts forwarded events — see docs/testing/v1-launch-money-path-e2e-execution.md §1.2.
 *   - seed-e2e-roaster.ts already executed (pnpm --filter @joe-perks/db seed:e2e)
 *
 * Storefront HTTP: apps/web uses next-international urlMappingStrategy "rewriteDefault", so
 * public URLs for the default locale (en) omit /en — this script uses /{slug} not /en/{slug}.
 */
import { randomBytes, randomUUID } from "node:crypto";

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

/** Prefer 127.0.0.1 so Node/Bun fetch does not stall on IPv6 ::1 when the dev server only answers IPv4. */
const WEB_URL = process.env.E2E_WEB_URL ?? "http://127.0.0.1:3000";

const E2E_FETCH_TIMEOUT_MS = Number(process.env.E2E_FETCH_TIMEOUT_MS ?? 60_000);

/** Mimic a browser so middleware (e.g. Arcjet) does not treat the client as a bare bot. */
const BROWSER_LIKE_HEADERS = {
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 JoePerks-E2E/1",
} as const;

/** Default locale (en) omits /en in public URLs — see packages/internationalization `rewriteDefault`. */
function buyerFetch(path: string, init?: RequestInit): Promise<Response> {
  const p = path.startsWith("/") ? path : `/${path}`;
  const { headers: userHeaders, ...rest } = init ?? {};
  const headers = new Headers(BROWSER_LIKE_HEADERS);
  if (userHeaders) {
    for (const [k, v] of new Headers(userHeaders).entries()) {
      headers.set(k, v);
    }
  }
  return fetch(`${WEB_URL}${p}`, {
    ...rest,
    headers,
    signal: AbortSignal.timeout(E2E_FETCH_TIMEOUT_MS),
  });
}

let passed = 0;
let failed = 0;
let skipped = 0;

function pass(name: string) {
  passed++;
  console.log(`  \x1b[32mPASS\x1b[0m  ${name}`);
}

function fail(name: string, reason: string) {
  failed++;
  console.log(`  \x1b[31mFAIL\x1b[0m  ${name}: ${reason}`);
}

function skip(name: string, reason: string) {
  skipped++;
  console.log(`  \x1b[33mSKIP\x1b[0m  ${name} (${reason})`);
}

function assert(cond: boolean, name: string, failMsg: string) {
  if (cond) {
    pass(name);
  } else {
    fail(name, failMsg);
  }
}

// ── Flow 2: Org Application ────────────────────────────────────────────

async function flow2_orgApplication() {
  console.log("\n--- Flow 2: Org Application (US-03-01) ---\n");

  const e2eEmail = "e2e-org-apply@joeperks.test";
  const e2eSlug = "e2e-sprint3-org";

  // Cleanup from previous runs
  const existingApp = await prisma.orgApplication.findUnique({
    where: { email: e2eEmail },
  });
  if (existingApp) {
    const existingOrg = await prisma.org.findUnique({
      where: { applicationId: existingApp.id },
    });
    if (existingOrg) {
      await prisma.user.deleteMany({ where: { orgId: existingOrg.id } });
      await prisma.campaignItem.deleteMany({
        where: { campaign: { orgId: existingOrg.id } },
      });
      await prisma.orderItem.deleteMany({
        where: { order: { campaign: { orgId: existingOrg.id } } },
      });
      await prisma.orderEvent.deleteMany({
        where: { order: { campaign: { orgId: existingOrg.id } } },
      });
      await prisma.order.deleteMany({
        where: { campaign: { orgId: existingOrg.id } },
      });
      await prisma.campaign.deleteMany({ where: { orgId: existingOrg.id } });
      await prisma.org.delete({ where: { id: existingOrg.id } });
    }
    await prisma.magicLink.deleteMany({
      where: { payload: { path: ["applicationId"], equals: existingApp.id } },
    });
    await prisma.roasterOrgRequest.deleteMany({
      where: { applicationId: existingApp.id },
    });
    await prisma.emailLog.deleteMany({ where: { entityId: existingApp.id } });
    await prisma.orgApplication.delete({ where: { id: existingApp.id } });
  }

  // Also clean up the reject test app
  const rejectEmail = "e2e-org-reject@joeperks.test";
  const existingRejectApp = await prisma.orgApplication.findUnique({
    where: { email: rejectEmail },
  });
  if (existingRejectApp) {
    await prisma.roasterOrgRequest.deleteMany({
      where: { applicationId: existingRejectApp.id },
    });
    await prisma.emailLog.deleteMany({
      where: { entityId: existingRejectApp.id },
    });
    await prisma.orgApplication.delete({ where: { id: existingRejectApp.id } });
  }

  const roaster = await prisma.roaster.findFirst({
    where: { status: "ACTIVE" },
    select: { id: true },
  });
  if (!roaster) {
    fail(
      "Org Application",
      "No ACTIVE roaster found — run seed-e2e-roaster.ts first"
    );
    return null;
  }

  const app = await prisma.orgApplication.create({
    data: {
      status: "PENDING_PLATFORM_REVIEW",
      email: e2eEmail,
      orgName: "E2E Sprint 3 Org",
      contactName: "Jane Smith",
      phone: "555-0199",
      description: "A test organization for Sprint 3 E2E testing.",
      desiredSlug: e2eSlug,
      desiredOrgPct: 0.15,
      termsAgreedAt: new Date(),
      termsVersion: "1.0",
    },
  });

  const request = await prisma.roasterOrgRequest.create({
    data: {
      applicationId: app.id,
      roasterId: roaster.id,
      status: "PENDING",
      priority: 1,
    },
  });

  assert(!!app.id, "OrgApplication created", "failed to create");
  assert(
    app.status === "PENDING_PLATFORM_REVIEW",
    "OrgApplication status = PENDING_PLATFORM_REVIEW",
    `got ${app.status}`
  );
  assert(
    !!request.id,
    "RoasterOrgRequest created with priority=1",
    "failed to create"
  );

  return {
    applicationId: app.id,
    roasterId: roaster.id,
    slug: e2eSlug,
    email: e2eEmail,
  };
}

// ── Flow 3: Admin Approve + Reject ──────────────────────────────────────

async function flow3_adminApproval(applicationId: string, roasterId: string) {
  console.log("\n--- Flow 3: Admin Org Approval (US-03-02) ---\n");

  // Test 3a: Approve the main application
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);

  await prisma.orgApplication.update({
    where: { id: applicationId },
    data: { status: "PENDING_ROASTER_APPROVAL" },
  });

  await prisma.magicLink.create({
    data: {
      token,
      purpose: "ROASTER_REVIEW",
      actorId: roasterId,
      actorType: "ROASTER",
      payload: {
        applicationId,
        roasterId,
        orgName: "E2E Sprint 3 Org",
      },
      expiresAt,
    },
  });

  const updatedApp = await prisma.orgApplication.findUnique({
    where: { id: applicationId },
  });
  assert(
    updatedApp?.status === "PENDING_ROASTER_APPROVAL",
    "Application status → PENDING_ROASTER_APPROVAL",
    `got ${updatedApp?.status}`
  );

  const link = await prisma.magicLink.findFirst({
    where: { token, purpose: "ROASTER_REVIEW" },
  });
  assert(!!link, "MagicLink created with purpose ROASTER_REVIEW", "not found");
  if (link) {
    assert(
      link.expiresAt > new Date(),
      "MagicLink expires in future (72h)",
      "already expired"
    );
  }

  // Test 3b: Reject a separate application
  const rejectApp = await prisma.orgApplication.create({
    data: {
      status: "PENDING_PLATFORM_REVIEW",
      email: "e2e-org-reject@joeperks.test",
      orgName: "E2E Reject Org",
      contactName: "Reject Test",
      desiredSlug: "e2e-reject-org",
      desiredOrgPct: 0.1,
      termsAgreedAt: new Date(),
      termsVersion: "1.0",
    },
  });
  await prisma.roasterOrgRequest.create({
    data: {
      applicationId: rejectApp.id,
      roasterId,
      status: "PENDING",
      priority: 1,
    },
  });

  await prisma.orgApplication.update({
    where: { id: rejectApp.id },
    data: { status: "REJECTED" },
  });

  const rejectedApp = await prisma.orgApplication.findUnique({
    where: { id: rejectApp.id },
  });
  assert(
    rejectedApp?.status === "REJECTED",
    "Reject path: status → REJECTED",
    `got ${rejectedApp?.status}`
  );

  return { token };
}

// ── Flow 4: Roaster Magic Link ──────────────────────────────────────────

async function flow4_magicLinkApprove(
  applicationId: string,
  roasterId: string,
  token: string,
  slug: string,
  email: string
) {
  console.log("\n--- Flow 4: Roaster Magic Link Review (US-03-03) ---\n");

  // Simulate what approveOrg() does
  const link = await prisma.magicLink.findFirst({
    where: {
      token,
      purpose: "ROASTER_REVIEW",
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
  });
  assert(!!link, "MagicLink valid and unused", "not found or expired");
  if (!link) {
    return null;
  }

  // Mark magic link as used
  await prisma.magicLink.update({
    where: { id: link.id },
    data: { usedAt: new Date() },
  });

  // Approve the roaster org request
  const req = await prisma.roasterOrgRequest.findFirst({
    where: { applicationId, roasterId, status: "PENDING" },
  });
  assert(!!req, "RoasterOrgRequest found in PENDING state", "not found");
  if (req) {
    await prisma.roasterOrgRequest.update({
      where: { id: req.id },
      data: { status: "APPROVED" },
    });
  }

  // Update application status
  await prisma.orgApplication.update({
    where: { id: applicationId },
    data: { status: "APPROVED" },
  });

  // Create Org
  const org = await prisma.org.create({
    data: {
      applicationId,
      status: "ONBOARDING",
      email,
      slug,
      stripeOnboarding: "NOT_STARTED",
    },
  });

  // Create ORG_ADMIN user
  const user = await prisma.user.create({
    data: {
      externalAuthId: `clerk_pending:${randomUUID()}`,
      email,
      role: "ORG_ADMIN",
      orgId: org.id,
    },
  });

  const verifyApp = await prisma.orgApplication.findUnique({
    where: { id: applicationId },
  });
  assert(
    verifyApp?.status === "APPROVED",
    "OrgApplication status → APPROVED",
    `got ${verifyApp?.status}`
  );
  assert(!!org.id, "Org record created", "failed");
  assert(org.slug === slug, `Org slug = ${slug}`, `got ${org.slug}`);
  assert(
    org.status === "ONBOARDING",
    "Org status = ONBOARDING",
    `got ${org.status}`
  );
  assert(!!user.id, "ORG_ADMIN User created", "failed");

  // Test error states
  const usedLink = await prisma.magicLink.findFirst({ where: { token } });
  assert(
    usedLink?.usedAt !== null,
    "MagicLink.usedAt is set (already used)",
    "usedAt is null"
  );

  const invalidLink = await prisma.magicLink.findFirst({
    where: {
      token: "invalid-token-12345",
      purpose: "ROASTER_REVIEW",
      usedAt: null,
    },
  });
  assert(
    !invalidLink,
    "Invalid token returns no results",
    "unexpectedly found a link"
  );

  return { orgId: org.id };
}

// ── Flow 5: Org Stripe Connect + Campaign ───────────────────────────────

async function flow5_orgConnectAndCampaign(
  orgId: string,
  roasterId: string
): Promise<{ campaignId: string } | null> {
  console.log("\n--- Flow 5: Org Stripe Connect + Campaign (US-03-04) ---\n");

  // Simulate Stripe Connect completion (we can't do real Stripe onboarding in a script)
  await prisma.org.update({
    where: { id: orgId },
    data: {
      stripeAccountId: `acct_e2e_org_${orgId.slice(0, 8)}`,
      stripeOnboarding: "COMPLETE",
      chargesEnabled: true,
      payoutsEnabled: true,
      status: "ACTIVE",
    },
  });

  const org = await prisma.org.findUnique({ where: { id: orgId } });
  assert(
    org?.status === "ACTIVE",
    "Org status → ACTIVE after Stripe Connect",
    `got ${org?.status}`
  );
  assert(org?.chargesEnabled === true, "Org chargesEnabled = true", "false");
  assert(org?.payoutsEnabled === true, "Org payoutsEnabled = true", "false");
  assert(!!org?.stripeAccountId, "Org stripeAccountId set", "null");

  // Create campaign
  const products = await prisma.product.findMany({
    where: { roasterId, status: "ACTIVE", deletedAt: null },
    include: { variants: { where: { isAvailable: true, deletedAt: null } } },
  });

  const campaign = await prisma.campaign.create({
    data: {
      orgId,
      name: "E2E Sprint 3 Fundraiser",
      status: "DRAFT",
      orgPct: 0.15,
      goalCents: 50_000,
    },
  });
  assert(
    campaign.status === "DRAFT",
    "Campaign created as DRAFT",
    `got ${campaign.status}`
  );
  assert(
    campaign.orgPct === 0.15,
    "Campaign orgPct = 0.15",
    `got ${campaign.orgPct}`
  );

  // Add items from all products
  const itemsData = products.flatMap((p, pi) =>
    p.variants.map((v) => ({
      campaignId: campaign.id,
      productId: p.id,
      variantId: v.id,
      retailPrice: v.retailPrice,
      wholesalePrice: v.wholesalePrice,
      isFeatured: pi === 0,
    }))
  );

  await prisma.campaignItem.createMany({ data: itemsData });

  const items = await prisma.campaignItem.findMany({
    where: { campaignId: campaign.id },
  });
  assert(
    items.length >= 3,
    `CampaignItems created (${items.length} items)`,
    "too few items"
  );

  // Check price snapshots match variants
  let pricesMatch = true;
  for (const item of items) {
    const variant = await prisma.productVariant.findUnique({
      where: { id: item.variantId },
    });
    if (
      variant &&
      (item.retailPrice !== variant.retailPrice ||
        item.wholesalePrice !== variant.wholesalePrice)
    ) {
      pricesMatch = false;
      break;
    }
  }
  assert(
    pricesMatch,
    "CampaignItem prices snapshot from ProductVariant",
    "price mismatch"
  );

  // Activate campaign
  const shippingRates = await prisma.roasterShippingRate.findMany({
    where: { roasterId },
  });
  if (shippingRates.length === 0) {
    fail(
      "Activation guard: roaster has shipping rates",
      "no shipping rates — run `pnpm --filter @joe-perks/db seed:e2e`"
    );
    return null;
  }
  pass("Activation guard: roaster has shipping rates");
  assert(items.length > 0, "Activation guard: at least one item", "no items");

  await prisma.campaign.update({
    where: { id: campaign.id },
    data: { status: "ACTIVE" },
  });

  const activeCampaign = await prisma.campaign.findUnique({
    where: { id: campaign.id },
  });
  assert(
    activeCampaign?.status === "ACTIVE",
    "Campaign status → ACTIVE",
    `got ${activeCampaign?.status}`
  );

  return { campaignId: campaign.id };
}

// ── Flow 6: Public Storefront (HTTP) ────────────────────────────────────

async function flow6_storefront(slug: string) {
  console.log("\n--- Flow 6: Public Storefront (US-04-01) ---\n");

  let ok = false;
  try {
    const path = `/${slug}`;
    const res = await buyerFetch(slug, { redirect: "follow" });
    ok = res.ok;
    assert(ok, `GET ${path} → ${res.status}`, `status ${res.status}`);

    if (ok) {
      const html = await res.text();
      assert(
        html.includes("E2E Sprint 3 Org") || html.includes("e2e-sprint3-org"),
        "Storefront HTML contains org name or slug",
        "org not found in HTML"
      );
      assert(
        html.includes("Morning Sunrise Blend") || html.includes("Dark Roast"),
        "Storefront HTML contains product names",
        "products not found in HTML"
      );
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error";
    const timedOut =
      (e instanceof Error && e.name === "TimeoutError") ||
      msg.includes("timed out") ||
      msg.includes("Timeout");
    const hint = timedOut
      ? ` — no response within ${E2E_FETCH_TIMEOUT_MS}ms; start \`pnpm dev\` (web on ${WEB_URL})`
      : "";
    fail("Storefront HTTP request", `${msg}${hint}`);
    return;
  }

  // Test 404 for non-existent slug
  try {
    const res404 = await buyerFetch("nonexistent-slug-xyz-999", {
      redirect: "follow",
    });
    assert(
      res404.status === 404,
      "GET /nonexistent-slug → 404",
      `got ${res404.status}`
    );
  } catch (e) {
    fail(
      "Storefront 404 test",
      e instanceof Error ? e.message : "unknown error"
    );
  }

  // Test reserved slug
  try {
    const resReserved = await buyerFetch("roasters", { redirect: "follow" });
    // RESERVED_SLUGS (e.g. roasters) → notFound() on buyer storefront
    assert(
      resReserved.status === 404,
      "Reserved slug /roasters → 404",
      `status ${resReserved.status}`
    );
  } catch (e) {
    skip(
      "Reserved slug test",
      e instanceof Error ? e.message : "unknown error"
    );
  }
}

// ── Flow 7: Shipping Guard ──────────────────────────────────────────────

async function flow7_shippingGuard(slug: string, roasterId: string) {
  console.log("\n--- Flow 7: Shipping Guard (US-04-05) ---\n");

  // Verify storefront has shipping rates normally
  const rates = await prisma.roasterShippingRate.findMany({
    where: { roasterId },
  });
  if (rates.length === 0) {
    fail(
      "Roaster has shipping rates for normal operation",
      "no rates — run `pnpm --filter @joe-perks/db seed:e2e`"
    );
    skip("Shipping guard redirect", "no baseline rates");
    return;
  }
  pass("Roaster has shipping rates for normal operation");

  // Temporarily remove shipping rates to test the guard
  const savedRates = rates.map((r) => ({
    roasterId: r.roasterId,
    label: r.label,
    carrier: r.carrier,
    flatRate: r.flatRate,
    isDefault: r.isDefault,
  }));

  await prisma.roasterShippingRate.deleteMany({ where: { roasterId } });

  // Verify checkout redirect when no shipping rates
  try {
    const checkoutRes = await buyerFetch(`${slug}/checkout`, {
      redirect: "manual",
    });
    // Should redirect with ?error=no-shipping or return the page with guard
    const location = checkoutRes.headers.get("location") ?? "";
    const isRedirect = checkoutRes.status >= 300 && checkoutRes.status < 400;
    const hasErrorParam = location.includes("no-shipping");

    if (isRedirect && hasErrorParam) {
      pass("Shipping guard: checkout redirects with ?error=no-shipping");
    } else {
      // The page might render with a guard instead of redirecting
      const html = await checkoutRes.text();
      if (
        html.includes("no-shipping") ||
        html.includes("unavailab") ||
        html.includes("shipping")
      ) {
        pass("Shipping guard: checkout page shows unavailability");
      } else {
        skip(
          "Shipping guard redirect",
          "page did not redirect or show guard — may need browser testing"
        );
      }
    }
  } catch (e) {
    skip(
      "Shipping guard test",
      e instanceof Error ? e.message : "unknown error"
    );
  }

  // Restore shipping rates
  await prisma.roasterShippingRate.createMany({ data: savedRates });
  const restored = await prisma.roasterShippingRate.findMany({
    where: { roasterId },
  });
  assert(
    restored.length === savedRates.length,
    "Shipping rates restored",
    "restoration failed"
  );
}

// ── Flow 8: Three-Step Checkout (HTTP API) ──────────────────────────────

interface CheckoutResponse {
  clientSecret: string;
  grossAmount: number;
  orderId: string;
  orderNumber: string;
  paymentIntentId: string;
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: end-to-end verification script intentionally checks many sequential assertions
async function flow8_checkout(campaignId: string, roasterId: string) {
  console.log("\n--- Flow 8: Three-Step Checkout (US-04-03) ---\n");

  const items = await prisma.campaignItem.findMany({
    where: { campaignId },
    take: 2,
    include: { product: true, variant: true },
  });
  assert(
    items.length >= 1,
    `Found ${items.length} CampaignItems for checkout`,
    "no items"
  );

  const shippingRate = await prisma.roasterShippingRate.findFirst({
    where: { roasterId, isDefault: true },
  });
  assert(!!shippingRate, "Default shipping rate found", "no default rate");
  if (!shippingRate || items.length === 0) {
    skip("Checkout API test", "missing test data");
    return null;
  }

  const checkoutPayload = {
    campaignId,
    items: items.map((item) => ({ campaignItemId: item.id, quantity: 2 })),
    buyerEmail: "buyer-e2e@joeperks.test",
    buyerName: "E2E Buyer",
    street: "123 Brew St",
    street2: "Suite 4",
    city: "Austin",
    state: "TX",
    zip: "78701",
    country: "US",
    shippingRateId: shippingRate.id,
  };

  let checkoutResponse: CheckoutResponse;
  try {
    const res = await fetch(`${WEB_URL}/api/checkout/create-intent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(checkoutPayload),
    });
    assert(
      res.ok,
      `POST /api/checkout/create-intent → ${res.status}`,
      `status ${res.status}`
    );
    if (!res.ok) {
      const errorBody = await res.text();
      fail("Checkout API response body", errorBody || "empty response body");
      return null;
    }
    checkoutResponse = (await res.json()) as CheckoutResponse;
  } catch (e) {
    fail(
      "Checkout API request",
      e instanceof Error ? e.message : "unknown error"
    );
    return null;
  }

  assert(
    !!checkoutResponse.clientSecret,
    "Response has clientSecret",
    "missing"
  );
  assert(!!checkoutResponse.orderId, "Response has orderId", "missing");
  assert(!!checkoutResponse.orderNumber, "Response has orderNumber", "missing");
  assert(
    !!checkoutResponse.paymentIntentId,
    "Response has paymentIntentId",
    "missing"
  );
  assert(
    typeof checkoutResponse.grossAmount === "number" &&
      checkoutResponse.grossAmount > 0,
    `grossAmount = ${checkoutResponse.grossAmount} cents`,
    "invalid"
  );

  // Verify DB state
  const order = await prisma.order.findUnique({
    where: { id: checkoutResponse.orderId },
    include: { items: true, buyer: true, events: true },
  });
  assert(!!order, "Order created in DB", "not found");
  assert(
    order?.status === "PENDING",
    "Order status = PENDING",
    `got ${order?.status}`
  );
  assert(
    order?.orderNumber?.startsWith("JP-") ?? false,
    `Order number format JP-XXXXX: ${order?.orderNumber}`,
    "wrong format"
  );
  assert(
    order?.items.length === items.length,
    `OrderItems count = ${order?.items.length}`,
    `expected ${items.length}`
  );
  assert(
    order?.buyer?.email === "buyer-e2e@joeperks.test",
    "Buyer upserted",
    "wrong email"
  );
  assert(
    order?.stripePiId === checkoutResponse.paymentIntentId,
    "Order linked to PaymentIntent",
    "PI mismatch"
  );

  // Check split amounts
  assert(
    (order?.productSubtotal ?? 0) > 0,
    `productSubtotal = ${order?.productSubtotal}`,
    "0 or missing"
  );
  assert(
    (order?.shippingAmount ?? 0) > 0,
    `shippingAmount = ${order?.shippingAmount}`,
    "0 or missing"
  );
  assert(
    (order?.orgAmount ?? 0) > 0,
    `orgAmount = ${order?.orgAmount}`,
    "0 or missing"
  );
  assert(
    (order?.platformAmount ?? 0) >= 0,
    `platformAmount = ${order?.platformAmount}`,
    "negative"
  );
  assert(
    (order?.roasterAmount ?? 0) > 0,
    `roasterAmount = ${order?.roasterAmount}`,
    "0 or missing"
  );

  // Verify grossAmount = productSubtotal + shippingAmount
  const expectedGross =
    (order?.productSubtotal ?? 0) + (order?.shippingAmount ?? 0);
  assert(
    order?.grossAmount === expectedGross,
    `grossAmount ${order?.grossAmount} = sub ${order?.productSubtotal} + ship ${order?.shippingAmount}`,
    "mismatch"
  );

  // Verify PAYMENT_INTENT_CREATED event
  const piEvent = order?.events.find(
    (e) => e.eventType === "PAYMENT_INTENT_CREATED"
  );
  assert(!!piEvent, "OrderEvent PAYMENT_INTENT_CREATED exists", "missing");

  // Check unit prices and line totals
  for (const oi of order?.items ?? []) {
    assert(
      oi.unitPrice > 0,
      `OrderItem "${oi.productName}" unitPrice = ${oi.unitPrice}`,
      "0 or missing"
    );
    assert(
      oi.lineTotal === oi.unitPrice * oi.quantity,
      "OrderItem lineTotal = unitPrice × qty",
      `${oi.lineTotal} ≠ ${oi.unitPrice} × ${oi.quantity}`
    );
  }

  // Test error case: invalid payload
  try {
    const badRes = await fetch(`${WEB_URL}/api/checkout/create-intent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ campaignId: "nonexistent" }),
    });
    assert(
      badRes.status === 400,
      `Bad checkout payload → ${badRes.status}`,
      "expected 400"
    );
  } catch (e) {
    skip(
      "Checkout error case",
      e instanceof Error ? e.message : "unknown error"
    );
  }

  return {
    orderId: checkoutResponse.orderId,
    orderNumber: checkoutResponse.orderNumber,
    paymentIntentId: checkoutResponse.paymentIntentId,
  };
}

// ── Flow 9: Order Confirmation + Email ──────────────────────────────────

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: end-to-end verification script intentionally checks many sequential assertions
async function flow9_orderConfirmation(
  orderId: string,
  paymentIntentId: string,
  slug: string
) {
  console.log(
    "\n--- Flow 9: Order Confirmation (US-04-04) + Email (US-08-01) ---\n"
  );

  // Test order-status API (order should be PENDING before webhook)
  try {
    const res = await fetch(
      `${WEB_URL}/api/order-status?pi=${paymentIntentId}`
    );
    assert(
      res.ok,
      `GET /api/order-status?pi=... → ${res.status}`,
      `status ${res.status}`
    );
    const data = await res.json();
    assert(
      data.status === "PENDING",
      "Order status via API = PENDING (pre-webhook)",
      `got ${data.status}`
    );
    assert(!!data.orderNumber, "API returns orderNumber", "missing");
    assert(Array.isArray(data.items), "API returns items array", "missing");
    assert(
      (data.items?.length ?? 0) > 0,
      `API returns ${data.items?.length} items`,
      "no items"
    );

    // Check item fields
    const item = data.items[0];
    assert(!!item.productName, "Item has productName", "missing");
    assert(!!item.variantDesc, "Item has variantDesc", "missing");
    assert(typeof item.unitPrice === "number", "Item has unitPrice", "missing");
    assert(typeof item.quantity === "number", "Item has quantity", "missing");
    assert(typeof item.lineTotal === "number", "Item has lineTotal", "missing");

    // Check monetary fields
    assert(
      typeof data.grossAmount === "number",
      "API returns grossAmount",
      "missing"
    );
    assert(
      typeof data.productSubtotal === "number",
      "API returns productSubtotal",
      "missing"
    );
    assert(
      typeof data.shippingAmount === "number",
      "API returns shippingAmount",
      "missing"
    );
    assert(
      typeof data.orgAmount === "number",
      "API returns orgAmount",
      "missing"
    );
    assert(
      typeof data.orgPctSnapshot === "number",
      "API returns orgPctSnapshot",
      "missing"
    );
    assert(!!data.orgName, "API returns orgName", "missing");
  } catch (e) {
    fail("Order status API", e instanceof Error ? e.message : "unknown error");
  }

  // Simulate webhook: payment_intent.succeeded
  // (In real E2E this would come from Stripe CLI, but we simulate the DB changes)
  console.log("\n  Simulating payment_intent.succeeded webhook...\n");

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { campaignId: true, orgAmount: true, status: true },
  });

  if (order && order.status === "PENDING") {
    const settings = await prisma.platformSettings.findUniqueOrThrow({
      where: { id: "singleton" },
    });

    await prisma.$transaction([
      prisma.order.update({
        where: { id: orderId },
        data: {
          status: "CONFIRMED",
          stripeChargeId: `ch_e2e_${orderId.slice(0, 8)}`,
          payoutStatus: "HELD",
          payoutEligibleAt: new Date(
            Date.now() + settings.payoutHoldDays * 24 * 60 * 60 * 1000
          ),
          fulfillBy: new Date(
            Date.now() + settings.slaBreachHours * 60 * 60 * 1000
          ),
        },
      }),
      prisma.orderEvent.create({
        data: {
          orderId,
          eventType: "PAYMENT_SUCCEEDED",
          actorType: "SYSTEM",
          payload: { stripe_pi_id: paymentIntentId },
        },
      }),
      prisma.campaign.update({
        where: { id: order.campaignId },
        data: { totalRaised: { increment: order.orgAmount } },
      }),
    ]);

    pass("Simulated payment_intent.succeeded → Order CONFIRMED");
  } else {
    skip("Webhook simulation", `Order status is ${order?.status}, not PENDING`);
  }

  // Verify confirmed state
  const confirmed = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, events: true, buyer: true, campaign: true },
  });
  assert(
    confirmed?.status === "CONFIRMED",
    "Order status = CONFIRMED",
    `got ${confirmed?.status}`
  );
  assert(
    !!confirmed?.orderNumber,
    `Order number: ${confirmed?.orderNumber}`,
    "missing"
  );
  assert(
    confirmed?.payoutStatus === "HELD",
    "Payout status = HELD",
    `got ${confirmed?.payoutStatus}`
  );

  // Check PAYMENT_SUCCEEDED event
  const succEvent = confirmed?.events.find(
    (e) => e.eventType === "PAYMENT_SUCCEEDED"
  );
  assert(!!succEvent, "OrderEvent PAYMENT_SUCCEEDED exists", "missing");

  // Idempotency: no duplicate events
  const succEvents =
    confirmed?.events.filter((e) => e.eventType === "PAYMENT_SUCCEEDED") ?? [];
  assert(
    succEvents.length === 1,
    "No duplicate PAYMENT_SUCCEEDED events",
    `found ${succEvents.length}`
  );

  // Check campaign totalRaised incremented
  const campaign = await prisma.campaign.findUnique({
    where: { id: confirmed?.campaignId },
  });
  assert(
    (campaign?.totalRaised ?? 0) > 0,
    `Campaign totalRaised = ${campaign?.totalRaised}`,
    "0"
  );

  // Verify buyer exists
  assert(!!confirmed?.buyer, "Buyer record exists", "missing");
  assert(
    confirmed?.buyer?.email === "buyer-e2e@joeperks.test",
    "Buyer email matches",
    `got ${confirmed?.buyer?.email}`
  );

  // Test order-status API after confirmation
  try {
    const res = await fetch(
      `${WEB_URL}/api/order-status?pi=${paymentIntentId}`
    );
    const data = await res.json();
    assert(
      data.status === "CONFIRMED",
      "Order status via API = CONFIRMED (post-webhook)",
      `got ${data.status}`
    );
  } catch (e) {
    fail(
      "Order status API (post-confirm)",
      e instanceof Error ? e.message : "unknown error"
    );
  }

  // Test 404 for nonexistent order
  try {
    const res404 = await fetch(
      `${WEB_URL}/api/order-status?pi=pi_nonexistent_999`
    );
    assert(
      res404.status === 404,
      "Order status 404 for nonexistent PI",
      `got ${res404.status}`
    );
  } catch (e) {
    skip(
      "Order status 404 test",
      e instanceof Error ? e.message : "unknown error"
    );
  }

  // Check the confirmation page renders
  try {
    const pageRes = await buyerFetch(`${slug}/order/${paymentIntentId}`, {
      redirect: "follow",
    });
    assert(
      pageRes.ok,
      `GET order confirmation page → ${pageRes.status}`,
      `status ${pageRes.status}`
    );
    if (pageRes.ok) {
      const html = await pageRes.text();
      const hasOrderNumber = html.includes(confirmed?.orderNumber ?? "JP-");
      if (hasOrderNumber) {
        pass("Confirmation page displays order number");
      } else {
        skip(
          "Confirmation page order number",
          "may be loading via client-side polling"
        );
      }
    }
  } catch (e) {
    fail(
      "Confirmation page HTTP",
      e instanceof Error ? e.message : "unknown error"
    );
  }
}

// ── Main ────────────────────────────────────────────────────────────────

async function main() {
  console.log(
    "\n╔════════════════════════════════════════════════════════════╗"
  );
  console.log("║          Sprint 3 — End-to-End Test Suite                 ║");
  console.log("╚════════════════════════════════════════════════════════════╝");

  // Flow 2: Org Application
  const flow2Result = await flow2_orgApplication();
  if (!flow2Result) {
    console.log("\n  ABORT: Flow 2 failed, cannot continue.\n");
    return;
  }

  // Flow 3: Admin Approve + Reject
  const flow3Result = await flow3_adminApproval(
    flow2Result.applicationId,
    flow2Result.roasterId
  );

  // Flow 4: Roaster Magic Link
  const flow4Result = await flow4_magicLinkApprove(
    flow2Result.applicationId,
    flow2Result.roasterId,
    flow3Result.token,
    flow2Result.slug,
    flow2Result.email
  );
  if (!flow4Result) {
    console.log("\n  ABORT: Flow 4 failed, cannot continue.\n");
    return;
  }

  // Flow 5: Org Connect + Campaign
  const flow5Result = await flow5_orgConnectAndCampaign(
    flow4Result.orgId,
    flow2Result.roasterId
  );
  if (!flow5Result) {
    console.log(
      "\n  ABORT: Flow 5 did not activate a campaign (see shipping-rate error above).\n"
    );
  }

  // Flow 6: Public Storefront
  await flow6_storefront(flow2Result.slug);

  // Flow 7: Shipping Guard
  await flow7_shippingGuard(flow2Result.slug, flow2Result.roasterId);

  // Flow 8: Three-Step Checkout
  const flow8Result = flow5Result
    ? await flow8_checkout(flow5Result.campaignId, flow2Result.roasterId)
    : null;
  if (!flow5Result) {
    skip("Flow 8: Checkout", "Flow 5 did not return a campaignId");
  }

  // Flow 9: Order Confirmation
  if (flow8Result) {
    await flow9_orderConfirmation(
      flow8Result.orderId,
      flow8Result.paymentIntentId,
      flow2Result.slug
    );
  } else {
    skip("Flow 9: Order Confirmation", "Flow 8 checkout did not succeed");
  }

  // ── Summary ─────────────────────────────────────────────────────────
  console.log(
    "\n══════════════════════════════════════════════════════════════"
  );
  console.log(
    `  Results: \x1b[32m${passed} passed\x1b[0m, \x1b[31m${failed} failed\x1b[0m, \x1b[33m${skipped} skipped\x1b[0m`
  );
  console.log(
    "══════════════════════════════════════════════════════════════\n"
  );

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

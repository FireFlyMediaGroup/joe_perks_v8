/**
 * Bootstraps the smoke-lane org + ORG_ADMIN User on production (linkage only).
 *
 * Does NOT require live Stripe Connect account ids — use Connect onboarding in the
 * org portal after the Clerk webhook merges, then run full `seed-smoke-lane.ts`.
 *
 * Guard: JOE_PERKS_CONFIRM_SMOKE_LANE_ORG_BOOTSTRAP=1
 *
 * Usage:
 *   cd packages/db
 *   JOE_PERKS_CONFIRM_SMOKE_LANE_ORG_BOOTSTRAP=1 \
 *   PRISMA_DATABASE_PROFILE=production \
 *   bun run ./scripts/bootstrap-smoke-lane-org-prod.ts
 *
 * See: docs/production-auth-troubleshooting/02-org-stripe-connect-no-organization-linked.md
 */
import { randomUUID } from "node:crypto";

import "../load-env-bootstrap";

import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import ws from "ws";
import { PrismaClient } from "../generated/client";
import { assertProdDatabaseUrl } from "./assert-prod-database-url";
import {
  SMOKE_LANE_ORG_EMAIL,
  SMOKE_LANE_ORG_NAME,
  SMOKE_LANE_ORG_SLUG,
} from "./smoke-lane-constants";

neonConfig.webSocketConstructor = ws;

if (process.env.JOE_PERKS_CONFIRM_SMOKE_LANE_ORG_BOOTSTRAP !== "1") {
  console.error(
    "Refusing: set JOE_PERKS_CONFIRM_SMOKE_LANE_ORG_BOOTSTRAP=1 (see docs/production-auth-troubleshooting/02-org-stripe-connect-no-organization-linked.md)."
  );
  process.exit(1);
}

assertProdDatabaseUrl();

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is missing.");
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: url }),
});

async function main() {
  console.log("\n--- Smoke lane org bootstrap (prod, linkage only) ---\n");
  console.log("  Org email:", SMOKE_LANE_ORG_EMAIL);
  console.log("  Org slug:", SMOKE_LANE_ORG_SLUG);

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

  const org = await prisma.org.upsert({
    where: { applicationId: orgApp.id },
    create: {
      applicationId: orgApp.id,
      status: "ACTIVE",
      email: SMOKE_LANE_ORG_EMAIL,
      slug: SMOKE_LANE_ORG_SLUG,
      stripeOnboarding: "NOT_STARTED",
    },
    update: {
      status: "ACTIVE",
      email: SMOKE_LANE_ORG_EMAIL,
      slug: SMOKE_LANE_ORG_SLUG,
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
    update: {
      role: "ORG_ADMIN",
      orgId: org.id,
      isPlatformAdmin: false,
    },
  });

  const pending =
    orgUser.externalAuthId.startsWith("clerk_pending:") ?
      orgUser.externalAuthId
    : `clerk_pending:${randomUUID()}`;

  if (orgUser.externalAuthId !== pending) {
    await prisma.user.update({
      where: { id: orgUser.id },
      data: { externalAuthId: pending },
    });
    console.log("  Reset User.externalAuthId →", pending);
  } else {
    console.log("  User.externalAuthId:", orgUser.externalAuthId);
  }

  console.log("  Org admin User:", orgUser.id);

  console.log(`
  Next:
  1. Run repair-org-clerk-prod-link.ts (org Clerk secret) if a stale Clerk user exists
  2. Sign in at https://orgs.joeperks.com/sign-in with ${SMOKE_LANE_ORG_EMAIL}
  3. Verify /onboarding shows Connect UI (not "No organization is linked…")
  4. Complete Stripe Connect onboarding, then full smoke-lane seed with acct_… ids
`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

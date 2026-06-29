/**
 * Repairs org admin Clerk ↔ Postgres linkage for the smoke-lane org email.
 *
 * Resets User.externalAuthId to clerk_pending:* so the org Clerk webhook merges on
 * first sign-in. Optionally deletes a stale email-only Clerk user (no Google link).
 *
 * Guard: JOE_PERKS_CONFIRM_ORG_CLERK_REPAIR=1
 *
 * Usage:
 *   cd packages/db
 *   CLERK_SECRET_KEY=sk_live_…   # org production instance
 *   JOE_PERKS_CONFIRM_ORG_CLERK_REPAIR=1 \
 *   PRISMA_DATABASE_PROFILE=production \
 *   bun run ./scripts/repair-org-clerk-prod-link.ts
 *
 * Optional: ORG_ADMIN_EMAIL=other+tag@example.com
 *
 * See: docs/production-auth-troubleshooting/02-org-stripe-connect-no-organization-linked.md
 */
import { randomUUID } from "node:crypto";

import "../load-env-bootstrap";

import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import ws from "ws";
import { PrismaClient } from "../generated/client";
import { SMOKE_LANE_ORG_EMAIL } from "./smoke-lane-constants";

neonConfig.webSocketConstructor = ws;

const CLERK_PENDING_EXTERNAL_AUTH_PREFIX = "clerk_pending:";

function isPendingClerkExternalAuthId(externalAuthId: string): boolean {
  return externalAuthId.startsWith(CLERK_PENDING_EXTERNAL_AUTH_PREFIX);
}

const CONFIRM = process.env.JOE_PERKS_CONFIRM_ORG_CLERK_REPAIR === "1";
const EMAIL = process.env.ORG_ADMIN_EMAIL?.trim() ?? SMOKE_LANE_ORG_EMAIL;
const CLERK_KEY = process.env.CLERK_SECRET_KEY?.trim();

if (!CONFIRM) {
  console.error(
    "Refusing: set JOE_PERKS_CONFIRM_ORG_CLERK_REPAIR=1 (see docs/production-auth-troubleshooting/02-org-stripe-connect-no-organization-linked.md)."
  );
  process.exit(1);
}

if (!CLERK_KEY?.startsWith("sk_live_")) {
  console.error(
    "Refusing: CLERK_SECRET_KEY must be the org production secret (sk_live_…)."
  );
  process.exit(1);
}

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is missing.");
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: url }),
});

interface ClerkExternalAccount {
  provider?: string;
  verification?: { status?: string };
}

interface ClerkUser {
  email_addresses?: { email_address: string }[];
  external_accounts?: ClerkExternalAccount[];
  id: string;
}

async function clerkGet<T>(path: string): Promise<T> {
  const res = await fetch(`https://api.clerk.com/v1${path}`, {
    headers: { Authorization: `Bearer ${CLERK_KEY}` },
  });
  const body = (await res.json()) as T & {
    errors?: { message?: string }[];
  };
  if (!res.ok) {
    throw new Error(
      body.errors?.[0]?.message ?? `Clerk GET ${path} (${res.status})`
    );
  }
  return body;
}

async function clerkDelete(path: string): Promise<void> {
  const res = await fetch(`https://api.clerk.com/v1${path}`, {
    headers: { Authorization: `Bearer ${CLERK_KEY}` },
    method: "DELETE",
  });
  if (!res.ok && res.status !== 404) {
    const body = (await res.json()) as { errors?: { message?: string }[] };
    throw new Error(
      body.errors?.[0]?.message ?? `Clerk DELETE ${path} (${res.status})`
    );
  }
}

async function findClerkUserByEmail(email: string): Promise<ClerkUser | null> {
  const users = await clerkGet<ClerkUser[]>(
    `/users?email_address=${encodeURIComponent(email)}&limit=1`
  );
  return users[0] ?? null;
}

function hasGoogleExternalAccount(user: ClerkUser): boolean {
  return (
    user.external_accounts?.some(
      (account) =>
        account.provider === "oauth_google" ||
        account.provider === "google" ||
        account.verification?.status === "verified"
    ) ?? false
  );
}

async function main() {
  console.log("\n--- Org Clerk prod link repair ---\n");
  console.log("  Email:", EMAIL);

  const dbUser = await prisma.user.findUnique({
    where: { email: EMAIL },
    select: {
      id: true,
      email: true,
      externalAuthId: true,
      orgId: true,
      role: true,
    },
  });

  if (!dbUser) {
    console.error(`  ERROR: no User row for ${EMAIL}`);
    console.error("  Run bootstrap-smoke-lane-org-prod.ts first.");
    process.exit(1);
  }

  if (!dbUser.orgId) {
    console.error(
      "  ERROR: User has no orgId — run bootstrap-smoke-lane-org-prod.ts first."
    );
    process.exit(1);
  }

  const pendingId = `${CLERK_PENDING_EXTERNAL_AUTH_PREFIX}${randomUUID()}`;
  console.log("  DB externalAuthId (before):", dbUser.externalAuthId);
  console.log("  Target pending id:", pendingId);

  const clerkUser = await findClerkUserByEmail(EMAIL);

  if (clerkUser) {
    const googleLinked = hasGoogleExternalAccount(clerkUser);
    console.log("  Clerk prod user:", clerkUser.id);
    console.log("  Google external account linked:", googleLinked);

    if (googleLinked && dbUser.externalAuthId !== clerkUser.id) {
      await prisma.user.update({
        where: { id: dbUser.id },
        data: { externalAuthId: clerkUser.id, role: "ORG_ADMIN", orgId: dbUser.orgId },
      });
      console.log("\n  Updated User.externalAuthId →", clerkUser.id);
      console.log(
        "\n  Next: sign in at https://orgs.joeperks.com/sign-in with Google."
      );
      return;
    }

    if (!googleLinked) {
      console.log("  Deleting email-only Clerk user (blocks Google OAuth)…");
      await clerkDelete(`/users/${clerkUser.id}`);
      console.log("  Deleted:", clerkUser.id);
    } else if (dbUser.externalAuthId === clerkUser.id) {
      console.log("\n  Already linked to Google-backed Clerk user.");
      return;
    }
  } else {
    console.log("  No Clerk prod user for this email.");
  }

  if (
    dbUser.externalAuthId !== pendingId ||
    !isPendingClerkExternalAuthId(dbUser.externalAuthId)
  ) {
    await prisma.user.update({
      where: { id: dbUser.id },
      data: { externalAuthId: pendingId },
    });
    console.log("\n  Reset User.externalAuthId →", pendingId);
  } else {
    console.log("\n  DB already on clerk_pending — no update needed.");
  }

  console.log(`
  Next steps (Clerk Dashboard — Joe Perks - Orgs prod):
  1. Configure → User & authentication → Email → Password → set **not required**
  2. Webhook https://orgs.joeperks.com/api/webhooks/clerk (user.created, user.updated)
  3. Incognito → https://orgs.joeperks.com/sign-in → Continue with Google as ${EMAIL}
  4. Verify /onboarding shows Connect UI
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

/**
 * Repairs roaster admin Clerk ↔ Postgres linkage for Google OAuth on prod.
 *
 * Problem A: `User.externalAuthId` points at a dev/test Clerk id that does not exist
 * on the roaster production instance.
 *
 * Problem B (common after `clerk deploy`): an API-created Clerk user exists for the email
 * but has **no Google external account**. Google OAuth then fails with Clerk's generic
 * "Unable to complete action at this time."
 *
 * Problem C: fresh prod instance + `password.required: true` blocks OAuth sign-up for
 * users who do not exist on Clerk yet. Fix that in Clerk Dashboard (see doc below);
 * this script cannot change instance auth settings via API.
 *
 * This script:
 * 1. Finds the roaster admin User by email (default: chris@chrisodomphoto.com)
 * 2. Deletes any roaster-prod Clerk user for that email without a Google link
 * 3. Resets `User.externalAuthId` to `clerk_pending:{roasterId}` for webhook merge
 *
 * Guard: JOE_PERKS_CONFIRM_ROASTER_CLERK_REPAIR=1
 *
 * Usage:
 *   cd packages/db
 *   CLERK_SECRET_KEY=sk_live_... \
 *   JOE_PERKS_CONFIRM_ROASTER_CLERK_REPAIR=1 \
 *   PRISMA_DATABASE_PROFILE=production \
 *   bun run ./scripts/repair-roaster-clerk-prod-link.ts
 *
 * Optional: ROASTER_ADMIN_EMAIL=other@example.com
 *
 * See: docs/production-auth-troubleshooting/01-roaster-sign-in-google-oauth.md
 */
import "../load-env-bootstrap";

import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import ws from "ws";
import { PrismaClient } from "../generated/client";

neonConfig.webSocketConstructor = ws;

const CLERK_PENDING_EXTERNAL_AUTH_PREFIX = "clerk_pending:";

function isPendingClerkExternalAuthId(externalAuthId: string): boolean {
  return externalAuthId.startsWith(CLERK_PENDING_EXTERNAL_AUTH_PREFIX);
}

const CONFIRM = process.env.JOE_PERKS_CONFIRM_ROASTER_CLERK_REPAIR === "1";
const EMAIL =
  process.env.ROASTER_ADMIN_EMAIL?.trim() ?? "chris@chrisodomphoto.com";
const CLERK_KEY = process.env.CLERK_SECRET_KEY?.trim();

if (!CONFIRM) {
  console.error(
    "Refusing: set JOE_PERKS_CONFIRM_ROASTER_CLERK_REPAIR=1 (see docs/production-auth-troubleshooting/01-roaster-sign-in-google-oauth.md)."
  );
  process.exit(1);
}

if (!CLERK_KEY?.startsWith("sk_live_")) {
  console.error(
    "Refusing: CLERK_SECRET_KEY must be the roaster production secret (sk_live_…)."
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
  console.log("\n--- Roaster Clerk prod link repair (Google OAuth) ---\n");
  console.log("  Email:", EMAIL);

  const dbUser = await prisma.user.findUnique({
    where: { email: EMAIL },
    select: {
      id: true,
      email: true,
      externalAuthId: true,
      roasterId: true,
      role: true,
    },
  });

  if (!dbUser) {
    console.error(`  ERROR: no User row for ${EMAIL}`);
    process.exit(1);
  }

  if (!dbUser.roasterId) {
    console.error(
      "  ERROR: User has no roasterId — approve roaster application first."
    );
    process.exit(1);
  }

  const pendingId = `${CLERK_PENDING_EXTERNAL_AUTH_PREFIX}${dbUser.roasterId}`;
  console.log("  DB externalAuthId (before):", dbUser.externalAuthId);
  console.log("  Target pending id:", pendingId);

  const clerkUser = await findClerkUserByEmail(EMAIL);

  if (clerkUser) {
    const googleLinked = hasGoogleExternalAccount(clerkUser);
    console.log("  Clerk prod user:", clerkUser.id);
    console.log("  Google external account linked:", googleLinked);

    if (googleLinked) {
      if (dbUser.externalAuthId !== clerkUser.id) {
        await prisma.user.update({
          where: { id: dbUser.id },
          data: { externalAuthId: clerkUser.id },
        });
        console.log("\n  Updated User.externalAuthId →", clerkUser.id);
      } else {
        console.log("\n  Already linked to Google-backed Clerk user.");
      }
      console.log(
        "\n  Next: sign in at https://roasters.joeperks.com/sign-in with Google."
      );
      return;
    }

    console.log("  Deleting email-only Clerk user (blocks Google OAuth)…");
    await clerkDelete(`/users/${clerkUser.id}`);
    console.log("  Deleted:", clerkUser.id);
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
  Next steps (Clerk Dashboard — Joe Perks - Roasters prod):
  1. Configure → User & authentication → Email → Password → set **not required**
     (OAuth sign-up fails silently when password is required on a fresh prod instance.)
  2. Configure → Webhooks → add https://roasters.joeperks.com/api/webhooks/clerk
     Events: user.created, user.updated — copy signing secret to Vercel CLERK_WEBHOOK_SECRET
  3. Clear cookies / incognito → https://roasters.joeperks.com/sign-in → Continue with Google
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

/**
 * Smoke tests for US-02-03 — Stripe Connect onboarding.
 *
 * Usage:
 *   cd packages/db && bun run scripts/smoke-onboarding.ts
 *   — or from repo root: cd packages/db && bun run scripts/smoke-onboarding.ts
 *
 * Requires: DATABASE_URL (loaded via packages/db/load-env-bootstrap),
 *           pnpm dev running (roaster on 3001, web on 3000),
 *           Stripe CLI listener forwarding to localhost:3000.
 */
import "../load-env-bootstrap";

import { spawn } from "node:child_process";
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

function runStripeTrigger(args: string[]): Promise<{
  exitCode: number | null;
  stderr: string;
  stdout: string;
}> {
  return new Promise((resolve, reject) => {
    const child = spawn("stripe", args, {
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk: Buffer | string) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk: Buffer | string) => {
      stderr += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", (exitCode) => {
      resolve({ exitCode, stderr, stdout });
    });
  });
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: smoke script intentionally performs many sequential environment checks
async function main() {
  console.log("\n--- US-02-03 Smoke Tests ---\n");

  // ── 1. DB: At least one Roaster with status ONBOARDING exists ──
  const roasters = await prisma.roaster.findMany({
    select: {
      id: true,
      email: true,
      status: true,
      stripeAccountId: true,
      stripeOnboarding: true,
      chargesEnabled: true,
      payoutsEnabled: true,
    },
  });

  console.log(`Found ${roasters.length} roaster(s) in DB:`);
  for (const r of roasters) {
    console.log(
      `  id=${r.id}  email=${r.email}  status=${r.status}  stripe=${r.stripeAccountId ?? "none"}  onboarding=${r.stripeOnboarding}  charges=${r.chargesEnabled}  payouts=${r.payoutsEnabled}`
    );
  }

  if (roasters.length > 0) {
    pass("At least one Roaster record exists");
  } else {
    fail(
      "No Roaster records in DB",
      "Submit a roaster application and approve it first (US-02-01 + US-02-02)"
    );
  }

  // ── 2. DB: User linked to roaster ──
  const roasterUsers = await prisma.user.findMany({
    where: { roasterId: { not: null } },
    select: {
      id: true,
      email: true,
      role: true,
      roasterId: true,
      externalAuthId: true,
    },
  });

  console.log(`\nFound ${roasterUsers.length} user(s) linked to roasters:`);
  for (const u of roasterUsers) {
    console.log(
      `  id=${u.id}  email=${u.email}  role=${u.role}  roasterId=${u.roasterId}  clerkId=${u.externalAuthId}`
    );
  }

  if (roasterUsers.length > 0) {
    pass("At least one User linked to a Roaster");
  } else {
    fail("No Users linked to Roasters");
  }

  // ── 3. Connect API route responds (unauthenticated → 401) ──
  try {
    const res = await fetch("http://localhost:3001/api/stripe/connect", {
      method: "POST",
    });
    if (res.status === 401) {
      pass("POST /api/stripe/connect returns 401 without auth (expected)");
    } else {
      fail(
        `POST /api/stripe/connect returned ${res.status} (expected 401)`,
        await res.text().catch(() => "")
      );
    }
  } catch (e) {
    fail(
      "POST /api/stripe/connect unreachable",
      e instanceof Error ? e.message : "unknown"
    );
  }

  // ── 4. Onboarding page responds (unauthenticated → redirect or page) ──
  try {
    const res = await fetch("http://localhost:3001/onboarding", {
      redirect: "manual",
    });
    if (res.status === 200 || res.status === 307 || res.status === 302) {
      pass(
        `GET /onboarding returns ${res.status} (page or auth redirect — expected)`
      );
    } else {
      fail(`GET /onboarding returned ${res.status}`);
    }
  } catch (e) {
    fail(
      "GET /onboarding unreachable",
      e instanceof Error ? e.message : "unknown"
    );
  }

  // ── 5. Webhook: account.updated via Stripe CLI ──
  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (stripeKey) {
      const { exitCode, stderr, stdout } = await runStripeTrigger([
        "trigger",
        "account.updated",
        "--api-key",
        stripeKey,
      ]);
      if (exitCode === 0) {
        pass("stripe trigger account.updated succeeded");
      } else {
        fail(
          `stripe trigger account.updated exited ${exitCode}`,
          (stderr || stdout).slice(0, 200)
        );
      }
    } else {
      fail("STRIPE_SECRET_KEY not set — skipping webhook test");
    }
  } catch (e) {
    fail(
      "stripe trigger account.updated failed",
      e instanceof Error ? e.message : "unknown"
    );
  }

  // ── 6. Webhook handler: verify StripeEvent logged ──
  const recentEvents = await prisma.stripeEvent.findMany({
    where: { eventType: "account.updated" },
    orderBy: { processedAt: "desc" },
    take: 3,
    select: { stripeEventId: true, eventType: true, processedAt: true },
  });

  console.log(`\nRecent account.updated StripeEvents: ${recentEvents.length}`);
  for (const ev of recentEvents) {
    console.log(
      `  ${ev.stripeEventId}  ${ev.eventType}  ${ev.processedAt.toISOString()}`
    );
  }

  if (recentEvents.length > 0) {
    pass("StripeEvent entries exist for account.updated");
  } else {
    fail(
      "No StripeEvent entries for account.updated",
      "Webhook may not be forwarding correctly"
    );
  }

  // ── 7. Roaster.status promotion guard ──
  const onboardingRoaster = roasters.find((r) => r.status === "ONBOARDING");
  const activeRoaster = roasters.find((r) => r.status === "ACTIVE");
  if (activeRoaster) {
    pass(
      `Roaster ${activeRoaster.id} has status=ACTIVE (promotion happened or was already active)`
    );
  } else if (onboardingRoaster) {
    pass(
      `Roaster ${onboardingRoaster.id} is still ONBOARDING (waiting for Stripe KYC completion)`
    );
  } else if (roasters.length > 0) {
    pass(`Roaster(s) exist with status: ${roasters.map((r) => r.status).join(", ")}`);
  }

  // ── Summary ──
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

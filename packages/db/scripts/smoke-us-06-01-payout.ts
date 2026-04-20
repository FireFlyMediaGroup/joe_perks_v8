/**
 * Smoke checks for US-06-01 — payout eligibility, event consistency, and optional
 * live payout runner execution.
 *
 * Usage:
 *   pnpm db:smoke:us-06-01
 *   RUN_PAYOUT_RELEASE=1 pnpm db:smoke:us-06-01
 *
 * Requires: DATABASE_URL (packages/db/.env or env).
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

const RUN_PAYOUT_RELEASE_PATTERN = /^(1|true|yes)$/i;

function getEligibleOrders() {
  return prisma.order.findMany({
    select: {
      id: true,
      orderNumber: true,
      payoutEligibleAt: true,
      roasterTotal: true,
      status: true,
    },
    take: 10,
    where: {
      payoutEligibleAt: { lte: new Date() },
      payoutStatus: "HELD",
      status: "DELIVERED",
      stripeChargeId: { not: null },
      stripeTransferId: null,
    },
    orderBy: { payoutEligibleAt: "asc" },
  });
}

async function main() {
  console.log("\n--- US-06-01 Payout Smoke ---\n");

  const eligible = await getEligibleOrders();

  console.log(
    `Eligible payout candidates (sample up to 10): ${eligible.length}`
  );
  for (const o of eligible) {
    console.log(
      `  - ${o.orderNumber} (${o.id}) eligible_at=${o.payoutEligibleAt?.toISOString() ?? "n/a"} roaster_total=${o.roasterTotal}`
    );
  }

  if (RUN_PAYOUT_RELEASE_PATTERN.test(process.env.RUN_PAYOUT_RELEASE ?? "")) {
    console.log("\nRunning live payout runner...\n");
    const { runPayoutRelease } = await import(
      "../../../apps/web/lib/inngest/run-payout-release"
    );
    await runPayoutRelease();
  }

  const transferredWithoutEvent = await prisma.order.findMany({
    select: { id: true, orderNumber: true, stripeTransferId: true },
    take: 10,
    where: {
      payoutStatus: "TRANSFERRED",
      events: {
        none: {
          eventType: "PAYOUT_TRANSFERRED",
        },
      },
    },
  });

  const failedWithoutEvent = await prisma.order.findMany({
    select: { id: true, orderNumber: true },
    take: 10,
    where: {
      payoutStatus: "FAILED",
      events: {
        none: {
          eventType: "PAYOUT_FAILED",
        },
      },
    },
  });

  const debtResolutionFailures = await prisma.orderEvent.findMany({
    take: 10,
    where: {
      eventType: "PAYOUT_FAILED",
      payload: {
        path: ["reason"],
        equals: "roaster_debt_exceeds_payout",
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const postRunEligible = await getEligibleOrders();
  console.log(
    `Eligible payout candidates after checks/run (sample up to 10): ${postRunEligible.length}`
  );
  console.log(
    `Transferred orders missing PAYOUT_TRANSFERRED event: ${transferredWithoutEvent.length}`
  );
  console.log(
    `Failed orders missing PAYOUT_FAILED event: ${failedWithoutEvent.length}`
  );
  console.log(
    `Debt-blocked payout failures recorded: ${debtResolutionFailures.length}`
  );

  if (transferredWithoutEvent.length > 0) {
    console.log("\nTransferred orders missing event:");
    for (const order of transferredWithoutEvent) {
      console.log(
        `  - ${order.orderNumber} (${order.id}) transfer=${order.stripeTransferId ?? "n/a"}`
      );
    }
  }

  if (failedWithoutEvent.length > 0) {
    console.log("\nFailed orders missing event:");
    for (const order of failedWithoutEvent) {
      console.log(`  - ${order.orderNumber} (${order.id})`);
    }
  }

  if (debtResolutionFailures.length > 0) {
    console.log("\nRecent debt-blocked payout failures:");
    for (const event of debtResolutionFailures) {
      console.log(`  - ${event.orderId} at ${event.createdAt.toISOString()}`);
    }
  }

  if (transferredWithoutEvent.length > 0 || failedWithoutEvent.length > 0) {
    throw new Error("Payout event consistency check failed.");
  }

  await prisma.$disconnect();
  console.log("\nDone.\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

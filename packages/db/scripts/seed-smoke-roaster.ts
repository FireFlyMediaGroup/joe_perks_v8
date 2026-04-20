/**
 * Seeds a smoke-test roaster for US-02-03 verification.
 * Run from packages/db:  bun run scripts/seed-smoke-roaster.ts
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

async function main() {
  const email = "smoke-test-roaster@joeperks.test";

  const app = await prisma.roasterApplication.upsert({
    where: { email },
    create: {
      status: "APPROVED",
      email,
      contactName: "Smoke Test",
      businessName: "Smoke Test Roasters",
      city: "Portland",
      state: "OR",
      termsAgreedAt: new Date(),
      termsVersion: "1.0",
    },
    update: {},
  });
  console.log("Application:", app.id);

  const roaster = await prisma.roaster.upsert({
    where: { applicationId: app.id },
    create: {
      applicationId: app.id,
      status: "ONBOARDING",
      email,
      stripeOnboarding: "NOT_STARTED",
      fulfillerType: "ROASTER",
    },
    update: {},
  });
  console.log("Roaster:", roaster.id, "status:", roaster.status);

  const user = await prisma.user.upsert({
    where: { email },
    create: {
      externalAuthId: `clerk_pending:${roaster.id}`,
      email,
      role: "ROASTER_ADMIN",
      roasterId: roaster.id,
    },
    update: {},
  });
  console.log("User:", user.id, "roasterId:", user.roasterId);

  console.log("\nSmoke roaster seeded successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

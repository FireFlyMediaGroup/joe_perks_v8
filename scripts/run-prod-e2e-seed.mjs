#!/usr/bin/env node
/**
 * Seeds singletons + E2E roaster/org/campaign data against the DB in
 * packages/db/.env.production (via PRISMA_DATABASE_PROFILE=production).
 *
 * Guard: set JOE_PERKS_CONFIRM_PROD_E2E_SEED=1 after reviewing risks.
 *
 * Usage:
 *   JOE_PERKS_CONFIRM_PROD_E2E_SEED=1 pnpm db:seed:e2e:prod
 */
import { spawnSync } from "node:child_process";
import process from "node:process";

if (process.env.JOE_PERKS_CONFIRM_PROD_E2E_SEED !== "1") {
  console.error(
    "Refusing to seed production: set JOE_PERKS_CONFIRM_PROD_E2E_SEED=1\n" +
      "Read docs/testing/e2e-frontend-accounts-reference.md (Production E2E seed) first."
  );
  process.exit(1);
}

const cmd =
  "cd packages/db && " +
  "PRISMA_DATABASE_PROFILE=production bun run ./seed.ts && " +
  "PRISMA_DATABASE_PROFILE=production bun run ./scripts/seed-e2e-roaster.ts && " +
  "PRISMA_DATABASE_PROFILE=production bun run ./scripts/seed-e2e-org.ts && " +
  "PRISMA_DATABASE_PROFILE=production bun run ./scripts/seed-e2e-orders.ts";

const result = spawnSync(cmd, {
  shell: true,
  stdio: "inherit",
  env: process.env,
});

process.exit(result.status ?? 1);

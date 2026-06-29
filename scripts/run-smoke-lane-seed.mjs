#!/usr/bin/env node
/**
 * Seeds the isolated production smoke lane (roaster + org + campaign).
 *
 * Prerequisites:
 *   - Neon prod snapshot taken
 *   - pnpm migrate:deploy:prod && pnpm db:seed:prod
 *   - Live Stripe Connect accounts onboarded; ids in env (see docs/runbooks/prod-smoke-lane.md)
 *
 * Guard: JOE_PERKS_CONFIRM_SMOKE_LANE_SEED=1
 *
 * Usage:
 *   Fill in `.env.smoke-lane`, set JOE_PERKS_CONFIRM_SMOKE_LANE_SEED=1, then:
 *   pnpm db:seed:smoke-lane:prod
 */
import { spawnSync } from "node:child_process";
import process from "node:process";
import { loadSmokeLaneEnv } from "./load-smoke-lane-env.mjs";

loadSmokeLaneEnv();

if (process.env.JOE_PERKS_CONFIRM_SMOKE_LANE_SEED !== "1") {
  console.error(
    "Refusing to seed production smoke lane: set JOE_PERKS_CONFIRM_SMOKE_LANE_SEED=1\n" +
      "Read docs/runbooks/prod-smoke-lane.md first."
  );
  process.exit(1);
}

const dbProfile = process.env.DATABASE_URL
  ? ""
  : "PRISMA_DATABASE_PROFILE=production ";

const cmd =
  "cd packages/db && " + `${dbProfile}bun run ./scripts/seed-smoke-lane.ts`;

const result = spawnSync(cmd, {
  shell: true,
  stdio: "inherit",
  env: process.env,
});

process.exit(result.status ?? 1);

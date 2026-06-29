#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import process from "node:process";
import { loadSmokeLaneEnv } from "./load-smoke-lane-env.mjs";

loadSmokeLaneEnv();

const dbProfile = process.env.DATABASE_URL
  ? ""
  : "PRISMA_DATABASE_PROFILE=production ";

const cmd =
  `cd packages/db && ${dbProfile}bun run ./scripts/verify-smoke-lane.ts`;

const result = spawnSync(cmd, {
  shell: true,
  stdio: "inherit",
  env: process.env,
});

process.exit(result.status ?? 1);

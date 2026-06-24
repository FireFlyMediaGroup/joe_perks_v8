# AGENTS.md

Canonical Joe Perks agent context is in **[docs/AGENTS.md](./docs/AGENTS.md)** (includes **pnpm vs Bun**, env naming, **troubleshooting** e.g. busy dev ports, and the **main-first git workflow**).

Open that file at the start of each coding session.

**Launch context (April 2026 onward)**: v1 pre-mortem and launch runbook have been published. Before making changes that touch the money path, auth, or deploy pipeline, scan:
- [`docs/pre-mortems/2026-04-19-v1-launch.md`](./docs/pre-mortems/2026-04-19-v1-launch.md) — risks + framing
- [`docs/runbooks/v1-launch-runbook.md`](./docs/runbooks/v1-launch-runbook.md) — launch execution
- [`docs/testing/2026-06-07-connect-v2-migration-smoke.md`](./docs/testing/2026-06-07-connect-v2-migration-smoke.md) — Stripe Connect V2 migration + sandbox smoke evidence
- [`SCAFFOLD_CHECKLIST.md`](./SCAFFOLD_CHECKLIST.md) Phase 10 — action items (single source of truth)

## Cursor Cloud specific instructions

The startup update script runs `pnpm install` only (Node 22+ and pnpm 10.31.0 are preinstalled). Standard dev/lint/test/build commands and the full env-var reference live in [`docs/AGENTS.md`](./docs/AGENTS.md) — read that first. Notes below are the non-obvious caveats specific to running this monorepo in a fresh cloud VM.

- **Apps will not boot without two public URL vars.** `packages/next-config/keys.ts` requires `NEXT_PUBLIC_APP_URL` and `NEXT_PUBLIC_WEB_URL` (validated as URLs). Without them, every Next app crashes at startup with `Invalid environment variables` — this is the most common `pnpm dev` failure here. Each app loads its own **gitignored** `.env.local`, so these must be recreated each session. Quickest path: `cp apps/web/.env.example apps/web/.env.local`, `cp apps/roaster/.env.example apps/roaster/.env.local`, and create `apps/org/.env.local` / `apps/admin/.env.local` containing at least `NEXT_PUBLIC_APP_URL="http://localhost:3000"` and `NEXT_PUBLIC_WEB_URL="http://localhost:3001"`. All other integration vars can stay empty strings (`""` is treated as unset). After that, `pnpm dev` boots web (3000), roaster (3001), org (3002), admin (3003), and the email preview (3004).
- **No secrets needed for: install, `pnpm check` (lint), `pnpm turbo test` (vitest), and serving the public marketing/storefront pages** (homepage, `/pricing`, `/roasters/apply`, `/contact`, `/order-lookup` all render). These are the reliable smoke targets in a credential-less VM.
- **DB-backed runtime needs a real Neon endpoint, not a local Postgres.** `packages/db/database.ts` uses the Neon serverless **WebSocket** driver. Pointing `DATABASE_URL` at a plain `postgres://localhost` does not work for the running apps without code changes (don't change it). Prisma CLI (migrate/seed/studio/`db:smoke`) connects over normal TCP and can use any Postgres, but the app runtime cannot. So storefront product pages, checkout, order-lookup submit, `/orgs/apply`, and webhooks require a Neon `DATABASE_URL` (+ Stripe test keys, + per-portal Clerk apps) to exercise end to end.
- **`pnpm build` (full) currently fails on `apps/email`** (optional React Email preview tool) with a `framer-motion`/`motion-dom` `activeAnimations` export mismatch — a pre-existing dependency incompatibility, not an env problem. Build the four core apps instead: `pnpm turbo build --filter=web --filter=roaster --filter=org --filter=admin`. Build/test mirror CI env (`.github/workflows/ci.yml`): set `SKIP_ENV_VALIDATION=true`, a dummy `SESSION_SECRET`, a `DATABASE_URL`, and the two `NEXT_PUBLIC_*_URL`s.
- **Bun is not preinstalled.** Root `migrate`/`db:*`/seed/smoke scripts invoke `bun`/`bunx` (see docs/AGENTS.md). Install Bun if you need them, or run `pnpm exec prisma …` from `packages/db` for Prisma CLI tasks.

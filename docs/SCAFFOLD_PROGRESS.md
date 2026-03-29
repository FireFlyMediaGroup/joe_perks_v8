# Joe Perks — Scaffold Progress Tracker

**Tracker version:** 0.2  
**Baseline document:** `docs/SCAFFOLD_CHECKLIST.md` (v1.1)  
**Story series:** `docs/scaffold-stories/README.md`  
**Purpose:** Track what is actually complete in this repository compared with the baseline scaffold checklist, and keep a versioned review log in git.

---

## How to use this file

- Treat `docs/SCAFFOLD_CHECKLIST.md` as the **baseline setup plan**.
- Treat this file as the **current-state tracker**.
- Update this file whenever scaffold work lands so the git diff shows exactly what changed between reviews.

### Status legend

| Status | Meaning |
|---|---|
| `Done` | Implemented in the repo or already configured in version-controlled project files. |
| `Partial` | Scaffold exists, but the real Joe Perks implementation is still stubbed or incomplete. |
| `Manual` | Must be completed outside the repo (dashboards, DNS, legal, Vercel, secrets, etc.). |
| `Todo` | Not yet implemented in code and not merely a manual ops step. |

---

## Revision log

| Review version | Date | Summary |
|---|---|---|
| `0.1` | 2026-03-22 | Initial tracker created from `docs/SCAFFOLD_CHECKLIST.md` and current repo state. |
| `0.2` | 2026-03-23 | Story 00 in progress: 7 of 9 third-party accounts provisioned and local env files populated. Stripe and Resend deferred. Admin auth set. |
| `0.3` | 2026-03-28 | Story 01: Joe Perks Prisma schema, initial migration, seed singletons (`PlatformSettings`, `OrderSequence`), `generateOrderNumber` in `packages/db/order-number.ts`, Prisma seed wired in `packages/db/prisma.config.ts`. |
| `0.4` | 2026-03-28 | Production DB workflow: `packages/db/.env.production`, `load-env.ts` + `PRISMA_DATABASE_PROFILE=production`, root scripts `migrate:deploy:prod`, `db:seed:prod`, `db:smoke` / `db:smoke:prod`, `scripts/smoke-db.ts`. |
| `0.5` | 2026-03-28 | Story 02: `@joe-perks/stripe` — `getStripe()` singleton, `calculateSplits()` / `calculateStripeFeeCents()`, Upstash checkout limiter (`getCheckoutLimiter`, `checkoutLimiter`, `limitCheckout`), `src/splits.test.ts`. Webhook and checkout routes still stubs. |

---

## Snapshot summary

| Area | Status | Notes |
|---|---|---|
| Repo scaffold / monorepo layout | `Done` | Joe Perks apps/packages exist and run under Turbo. |
| Local developer workflow | `Done` | `pnpm dev`, `pnpm dev:all`, `pnpm dev:studio`, fixed ports, env handling, troubleshooting docs. |
| CI / PR hygiene | `Done` | PR template, CI workflow, Dependabot are present. |
| Docs / diagrams / agent guidance | `Done` | `docs/AGENTS.md`, `docs/CONVENTIONS.md`, mermaid diagrams, scaffold docs exist. |
| Database scaffold | `Done` | `packages/db/prisma/schema.prisma` is the Joe Perks domain model; migrations under `packages/db/prisma/migrations/`; `pnpm migrate` + `bunx prisma db seed` against local Neon. |
| Email scaffold | `Partial` | Package exists, templates exist, `sendEmail()` is still a stub. |
| Stripe scaffold | `Partial` | `@joe-perks/stripe` implements client, split math, and rate limiting (`packages/stripe/src`). Checkout API and webhook routes are still not DB-backed. |
| Inngest scaffold | `Partial` | Route exists, but `serve()` and jobs are not wired. |
| Auth / admin security | `Partial` | Roaster/org/admin surfaces exist, but Clerk and admin auth are not fully wired. |
| Vendor / infra accounts | `Manual` | Stripe, Neon, Clerk, Resend, Vercel, DNS, GitHub secrets still require dashboard work. |

---

## Known divergences from the baseline checklist

These items in the baseline checklist no longer match the repo exactly and should be read through this tracker:

1. **Repository metadata** is already updated to the live GitHub remote in `package.json`.
2. **Root dev flow** is `pnpm`-first, not "run `create-turbo` from scratch" because this repository is already scaffolded.
3. **Default local dev** excludes `@repo/cms` and `apps/studio` until their required env vars are present.
4. **Stripe / Inngest** are still scaffold placeholders, so checklist items that assume a complete MVP backend are not yet true. Prisma schema and seed are real (Story 01).

---

## Progress matrix

### Phase 1 — Business & legal

| Baseline area | Status | Evidence / current state | Next step |
|---|---|---|---|
| LLC, EIN, bank account, terms, privacy | `Manual` | Not represented in repo. | Complete externally, then update legal pages and remove placeholder language when ready. |

### Phase 2 — Domain & DNS

| Baseline area | Status | Evidence / current state | Next step |
|---|---|---|---|
| `joeperks.com`, `roasters`, `orgs`, `admin` domain plan | `Partial` | Domain structure is reflected in docs and app naming. | Register domain / configure DNS in provider and Vercel. |

### Phase 3 — Third-party accounts

| Baseline area | Status | Evidence / current state | Next step |
|---|---|---|---|
| Neon | `Done` | Project `joe_perks_v8` in us-east-1; `production` + `dev` branches; pooled dev URL in `.env` and `packages/db/.env`. | Apply migrations in other environments with `pnpm migrate:deploy` when deploying. |
| Stripe | `Manual` + `Partial` | Shared package: real Stripe client (`getStripe`), splits, checkout rate limiter; webhook and server checkout flows still stubs. | Add test keys to `.env` and `apps/web/.env.local` when exercising payments end-to-end. |
| Clerk | `Done` | Two Clerk apps created: `Joe Perks Roasters` and `Joe Perks Organizations`. Keys in `apps/roaster/.env.local` and `apps/org/.env.local`. | Wire auth + webhooks (Story 06). |
| Resend | `Manual` + `Partial` | Email package exists; sending path is stubbed. Waiting on domain verification. | Add token to `.env` when domain is verified. |
| Inngest | `Done` | Account created, signing key + event key in root `.env`. MCP config at `.cursor/mcp.json`. | Implement `serve()` and register jobs (Story 05). |
| Upstash | `Done` | Redis instance `joe-perks-ratelimit` created; REST URL + token in root `.env`. | Wire checkout rate limiter (Story 02). |
| Sentry | `Done` | 4 projects created (`joe_perks-web`, `-roaster`, `-org`, `-admin`). Auth token in root `.env`, per-app DSNs in each `apps/*/.env.local`. | Add `/api/test-sentry` route (Story 07). |
| PostHog | `Done` | Project created (US hosting). Key + host in `apps/web/.env.local`. Autocapture + session recording disabled. | Validate client/server usage post-scaffold. |
| UploadThing | `Done` | Account created, token in `apps/web/.env.local`. | Wire upload routes in Sprint 2–3. |

### Phase 4 — Repository setup

| Baseline area | Status | Evidence / current state | Next step |
|---|---|---|---|
| GitHub repo created | `Done` | `package.json` points to `FireFlyMediaGroup/joe_perks_v8`; repo initialized and pushed. | None. |
| Branch protection | `Manual` | Not stored in repo. | Configure `main` / `develop` rules in GitHub settings. |
| PR template | `Done` | `.github/pull_request_template.md` exists. | Adjust template only if workflow needs more fields. |
| GitHub Actions CI | `Done` | `.github/workflows/ci.yml` exists. | Add required secrets and connect branch protection to green CI. |

### Phase 5 — Local development setup

| Baseline area | Status | Evidence / current state | Next step |
|---|---|---|---|
| Node + pnpm workflow | `Done` | Root scripts use pnpm / Turbo. | Keep local tools current. |
| Monorepo scaffold | `Done` | Apps/packages/docs already exist. | No need to rerun bootstrap generators. |
| Root / app env examples | `Done` | `.env.example`, app `.env.example`, package examples exist. | Fill real values locally as services are provisioned. |
| Port and dev troubleshooting | `Done` | `docs/AGENTS.md` documents freeing busy ports instead of rerouting. | Follow that process when `EADDRINUSE` occurs. |
| Database migration + seed | `Done` | `packages/db/prisma/schema.prisma` + `prisma/migrations/`; `packages/db/seed.ts` upserts `PlatformSettings` and `OrderSequence` singletons; `prisma.config.ts` loads `packages/db/.env` and defines `migrations.seed`. | Run `pnpm migrate` after schema changes; `bunx prisma db seed` after reset. |
| Stripe CLI forwarding | `Todo` | Route exists but real webhook handling does not. | Implement webhook route, then validate with `stripe listen`. |
| Local app verification | `Partial` | Apps boot locally with current env fallback handling; some routes remain placeholders. | Verify again after real backend work lands. |

### Phase 6 — Vercel setup

| Baseline area | Status | Evidence / current state | Next step |
|---|---|---|---|
| Four Vercel projects | `Manual` | App folders are ready to map to separate projects. | Create/import projects in Vercel. |
| Vercel env vars | `Manual` | Names are documented in checklist / AGENTS docs. | Add Preview + Production env vars per app. |
| Custom domains / DNS | `Manual` | Planned in docs only. | Configure domains after projects are created. |
| Stripe / Inngest / Clerk production endpoints | `Manual` + `Partial` | Routes exist or are planned, but implementations are incomplete. | Finish implementations, then register external endpoints. |

### Phase 7 — Initial deployment verification

| Baseline area | Status | Evidence / current state | Next step |
|---|---|---|---|
| First deploy / green builds | `Manual` | Not verified from repo alone. | Deploy to Vercel Preview and confirm all apps build. |
| Smoke tests | `Todo` | Checklist exists; app routes are only partly production-ready. | Run after Vercel + env setup. |
| DB verification | `Partial` | Dev DB migrated + seeded; production alignment uses `packages/db/.env.production`, `pnpm migrate:deploy:prod`, `pnpm db:seed:prod`, `pnpm db:smoke:prod` (see `docs/AGENTS.md`). | Create `.env.production` from Neon main branch, run deploy + seed + smoke, then confirm Studio against prod if needed. |
| Sentry verification | `Todo` | No dedicated test route yet. | Add `/api/test-sentry` or equivalent, then test. |
| Stripe webhook verification | `Todo` | Blocked by stub webhook route. | Implement webhook and verify with Stripe CLI. |

### Phase 8 — Branching workflow

| Baseline area | Status | Evidence / current state | Next step |
|---|---|---|---|
| `main` / `develop` / feature branch workflow | `Partial` | Git is initialized and `main` is pushed; workflow is documented in checklist and AGENTS docs. | Create / protect `develop`, then use feature branches for next work. |

### Phase 9 — Production readiness gate

| Baseline area | Status | Evidence / current state | Next step |
|---|---|---|---|
| Legal / security / E2E / infra go-live checklist | `Manual` + `Todo` | Most items depend on real integrations that are still scaffold-only. | Finish technical scaffold first, then run full launch checklist. |

---

## Engineering backlog to finish the technical scaffold

Work these in roughly this order:

1. **Database foundation** — `Done` (Story 01). Schema, migrations, singleton seed, and `generateOrderNumber` live in `packages/db`.

2. **Payments and order lifecycle**
   - `@joe-perks/stripe` client, split calculation, and rate limiting are implemented (Story 02).
   - Replace stub checkout and Stripe webhook routes with DB-backed flows and idempotency.

3. **Email and notifications**
   - Implement `sendEmail()` via Resend.
   - Add `EmailLog`-backed dedupe once the schema supports it.

4. **Background jobs**
   - Replace the Inngest stub with `serve()`.
   - Register `sla-check`, `payout-release`, and `cart-cleanup`.

5. **Auth and protected surfaces**
   - Finish Clerk integration for roaster and org apps.
   - Add admin Basic Auth or stronger admin protection for MVP.

6. **Deployment verification**
   - Add GitHub / Vercel / vendor secrets.
   - Stand up Vercel projects and run the Phase 7 smoke tests.

---

## Review checklist for the next update

- Update the `Revision log`.
- Move any changed item from `Todo` / `Partial` to `Done`.
- Add file or route references in the notes column when important work lands.
- If `docs/SCAFFOLD_CHECKLIST.md` changes materially, update the baseline version noted at the top of this tracker.

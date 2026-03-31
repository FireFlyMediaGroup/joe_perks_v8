# Joe Perks — Scaffold Progress Tracker

**Tracker version:** 1.0  
**Baseline document:** `docs/SCAFFOLD_CHECKLIST.md` (v1.4)  
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
| `0.6` | 2026-03-28 | Story 02 finalized: Connect Express helpers (`createExpressConnectedAccount`, `createExpressAccountLink`), `mapStripeAccountToOnboardingStatus` with tests, `assertStripeSecretKeyAllowed` live-key guard, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` added to `apps/web/env.ts`, `ROASTER_APP_ORIGIN` in `apps/roaster/.env.local`. Webhook route is real (signature + idempotency + `account.updated`); roaster Connect route is real. Checkout route remains stub (Story 03). |
| `0.7` | 2026-03-28 | Story 03: Checkout route creates PaymentIntent + Order + Buyer upsert + frozen splits + rate limiting. Webhook handles `payment_intent.succeeded` (→ CONFIRMED, HELD, campaign `totalRaised` increment) and `payment_intent.payment_failed` (→ OrderEvent). Order-status GET route returns order by PI id or order id. `generateOrderNumber` exported from `@joe-perks/db`. |
| `0.8` | 2026-03-28 | Story 03 smoke test — all 5 tests pass (Stripe key valid, webhook rejects unsigned → 400, `stripe trigger` → 200, order-status → 404, checkout validates → 400). Three fixes applied: (1) `apps/web/proxy.ts` matcher now excludes `api` paths so i18n/auth middleware doesn't intercept API routes; (2) `apps/web/load-root-env.ts` + import in `next.config.ts` loads root `.env` into the web app process (Next.js only loads per-app `.env` by default in a monorepo); (3) removed empty-string env overrides (`DATABASE_URL`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`) from `apps/web/.env.local` that were masking root values. |
| `0.9` | 2026-03-28 | Story 04: Transactional email pipeline. `sendEmail()` in `packages/email/send-email.ts` sends via Resend with `EmailLog` dedupe on `(entityType, entityId, template)`. Web contact form migrated to `@joe-perks/email/send`. Smoke test at `packages/email/scripts/smoke-email.ts` (DB-only dedupe or full Resend+dedupe). No direct Resend imports remain in apps. |
| `1.0` | 2026-03-29 | Story 05 complete: Inngest `serve()` + three crons; docs (`SCAFFOLD_CHECKLIST` v1.4, `SCAFFOLD.md`, scaffold stories README, `story-05` evidence) aligned with codebase. |
| `1.1` | 2026-03-29 | Story 06 complete: Clerk for `apps/roaster` + `apps/org` (middleware + UI), HTTP Basic Auth for `apps/admin`, Clerk webhooks → `User` upsert (`packages/db/clerk-user-sync.ts`), `middleware.ts` re-exports for `web`/`roaster`/`org` so `proxy.ts` runs. |
| `1.2` | 2026-03-29 | Sprint 1 gap closure: (1) US-01-08 — Legal placeholder pages at `/terms/roasters`, `/terms/orgs`, `/privacy-policy` with PENDING LEGAL REVIEW banners. (2) US-01-07 — Sentry SDK wired into `apps/org` and `apps/admin` (instrumentation, sentry configs, `withSentry` in next.config.ts, `@sentry/nextjs` + `@repo/observability` deps); `/api/test-sentry` route added to `apps/web`. (3) US-01-04 — `BaseEmailLayout` shared wrapper, `OrderConfirmationEmail` and `WelcomeEmail` templates added to `@joe-perks/email`. (4) US-01-10 — `PostHogProvider` from `posthog-js/react` added to `@repo/analytics` provider. |
| `1.3` | 2026-03-29 | Sprint 2 US-08-06: `@joe-perks/email` — `roaster-application-received`, `roaster-approved`, `roaster-rejected`, `org-application-received` templates (subject constants + `sendEmail()` docs in each file); `package.json` exports for each. |
| `1.4` | 2026-03-29 | Sprint 2 US-02-06: `@joe-perks/types` — `isValidSlugFormat` + `isReservedSlug` in `src/slug-validation.ts`; `apps/web/app/api/slugs/validate/route.ts` — public GET endpoint with format/reserved/DB checks + Upstash 30 req/min rate limiting. |
| `1.5` | 2026-03-29 | Smoke test fixes: (1) Deleted `middleware.ts` from `apps/web`, `apps/org`, `apps/roaster` — Next.js 16 conflicts when both `middleware.ts` and `proxy.ts` exist; middleware logic already in `proxy.ts`. (2) `limitSlugValidation()` added to `@joe-perks/stripe` — Upstash deps live in `packages/stripe`, not in apps. (3) Slug regex fixed to enforce 3-char minimum. |
| `1.6` | 2026-03-29 | Sprint 2 US-02-01: 5-step roaster application form. Schema migration added `contactName`, `phone`, `website`, `description`, `city`, `state`, `coffeeInfo` to `RoasterApplication`. `limitRoasterApplication()` added to `@joe-perks/stripe` (3 req/hr). Server action with Zod validation + `sendEmail()` wiring. |
| `1.7` | 2026-03-29 | Sprint 2 US-02-02: Admin roaster approval queue (`apps/admin/app/approvals/roasters/`), `load-root-env.ts` on admin, `@joe-perks/db` + `@joe-perks/email` deps. Clerk `upsertUserFromClerkWebhook` merges `clerk_pending:*` users by email. |
| `1.8` | 2026-03-29 | Sprint 2 US-02-03: Roaster Stripe Connect onboarding UI at `apps/roaster/app/(authenticated)/onboarding/` (`connect-status`, `start-onboarding-button`, return/refresh handling). |
| `1.9` | 2026-03-30 | US-02-03 follow-up: `handleAccountUpdated` webhook promotes `Roaster.status` `ONBOARDING` → `ACTIVE` (per RA8, guarded against `SUSPENDED`). Smoke tests at `packages/db/scripts/smoke-onboarding.ts` (7/7 pass) + `seed-smoke-roaster.ts` for test data. |
| `1.10` | 2026-03-30 | Sprint 2 US-02-04: Roaster product + variant CRUD at `apps/roaster/app/(authenticated)/products/` (list, new, detail, edit; server actions; Zod; soft deletes). Migration `20260330180000_add_product_display_fields` adds optional `description`, `origin`, `imageUrl` on `Product`. |
| `1.11` | 2026-03-30 | US-02-04 follow-up: UploadThing (`uploadthing`, `@uploadthing/react`, `UPLOADTHING_TOKEN`, `/api/uploadthing`), portal sidebar + Clerk account section, `NextSSRPlugin` in authenticated layout. |
| `1.12` | 2026-03-30 | US-02-04 review: PASS. Smoke tests 13/13 (`packages/db/scripts/smoke-products.ts`). Post-review doc updates: `AGENTS.md` — `requireRoasterId()` in tenant isolation; `CONVENTIONS.md` — server action pattern, portal route structure (`_actions/`/`_components/`/`_lib/`), dollar-to-cents form helpers, `roaster-rejected.tsx` template listing. |
| `1.13` | 2026-03-30 | Sprint 2 US-02-05: Roaster flat shipping rates at `apps/roaster/app/(authenticated)/settings/shipping/` (CRUD server actions, Zod schema, default-rate rules, hard delete with last-rate guard). Non-blocking alerts on products list and product form when `ACTIVE` with no rates. |
| `1.14` | 2026-03-31 | Sprint 2 US-03-01: Org application form at `apps/web/app/[locale]/orgs/apply/` (5-step multi-step form, server action with `$transaction`, debounced slug validation, roaster card selector, pct slider, `sendEmail()`, `limitOrgApplication()` in `packages/stripe`). Migration `20260330210000_add_org_application_fields` + auto-migration `20260331023831` to drop temp defaults. |

---

## Snapshot summary

| Area | Status | Notes |
|---|---|---|
| Repo scaffold / monorepo layout | `Done` | Joe Perks apps/packages exist and run under Turbo. |
| Local developer workflow | `Done` | `pnpm dev`, `pnpm dev:all`, `pnpm dev:studio`, fixed ports, env handling, troubleshooting docs. |
| CI / PR hygiene | `Done` | PR template, CI workflow, Dependabot are present. |
| Docs / diagrams / agent guidance | `Done` | `docs/AGENTS.md`, `docs/CONVENTIONS.md`, mermaid diagrams, scaffold docs exist. |
| Database scaffold | `Done` | `packages/db/prisma/schema.prisma` is the Joe Perks domain model; migrations under `packages/db/prisma/migrations/`; `pnpm migrate` + `bunx prisma db seed` against local Neon. |
| Email scaffold | `Done` | `sendEmail()` in `packages/email/send.ts` (Resend + `EmailLog` dedupe); web contact form uses it. `BaseEmailLayout` shared wrapper, `OrderConfirmationEmail`, `WelcomeEmail`, plus Sprint 2 application templates (`roaster-application-received`, `roaster-approved`, `roaster-rejected`, `org-application-received`). |
| Stripe scaffold | `Done` | `@joe-perks/stripe` package complete (client, splits, rate limiting via `limitCheckout` + `limitSlugValidation`, Connect, status mapper). Checkout route creates PaymentIntent + DB order with frozen splits. Webhook handles `account.updated`, `payment_intent.succeeded`, `payment_intent.payment_failed` with idempotency. Order-status GET route. Roaster `POST /api/stripe/connect` + onboarding UI at `(authenticated)/onboarding/`. |
| Inngest scaffold | `Done` | `apps/web/app/api/inngest/route.ts` uses `serve()` with `sla-check` (hourly), `payout-release` (09:00 UTC), `cart-cleanup` (02:00 UTC). Sync the app URL in the Inngest dashboard when deploying. |
| Auth / admin security | `Done` | Clerk wired for roaster + org (`proxy.ts` handles middleware; `middleware.ts` removed in Next.js 16 migration). Admin uses HTTP Basic Auth (`apps/admin/middleware.ts`). Clerk webhooks at `apps/roaster/app/api/webhooks/clerk/route.ts` and `apps/org/app/api/webhooks/clerk/route.ts` upsert `User` via `upsertUserFromClerkWebhook` (pending `clerk_pending:*` ids merged by email on first Clerk sign-in). Roaster application approval queue at `/approvals/roasters`. Dashboards show tenant ids from DB `User` (see `apps/roaster/.../dashboard/page.tsx`, `apps/org/.../dashboard/page.tsx`). |
| Sentry (all apps) | `Done` | All four apps (`web`, `roaster`, `org`, `admin`) have `@sentry/nextjs` + `@repo/observability` instrumentation (`instrumentation.ts`, `instrumentation-client.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`). `withSentry` in `next.config.ts` activates on Vercel. `/api/test-sentry` smoke route on `apps/web`. |
| Legal pages | `Done` | `/terms/roasters`, `/terms/orgs`, `/privacy-policy` placeholder pages in `apps/web/app/[locale]/` with PENDING LEGAL REVIEW banners. |
| PostHog provider | `Done` | `PostHogProvider` (from `posthog-js/react`) wraps children in `@repo/analytics` provider; `posthog.init()` runs via `instrumentation-client.ts`. |
| Vendor / infra accounts | `Manual` | Stripe, Neon, Clerk, Resend, Vercel, DNS, GitHub secrets still require dashboard work. |

---

## Known divergences from the baseline checklist

These items in the baseline checklist no longer match the repo exactly and should be read through this tracker:

1. **Repository metadata** is already updated to the live GitHub remote in `package.json`.
2. **Root dev flow** is `pnpm`-first, not "run `create-turbo` from scratch" because this repository is already scaffolded.
3. **Default local dev** excludes `@repo/cms` and `apps/studio` until their required env vars are present.
4. **Stripe** is fully implemented (Stories 02 + 03, smoke-tested). **Inngest** jobs are wired (Story 05). Prisma schema and seed are real (Story 01).
5. **Root `.env` loading** — Next.js in a monorepo only loads `.env` from the app directory, not the repo root. `apps/web` and `apps/admin` use `load-root-env.ts` (imported in `next.config.ts`) to load the root `.env` via dotenv. Do **not** set empty-string overrides in per-app `.env.local` for variables that have values in root `.env`.
6. **Middleware API exclusion** — `apps/web/proxy.ts` matcher must exclude `api` paths (`/((?!api|...)`) to prevent i18n/auth/security middleware from intercepting API route handlers.
7. **Middleware entry file** — Next.js 16 deprecated `middleware.ts` in favor of `proxy.ts`. The thin `middleware.ts` re-export files were deleted from `apps/web`, `apps/roaster`, and `apps/org` (having both files caused conflicts). Next.js now loads middleware directly from `proxy.ts`. `apps/admin` retains `middleware.ts` (it has no `proxy.ts`).

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
| Stripe | `Manual` + `Done` | Package, checkout, webhooks, order-status, and Connect routes all implemented. | Add `sk_test_` to root `.env`, `pk_test_` to `apps/web/.env.local`, run `stripe listen` for `whsec_`, enable Connect in Dashboard. |
| Clerk | `Done` | Two Clerk apps created: `Joe Perks Roasters` and `Joe Perks Organizations`. Keys in `apps/roaster/.env.local` and `apps/org/.env.local`. Auth + user webhooks implemented (Story 06). | Register `POST /api/webhooks/clerk` in each Clerk app for Preview/Production URLs. |
| Resend | `Manual` + `Done` | `sendEmail()` and contact form send via Resend when `RESEND_TOKEN` / `RESEND_FROM` are set; `EmailLog` requires `DATABASE_URL`. | Verify sending domain in Resend when ready for production. |
| Inngest | `Done` | Account created, signing key + event key in root `.env`. MCP config at `.cursor/mcp.json`. `serve()` + three cron functions in `apps/web`. | Point the Inngest app URL at `https://<web-host>/api/inngest` (Preview/Production) and verify functions in the dashboard. |
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
| Stripe CLI forwarding | `Done` | Webhook route handles `account.updated`, `payment_intent.succeeded`, `payment_intent.payment_failed` with signature verification + idempotency. `stripe listen` verified — `stripe trigger payment_intent.succeeded` returns 200 on all forwarded events. | None — working. |
| Local app verification | `Partial` | Apps boot locally with current env fallback handling; some routes remain placeholders. | Verify again after real backend work lands. |

### Phase 6 — Vercel setup

| Baseline area | Status | Evidence / current state | Next step |
|---|---|---|---|
| Four Vercel projects | `Manual` | App folders are ready to map to separate projects. | Create/import projects in Vercel. |
| Vercel env vars | `Manual` | Names are documented in checklist / AGENTS docs. | Add Preview + Production env vars per app. |
| Custom domains / DNS | `Manual` | Planned in docs only. | Configure domains after projects are created. |
| Stripe / Inngest / Clerk production endpoints | `Manual` + `Partial` | Stripe webhooks and Inngest `serve()` are implemented; Clerk user sync webhooks live on roaster/org (`/api/webhooks/clerk`). Register production URLs in vendor dashboards when deploying. | Register Stripe webhook + Inngest sync + Clerk user webhooks per environment. |

### Phase 7 — Initial deployment verification

| Baseline area | Status | Evidence / current state | Next step |
|---|---|---|---|
| First deploy / green builds | `Manual` | Not verified from repo alone. | Deploy to Vercel Preview and confirm all apps build. |
| Smoke tests | `Partial` | Local: Story 03 checks (Stripe key, webhook rejection, `stripe trigger`, order-status, checkout validation); **`GET /api/inngest`** returns `function_count: 3` when `pnpm dev` (web) is running; `pnpm db:smoke` passes. Vercel/preview smoke tests not yet run. | Run Vercel smoke tests after deployment. |
| DB verification | `Partial` | Dev DB migrated + seeded; production alignment uses `packages/db/.env.production`, `pnpm migrate:deploy:prod`, `pnpm db:seed:prod`, `pnpm db:smoke:prod` (see `docs/AGENTS.md`). | Create `.env.production` from Neon main branch, run deploy + seed + smoke, then confirm Studio against prod if needed. |
| Sentry verification | `Partial` | `/api/test-sentry` route added to `apps/web`. All four apps have Sentry SDK wired. | Deploy to Vercel and verify errors appear in Sentry dashboard within 30 seconds. |
| Stripe webhook verification | `Done` | Webhook route implemented and verified. `stripe trigger payment_intent.succeeded` → all events forwarded, all returned HTTP 200. Signature verification and idempotency confirmed. | None — working. |

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

2. **Payments and order lifecycle** — `Done` (Stories 02 + 03).
   - `@joe-perks/stripe` package complete: client, splits, rate limiting, Connect helpers, status mapper.
   - Checkout route: PaymentIntent + Order/Buyer/Items/Event creation with frozen splits and rate limiting.
   - Webhook route: signature verification, idempotency, handlers for `account.updated`, `payment_intent.succeeded`, `payment_intent.payment_failed`.
   - Order-status GET route for post-checkout confirmation.
   - Roaster Connect onboarding route.

3. **Email and notifications** — `Done` (Story 04). `sendEmail()` + `EmailLog` dedupe; contact form migrated.

4. **Background jobs** — `Done` (Story 05). Inngest `serve()` registers `sla-check`, `payout-release`, and `cart-cleanup`.

5. **Auth and protected surfaces** — `Done` (Story 06). Clerk for roaster/org; Basic Auth for admin; Clerk → `User` sync webhooks.

6. **Deployment verification**
   - Add GitHub / Vercel / vendor secrets.
   - Stand up Vercel projects and run the Phase 7 smoke tests.

---

## Review checklist for the next update

- Update the `Revision log`.
- Move any changed item from `Todo` / `Partial` to `Done`.
- Add file or route references in the notes column when important work lands.
- If `docs/SCAFFOLD_CHECKLIST.md` changes materially, update the baseline version noted at the top of this tracker.

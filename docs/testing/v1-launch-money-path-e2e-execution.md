# v1 launch — money-path E2E execution plan

**Created**: 2026-04-20  
**Tied to**: [`docs/runbooks/v1-launch-runbook.md`](../runbooks/v1-launch-runbook.md) Phase A.3 / B.1, [`docs/testing/money-path-e2e-scenarios.md`](./money-path-e2e-scenarios.md)

## 0. Current sandbox status (2026-04-20)

**Confirmed complete for the currently implemented sandbox layers**:

- `pnpm test` — PASS
- `pnpm e2e:stripe-listen` — PASS
- `pnpm e2e:stripe-trigger` — PASS
- `pnpm e2e:sprint3` — PASS (`90 passed, 0 failed, 0 skipped`)
- `pnpm test:e2e:frontend` — PASS (`2 passed`)

This means the **current sandbox validation stack is green** across unit/package, Stripe CLI webhook forwarding, integration-style HTTP/DB flow, and buyer-facing browser flow.

This does **not** yet mean "ready to rotate production secrets now." Remaining launch gates still include:

- preview dress rehearsal on Vercel with sandbox/test-mode integrations
- production-safe bootstrap for the first real users / roasters / orgs / products / campaigns
- production env + webhook setup
- live-mode smoke transaction + refund
- full CI automation (`pnpm test:e2e`, `.github/workflows/e2e.yml`) still not shipped

---

## Runbook expectations vs this repo (April 2026)

| Runbook item | Status in repo |
|--------------|----------------|
| `pnpm test:e2e` | **Not defined** in root `package.json` yet (scenarios doc still says “to be added”). |
| `.github/workflows/e2e.yml` | **Missing**; only [`ci.yml`](../../.github/workflows/ci.yml) runs `check` + `build`. |
| MP-01 … EC-24 automated coverage | **Specification only** in `money-path-e2e-scenarios.md`; full Playwright + signed-webhook suite not present. |

Until those ship, use the **executable layers** below (unit/integration smoke + optional HTTP driver script + manual dress rehearsal).

---

## 1. Automated tests to run before sandbox → production rotation

### 1.1 Unit / package tests (CI-safe, no Stripe servers)

| Command | What it covers | Maps to scenarios |
|---------|----------------|-------------------|
| `pnpm test` (turbo) | `@joe-perks/stripe` split math, `assertSplitInvariants`, roaster/admin vitest suites | EC-01…EC-06 style invariants; org/platform bounds (see `packages/stripe/src/splits.test.ts`) |

**Always run** on every launch prep; must be green.

### 1.2 Integration-style money path (local services + Stripe test mode)

**Script**: [`packages/db/scripts/e2e-sprint-3.ts`](../../packages/db/scripts/e2e-sprint-3.ts) (Sprint 3 “E2E” driver — HTTP to `web` + Prisma for org/roaster flows).

| Prerequisite | Why |
|--------------|-----|
| `DATABASE_URL` in `packages/db/.env` (or env) | Prisma + flows read/write orders; **must match** the DB `web` uses (same Neon branch / local). |
| `pnpm dev` with **`web` on `:3000`** | Storefront + `/api/checkout/create-intent` + `/api/order-status`. Admin `:3003` is **not** required — Flow 3 simulates admin via DB. |
| Stripe CLI (optional for this script’s default path) | Flow 9 **simulates** `payment_intent.succeeded` in the DB. For **real** signed webhooks (runbook A.7), run Stripe listen and see below. |
| `pnpm --filter @joe-perks/db seed:e2e` | E2E roaster baseline if fixtures are missing. |

**Storefront URLs**: `apps/web` uses `next-international` with `urlMappingStrategy: "rewriteDefault"`, so the default locale (`en`) uses **locale-stripped** public paths (`/{orgSlug}`, not `/en/{orgSlug}`). The script matches that and sends **browser-like headers** so Arcjet / bot rules are less likely to block programmatic GETs.

**Networking**: Default `E2E_WEB_URL` is `http://127.0.0.1:3000` (avoids IPv6 `localhost` stalls). Override if needed. HTML fetches use `E2E_FETCH_TIMEOUT_MS` (default 60000) so a stuck SSR fails fast instead of hanging the script.

**Covers (partially)**: storefront → shipping guard → **create-intent** → simulated confirmation — aligned with runbook B.1 steps 6–7 and [`money-path-e2e-scenarios.md`](./money-path-e2e-scenarios.md) checkout spine; **not** full MP-01 payout + 30d hold.

#### Stripe CLI: forward webhooks to local `web`

Use a **test** secret key (`sk_test_…`) in `STRIPE_SECRET_KEY` (root `.env`, loaded by `web`).

1. **Terminal A** — dev stack: `pnpm dev` (ensure `web` serves `http://localhost:3000`).
2. **Terminal B** — forward events:
   ```bash
   pnpm e2e:stripe-listen
   ```
   This runs [`scripts/stripe-listen-from-root-env.mjs`](../../scripts/stripe-listen-from-root-env.mjs), which sets `STRIPE_API_KEY` from root **`STRIPE_SECRET_KEY`** in `.env` (avoids a stale key cached by the Stripe CLI). Override target with `STRIPE_LISTEN_FORWARD_TO` if needed.
3. **Trigger a fixture event** with the same root-`.env` Stripe key:
   ```bash
   pnpm e2e:stripe-trigger
   ```
   This runs [`scripts/stripe-trigger-from-root-env.mjs`](../../scripts/stripe-trigger-from-root-env.mjs) and defaults to `payment_intent.succeeded`. You can pass a different fixture name after `--`, for example `pnpm e2e:stripe-trigger -- charge.refunded`.
3. Stripe CLI prints a **webhook signing secret** (`whsec_…`). Set **`STRIPE_WEBHOOK_SECRET`** in the same env `web` loads (typically root `.env`) to that value **for this session** while the CLI is running (it changes per `stripe listen` unless you use a fixed endpoint secret from the Dashboard).
4. Trigger a test event (runbook A.7):  
   `stripe trigger payment_intent.succeeded --api-key sk_test_...`

**Root shortcuts**: `pnpm e2e:stripe-listen`, `pnpm e2e:sprint3` (runs the script from `packages/db`).

Full sequence:

```bash
cd /path/to/joe_perks_v8
pnpm --filter @joe-perks/db seed:e2e   # if fixtures missing
# Terminal A: pnpm dev
# Terminal B: pnpm e2e:stripe-listen  # optional for real webhook delivery
pnpm e2e:sprint3
# Optional: override base URL
# E2E_WEB_URL=http://127.0.0.1:3000 pnpm e2e:sprint3
```

### 1.2b Frontend browser E2E (Playwright)

**Purpose**: exercise the buyer storefront and checkout UI in a real browser against seeded fixtures.

| Command | What it does |
|---------|---------------|
| `pnpm test:e2e:frontend` | Runs Playwright against the seeded storefront (`e2e-test-org`) and checks storefront/cart/shipping/payment-step rendering. |
| `pnpm test:e2e:frontend:headed` | Same suite with a visible browser for local debugging. |
| `pnpm db:seed:e2e:frontend` | Bootstraps Prisma singletons + deterministic roaster/org/campaign fixtures used by the browser tests. |

**Current coverage**:
- Storefront renders seeded products and cart estimate.
- Buyer can reach checkout from the storefront, fill shipping, and reach the Stripe payment step.

**Execution detail**: the Playwright harness boots its own isolated `web` server on `http://127.0.0.1:3100`, reads `SESSION_SECRET` from the root `.env.local`, and writes deterministic fixture metadata before the tests begin.

**Not yet covered in Playwright**:
- Full card confirmation inside Stripe Elements.
- Fulfillment / payout / refund / dispute paths.
- Clerk-authenticated org/roaster portal journeys.

**Important**: this fixture seeding is for **local / test / preview-style environments only**. Do **not** make production bootstrap data part of automated E2E setup. Production seeding (first real roasters, orgs, products, pilot campaigns) is a separate launch-prep step and should use a dedicated, prod-safe process.

### 1.3 Payout DB smoke (post-delivery eligibility)

| Command | What it checks |
|---------|----------------|
| `pnpm db:smoke:us-06-01` | Eligible `DELIVERED` orders, payout event consistency; optional `RUN_PAYOUT_RELEASE=1` runs `runPayoutRelease()` |

Use after you have **DELIVERED** orders with realistic `payoutEligibleAt` in the same DB you use for sandbox.

### 1.4 Manual dress rehearsal (required for go-live gate)

Runbook **Phase B.1** steps 1–14 on **preview** domains with Stripe **test** keys and Clerk **development** — this is the authoritative E2E until MP-01…EC-24 are fully automated.

---

## 2. Scenario checklist (target coverage)

Use [`money-path-e2e-scenarios.md`](./money-path-e2e-scenarios.md) as the full list. For launch, prioritize:

| Priority | IDs | Notes |
|----------|-----|-------|
| P0 | MP-01, EC-07, EC-09 | Happy path + webhook idempotency + bad signature |
| P0 | EC-03, EC-04, EC-05 | Floor, negative roaster share, shipping passthrough |
| P1 | MP-02, MP-03 | Multi-item and max org % |
| P1 | EC-12, EC-14 | Refund / dispute (often CLI + admin) |
| P2 | EC-16…EC-24 | Declines, DST, magic-link expiry, SLA — implement or manual per risk |

---

## 3. Execution log

| Step | Command | Result | Notes |
|------|---------|--------|--------|
| 1 | `pnpm test` | **PASS** — 20 tests (stripe 9, admin 9, roaster 2) | 2026-04-20 |
| 2 | `pnpm db:smoke:us-06-01` | **PASS** — 0 eligible payouts in sample DB | Sanity check only |
| 3 | `pnpm e2e:sprint3` | **FIXED 2026-04-20** — Flow 6 used `/en/{slug}`; `rewriteDefault` expects `/{slug}` for `en`, and bare `fetch` could hang or fail vs browser. Script now uses `buyerPageUrl(slug)` + browser-like headers; see [`e2e-sprint-3.ts`](../../packages/db/scripts/e2e-sprint-3.ts) header comment. Re-run after `pnpm dev` on `:3000`. |
| 4 | `pnpm e2e:stripe-listen` | **PASS** — helper now uses root `.env` `STRIPE_SECRET_KEY`; listen reached `Ready!` and emitted a local `whsec_…` | Keep the listen session running while testing. |
| 5 | `pnpm e2e:stripe-trigger` | **PASS** — fixture event created with the same root `.env` Stripe key used by the apps | Local listen confirmed forwarded webhook deliveries with `200` responses from `http://127.0.0.1:3000/api/webhooks/stripe`. |
| 6 | `pnpm e2e:sprint3` (with local `web`) | **PASS** — 90 passed, 0 failed, 0 skipped | Flow 8 payload updated to match current checkout schema (`street`, `city`, `state`, `zip`, `country`). |
| 7 | `pnpm test:e2e:frontend` | **PASS** — 2 Playwright browser tests passed against seeded fixtures and a dedicated `web` server on `:3100` | Coverage currently stops at rendered Stripe payment UI (`iframe` + pay button), not final card confirmation/webhook settlement. |

*(Append rows as you execute.)*

## 4. Before rotating secrets to production values

Use this checklist **before** a true frontend beta that uses production values or real pilot users.

The detailed production data bootstrap process lives in [`../runbooks/v1-production-bootstrap-checklist.md`](../runbooks/v1-production-bootstrap-checklist.md).
Use [`../runbooks/v1-production-beta-tester-worksheet.md`](../runbooks/v1-production-beta-tester-worksheet.md) for each live production pilot run.

### 4.1 Preconditions

- [x] Sandbox-local suite is green (see §0 and §3).
- [ ] Phase B.1 preview dress rehearsal passes with sandbox/test-mode services.
- [ ] Owners agree the passing sandbox runs still reflect the code being promoted.

### 4.2 Production data bootstrap

- [ ] Decide who the first beta roasters and orgs are by name.
- [ ] Create a production-safe bootstrap plan for:
  - roaster records
  - org records
  - real user auth linkage
  - products / variants
  - shipping rates
  - campaigns
- [ ] Confirm bootstrap order of operations (migrations -> singletons -> production seed/bootstrap).
- [ ] Confirm **local E2E fixture scripts are not used against production**.

### 4.3 Production secret rotation

- [ ] Snapshot production Neon before any env or migration cutover.
- [ ] Apply latest committed migrations successfully.
- [ ] Add live Stripe keys to Vercel `production`.
- [ ] Create live Stripe webhook endpoints, then update `STRIPE_WEBHOOK_SECRET` with the live endpoint secret.
- [ ] Add Clerk production keys / redirect URLs / webhooks for `web`, `roaster`, and `org`.
- [ ] Add production Resend key and verified sending domain values.
- [ ] Add production Inngest, Upstash, Sentry, PostHog, and any remaining required values.
- [ ] Verify preview keeps sandbox/test-mode values unless intentionally changing it.

### 4.4 Pre-beta go / no-go

- [ ] Run the smallest possible live smoke transaction with a named pilot roaster/org.
- [ ] Confirm webhook delivery, order creation, email delivery, fulfillment visibility, and refund path.
- [ ] Confirm rollback path: previous Vercel deployment, Neon snapshot ID, and operator names.
- [ ] Only after all of the above: invite the first true frontend beta users.

### Troubleshooting

| Symptom | Likely cause |
|---------|----------------|
| Flow 6: `The operation timed out` | `web` not running on `E2E_WEB_URL`, or SSR hanging (DB/env). Default URL is `http://127.0.0.1:3000`. |
| Flow 5: no shipping rates | E2E roaster missing rates (e.g. interrupted Flow 7 in a prior run). Re-run **`pnpm --filter @joe-perks/db seed:e2e`** or restore rates in DB. |
| `stripe listen` / `stripe trigger` → `api_key_expired` / 401 | Use the helper commands (`pnpm e2e:stripe-listen`, `pnpm e2e:stripe-trigger`) so the CLI reads root `.env` `STRIPE_SECRET_KEY` instead of stale cached CLI credentials. |

---

*When `pnpm test:e2e` and `e2e.yml` land, replace §1.2 with the canonical command and point CI secrets (`STRIPE_TEST_*`, `DATABASE_URL_TEST`) here.*

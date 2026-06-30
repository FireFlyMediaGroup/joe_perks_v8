# Production Smoke Lane

**Purpose**: isolated production tenant for pre-beta live checkout proof (P-13 / P-14 / P-15) without touching real pilot roasters, orgs, or beta roster data.

**Use this instead of**:
- `pnpm db:seed:e2e:prod` / `seed-e2e-*.ts` on production (forbidden in [`v1-production-bootstrap-checklist.md`](./v1-production-bootstrap-checklist.md))
- checkout against `e2e-test-org` on live Stripe

## Smoke lane identity

| Field | Value |
|---|---|
| Org slug | `internal-smoke-lane` |
| Storefront | `https://joeperks.com/en/internal-smoke-lane` |
| Roaster email | `chris@chrisodomphoto.com` |
| Org email | `wearefireflymedia+internal-smoke-lane@gmail.com` |
| Buyer (order confirmation) | `joe@joeperks.com` |

Constants live in `packages/db/scripts/smoke-lane-constants.ts`.

## Prerequisites

1. Neon **production** snapshot taken — **Console (recommended):** project → **`main`** branch → **Backup & restore** → **Create snapshot**; copy snapshot ID into go-live guide step **1**. Full steps: [`neon-production-snapshot.md`](./neon-production-snapshot.md).
2. Schema + singletons applied:

```bash
pnpm migrate:deploy:prod
pnpm db:seed:prod
pnpm db:smoke:prod
```

3. Vercel **production** envs use **live** Stripe / Clerk / Resend (see [`sandbox-to-production-cutover.md`](./sandbox-to-production-cutover.md)).
4. Two **live-mode** Stripe Connect accounts onboarded for the smoke roaster and smoke org (charges + payouts enabled). Capture their `acct_…` ids.

You can onboard through the normal admin/roaster flows using the plus-addressed emails above, or create accounts in Stripe Dashboard and paste ids into the seed command below.

## Step 1 — Seed the smoke lane on Neon main

Fill in **`.env.smoke-lane`** at the repo root (see `docs/runbooks/prod-smoke-lane.env.template`), then:

```bash
# Set JOE_PERKS_CONFIRM_SMOKE_LANE_SEED=1 and both acct_… ids in .env.smoke-lane first
pnpm db:seed:smoke-lane:prod
```

This creates ACTIVE roaster + org + campaign + products + shipping. It does **not** create historical orders.

Guardrails:
- Requires `packages/db/.env.production` with prod `DATABASE_URL` (`ep-bold-field-…`).
- Refuses dev Neon (`ep-dark-tree-…`).
- Refuses placeholder / E2E-style Connect ids.

## Step 2 — Verify readiness

```bash
pnpm smoke-lane:verify
```

Manual spot-check (optional):
- [ ] `https://joeperks.com/en/internal-smoke-lane` loads products
- [ ] checkout payment UI loads (live publishable key)
- [ ] roaster fulfillment email domain resolves to production

## Step 3 — Browserbase live money-path (recorded)

Fill in **`.env.smoke-lane`** (including `JOE_PERKS_CONFIRM_LIVE_MONEY_PATH=1`, card, Browserbase, Stripe). Never commit real values.

Run:

```bash
pnpm test:e2e:browserbase:live-smoke
```

### What you get

| Artifact | Location |
|---|---|
| Browserbase session replay | Printed at start: `https://www.browserbase.com/sessions/<id>` |
| Structured evidence JSON | `test-results/live-money-path-evidence.json` |
| Playwright HTML report | `playwright-report-live-smoke/` |

The test runs: storefront → live checkout → `CONFIRMED` → fulfillment magic link (via prod DB) → `SHIPPED` → optional Stripe refund → `REFUNDED`.

## Preflight guards (automatic)

The live test refuses to run when:
- `JOE_PERKS_CONFIRM_LIVE_MONEY_PATH` is not `1`
- `DATABASE_URL` points at dev Neon (`ep-dark-tree`) unless `LIVE_SMOKE_ALLOW_DEV_DB=1`
- `PLAYWRIGHT_E2E_ORG_SLUG` is not `internal-smoke-lane` unless `LIVE_SMOKE_REQUIRE_SMOKE_LANE_SLUG=0`
- slug is `e2e-test-org`

## Relationship to bootstrap checklist

- **Steps 1–8** of [`v1-production-bootstrap-checklist.md`](./v1-production-bootstrap-checklist.md) still apply for real beta rosters.
- **Step 9** (smallest live smoke) can be satisfied entirely on the smoke lane using this runbook + Browserbase recording before inviting external beta testers.
- After smoke lane passes, bootstrap real pilot entities separately; do not reuse smoke lane slug for customer-facing beta.

## Rollback

If smoke lane data is wrong:
- Restore Neon snapshot from before seed, **or**
- Leave smoke lane rows in place (isolated) and fix forward — they do not affect pilot org slugs.

## Related

- [`neon-production-snapshot.md`](./neon-production-snapshot.md) — Block A step 1 (Console + API)
- Smoke lane passed on production 2026-06-29 (order JP-00012): [`../v1-go-live-guide.md`](../v1-go-live-guide.md) steps 13–15; evidence [`./launch-day-evidence/2026-06-29-smoke-lane-jp-00012.md`](./launch-day-evidence/2026-06-29-smoke-lane-jp-00012.md)
- [`../testing/v1-launch-money-path-e2e-execution.md`](../testing/v1-launch-money-path-e2e-execution.md) — sandbox CI money path (separate from this prod lane)

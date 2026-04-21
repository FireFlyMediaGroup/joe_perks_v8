# v1 Production Bootstrap Checklist

**Purpose**: define the production-safe process for creating the first real Joe Perks data set before a true frontend beta.

**Use this with**:
- [`./v1-launch-runbook.md`](./v1-launch-runbook.md) — overall launch sequence
- [`../testing/v1-launch-money-path-e2e-execution.md`](../testing/v1-launch-money-path-e2e-execution.md) — sandbox evidence + pre-rotation gate
- [`./v1-production-beta-tester-worksheet.md`](./v1-production-beta-tester-worksheet.md) — per-tester live production worksheet
- [`../VERCEL_PRODUCTION_PREVIEW_SETUP.md`](../VERCEL_PRODUCTION_PREVIEW_SETUP.md) — Vercel env/project setup
- [`../../SCAFFOLD_CHECKLIST.md`](../../SCAFFOLD_CHECKLIST.md) — launch-blocking gate tracker

## Core rule

Production bootstrap is **not** the local E2E seed path.

Do **not** run:
- `pnpm --filter @joe-perks/db seed:e2e`
- `pnpm db:seed:e2e:frontend`
- `packages/db/scripts/seed-e2e-roaster.ts`
- `packages/db/scripts/seed-e2e-org.ts`
- `packages/db/scripts/write-playwright-fixtures.ts`

Against production.

The only currently-approved production seed command is:

```bash
pnpm db:seed:prod
```

That command prepares foundational singletons only:
- `PlatformSettings`
- `OrderSequence`

Everything else for production beta bootstrap must be deliberate, reviewed, and traceable.

## Exit criteria

This checklist is complete only when all of the following are true:

- production DB schema matches the committed repo migrations
- foundational singleton rows exist
- first beta roasters, orgs, users, products, shipping rates, and campaigns exist in production
- live Stripe / Clerk / Resend / webhook configuration matches that production data
- a smallest-possible live smoke transaction can be executed and refunded

## Required inputs

Before touching production, gather this in one shared document or secure note:

- beta launch date
- owner for each step
- production Neon database URL / branch
- Neon snapshot operator
- Vercel production project access
- live Stripe platform keys
- live Stripe Connect account IDs for the first beta roasters/orgs
- Clerk production app details and planned user emails
- Resend production domain and sender
- named first beta roasters and orgs
- named first internal smoke-test buyer

## Beta roster worksheet

Complete this table before bootstrap begins.

### Roasters

| Field | Value |
|---|---|
| Business name | |
| Contact name | |
| Contact email | |
| City / state | |
| Live Stripe account ID | |
| Charges enabled? | |
| Payouts enabled? | |
| Fulfiller type | |
| Planned products | |
| Shipping rates | |

### Orgs

| Field | Value |
|---|---|
| Org name | |
| Contact name | |
| Contact email | |
| Desired slug | |
| Desired org % | |
| Linked roaster(s) | |
| Live Stripe account ID | |
| Charges enabled? | |
| Payouts enabled? | |
| Planned campaign name | |

### Users

| Role | Email | Clerk user ID | Linked record |
|---|---|---|---|
| Roaster admin | | | |
| Org admin | | | |
| Platform admin | | | |
| Smoke-test buyer | | | |

## Step 1 — Freeze the production plan

- [ ] Confirm sandbox-local E2E is green.
- [ ] Confirm preview dress rehearsal has passed with sandbox/test-mode integrations.
- [ ] Confirm this exact branch/commit is the one being promoted.
- [ ] Confirm first beta roster worksheet is complete.
- [ ] Confirm who can stop the launch if bootstrap data looks wrong.

## Step 2 — Protect production before writes

- [ ] Take a fresh Neon production snapshot.
- [ ] Record snapshot ID: `__________________`
- [ ] Confirm rollback owner: `__________________`
- [ ] Confirm rollback operator has Vercel + Neon access.
- [ ] Confirm no one else is manually editing production rows during bootstrap.

## Step 3 — Apply schema + singleton prerequisites

Run only after the snapshot exists.

```bash
pnpm migrate:deploy:prod
pnpm db:seed:prod
pnpm db:smoke:prod
```

Checklist:
- [ ] `pnpm migrate:deploy:prod` passed
- [ ] `pnpm db:seed:prod` passed
- [ ] `pnpm db:smoke:prod` passed
- [ ] `_prisma_migrations` matches the intended release
- [ ] `PlatformSettings` values reviewed for production business rules
- [ ] `OrderSequence` singleton exists

## Step 4 — Load production secrets before app-facing bootstrap

Do this before creating records that depend on live integrations.

- [ ] Upload production env values to Vercel projects
- [ ] Verify `DATABASE_URL` points at production Neon
- [ ] Verify live `STRIPE_SECRET_KEY`
- [ ] Verify live `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- [ ] Verify live `STRIPE_WEBHOOK_SECRET`
- [ ] Verify production Clerk keys and redirect URLs
- [ ] Verify production Resend token / sender
- [ ] Verify production Inngest / Upstash / Sentry / PostHog values
- [ ] Verify preview still uses sandbox/test-mode values

## Step 5 — Bootstrap roasters

Create production roasters in this order:

1. `RoasterApplication`
2. `Roaster`
3. `User`
4. `RoasterShippingRate`
5. `Product`
6. `ProductVariant`

Checklist per roaster:
- [ ] `RoasterApplication` exists with real business/contact data
- [ ] terms agreement timestamp/version recorded
- [ ] `Roaster` exists and is `ACTIVE`
- [ ] live `stripeAccountId` stored correctly
- [ ] `stripeOnboarding = COMPLETE`
- [ ] `chargesEnabled = true`
- [ ] `payoutsEnabled = true`
- [ ] roaster admin `User` exists
- [ ] `User.externalAuthId` matches the real Clerk production user ID if auth is live
- [ ] at least one default shipping rate exists
- [ ] at least one active product exists
- [ ] each product has at least one active variant

Guardrails:
- never reuse test/sandbox Stripe account IDs
- do not leave production beta users on placeholder `clerk_pending:*` values once external sign-in is expected
- confirm every roaster used in beta has shipping configured before inviting buyers

## Step 6 — Bootstrap orgs

Create production orgs in this order:

1. `OrgApplication`
2. `RoasterOrgRequest`
3. `Org`
4. `User`
5. `Campaign`
6. `CampaignItem`

Checklist per org:
- [ ] `OrgApplication` exists with real contact data
- [ ] desired slug reviewed for collisions / branding
- [ ] desired org % approved
- [ ] `RoasterOrgRequest` exists for the intended roaster relationship
- [ ] `Org` exists and is `ACTIVE`
- [ ] live `stripeAccountId` stored correctly if applicable
- [ ] `stripeOnboarding = COMPLETE`
- [ ] `chargesEnabled = true`
- [ ] `payoutsEnabled = true`
- [ ] org admin `User` exists
- [ ] `User.externalAuthId` matches the real Clerk production user ID if auth is live
- [ ] at least one `ACTIVE` campaign exists
- [ ] campaign items reference active roaster variants
- [ ] `CampaignItem` price snapshots are reviewed before launch

Guardrails:
- keep `orgPct` inside production-approved bounds
- verify every campaign points at the intended org
- verify campaign items are using production prices, not copied test assumptions

## Step 7 — Verify storefront readiness

For each beta org:
- [ ] storefront URL resolves on the production domain
- [ ] campaign copy and branding are correct
- [ ] products render
- [ ] prices are correct
- [ ] cart estimate renders
- [ ] checkout is enabled
- [ ] shipping rate selection appears
- [ ] payment UI loads with live publishable key

## Step 8 — Verify connected systems

### Stripe
- [ ] live webhook endpoint exists for production `web`
- [ ] events subscribed match the launch runbook
- [ ] endpoint secret stored in the correct Vercel project
- [ ] first beta roasters/orgs show expected Connect status in Stripe

### Clerk
- [ ] roaster production Clerk app works
- [ ] org production Clerk app works
- [ ] webhook delivery succeeds
- [ ] user IDs match production `User.externalAuthId` values

### Email
- [ ] Resend production sender verified
- [ ] test send delivered to a real inbox
- [ ] buyer/roaster/admin-facing origin links point at production domains

### Inngest
- [ ] production app synced
- [ ] `sla-check` visible
- [ ] `payout-release` visible
- [ ] `cart-cleanup` visible

## Step 9 — Execute the smallest possible live smoke transaction

Do this before opening the frontend beta broadly.

- [ ] choose one named pilot roaster
- [ ] choose one named org/campaign
- [ ] choose one internal buyer
- [ ] place the smallest acceptable live order
- [ ] confirm webhook delivery
- [ ] confirm `Order` creation
- [ ] confirm email delivery
- [ ] confirm roaster fulfillment visibility
- [ ] confirm order-status visibility
- [ ] issue immediate refund if this is still a smoke-only transaction
- [ ] complete one copy of [`./v1-production-beta-tester-worksheet.md`](./v1-production-beta-tester-worksheet.md)
- [ ] document result in the launch evidence folder

## Step 10 — Sign-off before true frontend beta

- [ ] production bootstrap owner signs off
- [ ] engineering owner signs off
- [ ] business owner signs off
- [ ] rollback plan re-read
- [ ] first beta invite list approved

## If anything fails

Stop and do **not** continue with additional production writes until:

- the failure is documented
- the blast radius is understood
- the rollback choice is explicit:
  - keep data and fix forward
  - restore from Neon snapshot
  - revert Vercel deployment

## Notes for this repo right now

Current repo reality as of 2026-04-20:

- sandbox/local executable money-path coverage is green
- preview dress rehearsal is still a required gate
- full `pnpm test:e2e` and `.github/workflows/e2e.yml` are still missing
- org/admin launch blockers in the broader runbook still apply

So this bootstrap checklist is the **production data and operations plan**, not a declaration that all launch blockers are closed.

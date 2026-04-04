# Vercel Production And Stage Setup

## Purpose
This runbook explains how to deploy the current Joe Perks monorepo to Vercel using:

- `Production` for the `main` branch
- `Preview` as the staging environment for `develop` and pull requests

This matches the current repo direction in `docs/AGENTS.md`, `docs/SCAFFOLD_CHECKLIST.md`, and `.github/workflows/ci.yml`.

## Deployment Model
There are four deployable apps in this repo:

- `apps/web` -> `joeperks.com`
- `apps/roaster` -> `roasters.joeperks.com`
- `apps/org` -> `orgs.joeperks.com`
- `apps/admin` -> `admin.joeperks.com`

Recommended branch mapping:

- `main` -> Vercel `Production`
- `develop` -> Vercel `Preview` and treated as the shared stage environment
- feature branches / PR branches -> Vercel `Preview`

If you want a stable stage URL instead of using Vercel's generated preview URLs, attach branch domains to `develop`, for example:

- `staging.joeperks.com` -> `apps/web`
- `staging-roasters.joeperks.com` -> `apps/roaster`
- `staging-orgs.joeperks.com` -> `apps/org`
- `staging-admin.joeperks.com` -> `apps/admin`

## CI/CD Responsibilities
GitHub Actions remains CI only.

- CI file: `.github/workflows/ci.yml`
- Runs on `main` and `develop`
- Executes:
  - `pnpm install --frozen-lockfile`
  - `pnpm check`
  - `pnpm turbo build`

Vercel Git integration handles deployments.

- Push or merge to `develop` -> stage preview deploys
- Open or update a PR -> branch preview deploys
- Push or merge to `main` -> production deploys

## Important Repo Notes
Before configuring Vercel, keep these repo-specific rules in mind:

1. Local development uses a root `.env`, but Vercel does not. Add environment variables in each Vercel project directly.
2. `apps/web`, `apps/org`, and `apps/admin` load the repo root `.env` locally via `load-root-env.ts`. That does not carry over to Vercel.
3. Use `pnpm` commands for install/build alignment with CI, even though some older docs still reference Bun-heavy setup.
4. Database migrations are not automated by the current CI/CD setup. Run them as a release step.
5. Stripe, Clerk, Inngest, and DNS wiring are manual dashboard steps even though the routes already exist in code.

## Step 1: Prepare GitHub
1. Make sure both `main` and `develop` exist on GitHub.
2. Keep `.github/workflows/ci.yml` enabled.
3. Add branch protection:
   - `main`: require PRs and green CI
   - `develop`: require green CI
4. Add or confirm GitHub Actions secrets:
   - `DATABASE_URL_DEV`
   - `BASEHUB_TOKEN` if your builds need it

## Step 2: Create Four Vercel Projects
Create one Vercel project per app from the same repository.

### `joe-perks-web`
- Root directory: `apps/web`
- Framework preset: `Next.js`
- Install command: `pnpm install`
- Build command: `cd ../.. && pnpm turbo build --filter=web`
- Output directory: `.next`
- Production branch: `main`

### `joe-perks-roaster`
- Root directory: `apps/roaster`
- Framework preset: `Next.js`
- Install command: `pnpm install`
- Build command: `cd ../.. && pnpm turbo build --filter=roaster`
- Output directory: `.next`
- Production branch: `main`

### `joe-perks-org`
- Root directory: `apps/org`
- Framework preset: `Next.js`
- Install command: `pnpm install`
- Build command: `cd ../.. && pnpm turbo build --filter=org`
- Output directory: `.next`
- Production branch: `main`

### `joe-perks-admin`
- Root directory: `apps/admin`
- Framework preset: `Next.js`
- Install command: `pnpm install`
- Build command: `cd ../.. && pnpm turbo build --filter=admin`
- Output directory: `.next`
- Production branch: `main`

## Step 3: Add Environment Variables
Configure both `Production` and `Preview` in every Vercel project.

Critical rule:

- `Production` must use live or production-grade services
- `Preview` must use test or development-grade services
- `DATABASE_URL`, Stripe keys, and webhook secrets must differ between `Production` and `Preview`

### Bulk upload with the Vercel sync script
To avoid entering variables one at a time, use the repo script:

```bash
pnpm vercel:env:sync --env preview
pnpm vercel:env:sync --env production
```

The script is dry-run by default. Add `--apply` to actually upload:

```bash
pnpm vercel:env:sync --env preview --apply
pnpm vercel:env:sync --env production --apply
```

Store local upload files under `.vercel/env/` so they stay out of git:

```bash
.vercel/env/web.preview.env
.vercel/env/roaster.preview.env
.vercel/env/org.preview.env
.vercel/env/admin.preview.env

.vercel/env/web.production.env
.vercel/env/roaster.production.env
.vercel/env/org.production.env
.vercel/env/admin.production.env
```

Example:

```bash
# .vercel/env/web.preview.env
DATABASE_URL=postgresql://...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
RESEND_TOKEN=re_...
INNGEST_SIGNING_KEY=signkey-...
INNGEST_EVENT_KEY=...
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
ROASTER_APP_ORIGIN=https://staging-roasters.joeperks.com
```

Notes:

- The script uploads to the correct Vercel project based on the file name.
- It validates keys against an allowlist per app before uploading.
- It uses the current Vercel CLI login automatically, or `VERCEL_TOKEN` if set.
- It uses `upsert=true`, so rerunning the command updates existing variables instead of duplicating them.

### Shared Guidance
Use these values by environment:

- `Production`
  - Neon production branch
  - Stripe live keys
  - production webhook secrets
  - production public domains
- `Preview`
  - Neon dev branch
  - Stripe test keys
  - preview or stage webhook secrets
  - `develop` branch URLs

### `apps/web`
Add these variables to the `joe-perks-web` project:

```bash
DATABASE_URL=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
RESEND_TOKEN=
RESEND_FROM=
INNGEST_SIGNING_KEY=
INNGEST_EVENT_KEY=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
SENTRY_AUTH_TOKEN=
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=
PLATFORM_ALERT_EMAIL=
ROASTER_APP_ORIGIN=
```

Notes:

- `ROASTER_APP_ORIGIN` should point to the public roaster portal URL for the same environment.
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` must match the same mode as `STRIPE_SECRET_KEY`.

### `apps/roaster`
Add these variables to the `joe-perks-roaster` project:

```bash
DATABASE_URL=
STRIPE_SECRET_KEY=
RESEND_TOKEN=
RESEND_FROM=
SENTRY_AUTH_TOKEN=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_WEBHOOK_SECRET=
ROASTER_APP_ORIGIN=
ORG_APP_ORIGIN=
UPLOADTHING_TOKEN=
```

Notes:

- `ROASTER_APP_ORIGIN` should be the roaster portal URL for the same environment.
- `ORG_APP_ORIGIN` is used in org approval email links.
- `UPLOADTHING_TOKEN` is optional if you do not need product image uploads immediately.

### `apps/org`
Add these variables to the `joe-perks-org` project:

```bash
DATABASE_URL=
STRIPE_SECRET_KEY=
SENTRY_AUTH_TOKEN=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_WEBHOOK_SECRET=
ORG_APP_ORIGIN=
```

Notes:

- `ORG_APP_ORIGIN` should be the org portal URL for the same environment.
- The org app has a Stripe Connect route, so it needs `STRIPE_SECRET_KEY`.

### `apps/admin`
Add these variables to the `joe-perks-admin` project:

```bash
DATABASE_URL=
STRIPE_SECRET_KEY=
RESEND_TOKEN=
RESEND_FROM=
SENTRY_AUTH_TOKEN=
ADMIN_EMAIL=
ADMIN_PASSWORD=
ROASTER_APP_ORIGIN=
ORG_APP_ORIGIN=
```

Notes:

- `ADMIN_EMAIL` and `ADMIN_PASSWORD` power the HTTP Basic Auth gate.
- `ROASTER_APP_ORIGIN` and `ORG_APP_ORIGIN` are used for approval and account lifecycle links.

## Step 4: Configure Domains
Attach the production domains to the production deployments:

- `joeperks.com` -> `joe-perks-web`
- `www.joeperks.com` -> redirect to `joeperks.com`
- `roasters.joeperks.com` -> `joe-perks-roaster`
- `orgs.joeperks.com` -> `joe-perks-org`
- `admin.joeperks.com` -> `joe-perks-admin`

Recommended stage branch domains for `develop`:

- `staging.joeperks.com` -> `joe-perks-web`
- `staging-roasters.joeperks.com` -> `joe-perks-roaster`
- `staging-orgs.joeperks.com` -> `joe-perks-org`
- `staging-admin.joeperks.com` -> `joe-perks-admin`

After adding domains in Vercel:

1. Copy the DNS records Vercel gives you into your DNS provider.
2. Wait for DNS and certificate issuance.
3. Verify all domains return valid HTTPS responses.

## Step 5: Run Database Release Steps
Do not rely on deploys alone for schema changes.

### Preview / stage database
When `develop` introduces migrations, apply them to the Neon dev branch before or immediately after the stage deploy:

```bash
pnpm migrate:deploy
```

If the dev database is new or reset, also seed it:

```bash
cd packages/db && bunx prisma db seed
```

### Production database
Before the first production release, set up `packages/db/.env.production` from the production Neon branch and run:

```bash
pnpm migrate:deploy:prod
pnpm db:seed:prod
pnpm db:smoke:prod
```

## Step 6: Register External Endpoints
These routes already exist in the repo, but the dashboards still need to be configured.

### Stripe
Register webhook endpoints for the `web` app:

- Stage / preview:
  - `https://staging.joeperks.com/api/webhooks/stripe`
  - or a stable `develop` preview URL if you do not use a stage domain
- Production:
  - `https://joeperks.com/api/webhooks/stripe`

Subscribe to:

- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `charge.dispute.created`
- `charge.dispute.closed`
- `account.updated`
- `transfer.failed`

After Stripe generates each endpoint secret:

- Put the preview secret in the Vercel `Preview` env for `apps/web`
- Put the production secret in the Vercel `Production` env for `apps/web`

### Clerk
Register user webhooks for the portal apps:

#### Roaster Clerk app
- Stage: `https://staging-roasters.joeperks.com/api/webhooks/clerk`
- Production: `https://roasters.joeperks.com/api/webhooks/clerk`

#### Org Clerk app
- Stage: `https://staging-orgs.joeperks.com/api/webhooks/clerk`
- Production: `https://orgs.joeperks.com/api/webhooks/clerk`

For each Clerk app:

1. Subscribe to `user.created`
2. Subscribe to `user.updated`
3. Copy the webhook signing secret
4. Store it as `CLERK_WEBHOOK_SECRET` in the matching Vercel project and environment

### Inngest
Sync the `web` app route in the Inngest dashboard:

- Stage: `https://staging.joeperks.com/api/inngest`
- Production: `https://joeperks.com/api/inngest`

Verify the following functions appear:

- `sla-check`
- `payout-release`
- `cart-cleanup`

## Step 7: First Stage Deploy
Use `develop` as the first shared stage branch.

```bash
git checkout develop
git pull origin develop
git push origin develop
```

Then confirm in Vercel:

1. All four preview deployments build successfully.
2. The stage domains or `develop` preview URLs resolve correctly.
3. Environment variables are loaded correctly.

## Step 8: Stage Smoke Test Checklist
Run this smoke pass against the stage environment before shipping to production.

### `apps/web`
- Home page or storefront route loads
- Checkout page loads for a valid storefront
- `POST /api/webhooks/stripe` rejects an invalid signature with `400`
- `/api/inngest` responds and syncs in Inngest

### `apps/roaster`
- Clerk sign-in page renders
- Dashboard loads after auth
- Stripe Connect onboarding route works

### `apps/org`
- Clerk sign-in page renders
- Dashboard loads after auth
- Campaign routes load for an authenticated org user

### `apps/admin`
- Basic Auth prompt appears
- Admin dashboard loads after valid credentials

### Shared verification
- Sentry receives a test event from the deployed environment
- Clerk webhooks deliver successfully
- Stripe test webhook deliveries succeed
- Neon dev branch is the database behind stage, not production

## Step 9: Production Release Flow
Once `develop` is validated:

```bash
git checkout main
git pull origin main
git merge develop
git push origin main
```

Then:

1. Verify the production deploys complete in Vercel.
2. Run production database migration and smoke checks if needed.
3. Confirm production domains resolve correctly.
4. Confirm live Stripe webhook delivery is healthy.
5. Confirm Inngest is synced to the production `web` route.

## Step 10: Ongoing Workflow
Use this operating model going forward:

1. Branch from `develop`
2. Open PRs into `develop`
3. Review feature previews in Vercel
4. Merge into `develop` for shared stage testing
5. Promote `develop` into `main` for production

## Repo State
App-level Vercel config is now present across all four deployable apps:

- `apps/web/vercel.json`
- `apps/roaster/vercel.json`
- `apps/org/vercel.json`
- `apps/admin/vercel.json`

Matching `scripts/skip-ci.js` files are also present for each app, so the `[skip ci]` Vercel build-skip behavior is consistent across `web`, `roaster`, `org`, and `admin`.

## Source References
This runbook is based on:

- `docs/AGENTS.md`
- `docs/CONVENTIONS.md`
- `docs/SCAFFOLD_CHECKLIST.md`
- `docs/SCAFFOLD_PROGRESS.md`
- `docs/scaffold-stories/story-07-deploy-verify.md`
- `.github/workflows/ci.yml`
- `.env.example`

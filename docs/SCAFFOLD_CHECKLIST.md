# Joe Perks — Project Scaffold & Environment Setup Checklist
## Complete developer setup guide from zero to first deployment

**Version:** 1.4 | **Environment model:** Production + Development + Vercel Preview deployments  
**Audience:** Developer setting up the project for the first time, or AI coding agents helping with setup  
**Estimated time:** 3–4 hours for a complete setup (accounts + Vercel); **additional** time for the Joe Perks schema and integration work listed below.  
**Companion tracker:** `docs/SCAFFOLD_PROGRESS.md` — versioned current-state comparison against this checklist.  
**Story series:** `docs/scaffold-stories/README.md` — one focused scaffold story per workstream, ordered for the dev team.

---

## Where this repo is in the scaffold

**Two tracks:** Phases **1–3** and most of **6–7** are **your organization’s work** (accounts, DNS, Vercel) — those checkboxes stay `[ ]` until you complete them. The bullets below describe **this codebase** (Joe Perks monorepo derived from **next-forge**) so you can see what is already implemented vs what still defines the **technical** scaffold.

### Done in the repository (code + repo config)
- [x] Monorepo layout: `apps/web`, `apps/roaster`, `apps/org`, `apps/admin`, `apps/email`, `apps/studio`; `packages/db`, `packages/stripe`, `packages/email`, `packages/types`, `packages/ui`, plus shared `@repo/*` packages (see `docs/01-project-structure.mermaid`).
- [x] Local dev: root **`pnpm dev`** runs Turbo dev for the Joe Perks apps **excluding** `@repo/cms` (needs `BASEHUB_TOKEN` / `packages/cms/.env.local`) and **`studio`** (needs `DATABASE_URL`); use **`pnpm dev:all`** and **`pnpm dev:studio`** when those are configured (`docs/AGENTS.md`).
- [x] Fixed ports: web **3000**, roaster **3001**, org **3002**, admin **3003**, React Email preview **3004**, Prisma Studio **3005**.
- [x] **GitHub PR template** at `.github/pull_request_template.md` (story, testing, security checklist).
- [x] **CI** at `.github/workflows/ci.yml`: pnpm 10, `pnpm install --frozen-lockfile`, **`pnpm check`** (Ultracite), **`pnpm turbo build`** with secrets `DATABASE_URL_DEV`, `BASEHUB_TOKEN`, and `SKIP_ENV_VALIDATION=true`.
- [x] **Dependabot** at `.github/dependabot.yml` (npm + GitHub Actions).
- [x] Optional integration env vars: empty strings treated as unset in `packages/*/keys.ts` where applicable so **`pnpm dev`** can start without every vendor key filled in.
- [x] **API routes** on `apps/web`: `api/checkout/create-intent` (PaymentIntent + Order creation with frozen splits, rate limiting), `api/order-status` (GET by PI id or order id), `api/webhooks/stripe` (signature verification, idempotency, handlers for `account.updated`, `payment_intent.succeeded`, `payment_intent.payment_failed`), `api/inngest` (Inngest **`serve()`** — `sla-check`, `payout-release`, `cart-cleanup`). Local smoke test verified with `stripe trigger` (webhooks) and `GET /api/inngest` (function registration).
- [x] **`@joe-perks/stripe`** package complete: `getStripe()` singleton, `calculateSplits()` / `calculateStripeFeeCents()`, Upstash checkout rate limiter, Connect Express helpers, `mapStripeAccountToOnboardingStatus`, `assertStripeSecretKeyAllowed`. Unit tests passing.
- [x] **`@joe-perks/email`**: **`sendEmail()`** uses Resend + **`EmailLog`** dedupe `(entityType, entityId, template)`; web contact form uses `@joe-perks/email/send` (see `docs/AGENTS.md`).
- [x] **Middleware API exclusion**: `apps/web/proxy.ts` matcher excludes `api` paths so i18n/auth/Arcjet middleware does not intercept route handlers.
- [x] **Root `.env` loading**: `apps/web/load-root-env.ts` (imported in `next.config.ts`) loads root `.env` into the web app process — required because Next.js only auto-loads `.env` from the app directory.
- [x] **`packages/db`**: Prisma 7 config, Neon adapter, **Joe Perks domain schema** (`packages/db/prisma/schema.prisma`), migrations under `packages/db/prisma/migrations/`, **seed** upserts `PlatformSettings` + `OrderSequence` singletons (`seed.ts`), `generateOrderNumber` in `order-number.ts`. Production deploy path: `pnpm migrate:deploy:prod`, `packages/db/.env.production` (see `docs/AGENTS.md`).
- [x] **Inngest:** `apps/web/app/api/inngest/route.ts` uses **`serve()`**; registered crons **`sla-check`** (hourly), **`payout-release`** (daily 09:00 UTC), **`cart-cleanup`** (daily 02:00 UTC). Implementation under `apps/web/lib/inngest/`; Stripe helpers in `packages/stripe/src/payouts.ts`. See `docs/scaffold-stories/story-05-inngest-jobs.md`.

### Remaining for a complete Joe Perks *technical* scaffold
- [ ] **Portals:** Clerk-backed roaster/org flows, admin Basic Auth + platform routes — beyond placeholder pages — per PRD / epics.
- [ ] **CMS (optional):** set `BASEHUB_TOKEN` for local **`pnpm dev:all`** if marketing/content depends on Basehub.
- [ ] **Metadata:** point root `package.json` **`repository.url`** at your real GitHub remote when you publish (may still reference next-forge upstream).
- [ ] **`/api/test-sentry`** (or equivalent) on `apps/web` if you rely on **Phase 7.4 / Phase 9.4** Sentry smoke tests — route is **not** in the repo yet.

### Still your responsibility (outside this checklist’s code column)
Phases **1–3** (legal, DNS, vendor accounts), **4.1–4.2** (GitHub repo + branch protection), **6+** (Vercel projects, DNS, production webhooks), and **7–9** (verification and production gates) — complete when your org is ready.

---

## Environment Strategy

### Why 2 environments, not 3

This project uses **2 permanent environments** plus **Vercel preview deployments**:

| Environment | Branch | Stripe Keys | Database | Purpose |
|---|---|---|---|---|
| **Production** | `main` | Live (`sk_live_`) | Neon `main` branch | Real money, real users |
| **Development** | `develop` | Test (`sk_test_`) | Neon `dev` branch | Active development |
| **Preview** (ephemeral) | Any PR branch | Test (`sk_test_`) | Neon `dev` branch | Per-PR review, auto-deleted |

**Why not 3 (dev/staging/prod)?**  
A dedicated staging environment requires a third DB branch, third set of credentials for every service, and permanent Vercel projects that sit idle most of the time. With AI-agent-driven development and Vercel's per-PR preview deployments, each pull request gets its own isolated preview URL automatically. This gives you staging-level isolation without the operational overhead. Promote `develop → main` only when you're confident — preview deployments are your safety net.

---

## Pre-requisites Checklist

Before touching any code, complete these steps in order. Items marked 🔴 will block Sprint 1.

---

## PHASE 1 — Business & Legal Setup

> Complete these before any third-party account creation. Several services (Stripe) require a legal entity.

### 1.1 Legal entity
- [ ] 🔴 Form LLC or legal entity in your state
- [ ] 🔴 Obtain EIN (Employer Identification Number) from IRS — free, takes 15 minutes online
- [ ] 🔴 Open business bank account linked to the LLC
- [ ] Note down: legal business name, EIN, registered address, business bank account details
- [ ] Draft roaster terms of service (placeholder is fine — mark PENDING LEGAL REVIEW)
- [ ] Draft org terms of service (placeholder)
- [ ] Draft privacy policy (placeholder)

---

## PHASE 2 — Domain & DNS Setup

### 2.1 Domain registration
- [ ] 🔴 Register `joeperks.com` (if not already owned) — Cloudflare Registrar recommended
- [ ] Log into your DNS provider dashboard
- [ ] Plan your subdomain structure:
  - `joeperks.com` → main site + buyer storefronts
  - `roasters.joeperks.com` → roaster portal
  - `orgs.joeperks.com` → org portal
  - `admin.joeperks.com` → platform admin

> **DNS records will be added in Phase 6 (Vercel setup). Do not add them yet.**

---

## PHASE 3 — Third-Party Account Creation

Complete all accounts in this phase. You will get API keys that go into your `.env` files later.

### 3.1 Neon (Postgres database) 🔴 SPRINT 1 BLOCKER
- [ ] Create account at [neon.tech](https://neon.tech)
- [ ] Create new project: name it `joe-perks`
- [ ] Select region closest to your Vercel deployment region (us-east-1 recommended)
- [ ] Two branches are created automatically — rename them:
  - `main` → production database
  - Create a new branch from `main`: name it `dev` → development database
- [ ] Copy connection strings for both branches:
  - `DATABASE_URL` (main) — save as **PROD DATABASE URL**
  - `DATABASE_URL` (dev) — save as **DEV DATABASE URL**
- [ ] Enable connection pooling on both branches (Neon dashboard → branch → enable pooler)
- [ ] Confirm point-in-time recovery is active (7 days on free tier)
- [ ] Add a note in your password manager: Neon dashboard URL, project name, who has access

### 3.2 Stripe 🔴 SPRINT 1 BLOCKER
- [ ] Create account at [stripe.com](https://stripe.com) using your **business entity email**
- [ ] Complete business verification with your LLC details + EIN
- [ ] Enable Stripe Connect in the dashboard: Settings → Connect → Get started
- [ ] Set Connect settings:
  - Account type: Express
  - Statement descriptor: `JOE PERKS`
  - Support email: `support@joeperks.com`
- [ ] Collect API keys:
  - Test publishable key (`pk_test_...`) → **TEST PUBLISHABLE KEY**
  - Test secret key (`sk_test_...`) → **TEST SECRET KEY**
  - Live publishable key (`pk_live_...`) → **LIVE PUBLISHABLE KEY** (do NOT use in dev)
  - Live secret key (`sk_live_...`) → **LIVE SECRET KEY** (do NOT use in dev)
- [ ] Set up webhook endpoints — two separate endpoints:
  - Development: will be added when Vercel project is deployed (Phase 6)
  - Production: will be added when Vercel project is deployed (Phase 6)
  - For now: note the events to subscribe to (see webhook events list below)
- [ ] Enable Stripe Tax (optional for MVP — configure before expanding past one state)

**Stripe webhook events to subscribe to (for both dev + prod endpoints):**
```
payment_intent.succeeded
payment_intent.payment_failed
charge.dispute.created
charge.dispute.closed
account.updated
transfer.failed
```

### 3.3 Clerk (authentication) — two separate apps 🔴 SPRINT 1 BLOCKER
- [ ] Create account at [clerk.com](https://clerk.com)
- [ ] Create Application 1: name `Joe Perks Roasters`
  - Enable Email + Password sign-in
  - Enable Email verification
  - Set allowed callback URL: `https://roasters.joeperks.com/sign-in/sso-callback`
  - Set development callback URL: `http://localhost:3001/sign-in/sso-callback`
  - Copy: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` → **ROASTER CLERK PUBLIC KEY**
  - Copy: `CLERK_SECRET_KEY` → **ROASTER CLERK SECRET KEY**
  - Add webhook endpoint: note the Clerk webhook secret → **ROASTER CLERK WEBHOOK SECRET**
- [ ] Create Application 2: name `Joe Perks Orgs`
  - Same settings as above
  - Set allowed callback URL: `https://orgs.joeperks.com/sign-in/sso-callback`
  - Set development callback URL: `http://localhost:3002/sign-in/sso-callback`
  - Copy: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` → **ORG CLERK PUBLIC KEY**
  - Copy: `CLERK_SECRET_KEY` → **ORG CLERK SECRET KEY**
  - Add webhook endpoint: note the Clerk webhook secret → **ORG CLERK WEBHOOK SECRET**

### 3.4 Resend (email) 🔴 SPRINT 1 BLOCKER
- [ ] Create account at [resend.com](https://resend.com)
- [ ] Add domain: `joeperks.com`
- [ ] Copy the DNS records Resend provides (SPF, DKIM, DMARC)
- [ ] ⚠ Add these DNS records to your domain NOW — propagation takes 24–48 hours
  - In your DNS provider, add the TXT records exactly as Resend shows
  - Do NOT skip this step — email will not send without domain verification
- [ ] Get API key: → **RESEND API KEY** (`re_...`)
- [ ] Configure sending addresses (will be set up in code, just note them):
  - `orders@joeperks.com` — transactional order emails
  - `hello@joeperks.com` — welcome and onboarding
  - `support@joeperks.com` — support communications

### 3.5 Inngest (background jobs)
- [ ] Create account at [inngest.com](https://inngest.com)
- [ ] Create new app: `joe-perks`
- [ ] Copy: Event Key → **INNGEST EVENT KEY**
- [ ] Copy: Signing Key → **INNGEST SIGNING KEY**

### 3.6 Upstash (Redis for rate limiting)
- [ ] Create account at [upstash.com](https://upstash.com)
- [ ] Create Redis database: name `joe-perks-ratelimit`, region closest to Vercel
- [ ] Copy: REST URL → **UPSTASH REDIS REST URL**
- [ ] Copy: REST Token → **UPSTASH REDIS REST TOKEN**

### 3.7 Sentry (error monitoring)
- [ ] Create account at [sentry.io](https://sentry.io)
- [ ] Create organization: `joe-perks`
- [ ] Create 4 projects (one per app):
  - `joe-perks-web` → **SENTRY DSN WEB**
  - `joe-perks-roaster` → **SENTRY DSN ROASTER**
  - `joe-perks-org` → **SENTRY DSN ORG**
  - `joe-perks-admin` → **SENTRY DSN ADMIN**
- [ ] In each project: Settings → Source Maps → enable and note auth token
- [ ] Copy: Auth Token → **SENTRY AUTH TOKEN** (same for all 4 projects)
- [ ] Set up alert rules for each project:
  - Alert on: any error in checkout routes
  - Alert on: any error in webhook routes
  - Notification channel: email + Slack (if using)

### 3.8 Posthog (product analytics)
- [ ] Create account at [posthog.com](https://posthog.com) — select US or EU hosting
- [ ] Create project: `joe-perks`
- [ ] Copy: Project API Key → **POSTHOG KEY** (`phc_...`)
- [ ] Copy: API Host → **POSTHOG HOST** (`https://app.posthog.com` or EU equivalent)
- [ ] In Project Settings → Autocapture: **DISABLE** (prevents accidental PII capture)
- [ ] In Project Settings → Session recording: **DISABLE** (not needed for MVP)

### 3.9 Uploadthing (image uploads — MVP)
- [ ] Create account at [uploadthing.com](https://uploadthing.com)
- [ ] Create new app: `joe-perks`
- [ ] Copy: Secret → **UPLOADTHING SECRET**
- [ ] Copy: App ID → **UPLOADTHING APP ID**
- [ ] Configure file types: images only, max size 4MB

---

## PHASE 4 — Repository Setup

### 4.1 Create the GitHub repository
- [ ] Create new GitHub organization or use personal account
- [ ] Create repo: `joe-perks` — private
- [ ] Initialize with a README
- [ ] Add `.gitignore` for Node.js (will be replaced by Turborepo template)
- [ ] Add team members with appropriate permissions:
  - You: Owner
  - AI coding agents / contractors: Write access

### 4.2 Branch protection rules
- [ ] Settings → Branches → Add protection rule for `main`:
  - Require pull request before merging: ✅
  - Require at least 1 approval: ✅ (can be yourself via another device for MVP)
  - Require status checks to pass: ✅ (add after CI is set up)
  - Restrict who can push to matching branches: your account only
  - Do NOT allow bypassing the above settings
- [ ] Add protection rule for `develop`:
  - Require pull request before merging: ✅
  - Require status checks to pass: ✅
  - Allow force pushes: ✅ (needed for rebasing during active development)

### 4.3 PR template
Create `.github/PULL_REQUEST_TEMPLATE.md` in the repo root:
```markdown
## Story
Closes #[story-id] <!-- e.g. US-01-01 -->

## What changed
<!-- Brief description -->

## Acceptance criteria checklist
<!-- Paste the ACs from the story and check each one -->
- [ ] AC1:
- [ ] AC2:

## Testing
- [ ] Tested locally against dev DB
- [ ] Deployed to preview and smoke-tested

## Security checklist
- [ ] No PII (email, name, address, card data) logged in checkout or webhook routes
- [ ] No `req.body` logged anywhere
- [ ] All money values are integers in cents
- [ ] Tenant scoping verified on all DB queries (roaster_id / org_id from session)
- [ ] No direct Stripe imports in app code (use @joe-perks/stripe)
- [ ] No direct Resend calls (use sendEmail() from @joe-perks/email)
```

### 4.4 GitHub Actions CI
Create `.github/workflows/ci.yml`:
```yaml
name: CI
on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main, develop]

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - run: pnpm turbo typecheck
      - run: pnpm turbo lint
      - run: pnpm turbo build
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL_DEV }}
          SKIP_ENV_VALIDATION: true
```
- [ ] Add `DATABASE_URL_DEV` to GitHub Actions secrets (Settings → Secrets → Actions)

---

## PHASE 5 — Local Development Setup

### 5.1 Prerequisites on your machine
- [ ] Node.js 20+ installed: `node --version` (should be v20.x or higher)
- [ ] pnpm installed: `npm install -g pnpm` then `pnpm --version`
- [ ] Git configured: `git config --global user.name` and `user.email`
- [ ] Stripe CLI installed: `brew install stripe/stripe-cli/stripe` (macOS) or see [stripe.com/docs/stripe-cli](https://stripe.com/docs/stripe-cli)

### 5.2 Clone and initialize
```bash
git clone git@github.com:your-org/joe-perks.git
cd joe-perks
git checkout -b develop  # create develop branch
pnpm install
```

### 5.3 Monorepo origin (this repository)

**You are not starting from zero.** This project is a **customized next-forge / Turborepo** monorepo already shaped for Joe Perks (`apps/web`, `apps/roaster`, `apps/org`, `apps/admin`, `apps/email`, `apps/studio`, and `packages/*`). **Do not** run `npx create-turbo@latest` on top of this tree.

- Clone your team’s repo (or this fork), then **`pnpm install`** from the root.
- Structure and package names: **`docs/01-project-structure.mermaid`** and **`docs/AGENTS.md`**.

### 5.4 Create root `.env` file
```bash
cp .env.example .env
```
Fill in all values using the credentials collected in Phase 3:
```bash
# .env (root — shared by all apps via turbo pipeline)
DATABASE_URL=postgresql://...  # Neon DEV branch connection string
STRIPE_SECRET_KEY=sk_test_...  # TEST key only — never live key in .env
STRIPE_WEBHOOK_SECRET=whsec_... # from Stripe CLI in dev (see 5.7)
RESEND_TOKEN=re_...            # validated in @joe-perks/email/keys.ts (not RESEND_API_KEY)
INNGEST_SIGNING_KEY=signkey-...
INNGEST_EVENT_KEY=...
UPSTASH_REDIS_REST_URL=https://...upstash.io
UPSTASH_REDIS_REST_TOKEN=...
SENTRY_AUTH_TOKEN=...
```

### 5.5 Create app-specific `.env.local` files
```bash
# apps/web/.env.local
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
UPLOADTHING_SECRET=...
UPLOADTHING_APP_ID=...

# apps/roaster/.env.local
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...  # Roaster Clerk app
CLERK_SECRET_KEY=sk_test_...

# apps/org/.env.local
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...  # Org Clerk app
CLERK_SECRET_KEY=sk_test_...

# apps/admin/.env.local
ADMIN_EMAIL=admin@joeperks.com
ADMIN_PASSWORD=use-a-strong-password-here
```

### 5.6 Database migrations and seed

**Current state:** The repo has the **Joe Perks Prisma schema**, **migrations** under `packages/db/prisma/migrations/`, and a **real seed** for `PlatformSettings` + `OrderSequence` singletons. See **`docs/SCAFFOLD_PROGRESS.md`** and Story 01 (`docs/scaffold-stories/story-01-db-foundation.md`).

```bash
# From repo root (uses bunx + packages/db — see root package.json)
pnpm migrate                    # dev: migrate dev + new migration when schema changes
pnpm migrate:deploy             # apply existing migrations (CI / shared DBs)
pnpm migrate:deploy:prod        # production Neon: requires packages/db/.env.production

# Seed (singletons)
cd packages/db && bunx prisma db seed

# Prisma Studio (requires DATABASE_URL — e.g. packages/db/.env)
pnpm dev:studio                 # or: cd apps/studio && pnpm dev
```

After migration, confirm tables in Studio match the Joe Perks ERD (`docs/06-database-schema.mermaid`).

### 5.7 Set up Stripe webhook forwarding for local development
```bash
# In a separate terminal — keep this running during development
stripe login
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Stripe CLI will output a webhook signing secret:
# > Ready! Your webhook signing secret is whsec_...
# Copy this value into root .env as STRIPE_WEBHOOK_SECRET
```

### 5.8 Verify local development
```bash
# From repo root — Turbo dev for Joe Perks apps (excludes @repo/cms and apps/studio by default)
pnpm dev

# URLs:
# apps/web      → http://localhost:3000
# apps/roaster  → http://localhost:3001
# apps/org      → http://localhost:3002
# apps/admin    → http://localhost:3003
# apps/email    → http://localhost:3004   (React Email preview)
# apps/studio   → http://localhost:3005   (run `pnpm dev:studio` when DATABASE_URL is set)
```

- [x] **Expected today:** Next dev servers start for web/roaster/org/admin + email preview when optional env vars are empty or placeholders (see `docs/AGENTS.md`).
- [ ] **If ports are busy:** free **3000–3005** (stop old `pnpm dev` or `kill` the listening PID) — do **not** change ports as the first fix; see **`docs/AGENTS.md` → Troubleshooting**.

Verify each app responds before proceeding. Root `/` on `web` may 404 until marketing routes exist; that is separate from “dev server up.”

---

## PHASE 6 — Vercel Setup

### 6.1 Create Vercel team
- [ ] Create account at [vercel.com](https://vercel.com)
- [ ] Create team: `joe-perks` (Team plan required — $20/month — Hobby is not sufficient for multiple custom domains)
- [ ] Connect GitHub: Settings → Git Integration → Connect GitHub account
- [ ] Grant access to the `joe-perks` repository

### 6.2 Create four Vercel projects
Create one project per app. For each project:

**Project 1: joe-perks-web**
- [ ] New Project → Import Git Repository → `joe-perks`
- [ ] Framework Preset: Next.js
- [ ] Root Directory: `apps/web`
- [ ] Build Command: `cd ../.. && pnpm turbo build --filter=web`
- [ ] Output Directory: `.next`
- [ ] Install Command: `pnpm install`
- [ ] Project name: `joe-perks-web`

**Project 2: joe-perks-roaster**
- [ ] Same steps, Root Directory: `apps/roaster`
- [ ] Build Command: `cd ../.. && pnpm turbo build --filter=roaster`

**Project 3: joe-perks-org**
- [ ] Same steps, Root Directory: `apps/org`
- [ ] Build Command: `cd ../.. && pnpm turbo build --filter=org`

**Project 4: joe-perks-admin**
- [ ] Same steps, Root Directory: `apps/admin`
- [ ] Build Command: `cd ../.. && pnpm turbo build --filter=admin`

### 6.3 Configure Vercel environments per project

For each project, set up environment variables in **two** Vercel environments: `Production` and `Preview` (Preview covers all PR deployments).

**In Vercel: Settings → Environment Variables for each project**

Variables for ALL projects (Production + Preview):
```
DATABASE_URL              # Production → Neon main branch
                          # Preview   → Neon dev branch
STRIPE_SECRET_KEY         # Production → sk_live_...
                          # Preview   → sk_test_...
STRIPE_WEBHOOK_SECRET     # Production → whsec_ from prod webhook endpoint
                          # Preview   → whsec_ from dev webhook endpoint
RESEND_TOKEN              # Same for both environments (`re_...`, see @joe-perks/email/keys.ts)
INNGEST_SIGNING_KEY       # Same for both environments
INNGEST_EVENT_KEY         # Same for both environments
UPSTASH_REDIS_REST_URL    # Same for both (shared rate limit store)
UPSTASH_REDIS_REST_TOKEN  # Same for both
SENTRY_AUTH_TOKEN         # Same for both
```

Variables for **apps/web** only:
```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY   # pk_live_ (prod) / pk_test_ (preview)
NEXT_PUBLIC_POSTHOG_KEY              # Same for both
NEXT_PUBLIC_POSTHOG_HOST             # Same for both
UPLOADTHING_SECRET                   # Same for both
UPLOADTHING_APP_ID                   # Same for both
```

Variables for **apps/roaster** only:
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY    # Roaster Clerk app
CLERK_SECRET_KEY                     # Roaster Clerk app
```

Variables for **apps/org** only:
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY    # Org Clerk app
CLERK_SECRET_KEY                     # Org Clerk app
```

Variables for **apps/admin** only:
```
ADMIN_EMAIL                          # Production: real admin email
                                     # Preview: test@joeperks.com
ADMIN_PASSWORD                       # Use a strong password for production
```

> ⚠ **Critical:** DATABASE_URL and STRIPE_SECRET_KEY must have DIFFERENT values for Production vs Preview. Double-check this before deploying.

### 6.4 Configure custom domains

For each Vercel project, add the custom domain:

**joe-perks-web:**
- [ ] Settings → Domains → Add `joeperks.com`
- [ ] Add `www.joeperks.com` → redirect to `joeperks.com`
- [ ] Vercel will show you DNS records to add (A record or CNAME)

**joe-perks-roaster:**
- [ ] Settings → Domains → Add `roasters.joeperks.com`
- [ ] Vercel will show you a CNAME record to add

**joe-perks-org:**
- [ ] Settings → Domains → Add `orgs.joeperks.com`

**joe-perks-admin:**
- [ ] Settings → Domains → Add `admin.joeperks.com`

### 6.5 Add DNS records to your domain

In your DNS provider, add all records Vercel provided in the previous step.

After adding records:
- [ ] Wait for DNS propagation (5 minutes to 24 hours)
- [ ] Verify SSL certificates are issued: Vercel dashboard shows green checkmarks
- [ ] Test each subdomain resolves:
  ```bash
  curl -I https://joeperks.com
  curl -I https://roasters.joeperks.com
  curl -I https://orgs.joeperks.com
  curl -I https://admin.joeperks.com
  ```

### 6.6 Register Stripe webhook endpoints

Now that your production URLs exist, register them with Stripe:

**Development webhook (for Preview deployments):**
- [ ] Stripe Dashboard (test mode) → Developers → Webhooks → Add endpoint
- [ ] Endpoint URL: Use Stripe CLI for local dev, OR use a Vercel preview URL
- [ ] Select events listed in Phase 3 → Stripe section
- [ ] Copy webhook signing secret → update `STRIPE_WEBHOOK_SECRET` in Vercel Preview environment

**Production webhook:**
- [ ] Stripe Dashboard (live mode) → Developers → Webhooks → Add endpoint
- [ ] Endpoint URL: `https://joeperks.com/api/webhooks/stripe`
- [ ] Select same events
- [ ] Copy webhook signing secret → update `STRIPE_WEBHOOK_SECRET` in Vercel Production environment

### 6.7 Register Inngest endpoints

Inngest needs to know where your serve route is deployed:
- [ ] Inngest Dashboard → Apps → Sync app
- [ ] Production URL: `https://joeperks.com/api/inngest`
- [ ] Inngest will auto-discover your functions on sync
- [ ] Verify all 3 jobs appear: `sla-check`, `payout-release`, `cart-cleanup`

### 6.8 Register Clerk webhook endpoints

- [ ] Clerk Dashboard (Roaster app) → Webhooks → Add endpoint
- [ ] URL: `https://roasters.joeperks.com/api/webhooks/clerk`
- [ ] Subscribe to: `user.created`, `user.updated`

- [ ] Clerk Dashboard (Org app) → Webhooks → Add endpoint
- [ ] URL: `https://orgs.joeperks.com/api/webhooks/clerk`
- [ ] Subscribe to: `user.created`, `user.updated`

---

## PHASE 7 — Initial Deployment Verification

### 7.1 First deploy
```bash
# From repo root — push develop branch to trigger Vercel preview deployment
git add .
git commit -m "feat: initial project scaffold"
git push origin develop
```
- [ ] All 4 Vercel projects build successfully (green in Vercel dashboard)
- [ ] No build errors in Vercel build logs

### 7.2 Smoke tests — run against preview deployment URLs

After first deploy, verify each surface:
- [ ] `https://joeperks.com` → loads without errors (or preview URL equivalent)
- [ ] `https://roasters.joeperks.com/sign-in` → Clerk sign-in renders
- [ ] `https://orgs.joeperks.com/sign-in` → Clerk sign-in renders
- [ ] `https://admin.joeperks.com` → HTTP Basic Auth prompt appears
- [ ] `https://joeperks.com/api/webhooks/stripe` → POST with invalid signature returns 400
- [ ] `https://joeperks.com/terms/roasters` → loads with PENDING LEGAL REVIEW banner
- [ ] `https://joeperks.com/privacy-policy` → loads with PENDING LEGAL REVIEW banner

### 7.3 Database verification
- [ ] Prisma Studio connects to **dev** DB (locally) — use **`pnpm dev:studio`** with `DATABASE_URL` set (`packages/db/.env`)
- [ ] `PlatformSettings` singleton (`id = singleton`) exists with expected defaults — confirm after **`pnpm migrate`** + **`bunx prisma db seed`**
- [ ] `OrderSequence` singleton (`id = singleton`) exists — `nextVal` starts at **0** until the first order number is generated (`JP-00001` on first increment)
- [ ] **Production:** migrations applied (`pnpm migrate:deploy:prod`) and smoke test passes (`pnpm db:smoke:prod`) — see `docs/AGENTS.md`

### 7.4 Sentry verification
- [ ] `https://joeperks.com/api/test-sentry` → error appears in Sentry within 30 seconds
- [ ] Error shows correct project name and TypeScript source location (not compiled JS)

### 7.5 Stripe webhook verification
- [ ] Locally: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
- [ ] Run test event: `stripe trigger payment_intent.succeeded`
- [ ] Verify: StripeEvent record created in dev DB
- [ ] Verify: No error in terminal output

---

## PHASE 8 — Git Branching Workflow Setup

### 8.1 Branch naming convention
```
main           → source of truth / production — NEVER commit directly
develop        → optional shared staging / integration branch
feature/US-XX-XX-short-description   → feature branches
fix/US-XX-XX-bug-description         → bug fix branches
chore/description                    → tooling, deps, config changes
```

### 8.2 Development workflow
```bash
# Default: start a new story from main
git switch main
git pull --ff-only origin main
git switch -c feature/US-01-01-turborepo-scaffold

# Work on the feature...

# Push and open PR targeting main
git push origin feature/US-01-01-turborepo-scaffold
# → Vercel creates a preview deployment automatically
# → GitHub Actions CI runs check + build
# → Review the preview URL
# → Open PR to main

# After PR is approved and merged to main:
# → Production deploy triggers automatically

# Sync local after merge
git switch main
git pull --ff-only origin main
```

Optional shared-stage flow if your team wants a long-lived integration branch: branch from `develop`, open PRs to `develop`, validate there, then promote `develop` to `main`.

### 8.3 AI agent workflow with branches
When using AI coding agents (Cursor, Claude Code, etc.):
- Always work on a feature branch, never directly on `develop` or `main`
- The `.cursorrules` file in the repo root provides agents with project context automatically
- The `AGENTS.md` file should be referenced at the start of any complex agent session
- After an agent generates code: review it against `CONVENTIONS.md` before committing
- Commit frequently — small atomic commits are easier to review and revert if needed

---

## PHASE 9 — Production Readiness Gate

> Do NOT merge to `main` or flip Stripe to live mode until ALL items below are checked.

### 9.1 Legal
- [ ] LLC formed and verified with Stripe
- [ ] Business bank account connected to Stripe
- [ ] Roaster terms reviewed by counsel — PENDING banner removed
- [ ] Org terms reviewed by counsel — PENDING banner removed
- [ ] Privacy policy reviewed by counsel — PENDING banner removed
- [ ] CPA consulted on sales tax strategy (Stripe Tax configured if needed)

### 9.2 Security
- [ ] Stripe live keys stored ONLY in Vercel Production environment — not in any `.env` files, not in git
- [ ] Rate limiting verified: checkout endpoint returns 429 after 5 requests/hour from same IP
- [ ] Webhook signature verification confirmed working against live Stripe events
- [ ] Admin URL (`admin.joeperks.com`) not linked from any public page
- [ ] All `.env*` files confirmed excluded from git: `git check-ignore .env` returns `.env`
- [ ] Sentry PII scrubbing verified: no email/address visible in Sentry test events

### 9.3 End-to-end test in test mode
- [ ] Roaster onboarding: complete 5-step form → admin approval → Stripe Express → product created
- [ ] Org onboarding: complete 5-step form → roaster approval → campaign live at `/[slug]`
- [ ] Test purchase: Stripe card `4242 4242 4242 4242` → order created → roaster email received
- [ ] Fulfillment: click magic link → enter tracking → buyer email received
- [ ] Admin: mark order delivered → payout_eligible_at set correctly
- [ ] Payout: manually trigger payout job → roaster transfer appears in Stripe test dashboard
- [ ] Org transfer: appears in Stripe test dashboard
- [ ] All 11 transactional emails received and reviewed for content + formatting

### 9.4 Infrastructure
- [ ] Production DB is the Neon `main` branch — NOT dev branch
- [ ] Production Stripe keys are live keys — NOT test keys
- [ ] All four subdomains have valid SSL certificates (green lock in browser)
- [ ] Inngest jobs visible and synced in production dashboard
- [ ] Sentry receiving production errors (test with `/api/test-sentry` on production URL)

---

## Quick Reference

### Ports in local development
| App / tool | Port | URL |
|---|---|---|
| apps/web | 3000 | http://localhost:3000 |
| apps/roaster | 3001 | http://localhost:3001 |
| apps/org | 3002 | http://localhost:3002 |
| apps/admin | 3003 | http://localhost:3003 |
| apps/email (React Email preview) | 3004 | http://localhost:3004 |
| apps/studio (Prisma Studio) | 3005 | http://localhost:3005 |

Default **`pnpm dev`** does **not** start **`@repo/cms`** or **`studio`** — see top of this doc and **`docs/AGENTS.md`**.

### Key commands
```bash
pnpm dev                     # Turbo dev — Joe Perks apps (excludes cms + studio)
pnpm dev:all                 # full Turbo dev including Basehub CMS (needs BASEHUB_TOKEN)
pnpm dev:studio              # Prisma Studio only (needs DATABASE_URL)
pnpm --filter web dev        # start only apps/web
pnpm build                   # turbo build
pnpm check                   # Ultracite (also used in CI)
pnpm typecheck               # turbo typecheck
pnpm migrate                 # from root: prisma migrate dev in packages/db (uses bunx)
cd packages/db && bunx prisma db seed   # seed PlatformSettings + OrderSequence singletons
stripe listen --forward-to localhost:3000/api/webhooks/stripe  # local Stripe webhooks
```

### Environment variable checklist by service
| Service | Variable | Where |
|---|---|---|
| Neon | `DATABASE_URL` | root `.env` and/or `packages/db/.env` (Studio / Prisma) |
| Stripe (secret) | `STRIPE_SECRET_KEY` | root `.env` |
| Stripe (webhook) | `STRIPE_WEBHOOK_SECRET` | root `.env` |
| Stripe (public) | `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `apps/web/.env.local` |
| Resend | `RESEND_TOKEN` (and optional `RESEND_FROM`) | root `.env` (see `@joe-perks/email/keys.ts`) |
| Inngest | `INNGEST_SIGNING_KEY`, `INNGEST_EVENT_KEY` | root `.env` |
| Upstash | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | root `.env` |
| Sentry | `SENTRY_AUTH_TOKEN` | root `.env` |
| Posthog | `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST` | `apps/web/.env.local` |
| Uploadthing | `UPLOADTHING_SECRET`, `UPLOADTHING_APP_ID` | `apps/web/.env.local` |
| Clerk (roaster) | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SECRET` | `apps/roaster/.env.local` |
| Clerk (org) | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SECRET` | `apps/org/.env.local` |
| Admin auth | `ADMIN_EMAIL`, `ADMIN_PASSWORD` | `apps/admin/.env.local` |
| Basehub (CMS) | `BASEHUB_TOKEN` | `packages/cms/.env.local` (for `pnpm dev:all`) |

---

## Notes for AI Coding Agents

When an AI coding agent is helping set up or modify this project:

1. **Always check `docs/AGENTS.md` first** — it contains the non-negotiable rules and patterns
2. **Never commit `.env` files** — they contain secrets
3. **Never use live Stripe keys** outside the Vercel Production environment
4. **The develop branch is safe to push to** — it deploys to preview, not production
5. **Schema changes require a migration** — never modify the DB directly; always use `prisma migrate dev` (e.g. root **`pnpm migrate`**)
6. **Test locally before pushing** — run **`pnpm check`** and **`pnpm typecheck`** before any commit (CI runs `check` + `turbo build`)
7. **Branch from develop** — never branch from main for feature work
8. **Preview deployments are ephemeral** — do not use preview URLs as permanent references
9. **Busy dev ports (`EADDRINUSE`)** — free **3000–3005** by stopping the old process (`lsof` + `kill`); do **not** reroute ports by default — see **`docs/AGENTS.md` → Troubleshooting**

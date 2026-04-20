# JOE PERKS PLATFORM
## Scaffold & Environment Setup Guide
**Version 2.0  ·  March 2026  ·  next-forge + Next.js 16 + Bun**

### PURPOSE
This document supersedes SCAFFOLD_CHECKLIST.md for Phase 1 setup. It incorporates the next-forge boilerplate assessment decisions, Next.js 16 upgrade, Bun as package manager, and the updated project structure. After completing this guide, resume with AGENTS.md, CONVENTIONS.md, and the Epics & Stories v2.0 for feature development.

| Item | Value |
|------|--------|
| Boilerplate | next-forge (latest) |
| Package manager | Bun (next-forge v6 default — keep as-is) |
| Next.js version | 16 stable (upgrade immediately after init) |
| Monorepo tool | Turborepo |
| Database ORM | Prisma 5.x → Neon Postgres |
| Auth | Clerk (two separate apps: Roasters + Orgs) |
| Estimated setup time | 3–4 hours first time |
| Target: first local run | End of Phase 5 |
| Target: first deploy | End of Phase 6 |

---

## Phase 0 — Understanding the next-forge Base
The next-forge assessment concluded an ~85% stack match with Joe Perks. This means Sprint 1 infrastructure work is cut roughly in half — Turborepo wiring, Clerk setup, Prisma init, Stripe boilerplate, Resend, shadcn/ui, Sentry, and PostHog all arrive pre-configured.

### What next-forge provides out of the box

| Component | Status | Notes |
|-----------|--------|-------|
| Turborepo + Bun workspaces | KEEP | Pre-wired, use as-is |
| Next.js (ships as 14) | UPGRADE → 16 | Bump immediately after init |
| TypeScript strict mode | KEEP | |
| Clerk authentication | KEEP + EXTEND | Add second Clerk app for Orgs |
| Prisma ORM + Neon Postgres | KEEP + REPLACE SCHEMA | Replace default schema with Joe Perks 26-model schema |
| Stripe + webhook pattern | KEEP + EXTEND | Add @joe-perks/stripe package on top |
| Resend + React Email | KEEP | Add Joe Perks templates in Sprint 3–4 |
| shadcn/ui + Tailwind CSS | KEEP | Add Zustand cart to packages/ui in Sprint 3 |
| Sentry error monitoring | KEEP | Configure 4 projects (one per app) |
| PostHog analytics | KEEP | Disable autocapture + session recording |
| Feature flags package | KEEP | Useful for phased rollouts |
| Blog / CMS package | KEEP | Needed for Phase 2+ blog |
| Environment validation (env.ts) | KEEP | |
| ESLint + Prettier | KEEP | |
| Vercel deployment config | KEEP | |

### What to remove from next-forge

| Item | Action | Reason |
|------|--------|--------|
| apps/api | DELETE | Joe Perks uses Next.js API routes — no separate API app needed |
| apps/storybook | DELETE | Not needed for MVP — can revisit post-launch |

### What to add (not in next-forge)

| Item | Location | Sprint |
|------|----------|--------|
| apps/org (new Next.js app) | apps/org | Sprint 1 scaffold |
| apps/admin (new Next.js app) | apps/admin | Sprint 1 scaffold |
| packages/stripe — calculateSplits(), Stripe singleton, rate limiter | packages/stripe | Sprint 1 |
| packages/types — RESERVED_SLUGS, shared TS types | packages/types | Sprint 1 |
| Inngest background jobs | apps/web/app/api/inngest/route.ts (+ `apps/web/lib/inngest/`) | Sprint 1 (wired) |
| Upstash Redis (rate limiting) | packages/stripe/ratelimit.ts | Sprint 1 |
| UploadThing (image uploads) | apps/web + apps/roaster + apps/org | Sprint 2–3 |
| Zustand cart store | packages/ui | Sprint 3 |
| Magic link token system | packages/db | Sprint 2 |
| Full 26-model Prisma schema | packages/db/schema.prisma | Sprint 1 |

### Docs folder — best practice structure
Keep the next-forge docs app but convert it to a top-level `/docs` directory instead of a deployable app. Best practice for a monorepo is to keep reference docs at the repo root so they are discoverable by all tools, agents, and contributors without needing a running server.

```
joe-perks/
├── docs/
│   ├── 01-project-structure.mermaid
│   ├── 02-deployment-topology.mermaid
│   ├── 03-package-dependencies.mermaid
│   ├── 04-order-lifecycle.mermaid
│   ├── 05-approval-chain.mermaid
│   ├── 06-database-schema.mermaid
│   ├── 07-stripe-payment-flow.mermaid
│   ├── 08-order-state-machine.mermaid
│   ├── joe_perks_prd.docx
│   ├── joe_perks_db_schema.docx
│   └── joe_perks_epics_stories_v2.docx
├── AGENTS.md          ← root level, read by all agents
├── CONVENTIONS.md     ← root level
└── SCAFFOLD.md        ← this document (as markdown reference)
```

**NOTE:** Delete `apps/docs` from next-forge after init. Replace with the top-level `docs/` folder structure above. The mermaid diagram files referenced in AGENTS.md should live here.

### Image uploads — UploadThing scope

| App | Upload types | Used for |
|-----|--------------|----------|
| apps/roaster | Images (JPG/PNG/WebP, max 4MB) | Product catalog images when roaster creates products/variants |
| apps/org | Images (JPG/PNG/WebP, max 4MB) | Org logo, campaign banner images |
| apps/org | Documents (PDF, max 10MB) | Org verification documents, proof of non-profit status |
| apps/web | None (buyer-facing, no uploads needed for MVP) | — |
| apps/admin | None (admin reviews uploads, does not create them) | — |

**PHASE:** UploadThing account setup is in Phase 3 of this guide (Section 3.9). Code integration is Sprint 2 (roaster catalog — US-02-01) and Sprint 3 (org onboarding — US-03-01). Do not wire upload routes during scaffold — mark as TODO stubs.

---

## Phase 1 — Business & Legal Setup
**BLOCKER:** Complete these before creating any third-party accounts. Stripe requires a legal entity and EIN for Connect payouts.

### 1.1 Legal entity
- Form LLC or legal entity in your state
- Obtain EIN (Employer Identification Number) from IRS — free, 15 minutes at irs.gov
- Open business bank account linked to the LLC
- Note: legal business name, EIN, registered address, business bank details
- Draft roaster terms of service (placeholder — mark PENDING LEGAL REVIEW)
- Draft org terms of service (placeholder)
- Draft privacy policy (placeholder)

---

## Phase 2 — Domain & DNS Setup

### 2.1 Domain registration
- Register joeperks.com — Cloudflare Registrar recommended
- Log into DNS provider dashboard
- Plan subdomain structure (DNS records added in Phase 6 — do not add yet)

| Subdomain | App | Purpose |
|-----------|-----|---------|
| joeperks.com | apps/web | Marketing site + buyer storefronts + onboarding |
| roasters.joeperks.com | apps/roaster | Roaster portal |
| orgs.joeperks.com | apps/org | Org portal |
| admin.joeperks.com | apps/admin | Platform admin |

---

## Phase 3 — Third-Party Account Creation
Collect all API keys in this phase. You will paste them into `.env` files in Phase 5. Store all keys in a password manager — never in Slack or email.

### 3.1 Neon — Postgres database
**SPRINT 1 BLOCKER**

- Create account at neon.tech
- Create project: joe-perks, region us-east-1 (closest to Vercel)
- Rename main branch → production database
- Create new branch from main: name dev → development database
- Copy DATABASE_URL for main branch → save as PROD DATABASE URL
- Copy DATABASE_URL for dev branch → save as DEV DATABASE URL
- Enable connection pooling on both branches
- Confirm point-in-time recovery is active

### 3.2 Stripe
**SPRINT 1 BLOCKER**

- Create account at stripe.com using business entity email
- Complete business verification with LLC details + EIN
- Enable Stripe Connect → Settings → Connect → Get started
- Set Connect settings: Account type Express, statement descriptor JOE PERKS
- Copy test publishable key (pk_test_...) → TEST PUBLISHABLE KEY
- Copy test secret key (sk_test_...) → TEST SECRET KEY
- Copy live publishable key (pk_live_...) → LIVE PUBLISHABLE KEY (do NOT use in dev)
- Copy live secret key (sk_live_...) → LIVE SECRET KEY (do NOT use in dev)
- Note webhook events to subscribe to (endpoints added in Phase 6)

**Stripe webhook events** (subscribe to these for both dev + prod endpoints):
`payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.dispute.created`, `charge.dispute.closed`, `account.updated`, `transfer.failed`

### 3.3 Clerk — two separate apps
**SPRINT 1 BLOCKER**

Joe Perks uses two completely separate Clerk applications — one for roasters, one for orgs.

**Clerk App 1: Joe Perks Roasters**
- Create account at clerk.com
- Create Application: Joe Perks Roasters
- Enable Email + Password sign-in and email verification
- Set callback URLs: `https://roasters.joeperks.com/sign-in/sso-callback` (prod), `http://localhost:3001/sign-in/sso-callback` (dev)
- Copy NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY → ROASTER CLERK PUBLIC KEY
- Copy CLERK_SECRET_KEY → ROASTER CLERK SECRET KEY
- Note webhook signing secret → ROASTER CLERK WEBHOOK SECRET (configure in Phase 6)

**Clerk App 2: Joe Perks Orgs**
- Create Application: Joe Perks Orgs
- Same settings as Roasters app
- Set callback URLs: `https://orgs.joeperks.com/sign-in/sso-callback` (prod), `http://localhost:3002/sign-in/sso-callback` (dev)
- Copy NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY → ORG CLERK PUBLIC KEY
- Copy CLERK_SECRET_KEY → ORG CLERK SECRET KEY
- Note webhook signing secret → ORG CLERK WEBHOOK SECRET

### 3.4 Resend — transactional email
**SPRINT 1 BLOCKER**

**WARNING:** Add DNS records immediately after account creation. SPF/DKIM/DMARC propagation takes 24–48 hours.

- Create account at resend.com
- Add domain: joeperks.com
- Copy SPF, DKIM, DMARC DNS records from Resend dashboard
- Add those DNS records to your domain provider NOW — do not wait
- Copy API key → RESEND API KEY (re_...)
- Note sending addresses: orders@joeperks.com, hello@joeperks.com, support@joeperks.com

### 3.5 Inngest — background jobs
- Create account at inngest.com
- Create app: joe-perks
- Copy Event Key → INNGEST EVENT KEY
- Copy Signing Key → INNGEST SIGNING KEY

Three jobs are registered in code: **sla-check** (hourly), **payout-release** (daily 09:00 UTC), **cart-cleanup** (daily 02:00 UTC). Sync the deployed **`/api/inngest`** URL in the Inngest dashboard in Phase 6.

### 3.6 Upstash — Redis rate limiting
- Create account at upstash.com
- Create Redis database: joe-perks-ratelimit, region closest to Vercel
- Copy REST URL → UPSTASH REDIS REST URL
- Copy REST Token → UPSTASH REDIS REST TOKEN

### 3.7 Sentry — error monitoring
- Create account at sentry.io
- Create organization: joe-perks
- Create 4 projects: joe-perks-web, joe-perks-roaster, joe-perks-org, joe-perks-admin
- Copy DSN for each project → WEB DSN, ROASTER DSN, ORG DSN, ADMIN DSN
- Copy Auth Token (shared across projects) → SENTRY AUTH TOKEN
- Set alert rules: error in checkout routes + error in webhook routes → email + Slack

### 3.8 PostHog — product analytics
- Create account at posthog.com (select US or EU hosting)
- Create project: joe-perks
- Copy Project API Key → POSTHOG KEY (phc_...)
- Copy API Host → POSTHOG HOST
- Project Settings → Autocapture: DISABLE (prevents accidental PII capture)
- Project Settings → Session recording: DISABLE (not needed for MVP)

### 3.9 UploadThing — file and image uploads
- Create account at uploadthing.com
- Create app: joe-perks
- Copy Secret → UPLOADTHING SECRET
- Copy App ID → UPLOADTHING APP ID
- Configure allowed file types: images (JPG/PNG/WebP, max 4MB) + documents (PDF, max 10MB)

UploadThing is used in apps/roaster (product images) and apps/org (org logo, campaign images, verification docs). Code integration happens in Sprint 2–3, not during scaffold.

---

## Phase 4 — Repository Setup

### 4.1 Create the GitHub repository
- Create repo: joe-perks — set to private
- Add team members with Write access

### 4.2 Branch protection rules

**main branch**
- Require pull request before merging
- Require at least 1 approval
- Require status checks to pass (add after CI is set up)
- Restrict who can push: your account only

**develop branch**
- Require pull request before merging
- Require status checks to pass
- Allow force pushes (needed for rebasing during active development)

### 4.3 PR template
Create `.github/PULL_REQUEST_TEMPLATE.md`:

```markdown
## Story
Closes #[story-id]  <!-- e.g. US-01-01 -->

## What changed

## Acceptance criteria
- [ ] AC1:
- [ ] AC2:

## Testing
- [ ] Tested locally against dev DB
- [ ] Deployed to preview and smoke-tested

## Security checklist
- [ ] No PII logged in checkout or webhook routes
- [ ] All money values are integers in cents
- [ ] Tenant scoping on all DB queries (from session, not request body)
- [ ] No direct Stripe imports in app code (use @joe-perks/stripe)
- [ ] No direct Resend calls (use sendEmail() from @joe-perks/email)
```

### 4.4 GitHub Actions CI
Create `.github/workflows/ci.yml`. Note: uses Bun (matches next-forge v6 default).

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
      - uses: oven-sh/setup-bun@v2
        with: { bun-version: latest }
      - run: bun install --frozen-lockfile
      - run: bun turbo typecheck
      - run: bun turbo lint
      - run: bun turbo build
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL_DEV }}
          SKIP_ENV_VALIDATION: true
```

- Add `DATABASE_URL_DEV` to GitHub Actions secrets (Settings → Secrets → Actions)

---

## Phase 5 — Local Development & Scaffold

### 5.1 Prerequisites

| Tool | Version | Install command |
|------|---------|-----------------|
| Bun | Latest stable | `curl -fsSL https://bun.sh/install \| bash` |
| Node.js | 20+ | Required by some tooling even with Bun |
| Git | Any recent | Pre-installed on macOS / apt install git on Linux |
| Stripe CLI | Latest | `brew install stripe/stripe-cli/stripe` (macOS) |

### 5.2 Init next-forge with Bun
**NOTE:** next-forge v6 defaults to Bun — keep this. Do not pass `--package-manager pnpm`.

```bash
# 1. Init next-forge (Bun is the default for v6)
bunx next-forge@latest init joe-perks

# 2. Enter the project
cd joe-perks

# 3. Initialize git and create develop branch
git init
git checkout -b develop
```

### 5.3 Upgrade Next.js to version 16
```bash
# Upgrade Next.js to 16 stable across all apps
bun add next@16 --filter "*"

# Verify upgrade
cat apps/web/package.json | grep next
# Should show: "next": "^16.x.x"
```

### 5.4 Restructure apps
```bash
# Rename: apps/app → apps/roaster
mv apps/app apps/roaster

# Remove apps not needed for MVP
rm -rf apps/storybook
rm -rf apps/api

# Convert apps/docs to top-level docs folder
mkdir -p docs
cp -r apps/docs/content/* docs/ 2>/dev/null || true
rm -rf apps/docs

# Scaffold the two missing apps
cd apps
bunx create-next-app@latest org --typescript --tailwind --app --no-src-dir --use-bun
bunx create-next-app@latest admin --typescript --tailwind --app --no-src-dir --use-bun
cd ..
```

### 5.5 Add Joe Perks packages (not in next-forge)
```bash
mkdir -p packages/stripe packages/types
```

**packages/stripe/package.json**
```json
{
  "name": "@joe-perks/stripe",
  "version": "0.0.1",
  "private": true,
  "main": "./src/index.ts",
  "exports": { ".": "./src/index.ts" }
}
```

**packages/types/package.json**
```json
{
  "name": "@joe-perks/types",
  "version": "0.0.1",
  "private": true,
  "main": "./src/index.ts",
  "exports": { ".": "./src/index.ts" }
}
```

Stub files:
```bash
mkdir -p packages/stripe/src
echo "export const stripe = null as any" > packages/stripe/src/client.ts
echo "export const calculateSplits = null as any" > packages/stripe/src/splits.ts
echo "export const checkoutLimiter = null as any" > packages/stripe/src/ratelimit.ts
echo "export * from './client'; export * from './splits'; export * from './ratelimit'" > packages/stripe/src/index.ts

mkdir -p packages/types/src
echo "export const RESERVED_SLUGS: string[] = []" > packages/types/src/index.ts
```

### 5.6 Rename packages/database → packages/db
Rename directory `packages/database` → `packages/db`. Update `package.json` name to `@joe-perks/db`. Find/replace `@repo/database` (or equivalent) with `@joe-perks/db` across the monorepo.

### 5.7 Replace the Prisma schema
Replace `packages/db/schema.prisma` entirely with the Joe Perks 26-model schema from `docs/joe_perks_db_schema.docx` before running migrations.

After replacing:
```bash
cd packages/db
bunx prisma format
bunx prisma migrate dev --name init
bunx prisma db seed
bunx prisma generate
```

### 5.8 Install Inngest and Upstash
```bash
bun add inngest --filter web
bun add @upstash/ratelimit @upstash/redis --filter @joe-perks/stripe
```

**Inngest (implemented):** `apps/web/app/api/inngest/route.ts` uses **`serve()`** from `inngest/next` and registers **`sla-check`** (hourly), **`payout-release`** (09:00 UTC), **`cart-cleanup`** (02:00 UTC). Function bodies and runners live under **`apps/web/lib/inngest/`**. Payout transfers and SLA auto-refund use **`packages/stripe/src/payouts.ts`** (`transferToConnectedAccount`, `refundCharge`). Set **`INNGEST_SIGNING_KEY`** and **`INNGEST_EVENT_KEY`** in root `.env`; sync the deployed URL (`/api/inngest`) in the Inngest dashboard.

### 5.9 Create .env files
Use credentials from Phase 3. Never commit these files.

**Root `.env`** (shared): DATABASE_URL (Neon DEV), STRIPE_SECRET_KEY (test), STRIPE_WEBHOOK_SECRET, RESEND_API_KEY, INNGEST keys, UPSTASH Redis, SENTRY_AUTH_TOKEN, etc.

**apps/web/.env.local:** NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, PostHog, UploadThing

**apps/roaster/.env.local:** Roaster Clerk keys

**apps/org/.env.local:** Org Clerk keys (different app)

**apps/admin/.env.local:** ADMIN_EMAIL, ADMIN_PASSWORD

### 5.10 Stripe CLI webhook forwarding
```bash
stripe login
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```
Copy `whsec_...` into root `.env` as STRIPE_WEBHOOK_SECRET.

### 5.11 Verify local development
```bash
bun dev
```
- apps/web → http://localhost:3000
- apps/roaster → http://localhost:3001
- apps/org → http://localhost:3002
- apps/admin → http://localhost:3003

Verify Clerk, Prisma Studio, 26 tables, PlatformSettings + OrderSequence seed data.

### 5.12 Final monorepo structure after scaffold
```
joe-perks/
├── apps/
│   ├── web/
│   ├── roaster/
│   ├── org/
│   └── admin/
├── packages/
│   ├── db/
│   ├── ui/
│   ├── stripe/
│   ├── email/
│   └── types/
├── docs/
├── AGENTS.md
├── CONVENTIONS.md
├── .github/
│   ├── workflows/ci.yml
│   └── PULL_REQUEST_TEMPLATE.md
└── turbo.json
```

**REMOVED:** apps/api, apps/storybook, apps/docs (converted to top-level docs/)

---

## Phase 6 — Vercel Setup & Deployment

### 6.1 Create Vercel team
Team plan required — Hobby does not support multiple custom domains.

- Create account at vercel.com, team joe-perks
- Connect GitHub, grant access to joe-perks repository

### 6.2 Create four Vercel projects

| Project name | Root directory | Build command |
|--------------|----------------|---------------|
| joe-perks-web | apps/web | `cd ../.. && bun turbo build --filter=web` |
| joe-perks-roaster | apps/roaster | `cd ../.. && bun turbo build --filter=roaster` |
| joe-perks-org | apps/org | `cd ../.. && bun turbo build --filter=org` |
| joe-perks-admin | apps/admin | `cd ../.. && bun turbo build --filter=admin` |

For each: Framework Preset Next.js, Output Directory `.next`, Install Command `bun install`.

### 6.3 Environment variables per project
**CRITICAL:** DATABASE_URL and STRIPE_SECRET_KEY must differ for Production vs Preview.

(See original Joe Perks runbook for full variable matrix: Neon main vs dev, Stripe live vs test, per-app Clerk keys, admin credentials, etc.)

### 6.4 Custom domains

| Vercel project | Domain |
|----------------|--------|
| joe-perks-web | joeperks.com + www (redirect to apex) |
| joe-perks-roaster | roasters.joeperks.com |
| joe-perks-org | orgs.joeperks.com |
| joe-perks-admin | admin.joeperks.com |

### 6.5 Register webhooks & sync services
- **Stripe:** test + live endpoints, 6 events, signing secrets in Vercel
- **Inngest:** sync `https://joeperks.com/api/inngest` — verify 3 jobs
- **Clerk:** Roaster + Org webhook URLs on respective subdomains — user.created, user.updated

---

## Phase 7 — Initial Deployment Verification

### 7.1 First deploy
```bash
git add .
git commit -m "feat: initial project scaffold"
git push origin develop
```

### 7.2 Smoke tests
| URL | Expected |
|-----|----------|
| https://joeperks.com | Loads |
| https://roasters.joeperks.com/sign-in | Clerk |
| https://orgs.joeperks.com/sign-in | Clerk |
| https://admin.joeperks.com | Basic Auth |
| POST .../api/webhooks/stripe (invalid sig) | 400 |
| /terms/roasters, /privacy-policy | PENDING LEGAL REVIEW banner |

### 7.3 Sentry
Visit `/api/test-sentry` — error in Sentry within ~30s.

### 7.4 Stripe webhook
`stripe listen` + `stripe trigger payment_intent.succeeded` — StripeEvent in dev DB.

---

## Phase 8 — Git Branching Workflow

### 8.1 Branch naming
- `main` → production — never commit directly
- `develop` → optional shared staging / integration branch
- `feature/US-XX-XX-description`, `fix/...`, `chore/...`

### 8.2 Development workflow
Default workflow: branch from `main`, open PRs to `main`, and rely on per-PR preview deployments for staging-level validation.

Optional shared-stage workflow: if the team wants a long-lived integration branch, branch from `develop`, open PRs to `develop`, validate there, then promote `develop` to `main`.

### 8.3 AI agent workflow
- Work on feature branches only
- Reference AGENTS.md each session
- Review against CONVENTIONS.md before commit
- Atomic commits preferred

---

## Phase 9 — Production Readiness Gate
Do NOT merge to main or use Stripe live until: legal review complete, security checklist (keys, rate limits, webhooks, admin URL, .env gitignore, Sentry PII), full E2E in test mode, production DB/Stripe/domains/Inngest/Sentry verified.

---

## Quick Reference

### Local development ports

| App | Port | URL |
|-----|------|-----|
| apps/web | 3000 | http://localhost:3000 |
| apps/roaster | 3001 | http://localhost:3001 |
| apps/org | 3002 | http://localhost:3002 |
| apps/admin | 3003 | http://localhost:3003 |

### Key commands (Bun)
```bash
bun dev
bun dev --filter=web
bun turbo build
bun turbo typecheck
bun turbo lint
cd packages/db && bunx prisma studio
cd packages/db && bunx prisma migrate dev
cd packages/db && bunx prisma db seed
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

### Document index

| Document | Location | Read when... |
|----------|----------|--------------|
| AGENTS.md | repo root | Start of every agent session |
| CONVENTIONS.md | repo root | Before writing code |
| SCAFFOLD_CHECKLIST.md | repo root | What’s done vs still needed (living status) |
| This document | docs/ or root | First-time setup |
| PRD v1.0 | docs/ | Product specs |
| DB Schema Reference | docs/ | Prisma / split calc |
| Epics & Stories v2.0 | docs/ | Sprint planning |

---

## NEXT STEPS
Once Phase 7 smoke tests pass and the repo is green, switch to Epics & Stories v2.0 and begin Sprint 1 story **US-01-01**. Always branch from a clean, updated `main` by default, reference `AGENTS.md`, and run `pnpm typecheck` (or the repo-standard equivalent) before committing.

---

## Appendix — This repository (`joe_perks_v8`)

- **Source:** [next-forge](https://github.com/vercel/next-forge) **v6.0.2**, hoisted to the workspace root (not nested under `joe-perks/`).
- **Package manager:** **pnpm** `10.31.0` at the monorepo root (matches upstream `package.json`). Apps still run Next via **`bun --bun`** where next-forge configured it. To standardize on Bun-only installs, plan a deliberate migration (lockfile + CI).
- **Prisma:** Template ships **Prisma 7.x** with schema under `packages/db/prisma/schema.prisma` (the guide’s “Prisma 5.x” line is generic).
- **Joe Perks–specific renames:** `apps/app` → **`apps/roaster`**, `packages/database` → **`packages/db`**, package name **`@joe-perks/db`**. Removed **`apps/api`**, **`apps/storybook`**, Mintlify **`apps/docs`** (use root **`docs/`** for reference material). Added **`apps/org`**, **`apps/admin`**, **`@joe-perks/stripe`**, **`@joe-perks/types`**, **`apps/web/app/api/inngest/route.ts`** (Inngest **`serve()`** + jobs under **`apps/web/lib/inngest/`**), and **`inngest`** on **`web`**.
- **Dev ports:** web **3000**, roaster **3001**, org **3002**, admin **3003**, Prisma Studio (studio app) **3005** (unchanged).
- **CI:** `.github/workflows/ci.yml` runs `pnpm check` and `pnpm turbo build`. Configure GitHub Actions secrets **`DATABASE_URL_DEV`** (Neon dev branch) and **`BASEHUB_TOKEN`** (Basehub / CMS; required for `@repo/cms` build). Local `pnpm turbo typecheck` may need the same env vars where CMS and AI packages are in the graph.

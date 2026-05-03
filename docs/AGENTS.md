# AGENTS.md — Joe Perks Platform
## AI Coding Agent Context & Rules

This file is the primary reference for AI coding agents (Cursor, Copilot, Claude Code, etc.)
working on the Joe Perks codebase. Read this before writing any code.

---

## What is Joe Perks?

A multi-tenant B2B2C marketplace connecting specialty coffee roasters with local organizations
(schools, sports teams, nonprofits) to run coffee fundraising campaigns. Buyers purchase coffee
through an org-branded storefront; a percentage of every sale flows automatically to the org.

**Three-way revenue split on every order:**
- Roaster receives product earnings (retail minus org% minus platform% minus Stripe fee)
- Organization receives their fundraiser percentage (5–25% of product subtotal)
- Platform retains a fee (5% of product subtotal, min $1.00)
- Shipping is 100% passthrough to roaster — never included in split math

---

## Monorepo structure

```
joe-perks/
├── apps/
│   ├── web/          → joeperks.com (marketing + buyer storefronts + onboarding)
│   ├── roaster/      → roasters.joeperks.com (roaster portal)
│   ├── org/          → orgs.joeperks.com (org portal)
│   ├── admin/        → admin.joeperks.com (platform admin)
│   ├── email/        → React Email preview (next-forge)
│   └── studio/       → Prisma Studio wrapper (next-forge)
└── packages/
    ├── db/           → @joe-perks/db     (Prisma client, schema, helpers)
    ├── ui/           → @joe-perks/ui     (Zustand cart store; use @repo/design-system for UI primitives)
    ├── stripe/       → @joe-perks/stripe (split calc, Stripe client, rate limiting)
    ├── email/        → @joe-perks/email  (React Email templates; sendEmail() in send.ts)
    ├── types/        → @joe-perks/types  (RESERVED_SLUGS, shared types)
    └── …             → @repo/* (design-system, auth, cms, observability, etc.)
```

See `docs/01-project-structure.mermaid` for routes, API paths, and file-level detail. `apps/web` uses **`app/[locale]/…`** for pages and **`app/api/…`** for route handlers (next-forge i18n).

**Middleware (proxy.ts):** `apps/web/proxy.ts` composes i18n, Clerk auth, Arcjet, and security headers via `@rescale/nemo`. The matcher **must** exclude `api` paths — `/((?!api|_next/static|…)…)` — so route handlers in `app/api/` are not intercepted by the i18n rewrite or auth middleware. **Important:** Next.js 16 does not allow both `middleware.ts` and `proxy.ts` in the same app. `middleware.ts` was removed from `apps/web`, `apps/roaster`, and `apps/org`; `proxy.ts` is the sole middleware entry point. `apps/admin` still uses `middleware.ts` (no `proxy.ts`).

---

## Package managers: pnpm and Bun

This monorepo uses **both** tools; they are **not** interchangeable for installs.

### pnpm (primary)

- Declared in root `package.json` as **`packageManager`: `pnpm@10.31.0`**; lockfile is **`pnpm-lock.yaml`** (there is **no** root `bun.lockb`).
- **Use pnpm** for: installing dependencies, adding/removing packages, and running repo-wide scripts.

```bash
pnpm install                 # after clone or when package.json changes
pnpm dev                     # turbo dev — excludes @repo/cms and apps/studio (see below)
pnpm dev:all                 # full turbo dev including Basehub CMS (set BASEHUB_TOKEN first)
pnpm dev:studio              # Prisma Studio only — requires DATABASE_URL (e.g. packages/db/.env)
pnpm build                   # turbo build
pnpm check                   # ultracite (lint/format rules)
pnpm typecheck               # turbo typecheck
pnpm add <pkg> --filter web  # example: add dep to one app
```

**Neon production (main branch):** copy the pooled connection string into **`packages/db/.env.production`** (see **`packages/db/.env.production.example`**; file is gitignored). Then:

```bash
pnpm migrate:deploy:prod   # apply migrations to production
pnpm db:seed:prod        # PlatformSettings + OrderSequence singletons (first time / after reset)
pnpm db:smoke:prod       # verify schema + singletons + recent migrations
```

For a one-off URL without a file, set **`DATABASE_URL`** in the shell (it wins over `.env`); do not set **`PRISMA_DATABASE_PROFILE=production`** in that case.

Default **`pnpm dev`** skips:

- **`@repo/cms`** — `basehub dev` needs **`BASEHUB_TOKEN`** in `packages/cms/.env.local`. Use **`pnpm dev:all`** when you have that token.
- **`studio`** — **`prisma studio`** needs **`DATABASE_URL`** (e.g. in **`packages/db/.env`**). Use **`pnpm dev:studio`** in a second terminal after configuring the DB.

**`web`** and **`roaster`** run **`next`** via **pnpm** (no Bun required for dev/build/start). Root **`migrate`** / **`db:push`** scripts still use **`bunx prisma`**; install Bun for those, or run Prisma with **`pnpm exec prisma`** from **`packages/db`**.

Optional env vars that are **empty strings** in `.env` are treated as **unset** in shared **`packages/*/keys.ts`** (Betterstack, Clerk, CMS token, analytics, email, DB URL, etc.) so **`pnpm dev`** can start without every integration configured. **`DATABASE_URL`** may be omitted for **`roaster`** until you use Prisma-backed routes; set **`packages/db/.env`** (or app env) before **`pnpm dev:studio`** or DB work.

**Local dev ports (avoid collisions):**

| App / tool                    | Port |
| ----------------------------- | ---- |
| `web`                         | 3000 |
| `roaster`                     | 3001 |
| `org`                         | 3002 |
| `admin`                       | 3003 |
| `email` (React Email preview) | 3004 |
| `studio` (Prisma Studio)      | 3005 |

**CI** (`.github/workflows/ci.yml`) uses **`pnpm install --frozen-lockfile`**, then `pnpm check` and `pnpm turbo build`.

### Bun (secondary — runtime & CLI)

- **Use Bun** when a **script already invokes `bun` or `bunx`** (do not replace those with pnpm unless you change the script).
- Examples in this repo:
  - Root **`migrate`**, **`db:push`**, etc.: **`bunx prisma …`**
  - **`packages/db`** Prisma seed: **`prisma.config.ts`** `migrations.seed` is **`bun run ./seed.ts`**
  - Some apps run Next with **`bun --bun next dev`** / **`bun --bun next build`** inside their `package.json` `scripts`. When you run **`pnpm dev`**, Turbo executes those scripts; you usually **do not** type `bun` yourself.
- **`bunx`** is used like **`npx`** (e.g. one-off CLIs).

### What not to do

- **Do not run `bun install` at the monorepo root** for normal workflow — dependencies are resolved with **pnpm**. Moving to Bun-only installs would require a deliberate migration (workspaces, lockfile, CI).
- Prefer **`pnpm exec`** or **`pnpm dlx`** if you need a one-off CLI and want to stay on pnpm only; use **`bunx`** when matching existing root scripts.

### Env aggregate file

- Root **`.env.example`** lists variable *names* for copy/paste; real secrets live in **`.env`** / **`.env.local`** per app and `packages/db/.env` as applicable.

---

## Troubleshooting

### `EADDRINUSE` or “Failed to start server” when running `pnpm dev`

Turbo starts multiple Next (and related) dev servers on **fixed ports** (see the port table under **pnpm** above). If an earlier **`pnpm dev`** or another process is still listening, the new run fails with **`listen EADDRINUSE`** or a terse **Failed to start server**.

**Fix by freeing the ports** — not by changing dev ports in `package.json` as the default response. Rerouting ports diverges from documented defaults, breaks **`NEXT_PUBLIC_*_URL`** and local bookmarks, and usually masks a leftover **`node`** / **`next dev`** still bound to **3000–3005**.

1. In the terminal where **`pnpm dev`** is running, press **Ctrl+C** and wait until Turbo and all app processes exit.
2. If a port is still in use, find the listener (macOS / Linux):
   ```bash
   lsof -nP -iTCP:3000 -sTCP:LISTEN
   ```
   Run the same for **3001**, **3002**, **3003**, **3004**, or **3005** depending on which app failed.
3. Stop the process: **`kill <PID>`**. Use **`kill -9 <PID>`** only if it does not exit after a few seconds.

**For AI coding agents:** when resolving local dev startup failures caused by busy ports, **identify and terminate the processes holding those ports**. Do **not** reroute the monorepo to arbitrary alternate ports unless the user explicitly asks for that.

---

## Git workflow

Use a **main-first** workflow by default. A long-lived `develop` branch is **optional** and should only be used when the team explicitly wants a shared staging or release-integration branch.

1. Start from a clean, updated `main`:
   ```bash
   git switch main
   git pull --ff-only origin main
   git status
   ```
2. Create a **short-lived branch** from `main` for each unit of work:
   ```bash
   git switch -c <branch-name>
   ```
3. Commit only the files that belong to that branch. Do **not** mix unrelated work into the same PR.
4. Push the branch and open a PR **to `main`**.
5. Merge via PR — do **not** push directly to `main` unless the user explicitly asks.
6. After merge, return to a clean `main`:
   ```bash
   git switch main
   git pull --ff-only origin main
   git status
   ```

### Working tree hygiene

- Keep `main` **clean**. If you have local-only work, move it to a branch or stash it before switching branches.
- “Saved” should mean **committed and pushed** on a branch, or intentionally preserved in a **named stash**. Do not leave important work only as loose local edits.
- If a file is personal scratch and should not ship, leave it untracked or add an ignore rule in a separate intentional change.
- If the working tree is dirty and the user wants local and remote “in sync,” first preserve the local changes safely, then sync `main`.

### For AI agents

- Default base branch: `main`.
- Default PR target: `main`.
- Prefer `git pull --ff-only` when syncing local branches.
- Only use `develop` when the user explicitly wants a shared staging branch or batched promotion flow.

---

## Critical rules — always follow these

### Money
- ALL monetary values are stored as **integers in cents**. Never use floats for money.
- `$19.99` is stored as `1999`. `$1.00` is stored as `100`.
- Convert to dollars only at the display layer: `(cents / 100).toFixed(2)`
- Stripe also uses cents natively — no conversion needed at the API boundary.

### Split calculations
- **Always use `calculateSplits()` from `@joe-perks/stripe`** — never inline the math.
- Splits are calculated on `product_subtotal` only — shipping is excluded.
- Splits are **frozen on the Order row at PaymentIntent creation time** — never recalculate.
- `org_pct_snapshot` on the Order stores the org percentage used — use this for historical display.

### Tenant isolation
- Every roaster portal query **must** include `WHERE roaster_id = session.roasterId`.
- Every org portal query **must** include `WHERE org_id = session.orgId`.
- Never trust a `roaster_id` or `org_id` from the request body — always read from the verified session.
- Admin queries may scope globally — this is intentional.
- **`requireRoasterId()`** (in `products/_lib/require-roaster.ts`) is the canonical helper for roaster portal server actions: it calls `auth()`, resolves the Clerk user to a `User` row, and returns `{ ok: true, roasterId }` or `{ ok: false, error }`. Reuse this helper (or import it from a shared location) in any new roaster portal feature — do not reimplement the auth-to-roasterId lookup.
- **`requireOrgId()`** (in `apps/org/app/(authenticated)/_lib/require-org.ts`) is the canonical helper for org portal server actions: same pattern, returns `{ ok: true, orgId }` or `{ ok: false, error }`.

### Email sending
- **Transactional sends:** use **`sendEmail()`** from **`@joe-perks/email/send`** (also re-exported from **`@joe-perks/email`**). It sends via Resend, inserts **`EmailLog`** first, and dedupes on **`(entityType, entityId, template)`** (unique in the schema). On duplicate, the call returns without sending again (idempotent). If Resend fails after the log row is created, the row is deleted so callers can retry.
- **`resend`** on **`@joe-perks/email`** remains for edge cases; prefer **`sendEmail()`** for product flows.
- **Never** import the Resend SDK directly inside apps — keep email logic in **`@joe-perks/email`**.
- **Buyer order confirmation:** `payment_intent.succeeded` on `apps/web` (`/api/webhooks/stripe`) calls **`sendEmail()`** with template **`order_confirmation`**, `entityType = 'order'`, `entityId = order.id` (after the order is `CONFIRMED`).

### Stripe
- **Never import Stripe directly in an app** — always use the client from `@joe-perks/stripe`.
- **Split math in client components:** import `calculateSplits` (and related types) from **`@joe-perks/stripe/splits`** only. The main `@joe-perks/stripe` entry re-exports server-only modules and must not be bundled into client components.
- The Stripe client is initialized once as a module-level singleton.
- Webhook handlers must call `stripe.webhooks.constructEvent()` before any processing.
- Every webhook handler must check `StripeEvent` table for idempotency before processing.
- `transfer_group` must be set to `order.id` on every Stripe transfer — required for reconciliation.

### Logging and PII
- **Never log `req.body` in checkout or webhook routes** — it contains buyer addresses and card data.
- Only log: `order_id`, `stripe_pi_id`, `event_type`, `campaign_id` — never buyer fields.
- Sentry `beforeSend` scrubs email, name, address fields — verify this is active before adding new Sentry captures.

### Database
- **Soft deletes on Product and ProductVariant** — use `deleted_at DateTime?`. Never hard delete.
- Queries on these tables must always filter `WHERE deleted_at IS NULL`.
- `OrderEvent` is append-only — never update or delete event rows. Only insert.
- `logOrderEvent()` from `@joe-perks/db` is the preferred helper for non-transactional inserts (swallows errors). For events that must be atomic with other writes, use `database.orderEvent.create` inside `$transaction` (e.g. checkout, webhook confirmation, SLA auto-refund).
- `Order.org_pct_snapshot`, `Order.org_amount`, `Order.platform_amount`, `Order.roaster_amount` are immutable after creation.
- `CampaignItem.retail_price` and `CampaignItem.wholesale_price` are snapshots — read these for pricing, not `ProductVariant`.
- **Schema source of truth** — treat `packages/db/prisma/schema.prisma` plus committed files in `packages/db/prisma/migrations` as canonical. In April 2026, prod Neon matched the repo, while an older dev Neon branch had two extra applied historical migrations (`20260405134350_buyer_account_foundation`, `20260406032052_sprint8_fulfillment_schema_event_alignment`) from commits `03943f3` and `472749d` that were not present in the current checkout. If databases disagree, inspect `_prisma_migrations` before assuming prod is wrong or copying rows between databases.

### Magic links
- Tokens are generated with `crypto.randomBytes(32).toString('hex')` — 256 bits of entropy.
- Tokens are single-use: set `used_at = now()` immediately on first use before performing any action.
- Always verify: token exists, `expires_at > now()`, `used_at IS NULL`, correct `purpose`.
- For `ORDER_FULFILLMENT`, enforce a deterministic database-level dedupe key so only one live link can exist per order.
- Magic link pages (fulfill/[token], org-requests/[token]) are accessible WITHOUT authentication.

---

## Environment variables

### Root `.env` (shared secrets)
```
DATABASE_URL=                    # Neon Postgres connection string
STRIPE_SECRET_KEY=               # sk_test_... (dev) or sk_live_... (prod)
STRIPE_WEBHOOK_SECRET=           # whsec_... from Stripe dashboard
RESEND_TOKEN=                    # re_... (Resend API key — validated in @joe-perks/email/keys.ts)
RESEND_FROM=                     # optional From: address for Resend
INNGEST_SIGNING_KEY=             # signkey-...
INNGEST_EVENT_KEY=               # ...
PLATFORM_ALERT_EMAIL=            # optional — SLA breach/critical alerts to platform ops (used by `sla-check` job)
UPSTASH_REDIS_REST_URL=          # https://...upstash.io
UPSTASH_REDIS_REST_TOKEN=        # ...
SENTRY_AUTH_TOKEN=               # for source map uploads
```

**Root `.env` loading caveat:** Next.js only loads `.env` files from the app's own directory (e.g. `apps/web/`), **not** from the monorepo root. Apps that need root `.env` values use a `load-root-env.ts` loader (imported at the top of `next.config.ts`) that calls `dotenv.config()` pointing at `../../.env`. **`apps/web`** and **`apps/admin`** use this loader so `DATABASE_URL`, Resend keys, and shared URLs are available for Prisma and `sendEmail()` without duplicating secrets in per-app `.env` files.

**Empty-string overrides:** Do **not** set `STRIPE_SECRET_KEY=""` or similar in per-app `.env.local` for variables that already have values in root `.env`. Next.js merges `.env.local` over `.env` and the empty string will mask the real value. Only add a variable to `.env.local` if you need to override it with a non-empty app-specific value.

### apps/web `.env.local`
```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=   # pk_test_... or pk_live_...
NEXT_PUBLIC_POSTHOG_KEY=              # phc_...
NEXT_PUBLIC_POSTHOG_HOST=            # https://app.posthog.com
UPLOADTHING_SECRET=
UPLOADTHING_APP_ID=
```

### apps/roaster `.env.local`
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=   # Roaster Clerk app
CLERK_SECRET_KEY=
ROASTER_APP_ORIGIN=                # optional — public base URL for Stripe Connect return/refresh (default http://localhost:3001)
ORG_APP_ORIGIN=                    # optional — org portal base URL for US-03-03 `org-approved` email sign-in CTA (default http://localhost:3002)
UPLOADTHING_TOKEN=                 # optional — UploadThing API token (dashboard); enables product image uploads via `/api/uploadthing`
```

### apps/org `.env.local`
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=   # Org Clerk app (separate from roaster)
CLERK_SECRET_KEY=
ORG_APP_ORIGIN=                    # optional — public base URL for Stripe Connect return/refresh (default http://localhost:3002); also used for consistent absolute URLs if needed
```

### apps/admin `.env.local`
```
ADMIN_EMAIL=         # HTTP Basic Auth for MVP (platform admin login — e.g. joe@joeperks.com)
ADMIN_PASSWORD=      # HTTP Basic Auth for MVP
ROASTER_APP_ORIGIN=  # optional — public **roaster portal** base URL for approval emails (login CTA in `roaster-approved`), e.g. https://roasters.joeperks.com — **not** the admin user’s email. Default http://localhost:3001. May be set in root `.env` instead (admin loads root `.env` via `load-root-env.ts`).
```

### Stripe and Stripe Connect
- **`@joe-perks/stripe`** implements the shared client, split math, checkout rate limiting, and Connect Express helpers. Apps must not import the Stripe SDK directly — use this package.
- **Secret key** (`STRIPE_SECRET_KEY`) and **webhook signing secret** (`STRIPE_WEBHOOK_SECRET`) live in the **root `.env`** so `apps/web` (webhooks) and any server route using `getStripe()` can read them via Turbo.
- **Publishable key** (`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`) goes in **`apps/web/.env.local`** (buyer UI / Elements later). Use the same mode as the secret key (`pk_test_` with `sk_test_`, or live keys only in production).
- **Connect onboarding** (`POST /api/stripe/connect` on the roaster app) needs the secret key in the environment roaster runs with (typically same root `.env`). Set **`ROASTER_APP_ORIGIN`** in **`apps/roaster/.env.local`** for deployed previews (e.g. `https://roasters.joeperks.com`).
- Enable **Stripe Connect** in the Dashboard (**Settings → Connect**) before creating Express accounts. For webhooks, add an endpoint pointing at **`/api/webhooks/stripe`** on the marketing/storefront app and subscribe at least to **`account.updated`** (see `docs/SCAFFOLD_CHECKLIST.md`). Local testing: `stripe listen --forward-to localhost:3000/api/webhooks/stripe` and paste the CLI signing secret as `STRIPE_WEBHOOK_SECRET`.

---

## Auth model

| Surface                     | Auth method           | Role                |
| --------------------------- | --------------------- | ------------------- |
| `apps/roaster`              | Clerk                 | `ROASTER_ADMIN`     |
| `apps/org`                  | Clerk                 | `ORG_ADMIN`         |
| `apps/admin`                | HTTP Basic Auth (MVP) | `PLATFORM_ADMIN`    |
| `apps/web` buyer storefront | No auth               | Public              |
| Magic link pages            | Token validation      | No session required |

**Clerk user sync:** On `user.created` webhook from Clerk, create a `User` record in DB with `external_auth_id = event.data.id`. Link `roaster_id` or `org_id` from Clerk public metadata.

---

## Key data patterns

### Order number generation (atomic)
```typescript
// packages/db/order-number.ts
// Use raw SQL for atomic increment — never use application-level increment
const result = await prisma.$queryRaw<[{ next_val: bigint }]>`
  UPDATE "OrderSequence" SET next_val = next_val + 1
  WHERE id = 'singleton'
  RETURNING next_val
`
const n = Number(result[0].next_val)
return `JP-${String(n).padStart(5, '0')}` // JP-00001
```

### Buyer upsert on order creation
```typescript
// Always upsert — never assume buyer doesn't exist
const buyer = await prisma.buyer.upsert({
  where: { email: buyerEmail },
  create: { email: buyerEmail, name: buyerName },
  update: {},
})
// Link buyer.id to Order.buyer_id
```

### Rate limiting pattern

All rate limiters live in `packages/stripe/src/ratelimit.ts`. **Never** import `@upstash/ratelimit` or `@upstash/redis` directly in apps — use the exported helpers from `@joe-perks/stripe`.

```typescript
// packages/stripe/src/ratelimit.ts — defines all limiters
import { limitCheckout } from '@joe-perks/stripe'            // 5 req/hour per IP (checkout)
import { limitSlugValidation } from '@joe-perks/stripe'     // 30 req/min per IP (slug validation)
import { limitRoasterApplication } from '@joe-perks/stripe'  // 3 req/hour per IP (roaster apply)
import { limitOrgApplication } from '@joe-perks/stripe'      // 3 req/hour per IP (org apply)

// In API route:
const { success } = await limitCheckout(ip)
if (!success) return Response.json({ error: 'Too many requests' }, { status: 429 })
```

### Webhook idempotency pattern
```typescript
// Always check before processing
const existing = await prisma.stripeEvent.findUnique({
  where: { stripe_event_id: event.id }
})
if (existing) return Response.json({ received: true }) // already processed

await prisma.stripeEvent.create({ data: { stripe_event_id: event.id, event_type: event.type } })
// Now safe to process...
```

**`apps/web` Stripe webhook (`/api/webhooks/stripe`):** Uses the same **check-first** dedupe, but inserts the **`StripeEvent`** row **after** a successful handler run (so a failed run can be retried by Stripe without losing the event). Handlers must also be safe under concurrent delivery by guarding the business transition itself (for example, only one `PENDING -> CONFIRMED` update may commit).

---

## Inngest background jobs

| Job              | Schedule                      | Purpose                                                 |
| ---------------- | ----------------------------- | ------------------------------------------------------- |
| `sla-check`      | `0 * * * *` (hourly)          | Flag orders past SLA thresholds, send escalation emails |
| `payout-release` | `0 9 * * *` (daily 09:00 UTC) | Find payout-eligible orders, create Stripe transfers    |
| `cart-cleanup`   | `0 2 * * *` (daily 02:00 UTC) | Log expired cart count (Phase 2: delete expired carts)  |

Jobs are registered at **`apps/web/app/api/inngest/route.ts`** via Inngest **`serve()`** (`sla-check`, `payout-release`, `cart-cleanup`). After deploy, sync the app URL in the Inngest dashboard (`/api/inngest` on the web app).

---

## SLA thresholds (from PlatformSettings)

| Hours after order               | Action                                                  |
| ------------------------------- | ------------------------------------------------------- |
| T+24h (`sla_warn_hours`)        | Reminder email to roaster                               |
| T+48h (`sla_breach_hours`)      | Admin flagged, urgent roaster email, buyer delay notice |
| T+72h (`sla_critical_hours`)    | Admin must intervene manually                           |
| T+96h (`sla_auto_refund_hours`) | Automatic full refund via Stripe                        |

All thresholds are configurable in `PlatformSettings` singleton — never hardcode them.

---

## Stripe Connect account types

- **Roasters and orgs** both use Express accounts.
- Account type: `stripe.accounts.create({ type: 'express', ... })`
- Charge model: Destination charges — all payments flow through platform account first.
- `application_fee_amount` on PaymentIntent = `platform_amount` (stays with platform automatically).
- Roaster and org transfers are created manually by the payout job after the hold period.
- `transfer_group` must equal `order.id` on every transfer for reconciliation.

---

## Diagrams index

| File                                   | Contents                                                   |
| -------------------------------------- | ---------------------------------------------------------- |
| `docs/01-project-structure.mermaid`    | Full monorepo folder tree with all routes and files        |
| `docs/02-deployment-topology.mermaid`  | DNS → Vercel → third-party service connections             |
| `docs/03-package-dependencies.mermaid` | Which apps import which packages, external API connections |
| `docs/04-order-lifecycle.mermaid`      | Sequence diagram: checkout → webhook → fulfill → payout    |
| `docs/05-approval-chain.mermaid`       | Roaster and org onboarding + approval workflows            |
| `docs/06-database-schema.mermaid`      | ERD with all 27 models, key fields, and relationships      |
| `docs/07-stripe-payment-flow.mermaid`  | Charge → transfer → refund → chargeback flows              |
| `docs/08-order-state-machine.mermaid`  | Order and payout status state machines                     |

---

## Document index (full reference)

| Document                | Location                                         | Contents                                                           |
| ----------------------- | ------------------------------------------------ | ------------------------------------------------------------------ |
| `CONVENTIONS.md`        | `docs/CONVENTIONS.md`                            | Coding patterns, file layout, anti-patterns                        |
| `SCAFFOLD_CHECKLIST.md` | `docs/SCAFFOLD_CHECKLIST.md` (or repo root copy) | Scaffold status: done vs remaining; **Phase 10 = pre-mortem gate** |
| `SCAFFOLD.md`           | repo root                                        | Full environment / phase setup guide                               |
| PRD v1.0                | `docs/joe_perks_prd.docx`                        | Product requirements, user personas, functional specs              |
| DB Schema Reference     | `docs/joe_perks_db_schema.docx`                  | Full Prisma schema, Drizzle alternative, split calc implementation |
| Epics & Stories v2.0    | `docs/joe_perks_epics_stories_v2.docx`           | 39 user stories with acceptance criteria, 5 sprints                |

Repo root **`AGENTS.md`** and **`CONVENTIONS.md`** are short pointers to the canonical **`docs/`** files above.

---

## Launch & risk docs

Added in April 2026 after the v1 pre-mortem. These are the live docs for shipping v1; they cross-reference each other and the scaffold checklist.

| Document                       | Location                                        | When to read                                                                              |
| ------------------------------ | ----------------------------------------------- | ----------------------------------------------------------------------------------------- |
| v1 Pre-Mortem (dated snapshot) | `docs/pre-mortems/2026-04-19-v1-launch.md`      | Understand why each launch-blocking Tiger exists. Immutable snapshot — do not edit.       |
| v1 Launch Runbook              | `docs/runbooks/v1-launch-runbook.md`            | Opened during launch week. Phased pre-/dress-rehearsal/launch/watch steps + rollback.     |
| DB Schema Reconciliation Note  | `docs/runbooks/2026-04-database-schema-reconciliation.md` | Reference when dev/prod DB shape or seed data appears inconsistent during testing. |
| Money-Path E2E Test Scenarios  | `docs/testing/money-path-e2e-scenarios.md`      | When implementing LB-7 E2E tests. Happy paths, edge cases (EC-01…EC-24), invariants.      |
| Pilot Outreach Scripts         | `docs/gtm/pilot-outreach.md`                    | When sourcing the first 3 roasters + 3 orgs (Elephant E-1). Discovery + pilot agreements. |

**Source of truth for action items**: `SCAFFOLD_CHECKLIST.md` **Phase 10**. The pre-mortem is rationale; the checklist is execution. If they drift, the checklist wins — run a new pre-mortem if the world has changed.

---

## Phase map (what exists now vs later)

| Feature                                                               | Phase                             |
| --------------------------------------------------------------------- | --------------------------------- |
| Magic link fulfillment (no portal login)                              | MVP                               |
| Roaster portal dashboard                                              | Phase 2                           |
| Platform-generated shipping labels (EasyPost)                         | Phase 2                           |
| Inngest baseline jobs (`sla-check`, `payout-release`, `cart-cleanup`) | MVP (see `apps/web/lib/inngest/`) |
| Additional SLA / job automation beyond baseline                       | Phase 2                           |
| DB-backed cart (abandoned cart recovery)                              | Phase 2                           |
| Collab mode (platform holds stock, fulfills)                          | Phase 3                           |
| Custom domains per org                                                | Phase 3                           |
| Subscription/recurring orders                                         | Phase 3                           |
| Multi-roaster campaigns                                               | Phase 3                           |

When writing Phase 2/3 features, check whether the schema field already exists
(it likely does — the schema was designed to be forward-compatible).

---

## Cursor Cloud specific instructions

### Toolchain

The VM update script installs **fnm** (Node.js version manager), **Node.js 20**, **pnpm 10.31.0** (via corepack), and **Bun**. After the update script runs, source the environment:

```bash
export PATH="$HOME/.local/share/fnm:$HOME/.bun/bin:$PATH"
eval "$(fnm env)"
```

### Running dev servers

`pnpm dev` starts **web** (3000), **roaster** (3001), **org** (3002), **admin** (3003), and **email** (3004) via Turbo TUI. All apps gracefully degrade without external service credentials — the buyer storefront (`web`) and email preview (`email`) work fully without any secrets.

**Required env vars for all Next.js apps:** `NEXT_PUBLIC_APP_URL` and `NEXT_PUBLIC_WEB_URL` in each app's `.env.local` (validated by `packages/next-config/keys.ts` as `z.url()` — not optional). Without these, `next.config.ts` fails to load.

### Build scripts (pnpm.onlyBuiltDependencies)

The repo's `package.json` includes `pnpm.onlyBuiltDependencies` to allow native postinstall scripts (esbuild, prisma, sharp, etc.) to run during `pnpm install`. Without this, Next.js and Prisma fail at runtime.

### Running tests

- `pnpm test` — runs Vitest unit tests across `@joe-perks/stripe`, `apps/admin`, `apps/roaster`
- `pnpm check` — runs Ultracite (Biome-based lint/format)
- `pnpm typecheck` — runs TypeScript type checking across all packages

### Notes

- The `org` and `roaster` apps return 500/redirect without valid Clerk keys — this is expected in environments without Clerk credentials.
- The `admin` app uses HTTP Basic Auth: `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `apps/admin/.env.local`.
- Prisma Client must be generated before DB-backed routes work: `cd packages/db && npx prisma generate`.

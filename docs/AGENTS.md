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

| App / tool | Port |
|------------|------|
| `web` | 3000 |
| `roaster` | 3001 |
| `org` | 3002 |
| `admin` | 3003 |
| `email` (React Email preview) | 3004 |
| `studio` (Prisma Studio) | 3005 |

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

### Email sending
- **Target pattern:** use **`sendEmail()`** from **`@joe-perks/email/send`** — it must own transactional sends and (once implemented) write **`EmailLog`** before send with dedup key **`(entity_id, template)`**.
- **Current codebase:** `sendEmail()` is a **stub** (throws until `EmailLog` + wiring exist). Existing flows (e.g. web contact) may still use the **`resend`** export from **`@joe-perks/email`** — do not break those until `sendEmail()` is implemented.
- **Never** import the Resend SDK directly inside apps — keep email logic in **`@joe-perks/email`**.

### Stripe
- **Never import Stripe directly in an app** — always use the client from `@joe-perks/stripe`.
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
- `Order.org_pct_snapshot`, `Order.org_amount`, `Order.platform_amount`, `Order.roaster_amount` are immutable after creation.
- `CampaignItem.retail_price` and `CampaignItem.wholesale_price` are snapshots — read these for pricing, not `ProductVariant`.

### Magic links
- Tokens are generated with `crypto.randomBytes(32).toString('hex')` — 256 bits of entropy.
- Tokens are single-use: set `used_at = now()` immediately on first use before performing any action.
- Always verify: token exists, `expires_at > now()`, `used_at IS NULL`, correct `purpose`.
- Magic link pages (fulfill/[token], org-requests/[token]) are accessible WITHOUT authentication.

---

## Environment variables

### Root `.env` (shared across all apps via turbo pipeline)
```
DATABASE_URL=                    # Neon Postgres connection string
STRIPE_SECRET_KEY=               # sk_test_... (dev) or sk_live_... (prod)
STRIPE_WEBHOOK_SECRET=           # whsec_... from Stripe dashboard
RESEND_TOKEN=                    # re_... (Resend API key — validated in @joe-perks/email/keys.ts)
RESEND_FROM=                     # optional From: address for Resend
INNGEST_SIGNING_KEY=             # signkey-...
INNGEST_EVENT_KEY=               # ...
UPSTASH_REDIS_REST_URL=          # https://...upstash.io
UPSTASH_REDIS_REST_TOKEN=        # ...
SENTRY_AUTH_TOKEN=               # for source map uploads
```

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
```

### apps/org `.env.local`
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=   # Org Clerk app (separate from roaster)
CLERK_SECRET_KEY=
```

### apps/admin `.env.local`
```
ADMIN_EMAIL=         # HTTP Basic Auth for MVP
ADMIN_PASSWORD=      # HTTP Basic Auth for MVP
```

### Stripe client (implementation status)
The **`@joe-perks/stripe`** package is still **stubbed** (`client.ts` / `splits.ts` / `ratelimit.ts`). When you implement the real client, add guards here (e.g. refuse `sk_live_` outside `production`) per security review.

---

## Auth model

| Surface | Auth method | Role |
|---|---|---|
| `apps/roaster` | Clerk | `ROASTER_ADMIN` |
| `apps/org` | Clerk | `ORG_ADMIN` |
| `apps/admin` | HTTP Basic Auth (MVP) | `PLATFORM_ADMIN` |
| `apps/web` buyer storefront | No auth | Public |
| Magic link pages | Token validation | No session required |

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
```typescript
// packages/stripe/ratelimit.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

export const checkoutLimiter = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, '1 h'),
  prefix: 'jp:checkout',
})

// In API route:
const { success } = await checkoutLimiter.limit(ip)
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

---

## Inngest background jobs

| Job | Schedule | Purpose |
|---|---|---|
| `sla-check` | `0 * * * *` (hourly) | Flag orders past SLA thresholds, send escalation emails |
| `payout-release` | `0 9 * * *` (daily 09:00 UTC) | Find payout-eligible orders, create Stripe transfers |
| `cart-cleanup` | `0 2 * * *` (daily 02:00 UTC) | Log expired cart count (Phase 2: delete expired carts) |

Jobs should be registered at **`apps/web/app/api/inngest/route.ts`** via Inngest **`serve()`**. The route is currently a **stub** — replace with real function registration when implementing Sprint 1 jobs.

---

## SLA thresholds (from PlatformSettings)

| Hours after order | Action |
|---|---|
| T+24h (`sla_warn_hours`) | Reminder email to roaster |
| T+48h (`sla_breach_hours`) | Admin flagged, urgent roaster email, buyer delay notice |
| T+72h (`sla_critical_hours`) | Admin must intervene manually |
| T+96h (`sla_auto_refund_hours`) | Automatic full refund via Stripe |

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

| File | Contents |
|---|---|
| `docs/01-project-structure.mermaid` | Full monorepo folder tree with all routes and files |
| `docs/02-deployment-topology.mermaid` | DNS → Vercel → third-party service connections |
| `docs/03-package-dependencies.mermaid` | Which apps import which packages, external API connections |
| `docs/04-order-lifecycle.mermaid` | Sequence diagram: checkout → webhook → fulfill → payout |
| `docs/05-approval-chain.mermaid` | Roaster and org onboarding + approval workflows |
| `docs/06-database-schema.mermaid` | ERD with all 26 models, key fields, and relationships |
| `docs/07-stripe-payment-flow.mermaid` | Charge → transfer → refund → chargeback flows |
| `docs/08-order-state-machine.mermaid` | Order and payout status state machines |

---

## Document index (full reference)

| Document | Location | Contents |
|---|---|---|
| `CONVENTIONS.md` | `docs/CONVENTIONS.md` | Coding patterns, file layout, anti-patterns |
| `SCAFFOLD_CHECKLIST.md` | `docs/SCAFFOLD_CHECKLIST.md` (or repo root copy) | Scaffold status: done vs remaining |
| `SCAFFOLD.md` | repo root | Full environment / phase setup guide |
| PRD v1.0 | `docs/joe_perks_prd.docx` | Product requirements, user personas, functional specs |
| DB Schema Reference | `docs/joe_perks_db_schema.docx` | Full Prisma schema, Drizzle alternative, split calc implementation |
| Epics & Stories v2.0 | `docs/joe_perks_epics_stories_v2.docx` | 39 user stories with acceptance criteria, 5 sprints |

Repo root **`AGENTS.md`** and **`CONVENTIONS.md`** are short pointers to the canonical **`docs/`** files above.

---

## Phase map (what exists now vs later)

| Feature | Phase |
|---|---|
| Magic link fulfillment (no portal login) | MVP |
| Roaster portal dashboard | Phase 2 |
| Platform-generated shipping labels (EasyPost) | Phase 2 |
| Automated SLA Inngest jobs (full) | Phase 2 |
| DB-backed cart (abandoned cart recovery) | Phase 2 |
| Collab mode (platform holds stock, fulfills) | Phase 3 |
| Custom domains per org | Phase 3 |
| Subscription/recurring orders | Phase 3 |
| Multi-roaster campaigns | Phase 3 |

When writing Phase 2/3 features, check whether the schema field already exists
(it likely does — the schema was designed to be forward-compatible).

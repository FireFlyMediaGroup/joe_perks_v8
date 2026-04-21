# E2E / frontend testing — accounts & URLs reference

Use this sheet when seeding local or staging data for storefront tests, portal demos, and transactional email review. **IDs in the database (CUIDs) change when you recreate rows**; emails and slugs below are the stable keys defined in the seed scripts unless you edit those scripts.

---

## One-command seed

From the monorepo root (requires `DATABASE_URL` in `packages/db/.env` or your shell):

```bash
pnpm db:seed:e2e:frontend
```

This runs, in order:

1. `packages/db/seed.ts` — `PlatformSettings` + `OrderSequence` singletons  
2. `packages/db/scripts/seed-e2e-roaster.ts` — ACTIVE roaster, products, shipping  
3. `packages/db/scripts/seed-e2e-org.ts` — ACTIVE org, campaign, campaign items  
4. `packages/db/scripts/seed-e2e-orders.ts` — two synthetic paid orders (**CONFIRMED** + **SHIPPED**) for dashboard testing (no Stripe checkout)  
5. `packages/db/scripts/write-playwright-fixtures.ts` — Playwright cart fixtures  

After a successful run, note any printed IDs if you need them for SQL or support tickets. Playwright reads regenerated IDs from `tests/e2e/frontend/.generated/fixtures.json` (this path is **gitignored**; it is recreated on each seed).

---

## Seeded tenant accounts (database)

| Role | Email (default) | Where it’s set | Notes |
|------|-----------------|----------------|--------|
| Roaster admin | see `E2E_ROASTER_EMAIL` | `packages/db/scripts/e2e-seed-constants.ts` | `Roaster.email` and `User.email`. Fulfillment and lifecycle emails use **`Roaster.email`**, not Clerk. |
| Org admin | see `E2E_ORG_EMAIL` | `e2e-seed-constants.ts` | `Org.email` and org portal `User.email`. |
| Buyer | `E2E_SEED_BUYER_EMAIL` in `e2e-seed-constants.ts` | `seed-e2e-orders.ts` | Synthetic buyer for seeded dashboard orders only. Real checkout still creates/upserts buyers by email. |

**Business names (UX copy):**

- Roaster: **Sunrise Coffee Roasters** (`seed-e2e-roaster.ts`)
- Org: **E2E Test Organization** / storefront slug **`E2E_ORG_SLUG`** in `e2e-seed-constants.ts` (default `e2e-test-org`)

---

## Local URLs (default ports)

| Surface | URL |
|---------|-----|
| Storefront (seeded org) | `http://localhost:3000/en/e2e-test-org` |
| Roaster app | `http://localhost:3001` |
| Org app | `http://localhost:3002` |
| Admin app | `http://localhost:3003` |
| React Email template preview | `http://localhost:3004` — run `pnpm --filter email dev` |

---

## Clerk sign-in (roaster & org portals)

Seeded `User` rows use a **pending** Clerk placeholder: `externalAuthId` like `clerk_pending:<roasterId>` or `clerk_pending:<uuid>` until Clerk sync runs.

**Recommended flow:**

1. Use the **same email** in the seed scripts as the email you will use in **roaster** or **org** Clerk (dev instance).  
2. Sign up or sign in with that email on `localhost:3001` (roaster) or `localhost:3002` (org).  
3. Ensure Clerk **`user.created` / `user.updated` webhooks** hit your app with the **same `DATABASE_URL`** so `upsertUserFromClerkWebhook` can attach the real Clerk user id to the existing `User` row.

If webhooks are not wired locally, the seed script’s console output shows a manual SQL pattern (replace `externalAuthId` with your Clerk user id) — use only on non-production databases you trust.

**Roaster portal:** `requireRoasterId()` matches `User.externalAuthId` to the signed-in Clerk user id.

---

## Platform admin (not seeded by E2E scripts)

HTTP Basic auth for `apps/admin` is configured in **`apps/admin/.env.local`**:

- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

See `docs/AGENTS.md` environment section. Use this for approval queues and org/roaster admin flows, not for the seeded E2E roaster/org Clerk users.

---

## Transactional email — who gets what

With **Resend** configured (`RESEND_TOKEN`, etc. in root `.env`):

| Event | Template (approx.) | Recipient |
|-------|--------------------|-----------|
| Payment succeeds | `order_confirmation` | Buyer (`order.buyer.email` from checkout) |
| Payment succeeds | `magic_link_fulfillment` | Roaster (`Roaster.email`) — link to fulfill page |
| Roaster submits tracking | `order_shipped` (order-shipped) | Buyer |

There is **no per-order email to the org** on payment success in the current webhook path; org-related templates are mainly **onboarding / lifecycle** (applications, approvals).

**Preview templates without sending:** `pnpm --filter email dev` → open the template list on port **3004**.

---

## Fulfillment magic link (demo for roasters)

After a confirmed order, the roaster email contains:

`{ROASTER_APP_ORIGIN}/fulfill/{token}`  

Default local origin: `http://localhost:3001` (set in root `.env` or `apps/roaster/.env.local` as `ROASTER_APP_ORIGIN` so `apps/web` webhooks build the correct link).

To grab a token without email (dev only): query the `MagicLink` table for `purpose = ORDER_FULFILLMENT` and the matching order (dedupe key pattern `order_fulfillment:<orderId>`).

---

## Customizing seed emails

| File | What to change |
|------|----------------|
| `packages/db/scripts/e2e-seed-constants.ts` | **`E2E_ROASTER_EMAIL`**, **`E2E_ORG_EMAIL`**, **`E2E_ORG_SLUG`** — keep roaster email in sync across roaster + org seeds |

Re-run **`pnpm db:seed:e2e:frontend`** (dev DB) or prod seed after edits. Use plus-addressing (e.g. `you+roaster@gmail.com`) to separate inboxes while keeping a single mailbox.

---

## Production E2E seed (prod Postgres, sandbox Stripe / Clerk)

Use this when deployed apps use **Neon main** for `DATABASE_URL` but you still run **test** Stripe and **development** Clerk — you need tenant rows (roaster, org, campaign, products) on the **production database** to exercise dashboards and storefronts.

**Before you run**

1. Ensure **`packages/db/.env.production`** exists with the pooled Neon **main** URL (see `packages/db/.env.production.example` and `docs/AGENTS.md`).
2. Apply migrations if needed: **`pnpm migrate:deploy:prod`**.
3. **Customize** `seed-e2e-roaster.ts` and `seed-e2e-org.ts` (emails, `ORG_SLUG`) so you do not collide with real pilot orgs or inboxes you do not control. Default slug `e2e-test-org` is fine for an internal beta lane if unused.
4. Seeded `stripeAccountId` values are **placeholders**; some Connect flows may still need you to complete onboarding with **test** keys in the dashboard. Dashboard and catalog UIs can be validated even when Connect is incomplete.
5. Seeded **`User`** rows start with **`clerk_pending:…`**. Sign in with the **same email** in your **Clerk dev/sandbox** app, and ensure **Clerk webhooks** target an environment that writes to **this same** `DATABASE_URL` so `externalAuthId` updates correctly.

**Command** (guard requires explicit confirmation):

```bash
JOE_PERKS_CONFIRM_PROD_E2E_SEED=1 pnpm db:seed:e2e:prod
```

This runs: **`seed.ts`** (singletons) + **`seed-e2e-roaster.ts`** + **`seed-e2e-org.ts`** + **`seed-e2e-orders.ts`**. It does **not** run **`write-playwright-fixtures.ts`** (local Playwright only).

**Seeded orders:** fixed `stripePiId` values `pi_e2e_seed_dashboard_confirmed` and `pi_e2e_seed_dashboard_shipped` — re-running **`seed-e2e-orders.ts`** skips rows that already exist. Splits use **`calculateSplits`**; **`Campaign.totalRaised`** is incremented by each order’s **`orgAmount`** (same idea as the payment webhook).

Implementation: `scripts/run-prod-e2e-seed.mjs`.

---

## Related commands & docs

| Resource | Location |
|----------|----------|
| Root script | `package.json` → `db:seed:e2e:frontend` (dev) · `db:seed:e2e:prod` (prod DB, guarded) |
| Package shortcut | `packages/db/package.json` → `seed:e2e` (roaster + org only, no main seed / fixtures) |
| Agent context (ports, env, Clerk) | `docs/AGENTS.md` |
| Money-path scenarios | `docs/testing/money-path-e2e-scenarios.md` |

---

## Pointing local apps at the production database (read the warnings)

Use this only when you **intentionally** want Next.js on your machine to read/write the **same** Postgres as production (e.g. smoke-test the real storefront slug or verify a row).

**Risks:** Local server actions, webhooks, seeds, and Playwright can **mutate production data**. Do not point `DATABASE_URL` at prod and run **`pnpm db:seed:e2e:frontend`** by mistake. Intentional prod tenant seeding uses **`JOE_PERKS_CONFIRM_PROD_E2E_SEED=1 pnpm db:seed:e2e:prod`** (see above). Prefer **read-only** exploration via Neon SQL or Prisma Studio with a **read replica** when you only need to inspect rows.

**Connection string:** Use the Neon **pooled** URL for the **main** branch. The repo documents the gitignored file `packages/db/.env.production` in `packages/db/.env.production.example` (see `docs/AGENTS.md`).

**Ways to set `DATABASE_URL` for `pnpm dev`:**

1. **Shell (recommended for a temporary switch):** `export DATABASE_URL='postgresql://…'` then `pnpm dev`. Already-set variables are not overwritten by `dotenv` in `packages/db` loaders.
2. **Root `.env`:** Set `DATABASE_URL` in the monorepo root `.env`. The **web**, **org**, **admin**, and **roaster** apps load this file at startup (`load-root-env.ts` where applicable).
3. **`packages/db/.env`:** Still used by Prisma CLI and scripts that only load the db package; keep this **in sync** with root `.env` if you use db scripts, or rely on the shell export so both match.

**Clerk:** Roaster and org portals map **Clerk user id → `User.externalAuthId`**. Production DB rows expect **production** Clerk users. If you keep **development** Clerk keys in `.env.local`, sign-in will not attach to prod `User` rows. For portal testing against prod data, use the **same Clerk instance (and keys)** that production uses, or accept that only **unauthenticated** surfaces (e.g. buyer storefront, magic-link fulfill URLs) work without extra setup.

**Stripe:** Production rows reference **live** Connect accounts and payment state. Local checkout with **test** Stripe keys often **does not** match prod metadata; treat money-path tests as **environment-specific** (see money-path docs).

**Updating a roaster email on prod:** Prefer a targeted `UPDATE` on `Roaster` / `User` (and any related fields) or an admin workflow — not a full E2E seed — unless you explicitly want seeded catalog data on production.

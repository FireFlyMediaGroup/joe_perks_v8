**Joe Perks**

Database Schema Reference

*Prisma ORM · Postgres (Neon) · Aligned with repository*

| Item | Value |
| :--- | :--- |
| **ORM** | **Prisma 7** (`prisma-client` generator) — canonical schema: **`packages/db/prisma/schema.prisma`** |
| **Database** | Neon Postgres (serverless) — Postgres 15+ compatible |
| **Location** | `packages/db/` in the Turborepo monorepo |
| **Version** | **1.2** — Sprint 7 buyer-account foundation schema |
| **Last updated** | April 2026 |

> **Source of truth:** Do not treat this Markdown file as the live DDL. The deployed shape is whatever **`prisma migrate`** applied from `packages/db/prisma/migrations/`. This document summarizes that schema and points to the Prisma file for full detail.

---

## 1. Schema overview

Principles (unchanged from product design):

- **Immutability** — `OrderEvent` is append-only; split amounts on `Order` are frozen at charge time.
- **Tenant isolation** — Roaster/org portal queries must scope by `roasterId` / `orgId` from session (see `docs/AGENTS.md`).
- **Future-proofing** — `fulfillerType`, `isCollab` on product/order support later phases without blocking MVP.
- **Auditability** — `OrderEvent` records actor, type, payload, timestamp.
- **Business rules** — `PlatformSettings` singleton holds configurable fees, SLA hour thresholds, payout hold, dispute fee floor.

### 1.1 Models in the repository (current)

| Model | Role | Notes |
| :--- | :--- | :--- |
| `PlatformSettings` | Singleton | `id = "singleton"` — fees, org % bounds, SLA hours, `payoutHoldDays`, `disputeFeeCents` |
| `OrderSequence` | Singleton | `id = "singleton"`, `nextVal` — atomic `JP-#####` via raw SQL in `order-number.ts` |
| `User` | Auth | Clerk `externalAuthId`; optional `roasterId` / `orgId`; `UserRole` |
| `MagicLink` | Auth | Single-use tokens; `purpose`, `actorId`, `payload` JSON |
| `StripeEvent` | Infra | Webhook idempotency — `stripeEventId` unique |
| `EmailLog` | Infra | Dedup `@@unique([entityType, entityId, template])` |
| `RoasterApplication` | Onboarding | Streamlined: `businessName`, `termsAgreedAt`, `termsVersion`, `ApplicationStatus` |
| `Roaster` | Core | `stripeAccountId` required; `StripeOnboardingStatus`; no separate `businessName` on row (use application if needed) |
| `RoasterShippingRate` | Catalog | Flat-rate shipping rows in cents |
| `RoasterDebt` | Finance | Optional `orderId`; `DebtReason` |
| `OrgApplication` | Onboarding | `orgName`, `contactName`, `phone?`, `description?`, `desiredSlug`, `desiredOrgPct`, `termsAgreedAt`, `termsVersion` |
| `RoasterOrgRequest` | Onboarding | `@@unique([applicationId, roasterId])` |
| `Org` | Core | `slug`, `stripeAccountId`, `stripeOnboarding`, `chargesEnabled`, `payoutsEnabled`, `status` |
| `Product` | Catalog | `roastLevel` required; `deletedAt` soft delete |
| `ProductVariant` | Catalog | `sizeOz`, `grind`, prices in cents; `deletedAt` |
| `Campaign` | Commerce | `orgPct` snapshot; `goalCents`, `totalRaised` |
| `CampaignItem` | Commerce | Price snapshots; `@@unique([campaignId, variantId])` |
| `Buyer` | Commerce | Upsert by `email`; `lastSignInAt` reserved for buyer-account auth tracking |
| `Order` | Commerce | Frozen splits; `buyerIp` required string; immutable `buyerEmail` + shipping snapshot columns now persist historical contact data |
| `OrderItem` | Commerce | `productName`, `variantDesc`, line pricing snapshots |
| `OrderEvent` | Audit | Append-only |
| `AdminActionLog` | Audit | High-risk admin actions: actor label, action type, target, note, payload, timestamp |
| `DisputeRecord` | Finance | One per order (`orderId` unique) |

### 1.2 Not in the current Prisma schema (planned / doc legacy)

These appear in older design docs or Phase 2 plans but are **not** in `schema.prisma` today:

| Previously documented | Status |
| :--- | :--- |
| `RoasterOrgRelationship` | Not modeled — partnership implied via campaigns/orders or future migration |
| `Cart`, `CartItem` | Phase 2 DB-backed cart — not in schema |
| `ApplicationEvent` | Not in schema — approval history can be added later |
| `Order.wholesale_cost`, `shipping_label_url`, `label_generated_by` | Not in MVP schema |
| Extra `PlatformSettings` fields (`min_retail_spread_pct`, `magic_link_ttl_hours`, …) | Not in current `PlatformSettings` model |

When product needs these, add a **new Prisma migration**; update this doc in the same PR.

---

## 2. Key design decisions

### 2.1 Money as integers (cents)

All monetary fields are **`Int` cents** in Prisma. Percentages for splits and campaign snapshots use **`Float`** where appropriate. Display divides by 100. See `docs/AGENTS.md`.

### 2.2 Price snapshotting

- **`CampaignItem.retailPrice` / `wholesalePrice`** — frozen at campaign setup.
- **`Order`** line items and split columns — frozen at PaymentIntent / order creation (app responsibility; schema holds the ints).

There is **no** `CartItem` in the current schema; snapshot-at-add-to-cart applies when that model exists.

### 2.3 Append-only `OrderEvent`

Same intent as before: `Order.status` is a convenience; events are the audit trail. Enum values are in `schema.prisma` (`OrderEventType`).

### 2.4 Soft deletes

`Product` and `ProductVariant` use `deletedAt`; queries must filter active rows. See `docs/AGENTS.md`.

### 2.5 Shipping and splits

`Order.shippingAmount` is passthrough; split math uses **`productSubtotal`** only (`docs/AGENTS.md`, `@joe-perks/stripe` when implemented).

---

## 3. Indexes (as implemented)

The live schema defines the indexes below. Additional composite indexes (e.g. `Order [roasterId, status]` for queues) may be added in a follow-up migration when query patterns are fixed.

| Location | Definition |
| :--- | :--- |
| `User` | `roasterId`, `orgId` |
| `RoasterShippingRate` | `roasterId` |
| `RoasterDebt` | `roasterId`, `orderId` |
| `RoasterOrgRequest` | `roasterId`; unique `(applicationId, roasterId)` |
| `Product` | `roasterId`, `deletedAt` |
| `ProductVariant` | `productId`, `deletedAt` |
| `Campaign` | `orgId` |
| `CampaignItem` | `campaignId`; unique `(campaignId, variantId)` |
| `Order` | `campaignId`, `roasterId`, `buyerId`, `buyerEmail + orderNumber` |
| `OrderItem` | `orderId` |
| `OrderEvent` | `orderId` |
| `MagicLink` | `token` (unique + index) |
| `EmailLog` | unique `(entityType, entityId, template)`; `entityId` |

---

## 4. Prisma schema file (canonical)

- **Path:** `packages/db/prisma/schema.prisma`
- **Prisma version:** 7.x (see `packages/db/package.json`)
- **Datasource URL:** `packages/db/prisma.config.ts` + `load-env.ts` / `DATABASE_URL` (and optional `.env.production` for production tooling — `docs/AGENTS.md`)
- **Client output:** `packages/db/generated/`

Commands (from repo root):

```bash
pnpm migrate                 # dev: format, generate, migrate dev
pnpm migrate:deploy          # apply existing migrations
pnpm migrate:deploy:prod     # production Neon — needs packages/db/.env.production
cd packages/db && bunx prisma db seed
pnpm db:smoke                # sanity check singletons + migrations
```

Do **not** copy an embedded “full schema” from this document — edit **`schema.prisma`** and generate a migration.

---

## 5. Drizzle ORM

No Drizzle schema ships in this repo today. The table in older versions of this file was illustrative only. If you add Drizzle, mirror **`packages/db/prisma/schema.prisma`** and migrations, or generate from introspection.

---

## 6. Split calculation reference

Canonical implementation target: **`packages/stripe/splits.ts`** (`calculateSplits`). Rules: `docs/AGENTS.md`. This Markdown file does not duplicate fee formulas.

---

## 7. Seed and order numbers

**Seed** (`packages/db/seed.ts`): upserts `PlatformSettings` (`id: "singleton"`) and `OrderSequence` (`id: "singleton"`, `nextVal: 0`).

**Order numbers** (`packages/db/order-number.ts`): raw SQL increments `"OrderSequence"."nextVal"` and formats `JP-00001`, etc. Column names in PostgreSQL match Prisma’s camelCase mapping.

---

## 8. Changelog

| Doc version | Notes |
| :--- | :--- |
| 1.0 | Original long-form reference (Prisma 5–style embedded schema, extra models). |
| 1.1 | Aligned with **`packages/db/prisma/schema.prisma`** as of Story 01; removed obsolete embedded DDL; documented gaps vs legacy doc. |
| 1.2 | Sprint 7 foundation: added `Order` buyer/shipping snapshots, `Buyer.lastSignInAt`, and `BUYER_AUTH` support in the live Prisma schema. |

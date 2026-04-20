# Database Schema Reconciliation Note

**Date**: 2026-04-19 / 2026-04-20  
**Purpose**: Preserve the DB investigation findings that affected launch-readiness checks and frontend E2E setup.

---

## Summary

During Vercel production bring-up, the admin app initially failed because:

1. `ADMIN_EMAIL` / `ADMIN_PASSWORD` were missing in Vercel production.
2. `DATABASE_URL` was missing in Vercel production.
3. After `DATABASE_URL` was restored, production Prisma migrations were behind and had to be applied.

Once those env vars and migrations were fixed, `admin.joeperks.com` rendered successfully.

The follow-up investigation found a second source of confusion:

- **Production Neon** matched the current repo schema and committed Prisma migrations.
- **Dev Neon** contained additional applied migrations and extra schema that were **not** present in the current repo checkout.

---

## Canonical source of truth

Treat the following as canonical unless intentionally superseded in git:

- `packages/db/prisma/schema.prisma`
- `packages/db/prisma/migrations/*`

If a database disagrees with those files, the database is considered drifted until proven otherwise.

---

## What was verified

### Production

- Vercel production apps were aligned to the same production `DATABASE_URL`.
- `prisma migrate status` reported production was up to date after `prisma migrate deploy`.
- `prisma migrate diff` from production to the current Prisma schema was empty.
- Core production tables were structurally correct but empty, which is acceptable for seeding/E2E setup.

### Dev

- Dev Neon contained data (`User`, `Roaster`, `Org`, `Order`) that production did not.
- Dev Neon also had **two applied migrations** that were missing from the current repo checkout:
  - `20260405134350_buyer_account_foundation`
  - `20260406032052_sprint8_fulfillment_schema_event_alignment`

Those migration names existed in historical commits:

- `03943f3` — buyer account foundation
- `472749d` — sprint 8 fulfillment schema alignment

This explains how dev could be ahead of the current checkout without implying another active codebase.

---

## Dev-only drift that was observed

Examples found in dev but not in the current repo schema:

- `Buyer.lastSignInAt`
- `Order.buyerEmail`
- `Order.shipToAddress1`
- `Order.shipToAddress2`
- `Order.shipToCity`
- `Order.shipToCountry`
- `Order.shipToName`
- `Order.shipToPostalCode`
- `Order.shipToState`
- `Order.adminAcknowledgedFlag`
- `Order.flagNote`
- `Order.flagReason`
- `Order.flagResolvedAt`
- `Order.flaggedAt`
- `Order.fulfillmentNote`
- `Order.resolutionOffered`

Enum values present in dev but not in the current repo schema included:

- `MagicLinkPurpose.BUYER_AUTH`
- `OrderEventType.ORDER_FLAGGED`
- `OrderEventType.FLAG_RESOLVED`
- `OrderEventType.MAGIC_LINK_RESENT`
- `OrderEventType.TRACKING_UPDATED`

At the time of investigation, those extras were **not referenced by the current checked-out codebase**.

---

## Practical guidance

Before frontend testing, seeding, or production restore work:

1. Compare `_prisma_migrations` between the target databases.
2. Confirm the target DB matches the current repo schema.
3. Seed from the current repo's scripts and assumptions.
4. Do not copy raw rows from a more-populated database unless its schema is also confirmed to match the repo.

If dev data is needed later, first decide whether the missing historical migrations should be intentionally restored to the repo. Do not silently treat dev drift as canonical.

---

## Why this note exists

This issue can look like:

- "prod is wrong because it is empty"
- "dev is right because it has data"
- "the migrations removed data"

The investigation showed the actual situation was subtler:

- prod was structurally correct for the current repo
- dev had older applied schema changes that no longer exist in the current checkout

Keep this note handy during launch checks and frontend E2E so future debugging starts from evidence instead of assumptions.

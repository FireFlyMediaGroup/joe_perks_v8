# US-09-00 — Buyer Account Foundation: Schema, Shipping Snapshots, Auth/Env Prep

**Story ID:** US-09-00 | **Epic:** EP-09 (Buyer Accounts)
**Points:** 5 | **Priority:** High
**Status:** `Todo`
**Owner:** Full-stack
**Dependencies:** US-01-02, US-04-03
**Depends on this:** US-09-01, US-09-02, US-09-03, US-09-04, US-09-06

---

## Goal

Create the minimum data-model and environment foundation required for buyer accounts without overreaching into later-scope payment-method, marketing, or profile features. This story adds immutable shipping/contact snapshots to `Order`, adds the buyer-auth magic-link purpose, establishes guest lookup support, and prepares secure session env config for the buyer account surface.

---

## Planning baseline

Read first:

- [`docs/sprint-7/buyer-accounts-epic-v3.md`](../buyer-accounts-epic-v3.md)
- [`docs/sprint-7/README.md`](../README.md)

Normalized decisions this story implements:

- Shipping/contact snapshots live on `Order`
- Guest lookup uses `Order.buyerEmail` + `Order.orderNumber`
- Buyer auth uses a new `BUYER_AUTH` magic-link purpose
- Buyer session env prep belongs in Sprint 7 foundation

---

## Current repo evidence

- `packages/db/prisma/schema.prisma` currently defines a minimal `Buyer` model and an `Order` model without shipping/contact snapshot fields.
- `apps/web/app/api/checkout/create-intent/route.ts` already receives buyer contact and shipping inputs, but only persists `buyerId` and order financial fields.
- `apps/web/app/[locale]/[slug]/checkout/_components/step-shipping.tsx` and `_lib/schema.ts` already collect:
  - `buyerName`
  - `buyerEmail`
  - `street`
  - `city`
  - `state`
  - `zip`
  - `shippingRateId`
- `.env.example` currently lacks buyer-session env configuration.

---

## In scope

### Schema

- Add immutable buyer/shipping snapshot fields to `Order`
- Add `BUYER_AUTH` to `MagicLinkPurpose`
- Add any minimum buyer-account metadata fields required by later stories
- Add guest-lookup-supporting index(es)

### Checkout persistence

- Persist buyer email snapshot on `Order`
- Persist shipping/contact snapshot fields on `Order`
- Keep the current `Buyer` upsert flow intact

### Env prep

- Add `SESSION_SECRET` to `.env.example`
- Document its purpose and minimum security expectations

---

## Out of scope

- Buyer sign-in UI
- Session-cookie creation or redemption logic
- Newsletter opt-in
- Saved payment methods
- Buyer profile editing
- Billing portal
- Account deletion

---

## Primary files to create or modify

| Action | File | Purpose |
|--------|------|---------|
| Modify | `packages/db/prisma/schema.prisma` | Add shipping/contact snapshot fields and `BUYER_AUTH` |
| Create | Prisma migration under `packages/db/prisma/migrations/` | Persist schema changes |
| Modify | `apps/web/app/api/checkout/create-intent/route.ts` | Persist shipping snapshots when creating the order |
| Modify | `.env.example` | Add `SESSION_SECRET` and any Sprint 7 foundation env guidance |
| Modify | `docs/06-database-schema.mermaid` | Keep ERD aligned if schema changes |
| Modify | `docs/04-order-lifecycle.mermaid` | Align order creation timing and new buyer snapshot behavior if needed |

---

## Acceptance criteria

- [ ] `Order` includes immutable buyer/shipping snapshot fields sufficient for:
  - buyer order history/detail display
  - guest order lookup
  - future checkout prefill
- [ ] `Order` stores `buyerEmail` as a snapshot separate from `Buyer`
- [ ] `MagicLinkPurpose` includes `BUYER_AUTH`
- [ ] Guest lookup support is modeled at the schema level
- [ ] `.env.example` includes `SESSION_SECRET` with a clear note about secure use
- [ ] `create-intent` persists shipping/contact snapshots on order creation
- [ ] Existing guest checkout and order confirmation flow still work after schema changes
- [ ] No new logs expose buyer PII
- [ ] Prisma client is regenerated successfully

---

## Recommended field set

Unless implementation constraints require a minor adjustment, the order snapshot fields should include:

- `buyerEmail`
- `shipToName`
- `shipToAddress1`
- `shipToAddress2`
- `shipToCity`
- `shipToState`
- `shipToPostalCode`
- `shipToCountry`

Why:

- Historical orders must remain accurate even if buyer profile data later changes.
- Guest lookup should not depend on `Buyer` joins for the primary path.
- Buyer account order detail and future checkout prefill need stable order-level snapshots.

---

## AGENTS.md and CONVENTIONS.md rules that apply

- **Money as cents:** Shipping/contact additions must not disturb existing financial field handling.
- **Split calculations:** Persist shipping snapshots without changing existing split logic.
- **Logging/PII:** Do not log shipping addresses, raw emails, or request bodies.
- **API route pattern:** `create-intent` remains the canonical order-creation route; validate and persist only server-side.

---

## Suggested implementation steps

1. Update `schema.prisma`:
   - Add `Order` snapshot fields
   - Add `BUYER_AUTH` to `MagicLinkPurpose`
   - Add any needed index for guest lookup
2. Generate a migration and Prisma client.
3. Update `create-intent`:
   - Parse and persist shipping/contact snapshot fields
   - Keep `Buyer` upsert behavior intact
4. Update `.env.example`:
   - Add `SESSION_SECRET`
   - Document minimum expectations (long random secret; not committed with real value)
5. Update relevant diagrams/docs if implementation changes the documented flow.

---

## QA and verification

- [ ] Checkout still creates an order successfully
- [ ] New order row contains shipping/contact snapshots
- [ ] Buyer order confirmation still renders using the current route
- [ ] No TypeScript or Prisma schema errors remain
- [ ] No unexpected change to existing order financial behavior

---

## Handoff notes

- This story is the blocker story for Sprint 7. Do not start US-09-01 or any buyer-facing route work before these schema decisions land.
- Keep this story focused on foundation only. Do not sneak in saved-card, newsletter, or profile work.
- If implementation reveals a naming mismatch in the schema, update Sprint 7 docs in the same PR so later AI agents do not build against stale field names.

---

## Revision log

| Version | Date | Notes |
|---------|------|-------|
| 0.1 | 2026-04-05 | Initial Sprint 7 foundation story created from the normalized buyer-accounts sprint plan. |

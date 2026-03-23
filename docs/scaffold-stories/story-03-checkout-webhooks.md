# Story 03 — Checkout and Stripe Webhooks

**Story version:** 0.1  
**Status:** `Todo`  
**Owner:** Backend / web app  
**Depends on:** `story-01-db-foundation.md`, `story-02-stripe-core.md`

---

## Goal

Turn the current placeholder payment routes into a working order-creation and Stripe webhook pipeline that uses the real database and shared Stripe package.

---

## Current repo evidence

The routes exist but are scaffold-only:

- `apps/web/app/api/checkout/create-intent/route.ts`
- `apps/web/app/api/order-status/route.ts`
- `apps/web/app/api/webhooks/stripe/route.ts`

---

## Checklist alignment

- `docs/SCAFFOLD_CHECKLIST.md` — Stripe webhook sections, local Stripe CLI verification, database verification, production readiness checks
- `docs/SCAFFOLD_PROGRESS.md` — payments and order lifecycle backlog
- `docs/AGENTS.md` — no direct Stripe imports, idempotency via `StripeEvent`, frozen order snapshots, no PII logging

---

## In scope

- Create payment intent flow from `apps/web`
- Persist order and buyer data using the real schema
- Snapshot split math and org percentage at order creation time
- Verify Stripe webhook signatures
- Add event idempotency using `StripeEvent`
- Implement order status lookup behavior needed for post-checkout pages

---

## Out of scope

- Transfer / payout job automation
- Transactional email implementation details beyond the hook points needed for later stories
- Full storefront UX polish

---

## Primary files to change

- `apps/web/app/api/checkout/create-intent/route.ts`
- `apps/web/app/api/order-status/route.ts`
- `apps/web/app/api/webhooks/stripe/route.ts`
- related DB queries and helper code in `packages/db` / `packages/stripe`

---

## Acceptance criteria

- Checkout route creates or prepares an order using DB-backed data
- Split values are stored as immutable snapshot fields on the order
- Webhook route:
  - verifies signature
  - checks idempotency
  - records the Stripe event
  - updates order state appropriately
- No raw `req.body` or buyer PII is logged
- Stripe CLI can target `localhost:3000/api/webhooks/stripe` successfully in local development
- `docs/SCAFFOLD_PROGRESS.md` reflects that checkout/webhook scaffold is no longer a placeholder

---

## Suggested implementation steps

1. Finalize order and buyer persistence contract from the new schema.
2. Build checkout route using `@joe-perks/stripe`.
3. Implement order status route for the confirmation UI.
4. Implement webhook verification and idempotent processing.
5. Smoke-test with Stripe CLI.

---

## Handoff notes for the next story

Story 04 and Story 05 should plug into the order lifecycle established here instead of inventing a parallel event model.

---

## Revision log

| Version | Date | Notes |
|---|---|---|
| `0.1` | 2026-03-22 | Initial story created. |

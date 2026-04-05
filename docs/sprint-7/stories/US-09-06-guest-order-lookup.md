# US-09-06 — Guest Order Lookup with Direct-Link Tracking

**Story ID:** US-09-06 | **Epic:** EP-09 (Buyer Accounts)
**Points:** 3 | **Priority:** High
**Status:** `Done`
**Owner:** Full-stack
**Dependencies:** US-09-00, US-09-04
**Depends on this:** None

---

## Goal

Let buyers who do not want an account still look up an order using their email snapshot and order number, then see a simplified order/tracking view that uses the same direct-link tracking MVP.

---

## Planning baseline

Read first:

- [`docs/sprint-7/buyer-accounts-epic-v3.md`](../buyer-accounts-epic-v3.md)
- [`docs/sprint-7/README.md`](../README.md)
- [`docs/sprint-7/stories/US-09-04-buyer-order-detail-tracking.md`](./US-09-04-buyer-order-detail-tracking.md)

Normalized decisions this story implements:

- guest lookup uses `Order.buyerEmail` + `Order.orderNumber`
- lookup is rate limited
- tracking MVP remains direct-link only
- account creation CTA, if present, stays secondary and optional

---

## Current repo evidence

- `apps/web/app/[locale]/order-lookup/page.tsx` now renders the locale-aware guest lookup entry point.
- `apps/web/app/api/order-lookup/route.ts` now validates input, rate limits by request IP, and looks up orders by `Order.buyerEmail` + `Order.orderNumber`.
- The lookup result reuses the existing direct-link tracking/detail model built for `US-09-04`, while keeping buyer sign-in optional.

---

## In scope

- Locale-aware guest order-lookup page
- Lookup API route
- Generic not-found/error behavior
- Shared tracking/detail read model
- Secondary optional create-account CTA

---

## Out of scope

- Authentication requirements for lookup
- Billing or saved-card features
- Advanced tracking widgets
- Marketing preferences

---

## Primary files to create or modify

| Action | File | Purpose |
|--------|------|---------|
| Create | `apps/web/app/[locale]/order-lookup/page.tsx` | Guest lookup route |
| Create | `apps/web/app/api/order-lookup/route.ts` | Lookup API |
| Create/modify | shared buyer detail/tracking components/helpers | Reuse detail/tracking model where practical |

---

## Acceptance criteria

- [x] Locale-aware guest lookup page exists
- [x] Form accepts buyer email and order number
- [x] Lookup API uses order-level buyer email snapshot + order number
- [x] Lookup requests are rate limited
- [x] Failure message does not reveal which input was incorrect
- [x] Success result shows useful order/tracking information
- [x] Tracking behavior remains direct-link only
- [x] Optional create-account CTA remains clearly secondary

---

## UX / accessibility / mobile requirements

- [x] Lookup form is simple and calm for anxious buyers
- [x] Labels and error states are screen-reader friendly
- [x] Focus moves to result or error after submit
- [x] Mobile form remains usable at narrow widths
- [x] No raw sensitive data is placed unnecessarily in shareable URLs

---

## Suggested implementation steps

1. Create guest lookup page.
2. Create rate-limited lookup API.
3. Query by normalized buyer email snapshot + order number.
4. Reuse order detail/tracking read model where practical.
5. Add simple optional account CTA after successful lookup.

---

## QA and verification

- [x] Correct email + order number returns the expected order
- [x] Wrong combination returns a generic failure state
- [x] Rate limiting works
- [x] Mobile lookup form is usable
- [x] Result state is readable and does not depend on account context

Verification completed with:

- `pnpm exec vitest run "apps/web/lib/orders/guest-order-lookup.test.ts" "apps/web/app/[locale]/account/orders/[id]/_lib/order-detail.test.ts" "apps/web/app/api/order-lookup/route.test.ts"`
- `pnpm --filter web typecheck`
- Cursor lints on the touched `apps/web` and `packages/stripe` files

---

## Handoff notes

- Keep guest lookup low-friction and do not force account creation.
- Use the order snapshot email value, not a mutable buyer profile value.
- If any result-link behavior is added later, make sure it does not expose raw PII.

---

## Revision log

| Version | Date | Notes |
|---------|------|-------|
| 0.1 | 2026-04-05 | Initial guest order lookup story created from the normalized Sprint 7 plan. |
| 1.0 | 2026-04-05 | Completed with a locale-aware guest lookup page, rate-limited lookup API, shared direct-link tracking/detail reuse, and a secondary buyer sign-in CTA. |

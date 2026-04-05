# US-09-06 — Guest Order Lookup with Direct-Link Tracking

**Story ID:** US-09-06 | **Epic:** EP-09 (Buyer Accounts)
**Points:** 3 | **Priority:** High
**Status:** `Todo`
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

- There is currently no `/order-lookup` route in `apps/web`.
- There is currently no guest order lookup API.
- Sprint 7 foundation work is expected to add the order-level buyer email snapshot needed for lookup.

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

- [ ] Locale-aware guest lookup page exists
- [ ] Form accepts buyer email and order number
- [ ] Lookup API uses order-level buyer email snapshot + order number
- [ ] Lookup requests are rate limited
- [ ] Failure message does not reveal which input was incorrect
- [ ] Success result shows useful order/tracking information
- [ ] Tracking behavior remains direct-link only
- [ ] Optional create-account CTA remains clearly secondary

---

## UX / accessibility / mobile requirements

- [ ] Lookup form is simple and calm for anxious buyers
- [ ] Labels and error states are screen-reader friendly
- [ ] Focus moves to result or error after submit
- [ ] Mobile form remains usable at narrow widths
- [ ] No raw sensitive data is placed unnecessarily in shareable URLs

---

## Suggested implementation steps

1. Create guest lookup page.
2. Create rate-limited lookup API.
3. Query by normalized buyer email snapshot + order number.
4. Reuse order detail/tracking read model where practical.
5. Add simple optional account CTA after successful lookup.

---

## QA and verification

- [ ] Correct email + order number returns the expected order
- [ ] Wrong combination returns a generic failure state
- [ ] Rate limiting works
- [ ] Mobile lookup form is usable
- [ ] Result state is readable and does not depend on account context

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

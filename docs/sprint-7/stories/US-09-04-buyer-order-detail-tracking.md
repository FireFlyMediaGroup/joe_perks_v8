# US-09-04 — Buyer Order Detail and Tracking MVP

**Story ID:** US-09-04 | **Epic:** EP-09 (Buyer Accounts)
**Points:** 7 | **Priority:** High
**Status:** `Todo`
**Owner:** Full-stack
**Dependencies:** US-09-00, US-09-03
**Depends on this:** US-09-06

---

## Goal

Give signed-in buyers a clear order-detail page with historical item/totals/shipping snapshot data and a tracking MVP that uses direct carrier links and buyer-friendly order-state messaging.

---

## Planning baseline

Read first:

- [`docs/sprint-7/buyer-accounts-epic-v3.md`](../buyer-accounts-epic-v3.md)
- [`docs/sprint-7/README.md`](../README.md)
- [`docs/sprint-7/stories/US-09-03-buyer-dashboard-order-history.md`](./US-09-03-buyer-dashboard-order-history.md)

Normalized decisions this story implements:

- tracking MVP is direct-link only
- shipping/contact data comes from order snapshots
- historical display uses order snapshots, not mutable live product state

---

## Current repo evidence

- `apps/web/app/[locale]/[slug]/order/[pi_id]/page.tsx` shows a simple post-purchase summary today.
- There is no buyer account order-detail route yet.
- `OrderItem` already stores snapshot item fields suitable for historical detail display.
- `Order` already stores status, tracking number, carrier, `shippedAt`, and `deliveredAt`.

---

## In scope

- Locale-aware authenticated order-detail route
- Buyer ownership enforcement
- Item/totals snapshot display
- Shipping snapshot display
- Direct carrier-link tracking behavior
- Buyer-friendly order-state and delay/refund messaging

---

## Out of scope

- Embedded tracking widgets
- Live carrier API integrations
- Saved payment methods
- Reorder
- Self-service cancellation

---

## Primary files to create or modify

| Action | File | Purpose |
|--------|------|---------|
| Create | `apps/web/app/[locale]/account/orders/[id]/page.tsx` | Buyer order-detail route |
| Create | route-local `_components/` | Order detail sections, tracking summary, state messaging |
| Create/modify | shared formatting/helper files | Carrier link helpers and buyer-facing status labels |

---

## Acceptance criteria

- [ ] Locale-aware buyer order-detail route exists
- [ ] Unsigned buyer is redirected through sign-in
- [ ] Signed-in buyer can only access their own order
- [ ] Detail page uses `OrderItem` snapshot data for items and pricing
- [ ] Detail page uses `Order` shipping/contact snapshots for shipping display
- [ ] Tracking summary uses direct carrier-link behavior only
- [ ] State messaging is buyer-friendly for:
  - pending/confirmed
  - shipped
  - delivered
  - refunded
  - delayed
- [ ] Page remains useful even when tracking is not yet available

---

## UX / accessibility / mobile requirements

- [ ] Information hierarchy answers “What did I order?” and “Where is it?” quickly
- [ ] Direct tracking CTA is easy to tap on mobile
- [ ] No critical tracking information depends on animation
- [ ] Reduced-motion users are not forced through animated states
- [ ] Error and empty states are explicit and calm
- [ ] Breadcrumb/back navigation is simple on mobile

---

## Suggested implementation steps

1. Create authenticated order-detail route.
2. Enforce buyer ownership server-side.
3. Build snapshot-driven sections:
   - order status
   - items
   - totals
   - shipping contact/address
4. Add direct carrier-link helper logic.
5. Add buyer-friendly state copy for delayed/refunded/delivered variants.
6. Link dashboard cards into this route.

---

## QA and verification

- [ ] Buyer cannot access another buyer’s order
- [ ] Shipping snapshot values render correctly
- [ ] Carrier link is correct for supported carriers
- [ ] Mobile detail page remains readable without horizontal overflow
- [ ] Reduced Motion mode avoids unnecessary animation

---

## Handoff notes

- Keep this story tightly aligned to the direct-link tracking MVP. Do not add iframe/widget integrations here.
- If a visual stepper is introduced, it must still work well on mobile and degrade cleanly without motion.
- Any delay messaging should align with existing operational/SLA expectations already present elsewhere in the codebase.

---

## Revision log

| Version | Date | Notes |
|---------|------|-------|
| 0.1 | 2026-04-05 | Initial buyer order-detail/tracking story created from the normalized Sprint 7 plan. |

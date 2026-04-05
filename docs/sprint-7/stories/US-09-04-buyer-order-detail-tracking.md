# US-09-04 — Buyer Order Detail and Tracking MVP

**Story ID:** US-09-04 | **Epic:** EP-09 (Buyer Accounts)
**Points:** 7 | **Priority:** High
**Status:** `Done`
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

- `apps/web/app/[locale]/[slug]/order/[pi_id]/page.tsx` still handles post-purchase confirmation and create-account prompting.
- `apps/web/app/[locale]/account/orders/[id]/page.tsx` now exists as the protected buyer order-detail route.
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
| Create | `apps/web/app/[locale]/account/orders/[id]/_lib/queries.ts` | Buyer-owned order-detail read model |
| Create | `apps/web/app/[locale]/account/orders/[id]/_lib/order-detail.ts` | Buyer-facing tracking state and carrier-link helpers |
| Modify | `apps/web/app/[locale]/account/_components/order-history-list.tsx` | Link dashboard history cards into the detail route |

---

## Acceptance criteria

- [x] Locale-aware buyer order-detail route exists
- [x] Unsigned buyer is redirected through sign-in
- [x] Signed-in buyer can only access their own order
- [x] Detail page uses `OrderItem` snapshot data for items and pricing
- [x] Detail page uses `Order` shipping/contact snapshots for shipping display
- [x] Tracking summary uses direct carrier-link behavior only
- [x] State messaging is buyer-friendly for:
  - pending/confirmed
  - shipped
  - delivered
  - refunded
  - delayed
- [x] Page remains useful even when tracking is not yet available

---

## UX / accessibility / mobile requirements

- [x] Information hierarchy answers “What did I order?” and “Where is it?” quickly
- [x] Direct tracking CTA is easy to tap on mobile
- [x] No critical tracking information depends on animation
- [x] Reduced-motion users are not forced through animated states
- [x] Error and empty states are explicit and calm
- [x] Breadcrumb/back navigation is simple on mobile

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

- [x] Buyer cannot access another buyer’s order
- [x] Shipping snapshot values render correctly
- [x] Carrier link is correct for supported carriers
- [x] Mobile detail page remains readable without horizontal overflow
- [x] Reduced Motion mode avoids unnecessary animation

Verification run:

- `pnpm exec vitest run "apps/web/app/[locale]/account/orders/[id]/_lib/order-detail.test.ts" "apps/web/app/[locale]/account/_lib/dashboard.test.ts"`
- `pnpm --filter web typecheck`
- `NEXT_PUBLIC_APP_URL=http://localhost:3000 NEXT_PUBLIC_WEB_URL=http://localhost:3000 pnpm --filter web build`

Verification note:

- `pnpm check` still fails because of unrelated pre-existing diagnostics outside this story's files (for example under `apps/admin` and `scripts/vercel-sync-envs.mjs`). The touched Sprint 7 files were clean in editor lints, and the focused tests, typecheck, and `web` build passed.

Implementation notes:

- Added a protected `/{locale}/account/orders/[id]` page that reuses the signed buyer-session guard and returns `notFound()` when the order is missing or not owned by the signed-in buyer.
- Added buyer-facing tracking helpers for delayed/refunded/delivered messaging and direct carrier links for supported carriers, while keeping unsupported carriers readable without embedding third-party widgets.
- Linked the account dashboard history cards into the new detail route so the buyer can move from summary to full order detail in one tap.

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
| 1.0 | 2026-04-05 | Implemented the protected buyer order-detail route, snapshot-driven detail sections, direct carrier-link tracking helpers, delayed/refunded/delivered buyer messaging, and dashboard links into the new page. |

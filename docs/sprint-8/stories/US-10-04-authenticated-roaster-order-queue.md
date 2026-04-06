# US-10-04 — Authenticated Roaster Order Queue

**Story ID:** US-10-04 | **Epic:** EP-10 (Roaster Fulfillment)
**Points:** 5 | **Priority:** High
**Status:** `Done`
**Owner:** Full-stack
**Dependencies:** US-10-00, roaster auth baseline
**Depends on this:** US-10-05, US-10-06

---

## Goal

Turn the placeholder authenticated roaster dashboard into a real order-management surface so roasters can see what must ship, what has shipped, and what has been delivered without depending entirely on email.

---

## Planning baseline

Read first:

- [`docs/sprint-8/roaster-fulfillment-epic-v4.md`](../roaster-fulfillment-epic-v4.md)
- [`docs/sprint-8/roaster-fulfillment-preflight-decisions.md`](../roaster-fulfillment-preflight-decisions.md)

Normalized decisions this story implements:

- authenticated portal work uses server components plus server actions where needed
- portal queries scope through `requireRoasterId()`
- status and SLA vocabulary must match the live `Order` / `PlatformSettings` model

---

## Current repo evidence

- `apps/roaster/app/(authenticated)/dashboard/page.tsx` currently shows placeholder account/debug info, not an order queue.
- `apps/roaster/app/(authenticated)/products/_lib/require-roaster.ts` already provides the canonical `requireRoasterId()` helper.
- The live `Order` model already contains the fields needed to build a basic queue:
  - `status`
  - `fulfillBy`
  - `trackingNumber`
  - `carrier`
  - `shippedAt`
  - `deliveredAt`
- The token path already proves the order data model is usable for fulfillment.

---

## In scope

### Queue surface

- Replace the placeholder dashboard with a real order-management view
- Show at minimum:
  - `To ship`
  - `Shipped`
  - `Delivered`
  - `All`

### Data behavior

- Scope all reads by `session.roasterId`
- Order the `To ship` queue by `fulfillBy`
- Surface flagged unresolved orders as action-needed
- Use live payout/status vocabulary, not invented states

### Navigation

- Link rows into the portal order-detail route planned in US-10-05

---

## Out of scope

- Batch fulfillment
- Split fulfillment
- Advanced analytics dashboarding
- Payout ledger details (US-10-06)

---

## Primary files to create or modify

| Action | File | Purpose |
|--------|------|---------|
| Modify | `apps/roaster/app/(authenticated)/dashboard/page.tsx` | Replace placeholder dashboard |
| Create | route-local `_components/` | Queue list, tabs, summary cards, empty states |
| Create | route-local `_lib/queries.ts` or equivalent | Roaster-scoped dashboard read model |
| Create | route-local helpers for SLA labels | Map `fulfillBy` and live order state into UI copy |

---

## Acceptance criteria

- [x] Authenticated roasters see a real order-management view at the dashboard route
- [x] Unauthenticated access still follows the existing Clerk portal auth flow
- [x] All order queries scope by `session.roasterId`
- [x] `To ship` shows `CONFIRMED` orders ordered by `fulfillBy`
- [x] `Shipped` shows `SHIPPED` orders
- [x] `Delivered` shows `DELIVERED` orders
- [x] `All` shows the roaster's full order history
- [x] Flagged unresolved orders are surfaced with a clear action-needed indicator
- [x] Each row links to a detailed portal order view
- [x] The route uses `requireRoasterId()` or a shared equivalent for server-side tenant scoping

---

## UX / accessibility / mobile requirements

- [x] The default view answers “What needs to ship next?” quickly
- [x] The queue works well on mobile without requiring a desktop-only table
- [x] Empty states are explicit and calm
- [x] Status and SLA signals use text plus visual treatment, not color alone

---

## Suggested implementation steps

1. Replace the placeholder dashboard read model with roaster-scoped order queries.
2. Add queue tabs and row components.
3. Add derived SLA/action-needed labeling based on live order data.
4. Link each row into the portal detail route to be implemented in US-10-05.

---

## Required doc updates

- [x] target story doc
- [x] `docs/SPRINT_8_CHECKLIST.md`
- [x] `docs/SPRINT_8_PROGRESS.md`
- [x] `docs/sprint-8/README.md` because the route surface and next-story summary changed
- [x] `docs/01-project-structure.mermaid` when the dashboard surface becomes a real queue

---

## QA and verification

- [x] Roasters cannot see another roaster's orders
- [x] `To ship` ordering is correct by `fulfillBy`
- [x] Flagged unresolved orders appear with the intended action-needed state
- [x] Mobile layout remains usable without horizontal overflow
- [x] At minimum run:
  - targeted tests for query helpers / status labeling if added
  - `pnpm --filter roaster typecheck`
  - focused route verification for the dashboard page

---

## Handoff notes

- Keep the first version of the queue straightforward and operationally useful.
- Avoid overfitting the dashboard into analytics or payout reporting; those belong in later stories.

---

## Revision log

| Version | Date | Notes |
|---------|------|-------|
| 0.1 | 2026-04-05 | Initial EP-10 authenticated queue story created from the final fulfillment planning baseline. |
| 0.2 | 2026-04-05 | Tightened for execution with concrete points, tenant-scope criteria, and minimum verification expectations. |
| 0.3 | 2026-04-06 | Implemented the authenticated roaster order queue with roaster-scoped filters, action-needed flag visibility, mobile-first queue cards, and linked order handoff routes. |

# US-10-05 — Portal Order Detail, Fulfillment, and Tracking Correction

**Story ID:** US-10-05 | **Epic:** EP-10 (Roaster Fulfillment)
**Points:** 8 | **Priority:** High
**Status:** `Done`
**Owner:** Full-stack
**Dependencies:** US-10-00, US-10-01, US-10-04
**Depends on this:** none

---

## Goal

Add a signed-in roaster order-detail surface that mirrors the token fulfillment experience where appropriate, supports authenticated fulfillment for `CONFIRMED` orders, and allows portal-only post-ship tracking correction.

---

## Planning baseline

Read first:

- [`docs/sprint-8/roaster-fulfillment-epic-v4.md`](../roaster-fulfillment-epic-v4.md)
- [`docs/sprint-8/roaster-fulfillment-preflight-decisions.md`](../roaster-fulfillment-preflight-decisions.md)
- [`docs/sprint-8/stories/US-10-01-magic-link-fulfillment-page-enhancement.md`](./US-10-01-magic-link-fulfillment-page-enhancement.md)
- [`docs/sprint-8/stories/US-10-04-authenticated-roaster-order-queue.md`](./US-10-04-authenticated-roaster-order-queue.md)

Normalized decisions this story implements:

- portal mutations use server actions
- portal fulfillment follows the same order-state model as the token flow
- tracking correction is portal-only and writes `TRACKING_UPDATED`

---

## Current repo evidence

- `apps/roaster/app/(authenticated)/orders/[id]/page.tsx` currently exists only as a minimal authenticated handoff page.
- The token flow already proves the data model needed for order detail exists.
- `apps/admin/app/orders/[id]/_components/event-timeline.tsx` already shows that order events can be rendered as history, but its labels are admin-facing and based on current event names.
- The authenticated roaster dashboard already links queue rows into `orders/[id]`.

---

## In scope

### Portal order detail

- Add a tenant-safe authenticated order-detail route
- Show order data, shipping snapshot, item snapshots, payout snapshot, and event history

### Authenticated fulfillment

- Allow `CONFIRMED` orders to be fulfilled from the portal
- Reuse the same fulfillment form semantics as the token flow where practical

### Tracking correction

- Allow `SHIPPED` orders to update `trackingNumber` and/or `carrier`
- Log `TRACKING_UPDATED`
- Send a buyer tracking-update email using the shipped-email family

### Event history

- Show a roaster-facing event timeline based on the normalized labels from the epic

---

## Out of scope

- Magic-link-based portal access
- Batch fulfillment
- Split shipments
- Live carrier integrations

---

## Primary files to create or modify

| Action | File | Purpose |
|--------|------|---------|
| Modify | `apps/roaster/app/(authenticated)/orders/[id]/page.tsx` | Expand the handoff route into the authenticated order-detail surface |
| Create | route-local `_components/` | Detail sections, history, fulfillment/tracking forms |
| Create | route-local `_actions/` | Fulfill order and update tracking via server actions |
| Create | route-local `_lib/queries.ts` and helpers | Tenant-safe order detail read model |
| Create | `apps/roaster/app/_lib/order-shipping.ts` | Shared portal/token shipping and email helpers |
| Modify | `packages/email/templates/order-shipped.tsx` or related shipped-email logic | Support tracking-update wording |

---

## Acceptance criteria

- [x] Signed-in roasters can access a tenant-safe order-detail route
- [x] A roaster cannot view another roaster's order
- [x] `CONFIRMED` orders can be fulfilled in-portal using the same core behavior as the token flow
- [x] `SHIPPED` orders render a read-only shipped state by default
- [x] The portal allows tracking correction for `SHIPPED` orders only
- [x] Tracking correction writes `TRACKING_UPDATED`
- [x] The buyer receives a tracking-update email after a correction
- [x] The page shows a user-facing event history using live event names mapped to friendly labels
- [x] The page does not recalculate payout math; it uses the frozen order fields
- [x] Authenticated portal mutations are implemented as server actions scoped through `requireRoasterId()`

---

## UX / accessibility / mobile requirements

- [x] The portal detail should feel closely related to the token page, not like a separate product
- [x] The primary action on `CONFIRMED` orders is still fulfillment
- [x] Read-only shipped state is easy to scan
- [x] Tracking correction is clear but not overly prominent

---

## Suggested implementation steps

1. Create a tenant-safe `orders/[id]` route under the authenticated roaster app.
2. Build a server-side read model for detail display.
3. Reuse or extract fulfillment form logic from the token flow where practical.
4. Add a portal-only tracking-update server action that emits `TRACKING_UPDATED`.
5. Add the buyer tracking-update email wording.
6. Add a normalized event-history mapping for roaster-facing labels.

---

## Required doc updates

- [x] target story doc
- [x] `docs/SPRINT_8_CHECKLIST.md`
- [x] `docs/SPRINT_8_PROGRESS.md`
- [x] `docs/01-project-structure.mermaid` for the authenticated order-detail route
- [x] `docs/sprint-8/roaster-fulfillment-epic-v4.md` because the current repo alignment and portal detail semantics changed

---

## QA and verification

- [x] Roasters cannot view another roaster's order
- [x] In-portal fulfillment transitions `CONFIRMED -> SHIPPED`
- [x] Tracking correction updates the order and writes `TRACKING_UPDATED`
- [x] Buyer tracking-update email sends successfully when configured
- [x] Event history labels match the final epic mapping
- [x] At minimum run:
  - targeted tests for detail-query / tracking-update helpers if added
  - `pnpm --filter roaster typecheck`
  - focused verification for the authenticated route and server actions

---

## Handoff notes

- If a shared fulfillment component was extracted in US-10-01, reuse it here. If not, prefer shared form logic over prematurely extracting a heavy UI abstraction.
- Keep portal fulfillment and token fulfillment behavior aligned at the state/mutation level even if the surrounding layout differs.

---

## Revision log

| Version | Date | Notes |
|---------|------|-------|
| 0.1 | 2026-04-05 | Initial EP-10 portal-detail and tracking-correction story created from the final fulfillment planning baseline. |
| 0.2 | 2026-04-05 | Tightened for execution with concrete points, server-action scope rules, and minimum verification expectations. |
| 0.3 | 2026-04-06 | Implemented the authenticated roaster order-detail route, in-portal fulfillment, portal-only tracking correction, roaster-facing event history, and buyer tracking-update email handling. |

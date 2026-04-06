# US-10-05 — Portal Order Detail, Fulfillment, and Tracking Correction

**Story ID:** US-10-05 | **Epic:** EP-10 (Roaster Fulfillment)
**Points:** 8 | **Priority:** High
**Status:** `Todo`
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

- There is no authenticated roaster order-detail route yet.
- The token flow already proves the data model needed for order detail exists.
- `apps/admin/app/orders/[id]/_components/event-timeline.tsx` already shows that order events can be rendered as history, but its labels are admin-facing and based on current event names.
- The placeholder roaster dashboard route can link into a future `orders/[id]` route once created.

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
| Create | `apps/roaster/app/(authenticated)/orders/[id]/page.tsx` | Authenticated order-detail route |
| Create | route-local `_components/` | Detail sections, history, fulfillment/tracking forms |
| Create | route-local `_actions/` | Fulfill order and update tracking via server actions |
| Create | route-local `_lib/queries.ts` and helpers | Tenant-safe order detail read model |
| Modify | `packages/email/templates/order-shipped.tsx` or related shipped-email logic | Support tracking-update wording |

---

## Acceptance criteria

- [ ] Signed-in roasters can access a tenant-safe order-detail route
- [ ] A roaster cannot view another roaster's order
- [ ] `CONFIRMED` orders can be fulfilled in-portal using the same core behavior as the token flow
- [ ] `SHIPPED` orders render a read-only shipped state by default
- [ ] The portal allows tracking correction for `SHIPPED` orders only
- [ ] Tracking correction writes `TRACKING_UPDATED`
- [ ] The buyer receives a tracking-update email after a correction
- [ ] The page shows a user-facing event history using live event names mapped to friendly labels
- [ ] The page does not recalculate payout math; it uses the frozen order fields
- [ ] Authenticated portal mutations are implemented as server actions scoped through `requireRoasterId()`

---

## UX / accessibility / mobile requirements

- [ ] The portal detail should feel closely related to the token page, not like a separate product
- [ ] The primary action on `CONFIRMED` orders is still fulfillment
- [ ] Read-only shipped state is easy to scan
- [ ] Tracking correction is clear but not overly prominent

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

- [ ] target story doc
- [ ] `docs/SPRINT_8_CHECKLIST.md`
- [ ] `docs/SPRINT_8_PROGRESS.md`
- [ ] `docs/01-project-structure.mermaid` for the new authenticated order-detail route
- [ ] `docs/sprint-8/roaster-fulfillment-epic-v4.md` if event-label or tracking-update semantics change

---

## QA and verification

- [ ] Roasters cannot view another roaster's order
- [ ] In-portal fulfillment transitions `CONFIRMED -> SHIPPED`
- [ ] Tracking correction updates the order and writes `TRACKING_UPDATED`
- [ ] Buyer tracking-update email sends successfully when configured
- [ ] Event history labels match the final epic mapping
- [ ] At minimum run:
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

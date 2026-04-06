# US-10-02 — Structured "Can't Fulfill" Flow

**Story ID:** US-10-02 | **Epic:** EP-10 (Roaster Fulfillment)
**Points:** 8 | **Priority:** High
**Status:** `Todo`
**Owner:** Full-stack
**Dependencies:** US-10-00, US-10-01, admin orders baseline
**Depends on this:** US-10-05

---

## Goal

Give roasters a structured, supportive way to report that they cannot fulfill an order, and make that state visible in admin while explicitly pausing automated fulfillment-side SLA actions until the issue is resolved.

---

## Planning baseline

Read first:

- [`docs/sprint-8/roaster-fulfillment-epic-v4.md`](../roaster-fulfillment-epic-v4.md)
- [`docs/sprint-8/roaster-fulfillment-preflight-decisions.md`](../roaster-fulfillment-preflight-decisions.md)
- [`docs/sprint-8/roaster-fulfillmet`](../roaster-fulfillmet)

Normalized decisions this story implements:

- unresolved flags pause automated SLA actions, not just auto-refund
- admin acknowledgement alone does not silently resume the timer
- issue reporting is structured and explicit

---

## Current repo evidence

- The current token page has no "Can't fulfill" path.
- The live schema currently has no issue-reporting fields on `Order`.
- The live event model currently has no `ORDER_FLAGGED` or `FLAG_RESOLVED`.
- `apps/admin/app/orders/` already exists and already renders order status, details, and event history.
- `apps/web/lib/inngest/run-sla-check.tsx` currently processes unshipped `CONFIRMED` orders without any flag-aware branching.

---

## In scope

### Roaster issue reporting

- Add a "Can't fulfill this order" action to the token page
- Collect:
  - required issue reason
  - required resolution offer
  - optional roaster note
- Persist the issue state on `Order`
- Write `ORDER_FLAGGED`

### Admin visibility

- Surface flagged orders clearly in admin order list/detail
- Let admin acknowledge the issue
- Let admin explicitly resolve the issue
- Write `FLAG_RESOLVED` on resolution

### SLA behavior

- Pause automated roaster/buyer SLA automation while unresolved
- Keep the order visible for admin intervention

---

## Out of scope

- Automatic rerouting to another roaster
- Buyer-side self-service resolution
- Full refund workflow redesign
- Portal implementation of the same flow in this story (portal reuse can follow in US-10-05)

---

## Primary files to create or modify

| Action | File | Purpose |
|--------|------|---------|
| Modify | `apps/roaster/app/fulfill/[token]/page.tsx` | Add entry point to the issue flow |
| Create | route-local action/component files | Submit issue reports from the token page |
| Modify | `apps/web/lib/inngest/run-sla-check.tsx` | Skip unresolved flagged orders |
| Modify | `apps/admin/app/orders/page.tsx` and related components | Surface flag state in list/detail |
| Modify | `apps/admin/app/orders/[id]/page.tsx` and/or actions | Add admin acknowledge / resolve behavior |
| Modify | `packages/email/templates/...` or existing admin-alert templates | Send admin alert and any roaster confirmation email |

---

## Acceptance criteria

- [ ] The token page offers a "Can't fulfill this order" path
- [ ] The roaster must choose a reason
- [ ] The roaster must choose a resolution offer
- [ ] The roaster may include an optional note
- [ ] Submitting the issue:
  - stores the issue fields on `Order`
  - sets `flaggedAt`
  - resets `adminAcknowledgedFlag` to `false`
  - writes `ORDER_FLAGGED`
- [ ] Admin receives an alert email
- [ ] The roaster receives a confirmation state or confirmation email so they know the report was accepted
- [ ] Admin order surfaces clearly show unresolved flagged orders
- [ ] Admin can acknowledge a flag without resolving it
- [ ] Admin can explicitly resolve the flag, which writes `FLAG_RESOLVED`
- [ ] While unresolved, automated roaster reminder/urgent emails, buyer delay emails, and auto-refund handling do not continue against the order

---

## UX / copy requirements

- [ ] The issue-reporting flow uses supportive, non-punitive copy
- [ ] The roaster is told clearly that Joe Perks has been notified
- [ ] The post-submit confirmation makes it clear that no further action is required until follow-up
- [ ] The flow remains usable on mobile

---

## Suggested implementation steps

1. Land the schema/event support from US-10-00.
2. Add the issue-reporting UI and server action to the token route.
3. Update the SLA job to skip unresolved flagged orders.
4. Add clear admin list/detail visibility plus acknowledge/resolve actions.
5. Wire alert email and any roaster confirmation messaging.

---

## Required doc updates

- [ ] target story doc
- [ ] `docs/SPRINT_8_CHECKLIST.md`
- [ ] `docs/SPRINT_8_PROGRESS.md`
- [ ] `docs/sprint-8/roaster-fulfillment-epic-v4.md` if issue-field names or resolution semantics change
- [ ] `docs/04-order-lifecycle.mermaid` if issue-reporting changes the lifecycle
- [ ] `docs/08-order-state-machine.mermaid` if flagged/resolved state presentation changes

---

## QA and verification

- [ ] Reporting an issue writes the order fields and `ORDER_FLAGGED`
- [ ] Flagged orders surface in admin
- [ ] The SLA job skips unresolved flagged orders
- [ ] Resolution writes `FLAG_RESOLVED`
- [ ] Admin acknowledgement alone does not resume automated handling
- [ ] At minimum run:
  - targeted tests for flag submission / resolution / SLA filtering if added
  - `pnpm --filter roaster typecheck`
  - `pnpm --filter admin typecheck`
  - any focused checks needed for `apps/web/lib/inngest/run-sla-check.tsx`

---

## Handoff notes

- The key behavior in this story is not just collecting a reason; it is pausing automation safely until admin explicitly resolves the issue.
- If the implementation needs a small additional field to model unresolved vs resolved state cleanly, update the schema story and the epic in the same PR.

---

## Revision log

| Version | Date | Notes |
|---------|------|-------|
| 0.1 | 2026-04-05 | Initial EP-10 issue-reporting story created from the final fulfillment planning baseline. |
| 0.2 | 2026-04-05 | Tightened for execution with concrete points, clearer paused-SLA criteria, and minimum verification expectations. |

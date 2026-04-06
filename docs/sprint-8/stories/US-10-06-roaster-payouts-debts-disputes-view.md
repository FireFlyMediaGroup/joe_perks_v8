# US-10-06 — Roaster Payouts, Debts, and Disputes View

**Story ID:** US-10-06 | **Epic:** EP-10 (Roaster Fulfillment)
**Points:** 5 | **Priority:** High
**Status:** `Todo`
**Owner:** Full-stack
**Dependencies:** US-10-04, payout baseline
**Depends on this:** none

---

## Goal

Turn the placeholder roaster payouts page into a real operational finance view that gives roasters visibility into payout status, hold timing, transferred amounts, unresolved debt deductions, and disputes tied to their orders.

---

## Planning baseline

Read first:

- [`docs/sprint-8/roaster-fulfillment-epic-v4.md`](../roaster-fulfillment-epic-v4.md)
- [`docs/sprint-8/roaster-fulfillment-preflight-decisions.md`](../roaster-fulfillment-preflight-decisions.md)

Normalized decisions this story implements:

- payout UI vocabulary must map to the live `HELD -> TRANSFERRED / FAILED` model
- the page should be a roaster-scoped read model over existing payout/debt/dispute data

---

## Current repo evidence

- `apps/roaster/app/(authenticated)/payouts/page.tsx` is currently a placeholder.
- `apps/web/lib/inngest/run-payout-release.ts` already:
  - processes `DELIVERED` orders with `payoutStatus = HELD`
  - transfers roaster and org shares
  - settles `RoasterDebt` when appropriate
  - writes `PAYOUT_TRANSFERRED` and `PAYOUT_FAILED`
- The live schema already includes:
  - `Order.payoutStatus`
  - `Order.payoutEligibleAt`
  - `Order.stripeTransferId`
  - `Order.stripeOrgTransfer`
  - `RoasterDebt`
  - `DisputeRecord`

---

## In scope

### Payout status visibility

- Show hold-period, awaiting-release, transferred, and failed states using live data
- Show payout history for the signed-in roaster

### Debt visibility

- Show unsettled debts tied to the roaster
- Show when a payout was reduced or blocked by debt

### Dispute visibility

- Surface dispute rows tied to the roaster's orders
- Show attribution/outcome when present

### Summary UI

- Provide high-level cards or summaries for the roaster's finance state

---

## Out of scope

- Changing payout business logic
- Retrying failed transfers from the roaster portal
- Stripe dashboard deep-linking if not already available
- New dispute workflows for roasters to respond directly

---

## Primary files to create or modify

| Action | File | Purpose |
|--------|------|---------|
| Modify | `apps/roaster/app/(authenticated)/payouts/page.tsx` | Replace placeholder payouts page |
| Create | route-local `_components/` | Summary cards, payout history, debt/dispute sections |
| Create | route-local `_lib/queries.ts` or equivalent | Roaster-scoped payout/debt/dispute read model |

---

## Acceptance criteria

- [ ] Signed-in roasters can access a real payouts page
- [ ] All payout/debt/dispute queries scope by `session.roasterId`
- [ ] The page uses live payout vocabulary:
  - held + future eligible date = in hold period
  - held + past eligible date = awaiting release
  - transferred = paid
  - failed = transfer failed
- [ ] The page shows payout history for the roaster's orders
- [ ] The page shows unresolved `RoasterDebt`
- [ ] The page shows dispute records tied to the roaster's orders
- [ ] The page does not invent new payout states not present in the live implementation
- [ ] The route and all queries are scoped through `requireRoasterId()` or a shared equivalent

---

## UX / accessibility / mobile requirements

- [ ] Summary information is understandable without requiring Stripe knowledge
- [ ] Monetary values are displayed in full dollar-and-cents format
- [ ] Problem states are explicit without being alarmist
- [ ] The page remains readable on mobile

---

## Suggested implementation steps

1. Replace the placeholder payouts route with roaster-scoped read queries.
2. Add derived UI labels for `HELD`, `TRANSFERRED`, and `FAILED`.
3. Add debt and dispute sections using existing live models.
4. Add summary cards that surface the most important finance state at a glance.

---

## Required doc updates

- [ ] target story doc
- [ ] `docs/SPRINT_8_CHECKLIST.md`
- [ ] `docs/SPRINT_8_PROGRESS.md`
- [ ] `docs/01-project-structure.mermaid` if the payouts route structure changes materially
- [ ] `docs/sprint-8/roaster-fulfillment-epic-v4.md` if payout-label rules change

---

## QA and verification

- [ ] Roasters cannot see another roaster's payout/debt/dispute data
- [ ] Held orders display the correct derived UI state based on `payoutEligibleAt`
- [ ] Failed payout rows display clearly
- [ ] Debt and dispute sections match the live underlying records
- [ ] At minimum run:
  - targeted tests for payout/debt/dispute read-model helpers if added
  - `pnpm --filter roaster typecheck`
  - focused verification for the payouts route

---

## Handoff notes

- This story is a visibility story, not a payout-engine rewrite.
- If implementation reveals a useful missing index or read-model optimization, keep it tightly scoped and document it in the same PR.

---

## Revision log

| Version | Date | Notes |
|---------|------|-------|
| 0.1 | 2026-04-05 | Initial EP-10 payouts/debts/disputes story created from the final fulfillment planning baseline. |
| 0.2 | 2026-04-05 | Tightened for execution with concrete points, tenant-scope criteria, and minimum verification expectations. |

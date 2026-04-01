# US-06-01 -- Inngest Daily Payout Job: Find Eligible Orders and Create Stripe Transfers

**Story ID:** US-06-01 | **Epic:** EP-06 (Payouts & Financials)
**Points:** 8 | **Priority:** High
**Status:** `Todo`
**Owner:** Full-stack
**Dependencies:** US-05-03 (Delivery Confirmation), US-01-06 (Inngest Jobs)
**Depends on this:** None

---

## Goal

Verify and complete the existing Inngest `payout-release` job at `apps/web/lib/inngest/run-payout-release.ts` to ensure it correctly finds DELIVERED orders past their payout hold period, creates Stripe transfers for roaster and org shares, updates payout status, creates `OrderEvent(PAYOUT_TRANSFERRED)`, and handles edge cases (missing Stripe accounts, partial failures, RoasterDebt deductions). The job implementation already exists and is largely complete -- this story focuses on end-to-end verification, adding OrderEvent logging, and ensuring the full pipeline works with the DELIVERED orders produced by US-05-03.

---

## Diagram references

- **Order lifecycle:** [`docs/04-order-lifecycle.mermaid`](../../04-order-lifecycle.mermaid) -- Phase 5 (Automated Payout): query DELIVERED orders, `calculateRoasterPayout()` deduct RoasterDebts, roaster + org transfers, `Order.payout_status = TRANSFERRED`, `OrderEvent PAYOUT_TRANSFERRED`, `Campaign.total_raised += org_amount`, settle RoasterDebt rows
- **Stripe payment flow:** [`docs/07-stripe-payment-flow.mermaid`](../../07-stripe-payment-flow.mermaid) -- Transfer section: `stripe.transfers.create()` for roaster and org, `transfer_group = order.id`
- **Order state machine:** [`docs/08-order-state-machine.mermaid`](../../08-order-state-machine.mermaid) -- Payout status: `PAY_PENDING -> PAY_XFERRED` when payout job runs
- **Database ERD:** [`docs/06-database-schema.mermaid`](../../06-database-schema.mermaid) -- `Order`, `Roaster`, `Org`, `Campaign`, `RoasterDebt`

---

## Current repo evidence

- **`apps/web/lib/inngest/run-payout-release.ts`** -- Fully implemented:
  - `runPayoutRelease()` skips if Stripe not configured
  - Queries orders: `status: "DELIVERED"`, `payoutStatus: "HELD"`, `payoutEligibleAt: { lte: now }`, `stripeChargeId: { not: null }`, `stripeTransferId: null`
  - `payoutSingleOrder()`: checks roaster Connect ready, calls `transferToConnectedAccount()` for roaster amount (`roasterTotal`), then org amount if `orgAmount > 0` and org has Stripe account
  - On success: sets `stripeTransferId`, `stripeOrgTransfer`, `payoutStatus: "TRANSFERRED"`
  - On failure: sets `payoutStatus: "FAILED"`
  - Does NOT create `OrderEvent(PAYOUT_TRANSFERRED)` -- **gap to fill**
  - Does NOT deduct `RoasterDebt` -- **gap to fill** (diagram specifies `calculateRoasterPayout()` deducting unsettled debts)
  - Does NOT update `Campaign.totalRaised` -- **gap to fill** (diagram specifies incrementing by `org_amount`)
- **`apps/web/lib/inngest/functions.ts`** -- Registers `payout-release` as cron `0 9 * * *` (daily 09:00 UTC)
- **`packages/stripe/src/index.ts`** -- Exports `transferToConnectedAccount()`
- **`RoasterDebt` model** -- Has `roasterId`, `orderId`, `amount`, `reason` (DebtReason enum), `settled`, `settledAt`
- **`Campaign.totalRaised`** -- Denormalized field; currently incremented by webhook on order confirmation (Sprint 3). The diagram shows it should also be updated by the payout job (or the increment should move entirely to payout time).

---

## AGENTS.md rules that apply

- **Stripe:** Never import Stripe directly. Use `transferToConnectedAccount()` from `@joe-perks/stripe`. `transfer_group` must equal `order.id` on every transfer.
- **Money as cents:** All transfer amounts are integers in cents. `roasterTotal = roasterAmount + shippingAmount`.
- **OrderEvent:** Append-only. Create `PAYOUT_TRANSFERRED` with `actorType = SYSTEM`.
- **Error handling:** Background jobs capture to Sentry. Critical payment paths (transfers) let errors propagate for Inngest retry. Non-fatal errors (e.g., missing org Stripe account) log and continue.
- **Logging/PII:** Only log `order_id`, `transfer_id`. Never log amounts or account details.

**CONVENTIONS.md patterns:**
- Inngest function pattern: export runner function, register via `serve()` in API route
- Error handling: try/catch with Sentry for non-fatal, let propagate for retriable failures

---

## In scope

### Verify existing transfer logic

- Confirm `transferToConnectedAccount()` correctly uses `transfer_group = order.id`
- Confirm roaster transfer amount is `roasterTotal` (roaster_amount + shipping passthrough)
- Confirm org transfer amount is `orgAmount`
- Confirm `payoutStatus` transitions: `HELD -> TRANSFERRED` on success, `HELD -> FAILED` on error

### Add OrderEvent logging

- Create `OrderEvent(PAYOUT_TRANSFERRED)` after successful transfers with payload containing transfer IDs
- Create `OrderEvent(PAYOUT_FAILED)` on transfer failure with error details in payload

### Add RoasterDebt deduction (per lifecycle diagram)

- Before transferring to roaster, query unsettled `RoasterDebt` rows for this roaster
- Deduct total unsettled debt from `roasterTotal` for the net transfer amount
- Mark deducted `RoasterDebt` rows as `settled = true`, `settledAt = now()`
- If net amount is <= 0, skip roaster transfer but still process org transfer
- Log debt settlement details

### Verify Campaign.totalRaised handling

- The webhook already increments `totalRaised` by `orgAmount` at confirmation time. Verify this is correct behavior or if it should move to payout time per the diagram.
- Document the decision: if kept at confirmation time, add a code comment referencing the diagram discrepancy.

### Add smoke test script

- Create `packages/db/scripts/smoke-us-06-01-payout.ts` to verify the job logic with test data

---

## Out of scope

- Manual admin retry of failed payouts (Phase 2)
- Payout dashboard or reporting
- Roaster payout notification email
- Dispute-related payout holds (separate story)
- Changing the payout schedule (daily at 09:00 UTC is fixed for MVP)

---

## Primary files to create or modify

| Action | File | Purpose |
|--------|------|---------|
| Modify | `apps/web/lib/inngest/run-payout-release.ts` | Add OrderEvent logging, RoasterDebt deduction, verify transfer_group |
| Create | `packages/db/scripts/smoke-us-06-01-payout.ts` | Smoke test for payout logic verification |

---

## Acceptance criteria

- [ ] Payout job runs daily at 09:00 UTC via Inngest cron
- [ ] Job finds orders with `status = DELIVERED`, `payoutStatus = HELD`, `payoutEligibleAt <= now()`, and `stripeTransferId = null`
- [ ] Roaster transfer uses `roasterTotal` amount (roaster_amount + shipping passthrough)
- [ ] Org transfer uses `orgAmount` (skipped if org has no Stripe account)
- [ ] `transfer_group = order.id` on all transfers
- [ ] On success: `payoutStatus` set to `TRANSFERRED`, `stripeTransferId` and `stripeOrgTransfer` recorded
- [ ] On success: `OrderEvent(PAYOUT_TRANSFERRED)` created with transfer IDs in payload
- [ ] On roaster transfer failure: `payoutStatus` set to `FAILED`
- [ ] On roaster transfer failure: `OrderEvent(PAYOUT_FAILED)` created with error in payload
- [ ] Unsettled `RoasterDebt` amounts are deducted from roaster transfer
- [ ] Settled debts are marked `settled = true`, `settledAt = now()`
- [ ] If net roaster amount <= 0, roaster transfer is skipped (org transfer still proceeds)
- [ ] Job skips gracefully when Stripe is not configured
- [ ] Job handles orders individually (one failure does not block others)
- [ ] No PII logged -- only `order_id`, `transfer_id`, `debt_id`

---

## Suggested implementation steps

1. Add `OrderEvent` creation to `payoutSingleOrder()`:
   - After successful transfers: create `PAYOUT_TRANSFERRED` event
   - In catch blocks: create `PAYOUT_FAILED` event with error message
2. Add `RoasterDebt` deduction logic before roaster transfer:
   ```typescript
   const debts = await database.roasterDebt.findMany({
     where: { roasterId: roaster.id, settled: false },
   })
   const totalDebt = debts.reduce((sum, d) => sum + d.amount, 0)
   const netRoasterAmount = Math.max(0, order.roasterTotal - totalDebt)
   ```
3. After successful roaster transfer, settle debts:
   ```typescript
   if (debts.length > 0) {
     await database.roasterDebt.updateMany({
       where: { id: { in: debts.map(d => d.id) } },
       data: { settled: true, settledAt: new Date() },
     })
   }
   ```
4. Verify `transferToConnectedAccount` passes `transferGroup: order.id` (check `packages/stripe/src/payouts.ts`).
5. Review `Campaign.totalRaised` increment timing -- document decision with code comment.
6. Create smoke test script.
7. Test: create a DELIVERED order with `payoutEligibleAt` in the past, run the job manually, verify transfers, verify events, verify debt settlement.

---

## Handoff notes

- The payout job implementation is already solid for the happy path. The main gaps are OrderEvent logging and RoasterDebt deduction, both specified in the lifecycle diagram.
- The `Campaign.totalRaised` increment currently happens at order confirmation (webhook). The lifecycle diagram shows it at payout time. For MVP, keeping it at confirmation time is acceptable (it reflects pledged fundraiser contribution), but this should be documented.
- The payout job processes orders sequentially. For MVP volume this is fine; if scaling becomes an issue, consider parallel processing with concurrency limits.
- `transferToConnectedAccount` is in `packages/stripe/src/payouts.ts` -- verify it includes `transfer_group` in the Stripe API call.

---

## Revision log

| Version | Date | Notes |
|---------|------|-------|
| 0.1 | 2026-04-01 | Initial story created for Sprint 4 planning. |

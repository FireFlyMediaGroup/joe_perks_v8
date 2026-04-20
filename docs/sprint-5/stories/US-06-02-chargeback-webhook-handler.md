# US-06-02 -- Chargeback Webhook Handler with Fault Attribution and Debt Creation

**Story ID:** US-06-02 | **Epic:** EP-06 (Payments & Payouts)
**Points:** 8 | **Priority:** High
**Status:** `Done`
**Owner:** Full-stack
**Dependencies:** US-06-01 (Payout job), US-01-05 (Stripe checkout API)
**Depends on this:** None

---

## Goal

Handle `charge.dispute.created` and `charge.dispute.closed` webhook events so the platform can surface disputes immediately, track response deadlines, prepare evidence, and recover costs from roasters when fault attribution makes that appropriate.

---

## Diagram references

- **Stripe payment flow:** [`docs/07-stripe-payment-flow.mermaid`](../../07-stripe-payment-flow.mermaid) -- chargeback subgraph
- **Database ERD:** [`docs/06-database-schema.mermaid`](../../06-database-schema.mermaid) -- `DisputeRecord`, `Order`, `RoasterDebt`, `OrderEvent`
- **Order state machine:** [`docs/08-order-state-machine.mermaid`](../../08-order-state-machine.mermaid) -- refund / payout context around disputes

---

## Current repo evidence

- `packages/db/prisma/schema.prisma` already defines `DisputeRecord`, `FaultType`, `DisputeOutcome`, `RoasterDebt`, and dispute-related `OrderEventType` values `DISPUTE_OPENED` and `DISPUTE_CLOSED`.
- `apps/web/app/api/webhooks/stripe/route.ts` now handles `charge.dispute.created` and `charge.dispute.closed`, updates `DisputeRecord`, writes `DISPUTE_OPENED` / `DISPUTE_CLOSED`, and triggers roaster-fault recovery when the dispute closes lost.
- `apps/admin/app/disputes/page.tsx` now renders a real disputes review surface with fault attribution and evidence export.
- Sprint 4 already established the webhook idempotency pattern (`StripeEvent`) and payout/debt plumbing (`RoasterDebt`, `run-payout-release.ts`).
- Package A now provides `AdminActionLog` plus `logAdminAction()` for fault attribution, auto-suspension, and other high-risk admin dispute actions.
- `apps/web/lib/inngest/run-payout-release.ts` now skips open disputes and only resumes payout automatically for won / withdrawn disputes or lost disputes where the roaster is protected.

---

## In scope

- Handle `charge.dispute.created`
- Handle `charge.dispute.closed`
- Create or update `DisputeRecord`
- Add dispute timeline entries / audit events
- Support fault attribution in admin
- Create roaster debt when a lost dispute is roaster fault
- Show dispute state in admin detail/list surfaces

---

## Out of scope

- Full Stripe evidence-file upload automation unless explicitly chosen for Sprint 5
- A full dispute workflow engine beyond open/close tracking
- Cancelling historical orders due to suspension or dispute outcomes

---

## Primary files to create or modify

| Action | File | Purpose |
|--------|------|---------|
| Modify | `apps/web/app/api/webhooks/stripe/route.ts` | Add dispute event handling |
| Create / Modify | `apps/admin/app/disputes/page.tsx` and related components | Admin dispute visibility |
| Modify | `apps/admin/app/orders/[id]/page.tsx` and related components | Show dispute record and fault controls on order detail |
| Create | `packages/db/admin-action-log.ts` and related schema support | Audit fault attribution and auto-suspension |
| Modify | `packages/db/prisma/schema.prisma` | Add `AdminActionLog` and any minimal dispute-support fields needed for implementation |

---

## Acceptance criteria

- [x] `charge.dispute.created` creates a `DisputeRecord`, sets `respondBy`, creates `OrderEvent`, and surfaces the dispute in admin
- [x] `charge.dispute.closed` updates the dispute outcome and logs the closing event
- [x] Admin can set `faultAttribution` to `ROASTER`, `PLATFORM`, `BUYER_FRAUD`, or `UNCLEAR`
- [x] Lost roaster-fault disputes create the correct `RoasterDebt` entries and attempt transfer reversal when applicable
- [x] Platform-fault / buyer-fraud lost disputes do not penalize the roaster payout
- [x] The implementation preserves Stripe signature verification and `StripeEvent` idempotency

---

## Normalized implementation decisions

- Keep `DISPUTE_OPENED` for dispute creation and `DISPUTE_CLOSED` for final dispute resolution. Carry `outcome`, `faultAttribution`, Stripe dispute status, reversal outcome, and debt summary in event payloads rather than adding new event enums.
- Keep `DisputeRecord` as the system of record for active dispute state. Admin list/detail UI should derive red flags/countdowns from the relation instead of adding an `Order.isDisputed` field.
- Map debt rows onto the existing enum: use `DISPUTE_LOSS` for Stripe dispute fee and non-refundable Stripe processing fee; use `CHARGEBACK` for unrecovered principal or transfer-reversal shortfall if tracked separately.
- Treat evidence support as an admin helper/export flow in Sprint 5: compile order details, timeline, tracking, and buyer IP into a structured package for manual submission/review. Do not require automated Stripe evidence API submission in Sprint 5.
- Use `AdminActionLog` for admin-set fault attribution and other high-risk dispute actions.
- Keep the source-story 3-dispute threshold in Sprint 5: 3+ roaster-fault disputes in a trailing 90-day window auto-suspends the roaster, writes `AdminActionLog`, and notifies admin for follow-up.

---

## Suggested implementation steps

1. Add dispute event routing in the Stripe webhook.
2. Follow the normalized event/debt mapping above instead of introducing extra dispute enums by default.
3. Create a helper that loads `Order`, `OrderEvent`, tracking, and buyer IP for evidence/admin display.
4. Add admin UI to review disputes, set fault attribution, and view respond-by countdowns.
5. Wire lost-dispute debt creation and reversal attempts into the existing payout/debt model.

---

## Handoff notes

- Reuse Sprint 4 payout/debt patterns rather than inventing a second financial recovery path.
- Keep dispute-related logging free of PII.
- This story now assumes the normalized mapping documented here and in `docs/SPRINT_5_PROGRESS.md`.

---

## Revision log

| Version | Date | Notes |
|---------|------|-------|
| 0.1 | 2026-04-01 | Initial Sprint 5 story created from source planning doc and current repo review. |
| 0.2 | 2026-04-01 | Normalized to current schema: keep `DISPUTE_OPENED` / `DISPUTE_CLOSED`, use `DisputeRecord` as source of truth, and map debt creation onto existing `DebtReason` values. |
| 0.3 | 2026-04-01 | Package A landed: shared admin audit schema/helper now exists in the repo and this story status is now `Partial`. |
| 0.4 | 2026-04-01 | Implemented: webhook dispute open/close handling, admin disputes UI with fault attribution + evidence export, payout blocking for protected dispute states, roaster-fault debt recovery, and 3-dispute auto-suspension. |

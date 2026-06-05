# Fulfillment SLA is ship-by, and refunds are whole-order

**The fulfillment SLA measures time-to-ship, not time-to-deliver.** `fulfillBy` is set at order
confirmation (`confirmed + slaBreachHours`), the SLA clock runs only while the order is `CONFIRMED`,
and it stops the moment the roaster enters tracking (`SHIPPED`). A slow carrier never breaches the
SLA — only a slow roaster does. Lost-in-transit and post-delivery problems are handled via admin
action or disputes, not the SLA.

**Escalation is a configurable ladder, checked most-severe-first** by the hourly `runSlaCheck` job:
warning → breach → critical → auto-refund, with each threshold in `PlatformSettings.sla*Hours`. Each
tier emails the relevant parties and writes an `OrderEvent` (`SLA_WARNING`, `SLA_BREACH`, an
`SLA_CRITICAL` note). Only `CONFIRMED` + unshipped orders are scanned.

**Refunds are whole-order.** There are no partial or line-item refunds in v1. The refund surface is:

- **SLA auto-refund** — full refund when an order is still unshipped at `slaAutoRefundHours`. Sets
  `status = REFUNDED`, voids the payout, and (per the decision below) charges the roaster a debt for
  the order's Stripe fee, because the roaster's failure to ship caused the irrecoverable processing
  cost — consistent with the dispute loss-bearer policy ([ADR 0002](./0002-dispute-loss-bearer-policy.md)).
- **Manual refund (v1 scope)** — an admin may issue a **full** refund only on **pre-payout** orders
  (`payoutStatus = HELD`), so no transfer clawback is needed. Refunding an already-paid-out order is
  out of scope for v1 and goes through the dispute path (which reverses transfers).
- **Dispute-driven** — a lost dispute reverses transfers and bills the roaster per ADR 0002.

**Cancellation ≠ refund.** `CANCELLED` means the PaymentIntent never succeeded
(`PENDING → CANCELLED`); no money moved. `REFUNDED` means a completed payment was returned. A buyer
cannot cancel a confirmed order — the only exits from `CONFIRMED` are ship, refund, or dispute.

## Consequences — code gaps vs. current implementation

- **Roaster debt on auto-refund is not yet implemented.** `trySlaAutoRefund` in
  `apps/web/lib/inngest/run-sla-check.tsx` refunds and voids the payout but creates no `RoasterDebt`.
  Adding it needs a new `DebtReason` (e.g. `SLA_AUTO_REFUND`) — the enum currently has only
  `DISPUTE_LOSS`, `CHARGEBACK`, `MANUAL_ADJUSTMENT`, `PLATFORM_FEE`.
- **No manual-refund action exists.** `refundCharge()` is called only by the SLA job. A new admin
  action is required, gated to `payoutStatus = HELD` and full-amount only.
- **`payoutStatus = FAILED` is overloaded.** Refunds reuse `FAILED` to mean "no payout because the
  order was refunded," which is indistinguishable from "a transfer errored and needs retry."
  Dashboards that surface `FAILED` payouts for retry must exclude refunded orders, or a distinct
  voided/cancelled payout state should be added.

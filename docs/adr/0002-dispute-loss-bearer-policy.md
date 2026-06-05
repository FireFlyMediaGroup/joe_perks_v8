# Who bears a lost dispute is decided by admin fault attribution

When a buyer wins a card dispute (the order's dispute `outcome = LOST`), who absorbs the loss is
decided by the admin's `faultAttribution` on the `DisputeRecord`, not automatically:

- **ROASTER fault** → the loss is charged back to the roaster. The payout job does not release the
  order, and `processLostRoasterFaultDispute` reverses any roaster transfer and records two
  `RoasterDebt` rows: a `CHARGEBACK` debt for the unrecovered roaster principal and a `DISPUTE_LOSS`
  debt for the dispute fee (`PlatformSettings.disputeFeeCents`) plus the order's **full** Stripe fee.
  The full Stripe fee is deliberate even though [ADR 0003](./0003-stripe-fee-shared-org-roaster.md)
  splits that fee with the org at sale time: on a roaster-fault loss the roaster makes the platform
  whole for the entire irrecoverable processing cost, since the org did not cause the fault. Do not
  "consistency-fix" this to the roaster's fee share only.
- **PLATFORM or BUYER_FRAUD fault** → the platform absorbs the loss and the roaster still gets paid;
  the payout job releases these orders normally. Buyer fraud is treated as a cost of doing business
  for the platform, not the roaster's fault.
- **UNCLEAR fault** → a deliberate triage state. The payout job neither releases the payout nor
  creates debt; funds stay `HELD` until an admin reclassifies the fault. There is intentionally **no**
  time-based auto-fallback in either direction — auto-releasing would let the platform silently eat
  genuine roaster-fault losses, and auto-charging would unfairly bill roasters for losses that were
  never theirs. Money waits for a human decision.

Two related guardrails ride on the same policy:

- **Auto-suspension.** A roaster with ≥ 3 ROASTER-fault dispute losses in a trailing 90 days is set to
  `SUSPENDED` (logged to `AdminActionLog`).
- **Debt netting is per-payout, all-or-nothing.** Outstanding unsettled debt is summed across the
  roaster and netted from a single order's payout. If that order's `roasterTotal` cannot cover the
  total debt, the payout is marked `FAILED` for manual resolution rather than partially settled.

## Why record this

The branches are non-obvious — a reader would not guess that buyer fraud falls on the platform, that
UNCLEAR holds funds indefinitely, or that debt recovery is all-or-nothing per payout. These are
roaster-trust and platform-margin trade-offs that should not be "simplified" without understanding
the intent. Thresholds (3 / 90 days, dispute fee) live in code/`PlatformSettings`, not here.

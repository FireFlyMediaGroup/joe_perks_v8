# The Stripe processing fee is shared by the org and roaster, not borne by the roaster alone

The Stripe processing fee (2.9% + 30¢ on the gross charge) is split between the **org** and the
**roaster** in proportion to their product-subtotal shares. The **platform is exempt** and keeps its
full fee. We chose proportional-to-share (over 50/50, over pulling the platform in, and over the
roaster bearing 100%) so each revenue-earning party carries processing cost in proportion to what it
earns, while the platform fee stays a clean, predictable amount.

**Allocation rule** (integer cents):

- `feeBaseOrg = orgAmount` (= round(productSubtotal × orgPct))
- `feeBaseRoaster = productSubtotal − orgAmount − platformAmount` (roaster's product share, excludes
  shipping)
- `orgFeeShare = round(stripeFee × feeBaseOrg / (feeBaseOrg + feeBaseRoaster))`
- `roasterFeeShare = stripeFee − orgFeeShare` (roaster absorbs the rounding remainder so the fee
  reconciles exactly)
- Org receives `orgAmount − orgFeeShare`; roaster receives
  `productSubtotal − orgAmount − platformAmount − roasterFeeShare`, plus shipping passthrough.

Worked example — product $100, shipping $10, org 15%, platform $5, Stripe fee $3.49: org bears
15/95 ≈ $0.55 (nets ≈ $14.45), roaster bears 80/95 ≈ $2.94. The shipping-derived portion of the fee
is included in the shared total but shipping itself is excluded from the proportion base.

## Consequences — code gap vs. current implementation

This is a **change** from the shipped code, which must be updated:

- `packages/stripe/src/splits.ts` currently computes
  `roasterAmount = productSubtotal − orgAmount − platformAmount − stripeFee` — the roaster bears the
  entire fee and the org bears none. `calculateSplits` must instead apportion `stripeFee` between org
  and roaster per the rule above and reduce `orgAmount` by `orgFeeShare`.
- `orgAmount` on `Order` now means the org's share **net of its fee portion**; `orgPctSnapshot`
  remains the gross percentage. Anything displaying "org raised X" must be clear about gross vs. net.
- Frozen split columns on existing orders were computed under the old rule; this applies to new
  orders from the change forward (splits are never recalculated).
- Dispute-loss math references `order.stripeFee` (the full fee). This stays intentional: a
  roaster-fault dispute-loss debt charges the **full** Stripe fee, not the roaster's share — see
  [ADR 0002](./0002-dispute-loss-bearer-policy.md). The roaster makes the platform whole for the
  irrecoverable processing cost on a fault it caused.

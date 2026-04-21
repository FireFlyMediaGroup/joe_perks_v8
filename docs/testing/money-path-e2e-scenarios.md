# Money-Path E2E Test Scenarios

**Purpose**: Close pre-mortem Tiger **LB-7** — "No E2E test covers the money path."
**Scope**: End-to-end validation of checkout → Stripe webhook → order creation → roaster fulfillment → split transfer → payout release.
**Owner**: Eng lead
**Gate**: Must be committed and running on every PR before v1 go-live.

**Related**
- Pre-mortem: [`../pre-mortems/2026-04-19-v1-launch.md`](../pre-mortems/2026-04-19-v1-launch.md)
- Split math: [`packages/stripe/src/splits.ts`](../../packages/stripe/src/splits.ts) + existing unit tests in [`packages/stripe/src/splits.test.ts`](../../packages/stripe/src/splits.test.ts)
- Payment flow diagram: [`07-stripe-payment-flow.mermaid`](../07-stripe-payment-flow.mermaid)
- Order state machine: [`08-order-state-machine.mermaid`](../08-order-state-machine.mermaid)
- Checkout route: [`apps/web/app/api/checkout/create-intent/route.ts`](../../apps/web/app/api/checkout/create-intent/route.ts)
- Webhook route: [`apps/web/app/api/webhooks/stripe/route.ts`](../../apps/web/app/api/webhooks/stripe/route.ts)
- Payout release job: [`apps/web/lib/inngest/run-payout-release.ts`](../../apps/web/lib/inngest/run-payout-release.ts)

---

## Test-stack recommendation

| Layer | Tool | Rationale |
|---|---|---|
| Unit (split math, helpers) | **vitest** (already in use) | Fast, matches repo convention. |
| Integration (API routes + Prisma) | **vitest** + ephemeral Neon branch | Real DB, real Stripe test mode, signed webhook deliveries. |
| E2E (browser) | **Playwright** | Multi-app navigation (web → roaster → admin), magic-link emails via Resend test inbox. |
| Stripe harness | **Stripe CLI `stripe listen`** in CI, or **`stripe.events.constructEvent`** with a fixture webhook body signed with `STRIPE_WEBHOOK_SECRET` | Deterministic webhook delivery without flake. |
| Email assertion | **Resend test mode** or a mock `sendEmail()` inbox | Assert transactional emails fire at every state transition. |

Run locally: `pnpm test:e2e` (to be added to root `package.json`). Until then, use the launch execution guide [`v1-launch-money-path-e2e-execution.md`](./v1-launch-money-path-e2e-execution.md) (`pnpm test`, `pnpm e2e:sprint3`, `pnpm test:e2e:frontend`, Stripe listen). That guide also records the currently passing sandbox results and the pre-production secret-rotation checklist. Run in CI: separate GH Actions workflow gated on `main` and PR merges.

---

## Happy-path scenarios

### Scenario MP-01 — Full v1 flow, single line item, minimum split

**Test Objective**: Validate the canonical money flow end-to-end: buyer checks out, Stripe charges, webhook creates order, roaster fulfills, payout releases after hold, split amounts are correct to the cent.

**Starting Conditions**
- Pilot roaster (`roaster-a`) approved with live-mode Stripe Connect account; KYC complete.
- Pilot org (`org-a`) with approved campaign `camp-1`, `orgPct = 0.05` (minimum).
- Roaster product: 1 × 12oz bag at **$18.00** retail. Shipping flat rate **$6.00**.
- `PlatformSettings.platformFeePct = 0.05`, `platformFeeFloorCents = 100`.
- Clerk auth working; `apps/web`, `apps/roaster`, `apps/admin` all reachable.
- Stripe in **test mode** with webhook endpoint registered at `/api/webhooks/stripe`.

**User Role**: End-to-end buyer → roaster → (passive) admin.

**Test Steps**
1. Buyer navigates to `https://preview.joeperks.com/<org-a>/<camp-1>` → campaign storefront renders with roaster-a's products.
2. Buyer adds 1 × 12oz bag to cart, proceeds to checkout → Stripe PaymentIntent created via `POST /api/checkout/create-intent`.
3. Buyer submits test card `4242 4242 4242 4242`, any future expiry, any CVC → Stripe confirms `payment_intent.succeeded`.
4. Webhook fires → `POST /api/webhooks/stripe` receives signed event → `Order` row created with `status = CONFIRMED`.
5. Roaster receives MagicLink email → clicks → lands on fulfillment page → sees shipping snapshot.
6. Roaster enters tracking `1Z999AA10123456784` (UPS), carrier `UPS`, marks `SHIPPED` → `OrderEvent(FULFILLED)` emitted.
7. System emits `TRACKING_UPDATED` email to buyer.
8. (Simulated) 5 days later → buyer webhook or cron flips order to `DELIVERED`.
9. (Simulated) Advance clock to **t + 30 days** → Inngest `payout-release` job runs → Stripe Connect transfer fires → roaster balance credited.

**Expected Outcomes**
- Exactly **one** `Order` row with `status = DELIVERED`, `orderNumber` non-null.
- `OrderEvent` log contains: `PAYMENT_RECEIVED`, `CONFIRMED`, `FULFILLED`, `TRACKING_UPDATED`, `DELIVERED`, `PAYOUT_RELEASED` — **in that order, no duplicates**.
- **Split amounts (integer cents)**:
  - `productSubtotalCents = 1800`, `shippingAmountCents = 600`, `grossAmount = 2400`
  - `stripeFee = round(2400 * 29/1000) + 30 = 70 + 30 = 100`
  - `orgAmount = 1800 * 0.05 = 90` (at floor of minimum org split)
  - `platformAmount = max(1800 * 0.05, 100) = 100` (floor wins over 90)
  - `roasterAmount = 1800 - 90 - 100 - 100 = 1510` (product share after fees)
  - `roasterTotal = 1510 + 600 = 2110` (product + shipping passthrough)
  - `90 + 100 + 1510 + 100 = 1800`; plus shipping `600` = gross `2400` ✓
- **Emails fired**: `OrderConfirmation` (buyer), `NewOrderAlert` (roaster), `MagicLinkFulfillment` (roaster), `OrderShipped + TrackingNumber` (buyer), `PayoutReleased` (roaster).
- Stripe Connect shows one transfer to `roaster-a` of `$21.10`; platform retains `$1.00`; org receives `$0.90` transfer.
- No `Order` or `OrderEvent` rows for any unrelated roaster/org.

---

### Scenario MP-02 — Multi-item cart, mid-tier org split, two variants

**Test Objective**: Exercise a realistic cart with multiple variants and a 15% org split (mid of allowed range).

**Starting Conditions**
- Same as MP-01 but campaign `camp-2` has `orgPct = 0.15`.
- Cart: 2 × 12oz bag @ $18.00, 1 × 5lb bag @ $62.00. Shipping `$9.50`.

**Expected Outcomes**
- `productSubtotalCents = 1800*2 + 6200 = 9800`, `shippingAmountCents = 950`, gross = `10750`.
- `stripeFee = round(10750*29/1000) + 30 = 312 + 30 = 342`.
- `orgAmount = round(9800 * 0.15) = 1470` (use the same rounding rule the code uses — **assert round-half-to-even or Math.round — test both**).
- `platformAmount = max(round(9800 * 0.05), 100) = 490`.
- `roasterAmount = 9800 - 1470 - 490 - 342 = 7498`.
- `roasterTotal = 7498 + 950 = 8448`.
- Invariant: `orgAmount + platformAmount + roasterAmount + stripeFee = productSubtotal` ✓

---

### Scenario MP-03 — Maximum org split boundary

**Test Objective**: Validate the 25% org split upper bound.

**Starting Conditions**: Same product as MP-01, `orgPct = 0.25`.

**Expected Outcomes**
- `orgAmount = 1800 * 0.25 = 450`, `platformAmount = 100` (floor), `roasterAmount = 1800 - 450 - 100 - 100 = 1150`, `roasterTotal = 1150 + 600 = 1750`.
- Order succeeds.

---

## Edge-case scenarios

### Scenario EC-01 — Org split below minimum rejects

**Objective**: Campaign with `orgPct = 0.04` (below `DEFAULT_ORG_PCT_MIN = 0.05`) must fail validation.
**Expected**: `calculateSplits()` throws `RangeError`; campaign save is rejected at the API layer; admin approval flow refuses to approve the campaign.

### Scenario EC-02 — Org split above maximum rejects

**Objective**: `orgPct = 0.26` must fail.
**Expected**: Same as EC-01 but on upper bound.

### Scenario EC-03 — Platform fee floor binds (very small order)

**Objective**: A $5 order has `5% * $5 = $0.25`, which is below the `$1.00` floor. Floor must win.
**Starting Conditions**: 1 product at $5.00 retail, $0 shipping, `orgPct = 0.05`.
**Expected**:
- `productSubtotalCents = 500`, `platformAmount = max(500 * 0.05, 100) = 100`.
- `orgAmount = 25`. **Critical**: `roasterAmount = 500 - 25 - 100 - stripeFee`. With $0 shipping, `stripeFee = round(500 * 29/1000) + 30 = 15 + 30 = 45`. → `roasterAmount = 500 - 25 - 100 - 45 = 330`.
- **Invariant check**: No roaster share should ever go negative. Assert.

### Scenario EC-04 — Roaster share would go negative (fee stack exceeds product)

**Objective**: Prove the system refuses orders where platform + org + Stripe fees exceed product subtotal.
**Starting Conditions**: Contrived — $1.00 product, `orgPct = 0.25`, `platformFeeFloor = $1.00`, Stripe fee ≈ $0.33 on $1 gross.
**Expected**: `calculateSplits()` throws; checkout endpoint returns **400 Bad Request**; no Stripe PaymentIntent created; no `Order` row.

### Scenario EC-05 — Shipping never enters org/platform base

**Objective**: Regression guard — shipping is passthrough to roaster, never included in split math.
**Starting Conditions**: $10 product, **$50 shipping** (oversized pallet).
**Expected**:
- `productSubtotalCents = 1000`, `shippingAmountCents = 5000`.
- `orgAmount = 50`, `platformAmount = 100`.
- Stripe fee on gross $60: `round(6000*29/1000) + 30 = 174 + 30 = 204`.
- `roasterAmount = 1000 - 50 - 100 - 204 = 646`. `roasterTotal = 646 + 5000 = 5646`.
- Diff check: doubling shipping changes `roasterTotal` and `stripeFee`, but **does not change** `orgAmount` or `platformAmount` beyond the stripe fee effect on roaster.

### Scenario EC-06 — Penny-rounding invariance (5.5% org on odd subtotal)

**Objective**: Surface rounding drift. Cents are integers; at boundary values, `Math.round` vs banker's rounding differ.
**Starting Conditions**: `productSubtotalCents = 333`, `orgPct = 0.055`.
**Expected**:
- Document the chosen rounding rule (`Math.round` per current `calculateStripeFeeCents`).
- Assert: `orgAmount + platformAmount + roasterAmount + stripeFee == productSubtotalCents` for every fixture. If not, the penny went somewhere — test fails.
- Parameterized test: sweep subtotals from 100c to 100_000c in steps of 1c at three org splits (5%, 15%, 25%). Every case must satisfy the invariant.

### Scenario EC-07 — Duplicate Stripe webhook (idempotency)

**Objective**: Stripe will retry webhooks on 5xx. The same `event.id` delivered twice must not create two orders or two payouts.
**Test Steps**: POST the same signed webhook body twice in < 1s.
**Expected**: Second delivery returns `200` but does not emit a duplicate `OrderEvent(PAYMENT_RECEIVED)` or a second `Order` row. Idempotency key: `stripeEventId UNIQUE` constraint or in-memory dedupe via Upstash.

### Scenario EC-08 — Out-of-order webhook delivery

**Objective**: `payment_intent.succeeded` arrives *after* `charge.refunded` (rare but possible on retries).
**Expected**: Order does not flip back to `CONFIRMED` after a refund is recorded. State machine rejects invalid transition; `OrderEvent(WEBHOOK_OUT_OF_ORDER)` logged.

### Scenario EC-09 — Invalid webhook signature

**Objective**: A webhook POST with a tampered body or wrong secret is rejected.
**Expected**: `/api/webhooks/stripe` returns `400`, no DB writes, Sentry event logged with `webhook_signature_invalid`.

### Scenario EC-10 — Missing `STRIPE_WEBHOOK_SECRET` env var

**Objective**: If the secret is not set in Vercel, the route must fail loudly on startup — not silently accept all requests.
**Expected**: Route returns `500`, Sentry alert, health check flips to `unhealthy`. Pre-deploy hook asserts env var presence (part of LB-5).

### Scenario EC-11 — Cross-tenant attempt (buyer switches `?orgId=` mid-checkout)

**Objective**: Regression guard for LB-2 tenant isolation.
**Starting Conditions**: Checkout session created for `org-a`. Before `confirm`, buyer crafts a request that references `org-b`'s campaign.
**Expected**: Checkout endpoint validates `orgId` server-side against the session cart; rejects the confirm with `403`. No order created under `org-b`.

### Scenario EC-12 — Refund after fulfillment, before delivery

**Objective**: Admin refund within the 30-day hold window.
**Test Steps**: Order in `SHIPPED` state. Admin issues full refund via admin portal.
**Expected**:
- Stripe `charge.refunded` webhook → `OrderEvent(REFUNDED)` → order status `REFUNDED`.
- `payout-release` job for this order is cancelled; no roaster payout fires at t+30d.
- Roaster sees order marked refunded in portal; shipping passthrough retained? **Decide & document** — current assumption: shipping refunded to buyer; roaster eats the carrier cost. (This is a product decision to confirm.)

### Scenario EC-13 — Partial refund (shipping-only)

**Objective**: Admin refunds $6 shipping only; product stands.
**Expected**: `stripeFee` recalculated? **No** — Stripe fee is sunk. Split reduces shipping passthrough, not org/platform. Invariant test.

### Scenario EC-14 — Dispute (chargeback) after payout

**Objective**: Buyer disputes *after* roaster payout has released.
**Test Steps**: Order delivered; payout released at t+30d; at t+45d Stripe `charge.dispute.created` webhook arrives.
**Expected**:
- `DisputeRecord` created.
- Admin notified.
- Roaster account balance goes negative by the disputed amount.
- Next payout is held until negative balance cleared. `OrderEvent(DISPUTE_OPENED)`.
- If roaster has no future orders, admin flags account for collection.

### Scenario EC-15 — Roaster Connect account disabled mid-order

**Objective**: Roaster's Stripe Connect account gets disabled (KYC lapsed) *between* order confirmation and payout release.
**Expected**: Payout release job detects disabled account → holds the payout → emits admin alert. Roaster is notified; order status remains `DELIVERED`.

### Scenario EC-16 — Buyer retries after declined card

**Objective**: First card declined (4000000000000002), buyer retries with valid card.
**Expected**: No duplicate `Order` rows. Only the successful PaymentIntent creates one. Rate limiter on `/api/checkout/create-intent` (Upstash) allows N retries within window.

### Scenario EC-17 — Idempotent checkout create-intent (same cart submitted twice)

**Objective**: Double-click on "Pay" button must not create two PaymentIntents.
**Expected**: Client idempotency key or server-side dedupe on `(cartId, userIp, 5min)`.

### Scenario EC-18 — Out-of-stock at webhook time

**Objective**: Product goes out of stock between checkout-create-intent and webhook.
**Expected**: Webhook creates order but emits `OrderEvent(INVENTORY_CONFLICT)`; admin notified; does **not** flip to `CONFIRMED`; eligible for full refund.

### Scenario EC-19 — Soft-deleted product in cart

**Objective**: Regression guard — a product soft-deleted mid-checkout should not be orderable.
**Expected**: `POST /api/checkout/create-intent` validates that all line-item products have `deletedAt: null`; rejects with `410 Gone`.

### Scenario EC-20 — Magic-link token replay / expiry

**Objective**: LB-7 adjacency with T-1. Expired token cannot be used.
**Test Steps**: Roaster receives fulfillment magic link; waits 8 days (token `expiresAt` = 7 days); clicks link.
**Expected**: Page renders expired state with "Request a new link" CTA. Token row marked consumed/expired. No fulfillment action allowed.

### Scenario EC-21 — SLA breach triggers escalation

**Objective**: Inngest `sla-check` job escalates correctly at 48h.
**Test Steps**: Create `CONFIRMED` order; freeze clock; advance to t+24h (warning) and t+48h (breach).
**Expected**:
- t+24h: `SLA_WARNING` email to roaster, `OrderEvent(SLA_WARNING)`.
- t+48h: `SLA_BREACH` email to admin and roaster; order flagged in admin queue; payout hold extended.
- If roaster flagged order as "cannot fulfill" before t+24h, SLA is paused (per Sprint 8); no email fires.

### Scenario EC-22 — Concurrent admin actions (race)

**Objective**: Two admins simultaneously approve and reject the same roaster.
**Expected**: DB-level constraint ensures only one state wins. Audit log records both attempts. UI shows stale-state error to the loser.

### Scenario EC-23 — Payout release on DST boundary

**Objective**: 30-day hold across a spring-forward or fall-back boundary computes correctly.
**Expected**: Use UTC throughout; assert `releaseAt - confirmedAt === 30 * 24 * 3600 * 1000 ms` regardless of local timezone.

### Scenario EC-24 — Currency / amount overflow

**Objective**: An order larger than the Stripe cap ($999,999.99) or with more line items than the schema allows must reject gracefully.
**Expected**: Schema-level max-line-items check; Stripe error mapped to a user-visible error; no partial order row.

---

## Invariants (assert on every scenario)

For any successful order, the money-path invariants must hold:

1. **Split integrity**: `orgAmount + platformAmount + roasterAmount + stripeFee = productSubtotalCents`.
2. **Gross integrity**: `productSubtotalCents + shippingAmountCents = grossAmountCents`.
3. **Non-negativity**: Every amount ≥ 0. `roasterAmount > 0` is a product rule (EC-04).
4. **Shipping passthrough**: `roasterTotal − roasterAmount = shippingAmountCents`.
5. **Platform floor**: `platformAmount ≥ platformFeeFloorCents` whenever `productSubtotalCents > 0`.
6. **Org bounds**: `orgPctMin ≤ orgPctSnapshot ≤ orgPctMax`.
7. **Event ordering**: `OrderEvent` timestamps monotonically non-decreasing for a given order.
8. **Event uniqueness**: No `OrderEvent` type repeats within an order except explicit multi-fire types (`TRACKING_UPDATED`).
9. **Payout idempotency**: Exactly one Stripe transfer per order per payout.
10. **Email-per-event contract**: Every `OrderEvent` of a registered type has a corresponding sent email (FF-3 ties here).

Implement invariants 1–6 as a reusable `assertSplitInvariants(result, input)` helper in `packages/stripe/src/splits.ts`. Unit-test the helper itself.

---

## CI Integration

- **Unit + integration**: `.github/workflows/ci.yml` — add step `pnpm test:e2e` after `pnpm check` and `pnpm turbo build`.
- **Browser E2E**: separate `.github/workflows/e2e.yml` — runs on PR and nightly on `main`. Requires `STRIPE_TEST_SECRET_KEY`, `STRIPE_TEST_WEBHOOK_SECRET`, `DATABASE_URL_TEST` (ephemeral Neon branch) in GH secrets.
- **Fail loudly**: any invariant violation or scenario failure fails the build. No skips.

---

## Non-goals

- Load testing — tracked separately under Elephant E-5 (Inngest under load).
- Security pen-test — tracked under launch runbook Phase 7.
- Accessibility — separate track.

---

*Last updated: 2026-04-19. Derived from pre-mortem LB-7. Update when schema or split rules change.*

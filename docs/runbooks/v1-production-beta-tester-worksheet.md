# v1 Production Beta Tester Worksheet

**Purpose**: a fillable worksheet for each pilot tester during the first production beta runs.

**Use this with**:
- [`./v1-launch-runbook.md`](./v1-launch-runbook.md)
- [`./v1-production-bootstrap-checklist.md`](./v1-production-bootstrap-checklist.md)
- [`../testing/v1-launch-money-path-e2e-execution.md`](../testing/v1-launch-money-path-e2e-execution.md)

## Important note for testers

This worksheet is for **production** testing, not sandbox.

If the platform is using:
- production Vercel domains
- live Stripe keys
- real payment cards

Then the checkout creates **real charges and real money movement workflows**.

That means:
- the card is really charged
- Stripe fees are real
- order records are real
- emails and fulfillment workflows are real
- payout/reconciliation workflows are real unless the order is refunded before payout release

Joe Perks does **not** handle raw card numbers directly. Stripe handles payment entry and processing, but the charge is still a real live-money transaction.

## One worksheet per tester

Copy this section for each pilot tester/order attempt.

---

## Tester profile

| Field | Value |
|---|---|
| Test date | |
| Tester name | |
| Tester email | |
| Tester phone | |
| Internal owner | |
| Roaster | |
| Org | |
| Campaign | |
| Storefront URL | |
| Expected order amount | |
| Refund planned after test? | Yes / No |

## Tester acknowledgement

- [ ] I understand this is a **production** test.
- [ ] I understand my card will be charged real money.
- [ ] I understand Joe Perks uses Stripe-hosted payment processing for checkout.
- [ ] I know who to contact if the test does not behave as expected.

Tester signature / confirmation: `__________________`

## Preflight checks (internal)

- [ ] Production bootstrap checklist is complete for this roaster/org/campaign.
- [ ] Roaster is `ACTIVE` and shipping is configured.
- [ ] Org is `ACTIVE`.
- [ ] Campaign is `ACTIVE`.
- [ ] Storefront renders correctly on production.
- [ ] Live Stripe webhook endpoint is healthy.
- [ ] Internal operator is watching logs / Stripe / DB during the run.
- [ ] Refund plan is decided before the tester starts.

## Tester steps

Mark each item during the live run.

### A. Storefront

- [ ] Storefront page loads.
- [ ] Campaign/org name is correct.
- [ ] Product list is visible.
- [ ] Pricing looks correct.
- [ ] Add to cart works.
- [ ] Cart total looks correct.

Notes:

`____________________________________________________________`

### B. Checkout

- [ ] Checkout page opens.
- [ ] Shipping form is understandable.
- [ ] Shipping rate selection appears.
- [ ] Stripe payment UI loads.
- [ ] Tester submits payment successfully.

Notes:

`____________________________________________________________`

### C. Immediate post-payment

- [ ] Order confirmation page appears.
- [ ] Order number is visible.
- [ ] Confirmation email arrives.
- [ ] No unexpected error message appears.

Notes:

`____________________________________________________________`

### D. Fulfillment follow-through

- [ ] Roaster can see the order.
- [ ] Fulfillment workflow can begin.
- [ ] Shipment/tracking workflow works if exercised.
- [ ] Buyer-facing follow-up email(s) arrive if exercised.

Notes:

`____________________________________________________________`

## Internal operator results

### Live payment verification

- [ ] Stripe charge visible
- [ ] Correct live PaymentIntent created
- [ ] Webhook delivered successfully
- [ ] `Order` row created
- [ ] `OrderEvent` rows created in expected order
- [ ] Amounts look correct

### Money-path verification

- [ ] Product subtotal is correct
- [ ] Shipping amount is correct
- [ ] Org/platform/roaster split snapshots are correct
- [ ] No duplicate order created
- [ ] No webhook retry/signature issue observed

### Operational verification

- [ ] Logs look healthy
- [ ] Emails sent as expected
- [ ] No cross-tenant issue observed
- [ ] No admin/manual intervention required

## Outcome

Choose one:

- [ ] PASS — acceptable for beta
- [ ] PASS WITH ISSUES — usable, but follow-up required
- [ ] FAIL — do not continue broader beta from this result

Summary:

`____________________________________________________________`

`____________________________________________________________`

## Refund / retention decision

- [ ] Refund immediately
- [ ] Keep charge as a real beta order
- [ ] Partial refund
- [ ] Other: `__________________`

Refund notes:

`____________________________________________________________`

## Issue log

| Severity | Issue | Where observed | Owner | Follow-up |
|---|---|---|---|---|
| | | | | |
| | | | | |
| | | | | |

## Sign-off

| Role | Name | Sign-off |
|---|---|---|
| Tester | | |
| Internal operator | | |
| Launch owner | | |

---

## Recommended usage

For the very first production beta:

1. Start with one internal/friendly tester.
2. Use the smallest practical live charge.
3. Watch the full money path in real time.
4. Refund immediately unless the order is intentionally being kept as a real pilot order.
5. Do not scale to more testers until this worksheet is clean enough to justify it.

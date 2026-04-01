# Sprint 4 Implementation Review

Date: 2026-04-01

Scope reviewed:
- `US-05-01` webhook fulfillment magic link
- `US-05-02` roaster fulfillment page
- `US-05-03` delivery confirmation + payout eligibility
- `US-06-01` payout release job
- `US-06-03` order event log helper + API
- `US-08-02` fulfillment notification email
- `US-08-03` shipped notification email
- `US-08-04` delivered impact email
- `US-08-05` SLA notification emails

Method:
- Read all Sprint 4 story docs in `docs/sprint-4/stories/`
- Reviewed the current implementation in `apps/web`, `apps/roaster`, `apps/admin`, `packages/db`, `packages/email`, and `packages/stripe`
- Compared the code to the story acceptance criteria, Sprint 4 README, and `docs/AGENTS.md`

## Overall Assessment

Sprint 4 is largely implemented and the main product flows are present end to end:
- Stripe webhook confirms orders, creates fulfillment magic links, and sends the roaster fulfillment email
- Roasters can open the magic link, review the order, submit tracking, and trigger the shipped email
- Admin can review orders and confirm delivery
- The payout release job, order event helper/API, delivered email, and SLA notifications are all present

The biggest remaining issues are not missing features, but correctness and operational resilience gaps in a few critical paths.

## Remediation Status

Follow-up implementation completed on 2026-04-01:

1. Review finding 1 fixed: webhook confirmation now uses a status-guarded transaction so the `PENDING -> CONFIRMED` side effects can commit only once under concurrency.
2. Review finding 2 fixed: payouts where roaster debt fully consumes the roaster leg now move to explicit manual resolution (`payoutStatus = FAILED`) instead of being marked fully transferred.
3. Review finding 3 fixed: admin delivery confirmation now records a stable admin actor ID on the `DELIVERED` event.
4. Review finding 4 fixed: the roaster fulfillment details view now renders the order date.
5. Review finding 5 fixed: fulfillment magic links now use a database-enforced deterministic dedupe key.
6. Review finding 6 fixed: admin orders navigation now includes a dedicated `Refunded` tab.
7. Review finding 7 fixed: SLA admin alert copy now uses the configured threshold hours rather than hardcoded tier labels.
8. Review finding 8 fixed: the payout smoke script now checks payout/event consistency and can optionally execute the live payout runner.
9. Review finding 9 fixed: admin UI and admin API now share normalized Basic Auth parsing and credential handling.

## Findings In Priority Order

### 1. High: `payment_intent.succeeded` is still vulnerable to concurrent double-processing

Stories affected:
- `US-05-01`
- `US-06-03`

Files:
- `apps/web/app/api/webhooks/stripe/route.ts`

What I found:
- `StripeEvent` dedupe is checked before processing, but the row is inserted only after the handler finishes
- `handlePaymentIntentSucceeded()` reads the order first, confirms it is `PENDING`, then performs the transaction
- The order update inside the transaction uses `where: { id: orderId }`, not a state-guarded write such as `where: { id: orderId, status: "PENDING" }`

Why this matters:
- Two concurrent deliveries of the same Stripe event can both pass the pre-check before the `StripeEvent` row exists
- In that race, both executions can confirm the order, insert `PAYMENT_SUCCEEDED` events, increment `Campaign.totalRaised`, and attempt downstream fulfillment work
- That means the implementation is not fully idempotent under concurrency, even though it is mostly safe for simple retries

Recommended fix:
- Make the business logic idempotent on its own, not just through `StripeEvent`
- Guard the order confirmation write by status in the transaction
- Consider reserving the `StripeEvent` row earlier with a unique insert pattern, or otherwise using a transaction/unique constraint strategy that prevents two handlers from committing the same transition

### 2. High: payout debt handling is incomplete when roaster debt is greater than or equal to the payout

Stories affected:
- `US-06-01`

Files:
- `apps/web/lib/inngest/run-payout-release.ts`

What I found:
- The code correctly calculates `netRoasterAmount = max(0, order.roasterTotal - totalDebt)`
- If `netRoasterAmount > 0`, it transfers the reduced amount and marks all unsettled debts as settled
- If `netRoasterAmount <= 0`, the roaster transfer is skipped, but the unsettled debts are left untouched
- The order is then still eligible to be marked `TRANSFERRED` after the org leg completes

Why this matters:
- The debt ledger and payout outcome can diverge
- Orders can end the payout flow with no roaster transfer, no debt settlement, and no representation of how much debt was actually applied
- Because the order is no longer `HELD`, the job will not revisit it automatically

Recommended fix:
- Decide and encode the intended accounting behavior for debt-heavy payouts
- If partial settlement is allowed, the model needs a way to track partially applied debt rather than only `settled: true/false`
- If partial settlement is not allowed, the job should not mark the payout fully complete until debt state is resolved explicitly

### 3. Medium: admin delivery confirmation does not record which admin performed the action

Stories affected:
- `US-05-03`

Files:
- `apps/admin/app/orders/_actions/confirm-delivery.ts`

What I found:
- The delivery event is written with `actorType: "ADMIN"`
- No `actorId` is recorded for the admin user

Why this matters:
- The story and `docs/AGENTS.md` both frame `OrderEvent` as an audit trail
- Without `actorId`, the timeline cannot identify who confirmed delivery

Recommended fix:
- Introduce a stable admin actor identifier for Basic Auth, or explicitly document the MVP limitation if individual admin attribution is not possible yet

### 4. Medium: the roaster fulfillment page does not show the order date from the story acceptance criteria

Stories affected:
- `US-05-02`

Files:
- `apps/roaster/app/fulfill/[token]/page.tsx`
- `apps/roaster/app/fulfill/[token]/_components/fulfillment-details.tsx`

What I found:
- The page shows order number, status, item details, totals, and payout breakdown
- It does not load or render the order creation date

Why this matters:
- The story explicitly calls for order number, order date, and status
- This is a direct acceptance-criteria miss, even though the rest of the fulfillment UI is solid

Recommended fix:
- Include `createdAt` in the order query and render it in `FulfillmentDetails`

### 5. Medium: fulfillment magic link creation is only application-level unique, not database-enforced unique

Stories affected:
- `US-05-01`

Files:
- `apps/web/app/api/webhooks/stripe/route.ts`
- `packages/db/prisma/schema.prisma`

What I found:
- `createFulfillmentMagicLink()` uses `findFirst()` on JSON payload plus `create()`
- There is no database constraint ensuring only one `ORDER_FULFILLMENT` link exists per order

Why this matters:
- Under normal retries, this is usually fine
- Under concurrent webhook execution, it leaves room for duplicate fulfillment links for the same order
- This compounds the webhook idempotency issue above

Recommended fix:
- Add a deterministic unique key for fulfillment links, or store the order ID in a dedicated indexed column that can be constrained uniquely for this purpose

### 6. Medium: admin orders UI supports refunded filtering in code, but not in the actual tab navigation

Stories affected:
- `US-05-03`

Files:
- `apps/admin/app/orders/page.tsx`
- `apps/admin/app/orders/_components/order-list.tsx`

What I found:
- `parseStatusFilter()` supports `REFUNDED`
- The rendered tab list only exposes `Shipped`, `Confirmed`, `Delivered`, and `All`

Why this matters:
- The story scope mentions additional filters including `REFUNDED`
- The underlying filtering logic exists, but the UI does not expose it cleanly

Recommended fix:
- Add a `Refunded` tab, or revise the story/docs to match the intended MVP scope

### 7. Low: SLA admin alert email hardcodes the 48h and 72h tier names even though thresholds are configurable

Stories affected:
- `US-08-05`

Files:
- `packages/email/templates/sla.tsx`

What I found:
- `SlaAdminAlertEmail` renders `"SLA breach (48h tier)"` and `"SLA critical (72h tier)"`
- Actual thresholds come from `PlatformSettings`

Why this matters:
- If settings change, the copy becomes inaccurate while the job logic remains correct

Recommended fix:
- Either make the template wording generic, or pass the active threshold values into the template

### 8. Low: the payout smoke script does not really verify the payout job end to end

Stories affected:
- `US-06-01`

Files:
- `packages/db/scripts/smoke-us-06-01-payout.ts`

What I found:
- The script checks whether eligible orders exist and whether any `PAYOUT_TRANSFERRED` events exist
- It does not create fixtures, invoke `runPayoutRelease()`, or verify debt handling, transfers, and event creation together

Why this matters:
- The story describes end-to-end verification, but the current script is closer to a data-shape sanity check

Recommended fix:
- Expand the smoke script or add a focused integration test that executes the payout runner against seeded data

### 9. Low: admin Basic Auth is implemented slightly differently in the admin app and the events API

Stories affected:
- `US-05-03`
- `US-06-03`

Files:
- `apps/admin/middleware.ts`
- `apps/web/lib/admin-basic-auth.ts`

What I found:
- The API helper trims `ADMIN_EMAIL` and `ADMIN_PASSWORD`
- The admin middleware compares the raw environment variable values

Why this matters:
- A stray space in env configuration could make the admin UI and the admin API disagree

Recommended fix:
- Normalize credential handling in one shared helper used by both surfaces

## Story-By-Story Confirmation

### `US-05-01`
Confirmed implemented in `apps/web/app/api/webhooks/stripe/route.ts`.

Delivered:
- Creates a fulfillment `MagicLink` with `ORDER_FULFILLMENT`
- Uses 72 hour TTL and 32-byte hex token
- Sends `magic_link_fulfillment` email to the roaster
- Builds fulfill URL from `ROASTER_APP_ORIGIN`

Gap:
- Idempotency is not strong enough under concurrent webhook execution

### `US-05-02`
Confirmed implemented in `apps/roaster/app/fulfill/[token]/`.

Delivered:
- Token validation and invalid/expired/used states
- `FULFILLMENT_VIEWED` event
- Tracking form and `SHIPPED` transition
- Magic link consumption before order update
- Shipped buyer email
- No buyer email/address shown on the page

Gap:
- Order date is missing from the UI

### `US-05-03`
Confirmed implemented in `apps/admin/app/orders/`.

Delivered:
- Orders list and detail pages
- Delivery confirmation flow
- `DELIVERED` transition
- `payoutEligibleAt` recalculation from `PlatformSettings`
- Delivered email send
- Event timeline support

Gaps:
- No admin `actorId` on delivery events
- `Refunded` filter is not exposed in the tab UI

### `US-06-01`
Confirmed implemented in `apps/web/lib/inngest/run-payout-release.ts` and related files.

Delivered:
- Daily payout cron registration
- Eligibility query for delivered + held orders
- Roaster and org transfer logic using `transfer_group = order.id`
- `PAYOUT_TRANSFERRED` and `PAYOUT_FAILED` events
- Roaster debt deduction attempt

Gap:
- Debt-heavy orders are not accounted for cleanly when net roaster payout is zero

### `US-06-03`
Confirmed implemented in `packages/db/log-event.ts`, `packages/db/index.ts`, and `apps/web/app/api/orders/[id]/events/route.ts`.

Delivered:
- `logOrderEvent()` helper
- Helper export from `@joe-perks/db`
- Admin-protected order events API
- Refactor of non-transactional event writes in SLA code

Note:
- This part of Sprint 4 is in good shape overall

### `US-08-02`
Confirmed implemented in `packages/email/templates/magic-link-fulfillment.tsx`.

Delivered:
- Branded fulfillment email
- CTA to the magic-link fulfill page
- Order/item summary
- 72 hour expiry notice

### `US-08-03`
Confirmed implemented in `packages/email/templates/order-shipped.tsx` and roaster tracking action.

Delivered:
- Buyer shipped email with order number, tracking number, carrier, and org context

### `US-08-04`
Confirmed implemented in `packages/email/templates/order-delivered.tsx` and admin delivery action.

Delivered:
- Delivered confirmation email
- Fundraiser impact messaging based on `Order.orgAmount`

### `US-08-05`
Confirmed implemented in `apps/web/lib/inngest/run-sla-check.tsx` and `packages/email/templates/sla.tsx`.

Delivered:
- Hourly SLA job
- Warning, breach, critical, and auto-refund flow
- Thresholds sourced from `PlatformSettings`
- Correct use of `sendEmail()` and order events for idempotency

Gap:
- Admin template copy assumes fixed hour labels even though thresholds are configurable

## Recommended Next Steps

1. Add automated coverage around the payout runner and webhook confirmation paths if Sprint 4 follow-up continues beyond smoke/manual verification.
2. Revisit whether debt-heavy payouts should eventually support partial debt application instead of the current manual-resolution failure path.

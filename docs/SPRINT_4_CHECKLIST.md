# Joe Perks -- Sprint 4 Implementation Checklist

## Order fulfillment, payouts & notifications -- webhook magic links, roaster fulfillment page, delivery confirmation, payout job, order event log, transactional emails

**Version:** 1.0 | **Sprint:** 4 (Weeks 7-8) | **Points:** 46 | **Stories:** 9
**Audience:** AI coding agents, developers implementing Sprint 4 stories
**Companion documents:**
- Sprint overview: [`docs/sprint-4/README.md`](sprint-4/README.md)
- Story documents: [`docs/sprint-4/stories/`](sprint-4/stories/)
- Progress tracker: [`docs/SPRINT_4_PROGRESS.md`](SPRINT_4_PROGRESS.md)
- Sprint 3 baseline: [`docs/SPRINT_3_CHECKLIST.md`](SPRINT_3_CHECKLIST.md)

---

## Prerequisites (from Sprint 3)

Before starting Sprint 4 work, verify these Sprint 3 deliverables are in place (all are implemented on `main`):

- [x] `apps/web/app/[locale]/[slug]/checkout/` -- Three-step checkout creates PaymentIntent + Order (US-04-03)
- [x] `apps/web/app/api/checkout/create-intent/route.ts` -- Returns `clientSecret`, `paymentIntentId`, `grossAmount` (US-04-03)
- [x] `apps/web/app/api/webhooks/stripe/route.ts` -- Handles `payment_intent.succeeded` (PENDING -> CONFIRMED, buyer email) (US-05-01 prerequisite)
- [x] `apps/web/app/api/order-status/route.ts` -- Order lookup by PI ID or order ID (US-04-04)
- [x] `apps/web/lib/inngest/functions.ts` -- `sla-check` (hourly), `payout-release` (daily), `cart-cleanup` registered (US-01-06)
- [x] `apps/web/lib/inngest/run-payout-release.ts` -- Payout job implementation (queries DELIVERED + HELD) (US-06-01 prerequisite)
- [x] `apps/web/lib/inngest/run-sla-check.tsx` -- SLA job with escalation tiers and auto-refund (US-08-05 prerequisite)
- [x] `packages/email/send.ts` -- `sendEmail()` with `EmailLog` dedup (US-01-04)
- [x] `packages/email/templates/order-confirmation.tsx` -- Buyer order confirmation email (US-08-01)
- [x] `packages/email/templates/sla.tsx` -- Four SLA email templates (roaster reminder, urgent, buyer delay, admin alert)
- [x] `packages/stripe/` -- `getStripe()`, `transferToConnectedAccount()`, `refundCharge()`, `calculateSplits()`, rate limiters
- [x] `packages/db/prisma/schema.prisma` -- `MagicLink` with `ORDER_FULFILLMENT` purpose, `Order` with tracking/delivery fields, `OrderEvent` with full event type enum, `RoasterDebt`
- [x] `apps/roaster/app/fulfill/[token]/page.tsx` -- Stub page exists (to be replaced in US-05-02)

---

## Phase 1 -- Order Event Log Helper + API (US-06-03)

> **Why first:** The `logOrderEvent()` helper is a utility consumed by all subsequent stories. No Sprint 4 upstream dependencies.

### 1.1 Create logOrderEvent helper

- [ ] Create `packages/db/log-event.ts` with `logOrderEvent()` function
- [ ] Signature: `(orderId, eventType, actorType, actorId?, payload?, ipAddress?) -> Promise<void>`
- [ ] Wraps `database.orderEvent.create` with try/catch -- never throws
- [ ] Logs error to console with `order_id` and `event_type` on failure

### 1.2 Export from package

- [ ] Add `export { logOrderEvent } from './log-event'` to `packages/db/index.ts`
- [ ] Verify import works: `import { logOrderEvent } from '@joe-perks/db'`

### 1.3 Order events query API

- [ ] Create `apps/web/app/api/orders/[id]/events/route.ts`
- [ ] `GET` handler: query `orderEvent.findMany` by `orderId`, sort by `createdAt` ascending
- [ ] Require admin auth (HTTP Basic Auth pattern)
- [ ] Return 404 if order does not exist
- [ ] Response shape: `{ events: Array<{ id, eventType, actorType, actorId, payload, ipAddress, createdAt }> }`

### 1.4 Refactor existing callers

- [ ] Replace standalone `database.orderEvent.create` calls in `run-sla-check.tsx` with `logOrderEvent()`
- [ ] Add code comments on transactional `orderEvent.create` calls (webhook, checkout) explaining why they use direct create

**Reference:** [`docs/sprint-4/stories/US-06-03-order-event-log-api.md`](sprint-4/stories/US-06-03-order-event-log-api.md)
**Diagram:** [`docs/06-database-schema.mermaid`](06-database-schema.mermaid) -- `OrderEvent` model
**Rules:** `AGENTS.md` OrderEvent append-only; `CONVENTIONS.md` logOrderEvent pattern

---

## Phase 2 -- Webhook Fulfillment Magic Link (US-05-01)

> **Depends on:** Sprint 3 webhook handler. **Why now:** First in the EP-05 chain; creates the magic links that US-05-02 consumes.

### 2.1 MagicLink creation

- [ ] Add `crypto` import to `apps/web/app/api/webhooks/stripe/route.ts`
- [ ] Create helper `createFulfillmentMagicLink(orderId, roasterId)`:
  - Check for existing `MagicLink` with `purpose = ORDER_FULFILLMENT` and matching order (idempotency)
  - Generate token: `crypto.randomBytes(32).toString('hex')`
  - Create `MagicLink`: `purpose = ORDER_FULFILLMENT`, `actorId = roasterId`, `actorType = ROASTER`, `payload = { order_id }`, `expiresAt = now + 72h`
  - Return the magic link record

### 2.2 Fulfillment email send

- [ ] Create helper `sendRoasterFulfillmentEmail(orderId)`:
  - Load order with items, roaster, campaign.org relations
  - Build fulfill URL: `process.env.ROASTER_APP_ORIGIN ?? 'http://localhost:3001'` + `/fulfill/${token}`
  - Call `sendEmail()` with template `magic_link_fulfillment`, `entityType = 'order'`, `entityId = order.id`
  - Wrap in try/catch -- log only `order_id` on failure

### 2.3 Wire into webhook handler

- [ ] In `handlePaymentIntentSucceeded`, after `sendBuyerOrderConfirmationEmail(orderId)`:
  - Load `roasterId` from order (add to initial query `select`)
  - Call `createFulfillmentMagicLink(orderId, roasterId)`
  - Call `sendRoasterFulfillmentEmail(orderId)`
- [ ] MagicLink creation is OUTSIDE the main `$transaction` (order confirmation must succeed even if magic link fails)

**Reference:** [`docs/sprint-4/stories/US-05-01-webhook-fulfillment-magic-link.md`](sprint-4/stories/US-05-01-webhook-fulfillment-magic-link.md)
**Diagram:** [`docs/04-order-lifecycle.mermaid`](04-order-lifecycle.mermaid) -- Phase 2
**Rules:** `AGENTS.md` magic link rules, `sendEmail()` pattern

---

## Phase 3 -- Fulfillment Email Template (US-08-02)

> **Can parallel with Phase 2.** Creates the template that Phase 2 sends.

### 3.1 Create template

- [ ] Create `packages/email/templates/magic-link-fulfillment.tsx`
- [ ] Props: `orderNumber`, `fulfillUrl`, `items[]` (name, quantity, priceInCents), `totalInCents`, `shippingInCents`
- [ ] Content: "New order for fulfillment" heading, items list, amounts, CTA button "View Order & Ship"
- [ ] Include "This link expires in 72 hours" notice
- [ ] Use Joe Perks branding (consistent with `order-confirmation.tsx`)
- [ ] Include `PreviewProps` with sample data

### 3.2 Verify in preview

- [ ] Template renders in React Email preview (`pnpm --filter email dev` -> `http://localhost:3004`)
- [ ] Mobile responsive layout verified
- [ ] CTA button links to `fulfillUrl`

**Reference:** [`docs/sprint-4/stories/US-08-02-fulfillment-notification-email.md`](sprint-4/stories/US-08-02-fulfillment-notification-email.md)
**Diagram:** [`docs/04-order-lifecycle.mermaid`](04-order-lifecycle.mermaid) -- Phase 2: `sendEmail(magic_link_fulfillment -> roaster)`

---

## Phase 4 -- SLA Email Verification (US-08-05)

> **Can parallel with Phases 2-3.** Verifies existing implementation completeness.

### 4.1 Verify template rendering

- [ ] All four SLA templates render in React Email preview
- [ ] `SlaRoasterReminderEmail` -- order number, fulfillment deadline
- [ ] `SlaRoasterUrgentEmail` -- urgent tone, order number, deadline
- [ ] `SlaBuyerDelayEmail` -- buyer-friendly delay message
- [ ] `SlaAdminAlertEmail` -- order number, ID, stage (breach/critical)

### 4.2 Verify sendEmail wiring

- [ ] `entityType = 'order'`, `entityId = order.id` on all calls
- [ ] Template strings: `sla_roaster_reminder`, `sla_roaster_urgent`, `sla_buyer_delay`, `sla_admin_breach`, `sla_admin_critical`
- [ ] Each tier sends at most one email per order (dedup via `OrderEvent` check + `EmailLog`)

### 4.3 Verify threshold logic

- [ ] Thresholds read from `PlatformSettings` (not hardcoded)
- [ ] Escalation order: warn (24h) -> breach (48h) -> critical (72h) -> auto-refund (96h)
- [ ] Time calculations correct relative to `fulfillBy`

### 4.4 Verify auto-refund flow

- [ ] `refundCharge()` called with `order.stripeChargeId`
- [ ] Order transitions: `status = REFUNDED`, `payoutStatus = FAILED`
- [ ] `REFUND_COMPLETED` event created

### 4.5 Template improvements (if needed)

- [ ] Improve copy for clarity and actionability
- [ ] Refactor standalone `orderEvent.create` calls to `logOrderEvent()` (after Phase 1)

**Reference:** [`docs/sprint-4/stories/US-08-05-sla-notification-emails.md`](sprint-4/stories/US-08-05-sla-notification-emails.md)
**Diagram:** [`docs/08-order-state-machine.mermaid`](08-order-state-machine.mermaid) -- CONFIRMED -> REFUNDED (SLA auto-refund)
**Rules:** `AGENTS.md` SLA thresholds from PlatformSettings

---

## Phase 5 -- Roaster Fulfillment Page (US-05-02)

> **Depends on:** Phase 2 (magic links exist). Produces SHIPPED orders for Phase 7.

### 5.1 Token validation

- [ ] Create `apps/roaster/app/fulfill/[token]/_lib/validate-token.ts`
- [ ] Validate: token exists, `purpose = ORDER_FULFILLMENT`, `expiresAt > now()`, `usedAt IS NULL`
- [ ] Return discriminated union: `{ valid, magicLink, orderId }` or `{ valid: false, reason }`

### 5.2 Page server component

- [ ] Replace stub in `apps/roaster/app/fulfill/[token]/page.tsx`
- [ ] Call `validateToken(token)` -- render error views for expired/used/not-found
- [ ] Load order with items, roaster, campaign.org, buyer (name only)
- [ ] Create `OrderEvent(FULFILLMENT_VIEWED)` (guard: only once per token)
- [ ] Render `FulfillmentDetails` and `TrackingForm`

### 5.3 Order details display

- [ ] Create `_components/fulfillment-details.tsx`
- [ ] Show: order number, date, status badge, items table (name, variant, qty, price, line total)
- [ ] Show: subtotal, shipping, total (gross)
- [ ] Show: payout breakdown -- roaster amount, shipping passthrough, roaster total
- [ ] Show: org contribution (orgAmount, orgName) -- informational
- [ ] Show: buyer name (for label addressing) -- do NOT show buyer email or address

### 5.4 Tracking form

- [ ] Create `_components/tracking-form.tsx` (`'use client'`)
- [ ] Tracking number input (required)
- [ ] Carrier dropdown: USPS, UPS, FedEx, DHL, Other (with free-text)
- [ ] "Mark as Shipped" button with loading state
- [ ] Success confirmation view after submission

### 5.5 Submit tracking action

- [ ] Create `_actions/submit-tracking.ts` (`'use server'`)
- [ ] Re-validate token (race condition guard)
- [ ] `$transaction`: set `MagicLink.usedAt`, update `Order` (SHIPPED, trackingNumber, carrier, shippedAt)
- [ ] Create `OrderEvent(SHIPPED)` with tracking in payload
- [ ] Send shipped email to buyer (US-08-03 template)
- [ ] Return success/error

**Reference:** [`docs/sprint-4/stories/US-05-02-roaster-fulfillment-page.md`](sprint-4/stories/US-05-02-roaster-fulfillment-page.md)
**Diagram:** [`docs/04-order-lifecycle.mermaid`](04-order-lifecycle.mermaid) -- Phase 3
**Rules:** `AGENTS.md` magic link single-use, no auth required

---

## Phase 6 -- Shipped Email Template (US-08-03)

> **Can parallel with Phase 5.** Creates the template that Phase 5 sends.

### 6.1 Create template

- [ ] Create `packages/email/templates/order-shipped.tsx`
- [ ] Props: `buyerName`, `orderNumber`, `trackingNumber`, `carrier`, `orgName`
- [ ] Content: "Your order has shipped!" heading, tracking info, fundraiser message
- [ ] Optional: tracking URL for common carriers (USPS, UPS, FedEx)
- [ ] Include `PreviewProps` with sample data

### 6.2 Verify in preview

- [ ] Template renders in React Email preview
- [ ] Mobile responsive layout

**Reference:** [`docs/sprint-4/stories/US-08-03-shipped-notification-email.md`](sprint-4/stories/US-08-03-shipped-notification-email.md)
**Diagram:** [`docs/04-order-lifecycle.mermaid`](04-order-lifecycle.mermaid) -- Phase 3: `sendEmail(order_shipped + tracking -> buyer)`

---

## Phase 7 -- Delivery Confirmation (US-05-03)

> **Depends on:** Phase 5 (SHIPPED orders exist). Produces DELIVERED orders for Phase 9.

### 7.1 Admin order list page

- [ ] Create `apps/admin/app/orders/page.tsx`
- [ ] List orders with status filter: default SHIPPED, tabs for CONFIRMED/DELIVERED/REFUNDED
- [ ] Columns: order number, roaster, buyer name, dates, tracking, status badge
- [ ] Pagination: `?page=` query param

### 7.2 Admin order detail page

- [ ] Create `apps/admin/app/orders/[id]/page.tsx`
- [ ] Full order details: items, amounts, split breakdown, tracking info
- [ ] Order event timeline (chronological `OrderEvent` list)
- [ ] "Confirm Delivery" button (visible when `status = SHIPPED`)

### 7.3 Confirm delivery action

- [ ] Create `apps/admin/app/orders/_actions/confirm-delivery.ts`
- [ ] Load `PlatformSettings.payoutHoldDays`
- [ ] `$transaction`: update order (DELIVERED, deliveredAt, payoutEligibleAt), create `OrderEvent(ORDER_DELIVERED)`
- [ ] WHERE clause includes `status: 'SHIPPED'` (optimistic lock)
- [ ] Send delivered email to buyer (US-08-04 template)

### 7.4 Components

- [ ] Create `_components/order-list.tsx` -- table with filters and pagination
- [ ] Create `_components/order-detail.tsx` -- order info display
- [ ] Create `[id]/_components/event-timeline.tsx` -- chronological event list

**Reference:** [`docs/sprint-4/stories/US-05-03-delivery-confirmation-payout-eligibility.md`](sprint-4/stories/US-05-03-delivery-confirmation-payout-eligibility.md)
**Diagram:** [`docs/04-order-lifecycle.mermaid`](04-order-lifecycle.mermaid) -- Phase 4
**Rules:** `AGENTS.md` tenant isolation (admin global scope), PlatformSettings for hold days

---

## Phase 8 -- Delivered Email Template (US-08-04)

> **Can parallel with Phase 7.** Creates the template that Phase 7 sends.

### 8.1 Create template

- [ ] Create `packages/email/templates/order-delivered.tsx`
- [ ] Props: `buyerName`, `orderNumber`, `orgName`, `orgAmountInCents`, `orgPctSnapshot`
- [ ] Content: "Your order has been delivered!" heading, fundraiser impact section, thank-you message
- [ ] Dollar amount formatted from cents: `(orgAmountInCents / 100).toFixed(2)`
- [ ] Include `PreviewProps` with sample data

### 8.2 Verify in preview

- [ ] Template renders in React Email preview
- [ ] Impact section displays correctly
- [ ] Mobile responsive layout

**Reference:** [`docs/sprint-4/stories/US-08-04-delivery-impact-email.md`](sprint-4/stories/US-08-04-delivery-impact-email.md)
**Diagram:** [`docs/04-order-lifecycle.mermaid`](04-order-lifecycle.mermaid) -- Phase 4: `sendEmail(order_delivered + impact message -> buyer)`

---

## Phase 9 -- Payout Job Verification (US-06-01)

> **Depends on:** Phase 7 (DELIVERED orders exist). The job code already exists -- this phase verifies and completes it.

### 9.1 Verify existing transfer logic

- [ ] Confirm `transferToConnectedAccount()` uses `transfer_group = order.id`
- [ ] Confirm roaster transfer amount is `roasterTotal` (roasterAmount + shipping)
- [ ] Confirm org transfer amount is `orgAmount`
- [ ] Confirm `payoutStatus` transitions: `HELD -> TRANSFERRED` / `HELD -> FAILED`

### 9.2 Add OrderEvent logging

- [ ] Create `OrderEvent(PAYOUT_TRANSFERRED)` after successful transfers with payload: `{ roaster_transfer_id, org_transfer_id }`
- [ ] Create `OrderEvent(PAYOUT_FAILED)` on failure with error in payload
- [ ] Use `logOrderEvent()` from US-06-03

### 9.3 Add RoasterDebt deduction

- [ ] Query unsettled `RoasterDebt` rows for the roaster before transfer
- [ ] Deduct total debt from `roasterTotal` for net transfer amount
- [ ] If net amount <= 0, skip roaster transfer (org transfer still proceeds)
- [ ] Mark settled debts: `settled = true`, `settledAt = now()`

### 9.4 Verify Campaign.totalRaised handling

- [ ] Confirm `totalRaised` increment timing (currently at confirmation; document decision)
- [ ] Add code comment if keeping at confirmation time vs moving to payout time

### 9.5 Smoke test

- [ ] Create `packages/db/scripts/smoke-us-06-01-payout.ts`
- [ ] Verify with test data: DELIVERED order, eligible date past, Stripe configured

**Reference:** [`docs/sprint-4/stories/US-06-01-inngest-payout-job.md`](sprint-4/stories/US-06-01-inngest-payout-job.md)
**Diagram:** [`docs/07-stripe-payment-flow.mermaid`](07-stripe-payment-flow.mermaid) -- Transfer section
**Rules:** `AGENTS.md` Stripe transfer_group, money as cents

---

## Cross-cutting concerns

### Email templates created in Sprint 4

| Template file | Template string | Sender | Recipient | Story |
|---------------|----------------|--------|-----------|-------|
| `magic-link-fulfillment.tsx` | `magic_link_fulfillment` | Webhook (US-05-01) | Roaster | US-08-02 |
| `order-shipped.tsx` | `order_shipped` | Fulfillment page (US-05-02) | Buyer | US-08-03 |
| `order-delivered.tsx` | `order_delivered` | Admin delivery (US-05-03) | Buyer | US-08-04 |
| `sla.tsx` (existing) | `sla_roaster_reminder`, `sla_roaster_urgent`, `sla_buyer_delay`, `sla_admin_breach`, `sla_admin_critical` | SLA job | Roaster/Buyer/Admin | US-08-05 |

### Dependencies to verify/add

| Package | Dependency | Story |
|---------|-----------|-------|
| `packages/db` | No new deps -- uses existing Prisma client | US-06-03 |
| `apps/web` | No new deps -- uses existing `@joe-perks/email`, `@joe-perks/stripe` | US-05-01, US-06-01 |
| `apps/roaster` | No new deps -- uses existing `@joe-perks/db`, `@joe-perks/email` | US-05-02 |
| `apps/admin` | May need `@joe-perks/db` if not already in deps | US-05-03 |

### Document sync checklist

After Sprint 4 implementation, update these documents:

- [ ] `docs/AGENTS.md` -- Add `logOrderEvent()` to key data patterns, update Inngest jobs table if any changes
- [ ] `docs/CONVENTIONS.md` -- Update logOrderEvent pattern to reflect actual implementation, add fulfillment page pattern
- [ ] `docs/01-project-structure.mermaid` -- Add fulfillment route, admin orders route, events API route
- [ ] `docs/sprint-4/README.md` -- Update story statuses and "Current progress" line
- [ ] `docs/SPRINT_4_PROGRESS.md` -- Update per-phase matrices after each story completion
- [ ] Story documents -- Mark status as `Done`, update "Current repo evidence", check all ACs

### AGENTS.md rules checklist

- [ ] Money as cents: all amounts displayed via `(cents / 100).toFixed(2)`
- [ ] Magic links: `crypto.randomBytes(32)`, single-use via `usedAt`, 72h TTL, no auth required
- [ ] sendEmail(): via `@joe-perks/email`, `EmailLog` dedup, never import Resend directly
- [ ] Stripe: via `@joe-perks/stripe`, `transfer_group = order.id`
- [ ] OrderEvent: append-only, use `logOrderEvent()` for non-transactional inserts
- [ ] Tenant isolation: admin global, fulfillment via token
- [ ] PII: never log buyer email/address, only `order_id`, `tracking_number`, `transfer_id`

### Testing commands

```bash
# Dev server (all apps)
pnpm dev

# Email preview
pnpm --filter email dev

# Type check
pnpm typecheck

# Lint
pnpm check

# Build
pnpm build

# Prisma Studio (inspect DB)
pnpm dev:studio

# Stripe webhook forwarding (local)
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Inngest dev server (if using local Inngest)
npx inngest-cli@latest dev
```

---

## Quick reference -- Story-to-file mapping

| Story | Phase | Key files |
|-------|-------|-----------|
| US-06-03 | 1 | `packages/db/log-event.ts`, `packages/db/index.ts`, `apps/web/app/api/orders/[id]/events/route.ts` |
| US-05-01 | 2 | `apps/web/app/api/webhooks/stripe/route.ts` |
| US-08-02 | 3 | `packages/email/templates/magic-link-fulfillment.tsx` |
| US-08-05 | 4 | `packages/email/templates/sla.tsx`, `apps/web/lib/inngest/run-sla-check.tsx` |
| US-05-02 | 5 | `apps/roaster/app/fulfill/[token]/page.tsx`, `_actions/`, `_components/`, `_lib/` |
| US-08-03 | 6 | `packages/email/templates/order-shipped.tsx` |
| US-05-03 | 7 | `apps/admin/app/orders/page.tsx`, `[id]/page.tsx`, `_actions/`, `_components/` |
| US-08-04 | 8 | `packages/email/templates/order-delivered.tsx` |
| US-06-01 | 9 | `apps/web/lib/inngest/run-payout-release.ts`, `packages/db/scripts/smoke-us-06-01-payout.ts` |

# Joe Perks -- Sprint 4 Implementation Checklist

## Order fulfillment, payouts & notifications -- webhook magic links, roaster fulfillment page, delivery confirmation, payout job, order event log, transactional emails

**Version:** 1.2 | **Sprint:** 4 (Weeks 7-8) | **Points:** 46 | **Stories:** 9 (all complete)
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

- [x] Create `packages/db/log-event.ts` with `logOrderEvent()` function
- [x] Signature: `(orderId, eventType, actorType, actorId?, payload?, ipAddress?) -> Promise<void>`
- [x] Wraps `database.orderEvent.create` with try/catch -- never throws
- [x] Logs error to console with `order_id` and `event_type` on failure

### 1.2 Export from package

- [x] Add `export { logOrderEvent } from './log-event'` to `packages/db/index.ts`
- [x] Verify import works: `import { logOrderEvent } from '@joe-perks/db'`

### 1.3 Order events query API

- [x] Create `apps/web/app/api/orders/[id]/events/route.ts`
- [x] `GET` handler: query `orderEvent.findMany` by `orderId`, sort by `createdAt` ascending
- [x] Require admin auth (HTTP Basic Auth pattern)
- [x] Return 404 if order does not exist
- [x] Response shape: `{ events: Array<{ id, eventType, actorType, actorId, payload, ipAddress, createdAt }> }`

### 1.4 Refactor existing callers

- [x] Replace standalone `database.orderEvent.create` calls in `run-sla-check.tsx` with `logOrderEvent()`
- [x] Add code comments on transactional `orderEvent.create` calls (webhook, checkout) explaining why they use direct create

**Reference:** [`docs/sprint-4/stories/US-06-03-order-event-log-api.md`](sprint-4/stories/US-06-03-order-event-log-api.md)
**Diagram:** [`docs/06-database-schema.mermaid`](06-database-schema.mermaid) -- `OrderEvent` model
**Rules:** `AGENTS.md` OrderEvent append-only; `CONVENTIONS.md` logOrderEvent pattern

---

## Phase 2 -- Webhook Fulfillment Magic Link (US-05-01)

> **Depends on:** Sprint 3 webhook handler. **Why now:** First in the EP-05 chain; creates the magic links that US-05-02 consumes.

### 2.1 MagicLink creation

- [x] Add `crypto` import to `apps/web/app/api/webhooks/stripe/route.ts`
- [x] Create helper `createFulfillmentMagicLink(orderId, roasterId)`:
  - Enforce one `ORDER_FULFILLMENT` link per order with a deterministic database-backed dedupe key
  - Generate token: `crypto.randomBytes(32).toString('hex')`
  - Create `MagicLink`: `purpose = ORDER_FULFILLMENT`, `actorId = roasterId`, `actorType = ROASTER`, `payload = { order_id }`, `expiresAt = now + 72h`
  - Return the magic link record

### 2.2 Fulfillment email send

- [x] Create helper `sendRoasterFulfillmentEmail(orderId)`:
  - Load order with items, roaster, campaign.org relations
  - Build fulfill URL: `process.env.ROASTER_APP_ORIGIN ?? 'http://localhost:3001'` + `/fulfill/${token}`
  - Call `sendEmail()` with template `magic_link_fulfillment`, `entityType = 'order'`, `entityId = order.id`
  - Wrap in try/catch -- log only `order_id` on failure

### 2.3 Wire into webhook handler

- [x] In `handlePaymentIntentSucceeded`, after `sendBuyerOrderConfirmationEmail(orderId)`:
  - Load `roasterId` from order (add to initial query `select`)
  - Call `createFulfillmentMagicLink(orderId, roasterId)`
  - Call `sendRoasterFulfillmentEmail(orderId)`
- [x] MagicLink creation is OUTSIDE the main `$transaction` (order confirmation must succeed even if magic link fails)
- [x] Order confirmation side effects are concurrency-safe (`PENDING -> CONFIRMED` can commit only once)

**Reference:** [`docs/sprint-4/stories/US-05-01-webhook-fulfillment-magic-link.md`](sprint-4/stories/US-05-01-webhook-fulfillment-magic-link.md)
**Diagram:** [`docs/04-order-lifecycle.mermaid`](04-order-lifecycle.mermaid) -- Phase 2
**Rules:** `AGENTS.md` magic link rules, `sendEmail()` pattern

---

## Phase 3 -- Fulfillment Email Template (US-08-02)

> **Can parallel with Phase 2.** Creates the template that Phase 2 sends.

### 3.1 Create template

- [x] Create `packages/email/templates/magic-link-fulfillment.tsx`
- [x] Props: `orderNumber`, `fulfillUrl`, `items[]` (name, quantity, priceInCents), `totalInCents`, `shippingInCents`
- [x] Content: "New order for fulfillment" heading, items list, amounts, CTA button "View Order & Ship"
- [x] Include "This link expires in 72 hours" notice
- [x] Use Joe Perks branding (consistent with `order-confirmation.tsx`)
- [x] Include `PreviewProps` with sample data

### 3.2 Verify in preview

- [x] Template renders in React Email preview (`pnpm --filter email dev` -> `http://localhost:3004`)
- [x] Mobile responsive layout verified
- [x] CTA button links to `fulfillUrl`

**Reference:** [`docs/sprint-4/stories/US-08-02-fulfillment-notification-email.md`](sprint-4/stories/US-08-02-fulfillment-notification-email.md)
**Diagram:** [`docs/04-order-lifecycle.mermaid`](04-order-lifecycle.mermaid) -- Phase 2: `sendEmail(magic_link_fulfillment -> roaster)`

---

## Phase 4 -- SLA Email Verification (US-08-05)

> **Can parallel with Phases 2-3.** Verifies existing implementation completeness.

### 4.1 Verify template rendering

- [x] All four SLA templates render in React Email preview
- [x] `SlaRoasterReminderEmail` -- order number, fulfillment deadline
- [x] `SlaRoasterUrgentEmail` -- urgent tone, order number, deadline
- [x] `SlaBuyerDelayEmail` -- buyer-friendly delay message
- [x] `SlaAdminAlertEmail` -- order number, ID, stage (breach/critical)

### 4.2 Verify sendEmail wiring

- [x] `entityType = 'order'`, `entityId = order.id` on all calls
- [x] Template strings: `sla_roaster_reminder`, `sla_roaster_urgent`, `sla_buyer_delay`, `sla_admin_breach`, `sla_admin_critical`
- [x] Each tier sends at most one email per order (dedup via `OrderEvent` check + `EmailLog`)

### 4.3 Verify threshold logic

- [x] Thresholds read from `PlatformSettings` (not hardcoded)
- [x] Escalation order: warn (24h) -> breach (48h) -> critical (72h) -> auto-refund (96h)
- [x] Time calculations correct relative to `fulfillBy`

### 4.4 Verify auto-refund flow

- [x] `refundCharge()` called with `order.stripeChargeId`
- [x] Order transitions: `status = REFUNDED`, `payoutStatus = FAILED`
- [x] `REFUND_COMPLETED` event created

### 4.5 Template improvements (if needed)

- [x] Improve copy for clarity and actionability
- [x] Refactor standalone `orderEvent.create` calls to `logOrderEvent()` (after Phase 1)
- [x] Admin alert copy reflects the active configured threshold hours

**Reference:** [`docs/sprint-4/stories/US-08-05-sla-notification-emails.md`](sprint-4/stories/US-08-05-sla-notification-emails.md)
**Diagram:** [`docs/08-order-state-machine.mermaid`](08-order-state-machine.mermaid) -- CONFIRMED -> REFUNDED (SLA auto-refund)
**Rules:** `AGENTS.md` SLA thresholds from PlatformSettings

---

## Phase 5 -- Roaster Fulfillment Page (US-05-02)

> **Depends on:** Phase 2 (magic links exist). Produces SHIPPED orders for Phase 7.

### 5.1 Token validation

- [x] Create `apps/roaster/app/fulfill/[token]/_lib/validate-token.ts`
- [x] Validate: token exists, `purpose = ORDER_FULFILLMENT`, `expiresAt > now()`, `usedAt IS NULL`
- [x] Return discriminated union: `{ valid, magicLink, orderId }` or `{ valid: false, reason }`

### 5.2 Page server component

- [x] Replace stub in `apps/roaster/app/fulfill/[token]/page.tsx`
- [x] Call `validateToken(token)` -- render error views for expired/used/not-found
- [x] Load order with items, roaster, campaign.org, buyer (name only)
- [x] Create `OrderEvent(FULFILLMENT_VIEWED)` (guard: only once per token)
- [x] Render `FulfillmentDetails` and `TrackingForm`

### 5.3 Order details display

- [x] Create `_components/fulfillment-details.tsx`
- [x] Show: order number, date, status badge, items table (name, variant, qty, price, line total)
- [x] Show: subtotal, shipping, total (gross)
- [x] Show: payout breakdown -- roaster amount, shipping passthrough, roaster total
- [x] Show: org contribution (orgAmount, orgName) -- informational
- [x] Show: buyer name (for label addressing) -- do NOT show buyer email or address

### 5.4 Tracking form

- [x] Create `_components/tracking-form.tsx` (`'use client'`)
- [x] Tracking number input (required)
- [x] Carrier dropdown: USPS, UPS, FedEx, DHL, Other (with free-text)
- [x] "Mark as Shipped" button with loading state
- [x] Success confirmation view after submission

### 5.5 Submit tracking action

- [x] Create `_actions/submit-tracking.ts` (`'use server'`)
- [x] Re-validate token (race condition guard)
- [x] `$transaction`: set `MagicLink.usedAt`, update `Order` (SHIPPED, trackingNumber, carrier, shippedAt)
- [x] Create `OrderEvent(SHIPPED)` with tracking in payload
- [x] Send shipped email to buyer (US-08-03 template)
- [x] Return success/error

**Reference:** [`docs/sprint-4/stories/US-05-02-roaster-fulfillment-page.md`](sprint-4/stories/US-05-02-roaster-fulfillment-page.md)
**Diagram:** [`docs/04-order-lifecycle.mermaid`](04-order-lifecycle.mermaid) -- Phase 3
**Rules:** `AGENTS.md` magic link single-use, no auth required

---

## Phase 6 -- Shipped Email Template (US-08-03)

> **Can parallel with Phase 5.** Creates the template that Phase 5 sends.

### 6.1 Create template

- [x] Create `packages/email/templates/order-shipped.tsx`
- [x] Props: `buyerName`, `orderNumber`, `trackingNumber`, `carrier`, `orgName`
- [x] Content: "Your order has shipped!" heading, tracking info, fundraiser message
- [x] Optional: tracking URL for common carriers (USPS, UPS, FedEx)
- [x] Include `PreviewProps` with sample data

### 6.2 Verify in preview

- [x] Template renders in React Email preview
- [x] Mobile responsive layout

**Reference:** [`docs/sprint-4/stories/US-08-03-shipped-notification-email.md`](sprint-4/stories/US-08-03-shipped-notification-email.md)
**Diagram:** [`docs/04-order-lifecycle.mermaid`](04-order-lifecycle.mermaid) -- Phase 3: `sendEmail(order_shipped + tracking -> buyer)`

---

## Phase 7 -- Delivery Confirmation (US-05-03)

> **Depends on:** Phase 5 (SHIPPED orders exist). Produces DELIVERED orders for Phase 9.

### 7.1 Admin order list page

- [x] Create `apps/admin/app/orders/page.tsx`
- [x] List orders with status filter: default SHIPPED (`/orders`), tabs for CONFIRMED, DELIVERED, REFUNDED, and ALL (`?status=ALL` — includes other statuses)
- [x] Columns: order number, roaster, buyer name, dates, tracking, status badge
- [x] List capped at 200 rows per load (no `?page=` pagination in MVP)

### 7.2 Admin order detail page

- [x] Create `apps/admin/app/orders/[id]/page.tsx`
- [x] Full order details: items, amounts, split breakdown, tracking info
- [x] Order event timeline (chronological `OrderEvent` list)
- [x] "Confirm Delivery" button (visible when `status = SHIPPED`)

### 7.3 Confirm delivery action

- [x] Create `apps/admin/app/orders/_actions/confirm-delivery.ts`
- [x] Load `PlatformSettings.payoutHoldDays`
- [x] `$transaction`: update order (DELIVERED, deliveredAt, payoutEligibleAt), create `OrderEvent` with `eventType = DELIVERED`
- [x] WHERE clause includes `status: 'SHIPPED'` (optimistic lock)
- [x] `DELIVERED` event records a stable admin actor ID for MVP Basic Auth
- [x] Send delivered email to buyer (US-08-04 template)

### 7.4 Components

- [x] Create `_components/order-list.tsx` -- table with status filter tabs
- [x] Create `_components/order-detail.tsx` -- order info display
- [x] Create `[id]/_components/event-timeline.tsx` -- chronological event list

**Reference:** [`docs/sprint-4/stories/US-05-03-delivery-confirmation-payout-eligibility.md`](sprint-4/stories/US-05-03-delivery-confirmation-payout-eligibility.md)
**Diagram:** [`docs/04-order-lifecycle.mermaid`](04-order-lifecycle.mermaid) -- Phase 4
**Rules:** `AGENTS.md` tenant isolation (admin global scope), PlatformSettings for hold days

---

## Phase 8 -- Delivered Email Template (US-08-04)

> **Can parallel with Phase 7.** Creates the template that Phase 7 sends.

### 8.1 Create template

- [x] Create `packages/email/templates/order-delivered.tsx`
- [x] Props: `buyerName`, `orderNumber`, `orgName`, `orgAmountInCents`, `orgPctSnapshot`
- [x] Content: "Your order has been delivered!" heading, fundraiser impact section, thank-you message
- [x] Dollar amount formatted from cents: `(orgAmountInCents / 100).toFixed(2)`
- [x] Include `PreviewProps` with sample data

### 8.2 Verify in preview

- [x] Template renders in React Email preview
- [x] Impact section displays correctly
- [x] Mobile responsive layout

**Reference:** [`docs/sprint-4/stories/US-08-04-delivery-impact-email.md`](sprint-4/stories/US-08-04-delivery-impact-email.md)
**Diagram:** [`docs/04-order-lifecycle.mermaid`](04-order-lifecycle.mermaid) -- Phase 4: `sendEmail(order_delivered + impact message -> buyer)`

---

## Phase 9 -- Payout Job Verification (US-06-01)

> **Depends on:** Phase 7 (DELIVERED orders exist). The job code already exists -- this phase verifies and completes it.

### 9.1 Verify existing transfer logic

- [x] Confirm `transferToConnectedAccount()` uses `transfer_group = order.id`
- [x] Confirm roaster transfer amount is `roasterTotal` (roasterAmount + shipping)
- [x] Confirm org transfer amount is `orgAmount`
- [x] Confirm `payoutStatus` transitions: `HELD -> TRANSFERRED` / `HELD -> FAILED`

### 9.2 Add OrderEvent logging

- [x] Create `OrderEvent(PAYOUT_TRANSFERRED)` after successful transfers with payload: `{ roaster_transfer_id, org_transfer_id }`
- [x] Create `OrderEvent(PAYOUT_FAILED)` on failure with error in payload
- [x] Use `logOrderEvent()` from US-06-03

### 9.3 Add RoasterDebt deduction

- [x] Query unsettled `RoasterDebt` rows for the roaster before transfer
- [x] Deduct total debt from `roasterTotal` for net transfer amount
- [x] If roaster debt fully consumes the payout, fail the payout for manual resolution instead of marking it transferred
- [x] Mark settled debts: `settled = true`, `settledAt = now()`

### 9.4 Verify Campaign.totalRaised handling

- [x] Confirm `totalRaised` increment timing (currently at confirmation; document decision)
- [x] Add code comment if keeping at confirmation time vs moving to payout time

### 9.5 Smoke test

- [x] Create `packages/db/scripts/smoke-us-06-01-payout.ts`
- [x] Verify payout event consistency; optionally execute the live payout runner with `RUN_PAYOUT_RELEASE=1`

**Reference:** [`docs/sprint-4/stories/US-06-01-inngest-payout-job.md`](sprint-4/stories/US-06-01-inngest-payout-job.md)
**Diagram:** [`docs/07-stripe-payment-flow.mermaid`](07-stripe-payment-flow.mermaid) -- Transfer section
**Rules:** `AGENTS.md` Stripe transfer_group, money as cents

---

## Implementation Review Follow-up (2026-04-01)

- [x] Review finding 1: webhook confirmation is concurrency-safe and duplicate `StripeEvent` insert races are ignored safely
- [x] Review finding 2: debt-heavy payouts no longer finish as `TRANSFERRED`; they fail with explicit manual-resolution logging
- [x] Review finding 3: delivery confirmation stores an admin actor ID on the `DELIVERED` event
- [x] Review finding 4: roaster fulfillment details show the order date
- [x] Review finding 5: fulfillment magic links use a database-enforced dedupe key
- [x] Review finding 6: admin orders navigation exposes `Refunded`
- [x] Review finding 7: SLA admin alert copy uses configured threshold hours
- [x] Review finding 8: payout smoke script checks event consistency and can run the payout runner explicitly
- [x] Review finding 9: admin UI and admin API share normalized Basic Auth parsing/credential handling

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
| `apps/admin` | `@joe-perks/db` and `@joe-perks/types` for delivery flow + shared Basic Auth normalization | US-05-03 |

### Document sync checklist

After Sprint 4 implementation, update these documents:

- [x] `docs/AGENTS.md` -- Add `logOrderEvent()` to key data patterns, update Inngest jobs table if any changes
- [x] `docs/CONVENTIONS.md` -- Update logOrderEvent pattern to reflect actual implementation, add fulfillment page pattern
- [x] `docs/01-project-structure.mermaid` -- Add fulfillment route, admin orders route, events API route
- [x] `docs/06-database-schema.mermaid` -- Reflect `MagicLink.dedupeKey` and confirmation-time fundraiser accrual note
- [x] `docs/sprint-4/README.md` -- Update story statuses and "Current progress" line
- [x] `docs/SPRINT_4_PROGRESS.md` -- Update per-phase matrices after each story completion
- [x] Story documents -- Mark status as `Done`, update "Current repo evidence", check all ACs

### AGENTS.md rules checklist

- [x] Money as cents: all amounts displayed via `(cents / 100).toFixed(2)`
- [x] Magic links: `crypto.randomBytes(32)`, single-use via `usedAt`, 72h TTL, no auth required
- [x] sendEmail(): via `@joe-perks/email`, `EmailLog` dedup, never import Resend directly
- [x] Stripe: via `@joe-perks/stripe`, `transfer_group = order.id`
- [x] OrderEvent: append-only, use `logOrderEvent()` for non-transactional inserts
- [x] Tenant isolation: admin global, fulfillment via token
- [x] PII: never log buyer email/address, only `order_id`, `tracking_number`, `transfer_id`

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

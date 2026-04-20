# US-08-05 -- SLA Warning and Breach Notification Emails

**Story ID:** US-08-05 | **Epic:** EP-08 (Notifications)
**Points:** 3 | **Priority:** Medium
**Status:** `Done`
**Owner:** Full-stack
**Dependencies:** US-01-04 (Email Pipeline), US-01-06 (Inngest Jobs), US-05-01 (Webhook Fulfillment Magic Link)
**Depends on this:** None

---

## Goal

Verify and complete the SLA notification email wiring in the existing `sla-check` Inngest job. The SLA templates (`SlaRoasterReminderEmail`, `SlaRoasterUrgentEmail`, `SlaBuyerDelayEmail`, `SlaAdminAlertEmail`) already exist in `packages/email/templates/sla.tsx` and are wired into the `run-sla-check.tsx` job with `sendEmail()`. This story verifies the templates render correctly, the `sendEmail()` calls use proper `EmailLog` dedup parameters, the SLA thresholds align with `PlatformSettings`, and the escalation tiers (warn -> breach -> critical -> auto-refund) function as designed.

---

## Diagram references

- **Order lifecycle:** [`docs/04-order-lifecycle.mermaid`](../../04-order-lifecycle.mermaid) -- SLA escalation is implicit: orders in CONFIRMED status with `shippedAt = null` are checked hourly
- **Order state machine:** [`docs/08-order-state-machine.mermaid`](../../08-order-state-machine.mermaid) -- CONFIRMED -> REFUNDED: `Admin manual refund or SLA auto-refund at T+96h`
- **Database ERD:** [`docs/06-database-schema.mermaid`](../../06-database-schema.mermaid) -- `Order` (fulfillBy, shippedAt, status), `OrderEvent` (SLA_WARNING, SLA_BREACH), `PlatformSettings` (slaWarnHours, slaBreachHours, slaCriticalHours, slaAutoRefundHours), `EmailLog`

---

## Current repo evidence

- **`packages/email/templates/sla.tsx`** -- Contains four exported components:
  - `SlaRoasterReminderEmail({ orderNumber, fulfillByIso })` -- 24h warning
  - `SlaRoasterUrgentEmail({ orderNumber, fulfillByIso })` -- 48h breach
  - `SlaBuyerDelayEmail({ orderNumber })` -- buyer delay notice
  - `SlaAdminAlertEmail({ orderNumber, orderId, stage, thresholdHours })` -- admin breach/critical alert with dynamic tier copy
- **`apps/web/lib/inngest/run-sla-check.tsx`** -- Fully implemented SLA check job:
  - Queries CONFIRMED orders with `shippedAt: null`
  - Cascading checks: auto-refund (T+96h) -> critical (T+72h) -> breach (T+48h) -> warn (T+24h)
  - Each tier: checks for existing event (idempotent), creates `OrderEvent`, sends emails via `sendEmail()` with template strings: `sla_roaster_reminder`, `sla_roaster_urgent`, `sla_buyer_delay`, `sla_admin_breach`, `sla_admin_critical`
  - Auto-refund calls `refundCharge()` from `@joe-perks/stripe` and creates `REFUND_COMPLETED` event
  - Reads `PLATFORM_ALERT_EMAIL` env var for admin notifications
- **`apps/web/lib/inngest/functions.ts`** -- `sla-check` registered as cron `0 * * * *` (hourly)
- **`PlatformSettings`** -- Has `slaWarnHours` (24), `slaBreachHours` (48), `slaCriticalHours` (72), `slaAutoRefundHours` (96)

---

## AGENTS.md rules that apply

- **SLA thresholds:** All thresholds are configurable in `PlatformSettings` singleton -- never hardcode.
- **sendEmail():** Use `sendEmail()`. `EmailLog` dedup prevents duplicate emails per tier.
- **OrderEvent:** Append-only. SLA events: `SLA_WARNING`, `SLA_BREACH`, `NOTE_ADDED` (with code `SLA_CRITICAL`), `REFUND_COMPLETED`.
- **Stripe:** Auto-refund uses `refundCharge()` from `@joe-perks/stripe`.

**CONVENTIONS.md patterns:**
- Error handling: Inngest jobs capture to Sentry, don't re-throw for non-fatal. Critical payment (refund) lets errors propagate for retry.

---

## In scope

### Verify template rendering

- Confirm all four SLA templates render correctly in React Email preview
- Verify template props match the `sendEmail()` calls in `run-sla-check.tsx`
- Ensure templates display meaningful content (order number, deadline, stage)

### Verify sendEmail() wiring

- Confirm `entityType = 'order'` and `entityId = order.id` on all `sendEmail()` calls
- Confirm template strings match: `sla_roaster_reminder`, `sla_roaster_urgent`, `sla_buyer_delay`, `sla_admin_breach`, `sla_admin_critical`
- Verify `EmailLog` dedup works: each tier sends at most one email per order (idempotent on retry)

### Verify SLA threshold logic

- Confirm thresholds are read from `PlatformSettings` (not hardcoded)
- Confirm the escalation order: warn (24h) -> breach (48h) -> critical (72h) -> auto-refund (96h)
- Confirm `fulfillBy` is set correctly at order confirmation time (webhook)
- Confirm the time calculations are correct: `fulfillBy - slaBreachHours + tierHours`

### Verify auto-refund flow

- Confirm `refundCharge()` is called with the order's `stripeChargeId`
- Confirm order status transitions to `REFUNDED` and `payoutStatus` to `FAILED`
- Confirm `REFUND_COMPLETED` event is created

### Template improvements (if needed)

- Add more descriptive copy to templates if current content is too minimal
- Ensure templates include actionable information for each recipient type

---

## Out of scope

- Changing the SLA threshold values
- Adding new SLA tiers
- SMS or push notifications for SLA events
- Buyer-facing tracking or delay details page
- Admin SLA dashboard

---

## Primary files to create or modify

| Action | File | Purpose |
|--------|------|---------|
| Verify/Modify | `packages/email/templates/sla.tsx` | Verify templates render correctly; improve copy if needed |
| Verify/Modify | `apps/web/lib/inngest/run-sla-check.tsx` | Verify sendEmail wiring, threshold logic, auto-refund flow |

---

## Acceptance criteria

- [x] All four SLA templates render correctly in React Email preview (`pnpm --filter email dev`)
- [x] `SlaRoasterReminderEmail` shows order number and fulfillment deadline
- [x] `SlaRoasterUrgentEmail` shows urgent tone with order number and deadline
- [x] `SlaBuyerDelayEmail` shows buyer-friendly delay message with order number
- [x] `SlaAdminAlertEmail` shows order number, order ID, and stage (breach/critical)
- [x] All `sendEmail()` calls use `entityType = 'order'`, `entityId = order.id`
- [x] Template strings match: `sla_roaster_reminder`, `sla_roaster_urgent`, `sla_buyer_delay`, `sla_admin_breach`, `sla_admin_critical`
- [x] Each SLA tier sends at most one email per order (dedup via `OrderEvent` check + `EmailLog`)
- [x] SLA thresholds are read from `PlatformSettings` (not hardcoded)
- [x] Auto-refund at T+96h calls `refundCharge()`, sets `status = REFUNDED`, creates `REFUND_COMPLETED` event
- [x] SLA job runs hourly via Inngest cron (`0 * * * *`)
- [x] Admin email sent to `PLATFORM_ALERT_EMAIL` env var (breach and critical tiers)
- [x] Job handles missing email configuration gracefully (skips sends)
- [x] No PII logged -- only `order_id`

---

## Suggested implementation steps

1. Preview all SLA templates: `pnpm --filter email dev` -> browse to `http://localhost:3004`. Verify each template renders.
2. Review `run-sla-check.tsx`:
   - Trace each `sendEmail()` call -- verify `entityType`, `entityId`, `template` params
   - Verify idempotency guards: `OrderEvent` check before creating new events
   - Verify threshold calculations against `PlatformSettings` values
3. Review auto-refund flow in `trySlaAutoRefund()`:
   - Verify `refundCharge()` call with `order.stripeChargeId`
   - Verify order status and payout status transitions
   - Verify `REFUND_COMPLETED` event creation
4. If templates need copy improvements:
   - `SlaRoasterReminderEmail`: add "Please ship order {orderNumber} by {deadline} to avoid SLA penalties"
   - `SlaRoasterUrgentEmail`: add "Your account may be affected if this is not resolved"
   - `SlaBuyerDelayEmail`: add "We apologize for the delay and are working to resolve this"
   - `SlaAdminAlertEmail`: add actionable next steps for each stage
5. Refactor standalone `orderEvent.create` calls to use `logOrderEvent()` (after US-06-03).
6. Test: create a CONFIRMED order with `fulfillBy` in the past, run the SLA job manually, verify each tier fires correctly.

---

## Handoff notes

- The SLA job and templates are already functional. This story is primarily a verification and quality pass rather than greenfield development.
- The `sendEmail()` calls use unique template strings per tier (`sla_roaster_reminder` vs `sla_roaster_urgent`), so `EmailLog` dedup correctly separates them. Each tier can send its own email to the same order.
- The `fulfillBy` field is set by the webhook at order confirmation time as `now + slaBreachHours`. The SLA job then calculates each tier's trigger time relative to `fulfillBy`.
- After US-06-03 is complete, the standalone `orderEvent.create` calls in this file should be refactored to use `logOrderEvent()`. The transactional call in `trySlaAutoRefund` (inside `$transaction`) should remain as `database.orderEvent.create`.
- The `PLATFORM_ALERT_EMAIL` env var may not be set in development -- the job handles this gracefully by skipping admin emails.

---

## Revision log

| Version | Date | Notes |
|---------|------|-------|
| 0.1 | 2026-04-01 | Initial story created for Sprint 4 planning. |
| 0.2 | 2026-04-01 | Implemented on `main`; status `Done`. |
| 0.3 | 2026-04-01 | Review follow-up: admin SLA alert copy now uses the configured threshold hours instead of fixed 48h/72h labels. |

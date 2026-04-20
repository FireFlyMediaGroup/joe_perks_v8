# US-05-03 -- Delivery Confirmation and Payout Eligibility Calculation

**Story ID:** US-05-03 | **Epic:** EP-05 (Order Fulfillment)
**Points:** 5 | **Priority:** High
**Status:** `Done`
**Owner:** Full-stack
**Dependencies:** US-05-02 (Roaster Fulfillment Page)
**Depends on this:** US-06-01 (Payout Job), US-08-04 (Delivered Email)

---

## Goal

Build an admin-facing delivery confirmation flow that transitions shipped orders from `SHIPPED` to `DELIVERED`, sets `deliveredAt`, and calculates `payoutEligibleAt` (delivered_at + payout_hold_days from `PlatformSettings`). This unlocks the payout job (US-06-01) which requires `status = DELIVERED` to transfer funds. A delivered confirmation + impact email is sent to the buyer (US-08-04). This implements Phase 4 of `docs/04-order-lifecycle.mermaid`.

---

## Diagram references

- **Order lifecycle:** [`docs/04-order-lifecycle.mermaid`](../../04-order-lifecycle.mermaid) -- Phase 4 (Delivery Confirmation): `Update Order (status=DELIVERED, delivered_at=now)`, `Set payout_eligible_at = delivered_at + 7 days`, `Create OrderEvent (ORDER_DELIVERED)`, `sendEmail(order_delivered -> buyer)`
- **Order state machine:** [`docs/08-order-state-machine.mermaid`](../../08-order-state-machine.mermaid) -- SHIPPED -> DELIVERED: `Admin confirms OR carrier webhook (Phase 2), OrderEvent ORDER_DELIVERED`
- **Stripe payment flow:** [`docs/07-stripe-payment-flow.mermaid`](../../07-stripe-payment-flow.mermaid) -- Transfer section: `payout_eligible_at <= now()` triggers payout job
- **Database ERD:** [`docs/06-database-schema.mermaid`](../../06-database-schema.mermaid) -- `Order` (deliveredAt, payoutEligibleAt, payoutStatus), `OrderEvent`, `PlatformSettings` (payoutHoldDays)

---

## Current repo evidence

- **`apps/admin/app/orders/page.tsx`** -- Lists orders with `Shipped`, `Confirmed`, `Delivered`, `Refunded`, and `All` filters.
- **`apps/admin/app/orders/[id]/page.tsx`** -- Shows full order detail, tracking, splits, and the chronological event timeline.
- **`apps/admin/app/orders/_actions/confirm-delivery.ts`** -- Updates `SHIPPED -> DELIVERED`, recalculates `payoutEligibleAt`, records a `DELIVERED` event, and stores a stable admin actor ID derived from the configured Basic Auth email.
- **`apps/admin/middleware.ts`** -- Uses shared Basic Auth parsing/credential normalization so the admin UI and the admin events API behave consistently.

---

## AGENTS.md rules that apply

- **Money as cents:** Display `payoutEligibleAt` date and payout amounts in the admin order detail view.
- **OrderEvent:** Append-only. Create `ORDER_DELIVERED` event with `actorType = ADMIN`, `actorId` from admin session.
- **Tenant isolation:** Admin queries may scope globally (this is intentional per AGENTS.md).
- **sendEmail():** Use `sendEmail()` for the delivered notification email (US-08-04 template).
- **PlatformSettings:** Read `payoutHoldDays` from the singleton -- never hardcode the hold period.

**CONVENTIONS.md patterns:**
- Admin app uses HTTP Basic Auth (MVP) -- `ADMIN_EMAIL` + `ADMIN_PASSWORD` in `apps/admin/.env.local`
- Server actions for admin mutations in `_actions/`
- Portal route structure: `_actions/`, `_components/`, `_lib/` under route segments

---

## In scope

### Admin order list page

- New route: `apps/admin/app/orders/page.tsx`
- List shipped orders that need delivery confirmation
- Default filter: `status = SHIPPED` (ready for confirmation)
- Additional filters/tabs: CONFIRMED (awaiting shipment), DELIVERED, REFUNDED
- Each row: order number, roaster name, buyer name, order date, shipped date, tracking number, status badge
- Link to order detail page

### Admin order detail page

- New route: `apps/admin/app/orders/[id]/page.tsx`
- Full order details: items, amounts, splits, tracking info, order events timeline
- "Confirm Delivery" button (visible when `status = SHIPPED`)
- Confirmation dialog before action

### Confirm delivery action

- Server action: `_actions/confirm-delivery.ts`
- Load `PlatformSettings.payoutHoldDays`
- Update `Order`: `status = DELIVERED`, `deliveredAt = now()`, `payoutEligibleAt = now() + payoutHoldDays`
- Create `OrderEvent(ORDER_DELIVERED)` with `actorType = ADMIN`
- Send delivered email to buyer (US-08-04 template)
- Return success/error

---

## Out of scope

- Carrier webhook for automatic delivery detection (Phase 2)
- Buyer-facing delivery tracking page
- Dispute flow (separate epic)
- Payout execution (US-06-01)
- Roaster-initiated delivery confirmation
- Bulk delivery confirmation (single order at a time for MVP)

---

## Primary files to create or modify

| Action | File | Purpose |
|--------|------|---------|
| Create | `apps/admin/app/orders/page.tsx` | Server component -- list orders with status filters |
| Create | `apps/admin/app/orders/[id]/page.tsx` | Server component -- order detail with delivery confirmation |
| Create | `apps/admin/app/orders/_actions/confirm-delivery.ts` | Server action -- SHIPPED -> DELIVERED transition |
| Create | `apps/admin/app/orders/_components/order-list.tsx` | Order list table with filters |
| Create | `apps/admin/app/orders/_components/order-detail.tsx` | Order detail display |
| Create | `apps/admin/app/orders/[id]/_components/event-timeline.tsx` | OrderEvent history display |

---

## Acceptance criteria

- [x] Admin can view a list of orders filtered by status (default: SHIPPED)
- [x] Order list shows: order number, roaster, buyer name, dates, tracking, status
- [x] Admin can click into an order detail page showing full order information
- [x] Order detail page shows items, amounts, split breakdown, tracking info
- [x] Order detail page shows order event timeline (chronological)
- [x] "Confirm Delivery" button is visible only when `status = SHIPPED`
- [x] Clicking "Confirm Delivery" shows a confirmation dialog
- [x] On confirmation: `Order.status` set to `DELIVERED`, `deliveredAt` set to `now()`
- [x] On confirmation: `payoutEligibleAt` calculated as `deliveredAt + PlatformSettings.payoutHoldDays` days
- [x] On confirmation: `OrderEvent` with `eventType = DELIVERED`, `actorType = ADMIN`, and a stable admin `actorId`
- [x] On confirmation: delivered email sent to buyer (when Resend configured)
- [x] After confirmation, the button is replaced with delivery info (date, payout eligible date)
- [x] Admin cannot confirm delivery for non-SHIPPED orders
- [x] Admin order pages are protected by HTTP Basic Auth

---

## Suggested implementation steps

1. Create `apps/admin/app/orders/page.tsx`:
   - Server component querying `Order` with status filter from `?status=` query param
   - Include roaster name (via `roaster.application.businessName` or `roaster.email`), buyer name
   - Render `OrderList` component with pagination
2. Create `apps/admin/app/orders/[id]/page.tsx`:
   - Load order with full relations: items, roaster, buyer, campaign.org, events
   - Render `OrderDetail` and `EventTimeline` components
   - Conditionally render "Confirm Delivery" button
3. Create `_actions/confirm-delivery.ts`:
   ```typescript
   'use server'
   const settings = await database.platformSettings.findUniqueOrThrow({ where: { id: 'singleton' } })
   const now = new Date()
   await database.$transaction([
     database.order.update({
       where: { id: orderId, status: 'SHIPPED' },
       data: {
         status: 'DELIVERED',
         deliveredAt: now,
         payoutEligibleAt: new Date(now.getTime() + settings.payoutHoldDays * 24 * 60 * 60 * 1000),
       },
     }),
     database.orderEvent.create({
       data: { orderId, eventType: 'DELIVERED', actorType: 'ADMIN', payload: {} },
     }),
   ])
   ```
4. Send delivered email after the transaction (US-08-04 template).
5. Create `_components/event-timeline.tsx` -- render `OrderEvent` rows chronologically with event type labels, actor, timestamp, and payload preview.
6. Test: ship an order via fulfillment page, confirm delivery via admin, verify status transition, verify `payoutEligibleAt` calculation, verify email.

---

## Handoff notes

- The `payoutEligibleAt` calculation in the webhook currently sets it at order confirmation time. This story overwrites it at delivery confirmation time using the actual delivery date, which is the correct behavior per the lifecycle diagram. The payout job uses `payoutEligibleAt <= now()` as its gate.
- The `order.update` WHERE clause should include `status: 'SHIPPED'` to prevent race conditions (optimistic locking pattern).
- The admin order pages establish the pattern for further admin order management (refunds, disputes) in future sprints.
- `EventTimeline` will be reused by US-06-03 (order event log API) and future admin features.
- For the `payoutHoldDays`, the diagram says 7 days. This is configurable via `PlatformSettings` -- never hardcode.

---

## Revision log

| Version | Date | Notes |
|---------|------|-------|
| 0.1 | 2026-04-01 | Initial story created for Sprint 4 planning. |
| 0.2 | 2026-04-01 | Implemented on `main`; status `Done`. |
| 0.3 | 2026-04-01 | Review follow-up: `DELIVERED` events now store an admin actor ID and the admin list exposes a dedicated `Refunded` tab. |

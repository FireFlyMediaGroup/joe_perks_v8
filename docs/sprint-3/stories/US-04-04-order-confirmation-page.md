# US-04-04 -- Order Confirmation Page with Payment Status Polling

**Story ID:** US-04-04 | **Epic:** EP-04 (Buyer Storefront & Checkout)
**Points:** 5 | **Priority:** High
**Status:** `Todo`
**Owner:** Frontend / Full-stack
**Dependencies:** US-04-03 (Three-Step Checkout)
**Depends on this:** None

---

## Goal

Replace the scaffold at `apps/web/app/[locale]/[slug]/order/[pi_id]/page.tsx` with a real order confirmation page. After Stripe payment, the buyer is redirected here. The page polls `GET /api/order-status?pi=[pi_id]` until the order transitions from `PENDING` to `CONFIRMED` (triggered by the `payment_intent.succeeded` webhook). Once confirmed, the page displays the order number, items, totals, and a message about the fundraiser contribution.

---

## Diagram references

- **Order state machine:** [`docs/08-order-state-machine.mermaid`](../../08-order-state-machine.mermaid) -- `PENDING` to `CONFIRMED` transition (payment_intent.succeeded webhook, order_number generated, magic link sent to roaster)
- **Order lifecycle:** [`docs/04-order-lifecycle.mermaid`](../../04-order-lifecycle.mermaid) -- Phase 1 end (payment success, redirect to `/[slug]/order/[pi_id]`) and Phase 2 (webhook processes, order confirmed)
- **Database ERD:** [`docs/06-database-schema.mermaid`](../../06-database-schema.mermaid) -- `Order`, `OrderItem` models

---

## Current repo evidence

- `apps/web/app/[locale]/[slug]/order/[pi_id]/page.tsx` exists as **scaffold** -- shows slug and PaymentIntent ID only
- `apps/web/app/api/order-status/route.ts` is **fully implemented**:
  - `GET /api/order-status?pi=[pi_id]` or `?id=[orderId]`
  - Returns: `id`, `orderNumber`, `status`, `grossAmount`, `productSubtotal`, `shippingAmount`, `orgAmount`, `orgPctSnapshot`, `trackingNumber`, `carrier`, `createdAt`, `items[]` (with `productName`, `variantDesc`, `quantity`, `unitPrice`, `lineTotal`)
- `apps/web/app/api/webhooks/stripe/route.ts` handles `payment_intent.succeeded`:
  - Updates `Order.status` to `CONFIRMED`
  - Generates order number
  - Creates `MagicLink` for roaster fulfillment
  - Creates `OrderEvent` (ORDER_CREATED)
- `Order` model: `status` (`OrderStatus`: `PENDING`, `CONFIRMED`, `SHIPPED`, `DELIVERED`, `REFUNDED`, `CANCELLED`), `orderNumber`, `grossAmount`, `productSubtotal`, `shippingAmount`, `orgAmount`, `orgPctSnapshot`, `stripePiId`

---

## AGENTS.md rules that apply

- **Money as cents:** All amounts in the API response are cents. Display: `(cents / 100).toFixed(2)`.
- **No auth:** Order confirmation is a public page. Access is controlled by knowing the PaymentIntent ID (URL is only shared with the buyer via redirect).

**CONVENTIONS.md patterns:**
- Server component for initial page load (attempt to fetch order by PI ID)
- Client component for polling (status poller with interval)
- No direct DB access from client -- use the existing `order-status` API

---

## In scope

- Confirmation page at `[locale]/[slug]/order/[pi_id]/page.tsx`
- Initial server-side fetch of order by PaymentIntent ID
- If order exists and `status >= CONFIRMED`: render full confirmation immediately
- If order exists and `status = PENDING`: render polling state with spinner/animation
- Client-side polling component: poll `GET /api/order-status?pi=[pi_id]` every 2 seconds
- Stop polling on confirmation or after 30-second timeout
- Confirmed state: order number, items with details, subtotal, shipping, total, fundraiser contribution
- Timeout state: message that order is processing, check email for confirmation

---

## Out of scope

- Order tracking page (Phase 2 -- uses `trackingNumber` and `carrier`)
- Order history for buyers (Phase 2 -- requires buyer auth)
- Real-time WebSocket updates (polling is sufficient for MVP)
- Printing/PDF receipts

---

## Primary files to create or modify

| Action | File | Purpose |
|--------|------|---------|
| Modify | `apps/web/app/[locale]/[slug]/order/[pi_id]/page.tsx` | Server component -- initial order fetch, render confirmation or polling state |
| Create | `apps/web/app/[locale]/[slug]/order/[pi_id]/_components/order-status-poller.tsx` | Client component -- polls order-status API until confirmed |
| Create | `apps/web/app/[locale]/[slug]/order/[pi_id]/_components/order-summary.tsx` | Display confirmed order details |
| Create | `apps/web/app/[locale]/[slug]/order/[pi_id]/_components/order-processing.tsx` | Loading/polling state with animation |

---

## Acceptance criteria

- [ ] After checkout redirect, page loads at `/[slug]/order/[pi_id]`
- [ ] If order is already CONFIRMED (webhook fired before page load): shows full confirmation immediately
- [ ] If order is PENDING: shows processing state with spinner/animation
- [ ] Polling fires every 2 seconds while status is PENDING
- [ ] When status transitions to CONFIRMED: polling stops, confirmation state renders
- [ ] After 30 seconds without confirmation: shows "processing" message with instruction to check email
- [ ] Confirmed state shows order number (e.g. "JP-00042")
- [ ] Confirmed state shows all items with product names, variant descriptions, quantities, unit prices, line totals
- [ ] Confirmed state shows subtotal, shipping amount, and total (`grossAmount`) formatted as dollars
- [ ] Confirmed state shows fundraiser contribution: "X% ($Y.YY) supports [org name]"
- [ ] `orgPctSnapshot` and `orgAmount` from the order are used for the fundraiser display
- [ ] Scaffold placeholder text removed
- [ ] Page is mobile responsive

---

## Suggested implementation steps

1. Update `page.tsx` (server component):
   - Extract `pi_id` from params
   - Fetch order from DB by `stripePiId` (or call the order-status API internally)
   - If order not found: show "Order not found" message
   - If order `status = CONFIRMED` or later: pass order data to `OrderSummary`
   - If order `status = PENDING`: render `OrderStatusPoller` client component with `piId` prop
2. Build `order-processing.tsx`:
   - Animated spinner or loading state
   - "Processing your payment..." message
   - Passes to poller for active polling
3. Build `order-status-poller.tsx` (client component):
   - `useEffect` with `setInterval` (2 seconds)
   - Fetch `GET /api/order-status?pi=[piId]`
   - When `status !== 'PENDING'`: clear interval, set order data in state
   - After 30 seconds (15 polls): clear interval, show timeout message
   - Render `OrderSummary` when confirmed, `OrderProcessing` when polling
4. Build `order-summary.tsx`:
   - Order number display (prominent)
   - Items list with details
   - Price breakdown: subtotal, shipping, total
   - Fundraiser contribution message with percentage and dollar amount
   - Success check mark or icon
   - "Continue shopping" link back to storefront
5. Test: immediate confirmation, polling to confirmation, timeout, mobile.

---

## Handoff notes

- The `order-status` API returns the same data shape regardless of status. The client uses the `status` field to decide what to render.
- The webhook handler (`payment_intent.succeeded`) also sends an email to the buyer (US-08-01) and creates a magic link for the roaster. The confirmation page does not need to trigger these -- they happen server-side via the webhook.
- If the buyer revisits this URL later, the page should still show the confirmed order (it is a permalink).
- The `orgPctSnapshot` field on the Order is the frozen org percentage used at checkout. Use this (not the current campaign `orgPct`) for the fundraiser display.
- Consider clearing the Zustand cart (`useCartStore().clear()`) when the confirmation page renders the confirmed state.

---

## Revision log

| Version | Date | Notes |
|---------|------|-------|
| 0.1 | 2026-03-30 | Initial story created for Sprint 3 planning. |

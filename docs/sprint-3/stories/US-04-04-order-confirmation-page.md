# US-04-04 -- Order Confirmation Page with Payment Status Polling

**Story ID:** US-04-04 | **Epic:** EP-04 (Buyer Storefront & Checkout)
**Points:** 5 | **Priority:** High
**Status:** `Done`
**Owner:** Frontend / Full-stack
**Dependencies:** US-04-03 (Three-Step Checkout)
**Depends on this:** None

---

## Goal

The page at `apps/web/app/[locale]/[slug]/order/[pi_id]/page.tsx` confirms the buyer’s order after Stripe payment. It loads the order by PaymentIntent id; if **`PENDING`**, it shows **`OrderStatusPoller`**, which polls **`GET /api/order-status?pi=[pi_id]`** until the order is no longer pending (typically **`CONFIRMED`** after `payment_intent.succeeded`). The UI shows order number, line items, totals, and fundraiser messaging using **`orgPctSnapshot`**, **`orgAmount`**, and **`orgName`**.

---

## Diagram references

- **Order state machine:** [`docs/08-order-state-machine.mermaid`](../../08-order-state-machine.mermaid) -- `PENDING` to `CONFIRMED` transition (`payment_intent.succeeded` webhook)
- **Order lifecycle:** [`docs/04-order-lifecycle.mermaid`](../../04-order-lifecycle.mermaid) -- Phase 1 end (redirect to `/[locale]/[slug]/order/[pi_id]`) and Phase 2 (webhook confirms order)
- **Database ERD:** [`docs/06-database-schema.mermaid`](../../06-database-schema.mermaid) -- `Order`, `OrderItem` models

---

## Current repo evidence

- **`apps/web/app/[locale]/[slug]/order/[pi_id]/page.tsx`** -- Server component: loads order by **`stripePiId`** with Prisma; validates **`order.campaign.org.slug === slug`**; if not found → “Order not found”; if **`PENDING`** → **`OrderStatusPoller`**; else → **`OrderSummary`** with server data
- **`apps/web/app/api/order-status/route.ts`** -- **`GET /api/order-status?pi=`** or **`?id=`**; returns **`orgName`** (from org application), plus amounts, **`items[]`**, etc.
- **`apps/web/app/api/webhooks/stripe/route.ts`** -- On **`payment_intent.succeeded`**: sets **`Order.status`** to **`CONFIRMED`**, updates **`totalRaised`**, creates **`PAYMENT_SUCCEEDED`** **`OrderEvent`**, sends buyer **`order_confirmation`** email. **Order number** is assigned at **`create-intent`** (not in this webhook handler).
- **`Order` model:** `status`, `orderNumber`, `grossAmount`, `productSubtotal`, `shippingAmount`, `orgAmount`, `orgPctSnapshot`, `stripePiId`, …

---

## AGENTS.md rules that apply

- **Money as cents:** All amounts in the API response are cents. Display: `(cents / 100).toFixed(2)` or `formatCentsAsDollars`.
- **No auth:** Order confirmation is a public page. Access is controlled by knowing the PaymentIntent ID (URL from Stripe redirect).

**CONVENTIONS.md patterns:**
- Server component for initial page load (Prisma order fetch)
- Client component for polling (**`order-status-poller.tsx`**)
- Poller uses the public **`order-status`** API (also used for **`orgName`** when confirming via poll)

---

## In scope

- Confirmation page at `[locale]/[slug]/order/[pi_id]/page.tsx`
- Initial server-side load by PaymentIntent id
- If order **`CONFIRMED`** (or other non-**`PENDING`**): render **`OrderSummary`** immediately
- If **`PENDING`**: render **`OrderStatusPoller`**
- Poll every **2** seconds; stop on success or **30** s timeout
- Confirmed state: order number, items, subtotal, shipping, total, fundraiser line
- Timeout: message to check email

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
| Done | `apps/web/app/[locale]/[slug]/order/[pi_id]/page.tsx` | Server component -- order fetch, slug guard, PENDING vs confirmed |
| Done | `apps/web/app/[locale]/[slug]/order/[pi_id]/_components/order-status-poller.tsx` | Client -- polls until not `PENDING` or timeout |
| Done | `apps/web/app/[locale]/[slug]/order/[pi_id]/_components/order-summary.tsx` | Confirmed UI; clears cart on mount |
| Done | `apps/web/app/[locale]/[slug]/order/[pi_id]/_components/order-processing.tsx` | Spinner while polling |

---

## Acceptance criteria

- [x] After checkout redirect, page loads at `/[locale]/[slug]/order/[pi_id]`
- [x] If order is already CONFIRMED (webhook fired before page load): shows full confirmation immediately
- [x] If order is PENDING: shows processing state with spinner/animation
- [x] Polling fires every 2 seconds while status is PENDING
- [x] When status transitions to non-PENDING: polling stops, confirmation state renders
- [x] After 30 seconds without confirmation: shows "processing" message with instruction to check email
- [x] Confirmed state shows order number (e.g. "JP-00042")
- [x] Confirmed state shows all items with product names, variant descriptions, quantities, unit prices, line totals
- [x] Confirmed state shows subtotal, shipping amount, and total (`grossAmount`) formatted as dollars
- [x] Confirmed state shows fundraiser contribution using `orgPctSnapshot`, `orgAmount`, and `orgName`
- [x] Scaffold placeholder text removed
- [x] Page is mobile responsive

---

## Handoff notes

- The **`order-status`** API returns a consistent JSON shape; the client uses **`status`** and **`orgName`** as needed.
- The webhook sends the buyer **`order_confirmation`** email (US-08-01); the confirmation page does not send mail.
- Revisiting the URL later still shows the confirmed order (permalink).
- **`orgPctSnapshot`** on **`Order`** is the frozen org percentage for display (not live campaign **`orgPct`**).
- **`OrderSummary`** calls **`useCartStore().clear()`** on mount when showing confirmation.

---

## Revision log

| Version | Date | Notes |
|---------|------|-------|
| 0.1 | 2026-03-30 | Initial story created for Sprint 3 planning. |
| 0.2 | 2026-04-01 | Marked Done; aligned evidence with Prisma page + webhook behavior. |

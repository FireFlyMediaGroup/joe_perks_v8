# US-05-02 -- Roaster Magic Link Fulfillment Page: View Order and Submit Tracking

**Story ID:** US-05-02 | **Epic:** EP-05 (Order Fulfillment)
**Points:** 8 | **Priority:** High
**Status:** `Done`
**Owner:** Full-stack
**Dependencies:** US-05-01 (Webhook Fulfillment Magic Link)
**Depends on this:** US-05-03 (Delivery Confirmation), US-08-03 (Shipped Email)

---

## Goal

Replace the stub at `apps/roaster/app/fulfill/[token]/page.tsx` with a fully functional magic link fulfillment page. The page validates the `ORDER_FULFILLMENT` token, displays complete order details (items, quantities, prices, shipping info, payout breakdown), and provides a form for the roaster to enter a tracking number and carrier. On submission, the order transitions from `CONFIRMED` to `SHIPPED`, the magic link is consumed (`usedAt = now()`), and a shipped notification email is sent to the buyer. This implements Phase 3 of `docs/04-order-lifecycle.mermaid`.

---

## Diagram references

- **Order lifecycle:** [`docs/04-order-lifecycle.mermaid`](../../04-order-lifecycle.mermaid) -- Phase 3 (Roaster Fulfillment): validate MagicLink, fetch Order with items/splits, update Order (status=SHIPPED, tracking_number, carrier, shipped_at), set MagicLink.used_at, create OrderEvent (ORDER_SHIPPED), sendEmail(order_shipped -> buyer)
- **Order state machine:** [`docs/08-order-state-machine.mermaid`](../../08-order-state-machine.mermaid) -- CONFIRMED -> SHIPPED: `Roaster enters tracking via magic link or portal, OrderEvent ORDER_SHIPPED`
- **Database ERD:** [`docs/06-database-schema.mermaid`](../../06-database-schema.mermaid) -- `Order`, `OrderItem`, `MagicLink`, `OrderEvent`, `Roaster`, `Buyer`

---

## Current repo evidence

- **`apps/roaster/app/fulfill/[token]/page.tsx`** -- Validates the token, loads the order, records `FULFILLMENT_VIEWED`, renders `FulfillmentDetails`, and shows the tracking form for `CONFIRMED` orders.
- **`apps/roaster/app/fulfill/[token]/_components/fulfillment-details.tsx`** -- Shows order number, order date, status, item snapshots, totals, payout breakdown, fundraiser context, and buyer name only.
- **`apps/roaster/app/fulfill/[token]/_actions/submit-tracking.ts`** -- Re-validates and consumes the magic link inside a transaction, updates the order to `SHIPPED`, records the `SHIPPED` event, and sends the shipped email.
- **No authentication required** -- Magic link pages remain accessible without Clerk session per AGENTS.md.

---

## AGENTS.md rules that apply

- **Magic links:** Single-use: set `usedAt = now()` immediately on first use BEFORE performing any action. Verify: token exists, `expiresAt > now()`, `usedAt IS NULL`, correct `purpose` (`ORDER_FULFILLMENT`). Accessible WITHOUT authentication.
- **Money as cents:** Display order amounts using `(cents / 100).toFixed(2)`. Show roaster payout breakdown (roasterAmount, shippingAmount = roasterTotal).
- **OrderEvent:** Append-only. Create `FULFILLMENT_VIEWED` when page loads (token valid), `SHIPPED` when tracking submitted.
- **Logging/PII:** Never log buyer address or email. Log `order_id`, `tracking_number` on submission.

**CONVENTIONS.md patterns:**
- Server component for page shell (validates token, loads order data)
- Client component for the tracking form (interactivity, form state)
- Server action in `_actions/` for the submit mutation
- `_lib/` for token validation helper
- `_components/` for UI components

---

## In scope

### Token validation

- Validate magic link: token exists, `purpose = ORDER_FULFILLMENT`, `expiresAt > now()`, `usedAt IS NULL`
- If invalid/expired/used: show appropriate error message (expired, already used, not found)
- Extract `order_id` from `MagicLink.payload`
- Create `OrderEvent(FULFILLMENT_VIEWED)` on valid page load

### Order details display

- Order number, order date, order status badge
- Items list: product name, variant description, quantity, unit price, line total (from `OrderItem` snapshots)
- Subtotal, shipping amount, total (gross amount)
- Payout breakdown: roaster amount, shipping passthrough, roaster total
- Org contribution amount and org name (informational)
- Buyer name (for label addressing -- do NOT show buyer email or address)

### Tracking form

- Tracking number input (required)
- Carrier dropdown or text input (required): common carriers (USPS, UPS, FedEx, DHL) + "Other" with free-text
- "Mark as Shipped" button
- Loading/submitting state
- Success confirmation view after submission

### On submission (server action)

- Verify token is still valid (not used, not expired) -- race condition guard
- Set `MagicLink.usedAt = now()` FIRST (single-use enforcement)
- Update `Order`: `status = SHIPPED`, `trackingNumber`, `carrier`, `shippedAt = now()`
- Create `OrderEvent(SHIPPED)` with `actorType = ROASTER`, `actorId = roasterId`, `payload = { tracking_number, carrier }`
- Send shipped notification email to buyer (US-08-03 template)

---

## Out of scope

- Authenticated roaster portal fulfillment (Phase 2 feature)
- Shipping label generation (EasyPost -- Phase 2)
- Multiple shipments per order (split fulfillment)
- Buyer address display (PII concern for MVP magic link page)
- Editing tracking info after submission (link is consumed)
- Delivery confirmation (US-05-03)

---

## Primary files to create or modify

| Action | File | Purpose |
|--------|------|---------|
| Modify | `apps/roaster/app/fulfill/[token]/page.tsx` | Server component -- validate token, load order, render details + form |
| Create | `apps/roaster/app/fulfill/[token]/_actions/submit-tracking.ts` | Server action -- consume token, update order to SHIPPED, send email |
| Create | `apps/roaster/app/fulfill/[token]/_components/fulfillment-details.tsx` | Server or client component -- order info, items list, payout breakdown |
| Create | `apps/roaster/app/fulfill/[token]/_components/tracking-form.tsx` | Client component -- tracking number + carrier input |
| Create | `apps/roaster/app/fulfill/[token]/_lib/validate-token.ts` | Helper: validate MagicLink token, return order data or error |

---

## Acceptance criteria

- [x] Visiting `/fulfill/[token]` with a valid, unused, non-expired `ORDER_FULFILLMENT` token shows order details
- [x] Visiting with an expired token shows "This link has expired" message
- [x] Visiting with a used token shows "This link has already been used" message
- [x] Visiting with a non-existent token shows "Invalid link" message
- [x] Order details display: order number, items with names/quantities/prices, subtotal, shipping, total
- [x] Payout breakdown shows roaster amount, shipping passthrough, and roaster total
- [x] `OrderEvent(FULFILLMENT_VIEWED)` is created when the page loads with a valid token
- [x] Tracking form has required tracking number and carrier fields
- [x] Carrier field offers common options (USPS, UPS, FedEx, DHL, Other)
- [x] On submission: `MagicLink.usedAt` is set BEFORE order update (single-use enforcement)
- [x] On submission: `Order.status` transitions to `SHIPPED`, `trackingNumber`, `carrier`, `shippedAt` are set
- [x] On submission: `OrderEvent(SHIPPED)` is created with tracking details in payload
- [x] On submission: shipped notification email is sent to buyer (when Resend configured)
- [x] Success view shows confirmation with order number and tracking info
- [x] Page is accessible without authentication (no Clerk session required)
- [x] Mobile responsive with 44x44px touch targets
- [x] No buyer email, address, or PII displayed on the page

---

## Suggested implementation steps

1. Create `_lib/validate-token.ts`:
   - Query `MagicLink` by token with `purpose = ORDER_FULFILLMENT`
   - Check `expiresAt > now()`, `usedAt IS NULL`
   - Return discriminated union: `{ valid: true, magicLink, orderId }` or `{ valid: false, reason: 'expired' | 'used' | 'not_found' }`
2. Update `page.tsx` server component:
   - Call `validateToken(token)`
   - If invalid, render error view with appropriate message
   - If valid, load order with items, roaster, campaign.org relations
   - Create `OrderEvent(FULFILLMENT_VIEWED)` (guard: only if not already viewed -- check for existing event)
   - Render `FulfillmentDetails` and `TrackingForm`
3. Create `_components/fulfillment-details.tsx`:
   - Display order number, date, status
   - Items table: name, variant, qty, unit price, line total
   - Subtotal, shipping, total
   - Payout section: roaster amount + shipping = roaster total
4. Create `_components/tracking-form.tsx` (`'use client'`):
   - Tracking number text input (required)
   - Carrier select (USPS, UPS, FedEx, DHL, Other) + free text for Other
   - Submit button with loading state
   - Call server action `submitTracking(token, trackingNumber, carrier)`
   - On success: show confirmation, hide form
5. Create `_actions/submit-tracking.ts` (`'use server'`):
   - Re-validate token (race condition guard)
   - `$transaction`: set `MagicLink.usedAt`, update `Order` (SHIPPED + tracking), create `OrderEvent`
   - After transaction: send shipped email via `sendEmail()`
   - Return `{ success: true }` or `{ success: false, error }`
6. Test: create a magic link via US-05-01, visit the page, submit tracking, verify order status, verify email, verify link is consumed.

---

## Handoff notes

- The existing `org-requests/[token]/page.tsx` in `apps/roaster` is a good reference for the token validation and page structure pattern.
- The `Order` includes `roasterAmount`, `shippingAmount`, `roasterTotal` -- use these frozen values for the payout breakdown display. Never recalculate.
- Buyer name is available from `Order.buyer.name` for display (e.g., "Ship to: John D."). Do NOT display buyer email or full address on this unauthenticated page.
- The tracking form consumes the magic link on submission. If the roaster needs to update tracking info later, they must do so through the authenticated roaster portal (Phase 2).
- `FULFILLMENT_VIEWED` event should only be created once per magic link -- guard with a `findFirst` check before inserting.

---

## Revision log

| Version | Date | Notes |
|---------|------|-------|
| 0.1 | 2026-04-01 | Initial story created for Sprint 4 planning. |
| 0.2 | 2026-04-01 | Implemented on `main`; status `Done`. |
| 0.3 | 2026-04-01 | Review follow-up: fulfillment details now explicitly render the order date to match the story acceptance criteria. |

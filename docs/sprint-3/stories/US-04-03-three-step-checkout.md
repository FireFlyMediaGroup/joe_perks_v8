# US-04-03 -- Three-Step Checkout: Cart Review, Shipping Details, Payment

**Story ID:** US-04-03 | **Epic:** EP-04 (Buyer Storefront & Checkout)
**Points:** 8 | **Priority:** High
**Status:** `Todo`
**Owner:** Full-stack
**Dependencies:** US-04-02 (Zustand Cart), US-01-05 (Stripe Checkout API)
**Depends on this:** US-04-04 (Order Confirmation Page)

---

## Goal

Replace the scaffold at `apps/web/app/[locale]/[slug]/checkout/page.tsx` with a three-step checkout flow: (1) cart review with quantity adjustments, (2) shipping details and rate selection, (3) payment via Stripe Elements. The checkout calls the existing `POST /api/checkout/create-intent` endpoint to create the PaymentIntent and Order, then uses Stripe Elements for payment confirmation. On success, the buyer is redirected to the order confirmation page.

---

## Diagram references

- **Order lifecycle:** [`docs/04-order-lifecycle.mermaid`](../../04-order-lifecycle.mermaid) -- Phase 1 (Checkout: POST /api/checkout/create-intent, calculateSplits, PaymentIntent, Order PENDING)
- **Stripe payment flow:** [`docs/07-stripe-payment-flow.mermaid`](../../07-stripe-payment-flow.mermaid) -- Charge section (buyer submits checkout, server calculateSplits, all splits FROZEN, paymentIntents.create, buyer pays via Stripe Elements)
- **Order state machine:** [`docs/08-order-state-machine.mermaid`](../../08-order-state-machine.mermaid) -- PENDING state (PaymentIntent created)
- **Database ERD:** [`docs/06-database-schema.mermaid`](../../06-database-schema.mermaid) -- `Order`, `OrderItem`, `OrderEvent`, `Buyer`, `RoasterShippingRate`

---

## Current repo evidence

- `apps/web/app/[locale]/[slug]/checkout/page.tsx` exists as **scaffold** ("3-step flow scaffold.")
- `apps/web/app/api/checkout/create-intent/route.ts` is **fully implemented**:
  - Validates: `campaignId`, `items[]` (campaignItemId + quantity), `buyerEmail`, `buyerName?`, `shippingRateId`
  - Loads campaign (must be ACTIVE), campaign items, roaster (must be ACTIVE), shipping rate
  - Validates: items exist, products/variants not deleted, variant available, single roaster
  - Calls `calculateSplits()` from `@joe-perks/stripe`
  - Creates Stripe `paymentIntents.create()` with `transfer_group = orderId`
  - `$transaction`: upsert `Buyer`, create `Order` (PENDING), `OrderItem`s, `OrderEvent` (PAYMENT_INTENT_CREATED)
  - Returns `{ clientSecret, orderId, orderNumber }`
  - Rate limited via `limitCheckout(ip)` (5 req/hr per IP)
- `apps/web/app/api/order-status/route.ts` is implemented (used by US-04-04)
- `packages/ui/src/store/cart.ts` will have full cart store from US-04-02
- `RoasterShippingRate` model: `label`, `carrier`, `flatRate` (cents), `isDefault`, `roasterId`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` configured in `apps/web/.env.local`
- `@stripe/react-stripe-js` and `@stripe/stripe-js` are NOT yet in `apps/web` dependencies

---

## AGENTS.md rules that apply

- **Money as cents:** All prices, shipping rates, and totals are in cents. Display: `(cents / 100).toFixed(2)`.
- **Split calculations:** Handled by `POST /api/checkout/create-intent` using `calculateSplits()` -- no client-side split math.
- **CampaignItem prices:** Cart uses `CampaignItem.retailPrice`. The `create-intent` API re-validates all prices server-side.
- **Stripe:** Never import Stripe directly in an app. For client-side Stripe Elements, use `@stripe/react-stripe-js` (this is the sanctioned browser SDK, not the server SDK). The publishable key (`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`) is a client-side env var.
- **Logging/PII:** Never log buyer address, email, or card data. The checkout API already follows this.

**CONVENTIONS.md patterns:**
- Server component for page shell (loads shipping rates, validates campaign)
- Client component for the multi-step form (interactivity, Stripe Elements, cart state)
- API route pattern: validate -> business logic -> `Response.json()`

---

## In scope

### Step 1 -- Cart review

- Display cart items from `useCartStore()` with product names, variant descriptions, quantities, unit prices, line totals
- Allow quantity adjustments (reuse cart store `updateQuantity`)
- Show subtotal
- Guard: redirect to storefront if cart is empty
- "Continue to shipping" button

### Step 2 -- Shipping details

- Buyer info: name (required), email (required, validated)
- Shipping address: street, city, state, zip (captured for display/future use)
- Shipping rate selection: radio buttons for roaster's `RoasterShippingRate`s (loaded server-side)
- Display shipping cost from selected rate
- Order summary: subtotal + shipping = estimated total
- "Continue to payment" button

### Step 3 -- Payment

- Full order summary: items + shipping + total
- Stripe Elements (`PaymentElement` or `CardElement`) for card input
- Call `POST /api/checkout/create-intent` with cart data to get `clientSecret`
- `stripe.confirmPayment()` with `return_url` pointing to `[slug]/order/{PAYMENT_INTENT_ID}`
- Loading/processing states during API call and payment confirmation
- Error display for declined/failed payments

### Dependencies

- Add `@stripe/react-stripe-js` and `@stripe/stripe-js` to `apps/web`

---

## Out of scope

- Server-side split calculation display (splits are frozen on the Order by the API)
- Saved payment methods
- Guest vs. account checkout (all buyers are guests for MVP)
- Address validation API
- Tax calculation
- Discount codes / coupons

---

## Primary files to create or modify

| Action | File | Purpose |
|--------|------|---------|
| Modify | `apps/web/app/[locale]/[slug]/checkout/page.tsx` | Server component -- load campaign, shipping rates, render checkout |
| Create | `apps/web/app/[locale]/[slug]/checkout/_components/checkout-form.tsx` | Client component -- 3-step form with state management |
| Create | `apps/web/app/[locale]/[slug]/checkout/_components/step-cart-review.tsx` | Step 1 -- cart review with quantity controls |
| Create | `apps/web/app/[locale]/[slug]/checkout/_components/step-shipping.tsx` | Step 2 -- shipping details + rate selection |
| Create | `apps/web/app/[locale]/[slug]/checkout/_components/step-payment.tsx` | Step 3 -- Stripe Elements + payment |
| Create | `apps/web/app/[locale]/[slug]/checkout/_components/order-summary-sidebar.tsx` | Running order total sidebar |
| Create | `apps/web/app/[locale]/[slug]/checkout/_lib/schema.ts` | Zod schema for shipping form |
| Create | `apps/web/app/[locale]/[slug]/checkout/_lib/stripe-provider.tsx` | Stripe Elements provider wrapper |
| Modify | `apps/web/package.json` | Add `@stripe/react-stripe-js`, `@stripe/stripe-js` |

---

## Acceptance criteria

### Step 1 -- Cart review

- [ ] Displays all cart items with product name, variant description, quantity, unit price, line total
- [ ] Quantity can be adjusted (+/- buttons or input)
- [ ] Removing all items redirects to storefront
- [ ] Subtotal displayed (sum of line totals)
- [ ] "Continue to shipping" advances to step 2

### Step 2 -- Shipping details

- [ ] Buyer name field (required)
- [ ] Buyer email field (required, email format validated)
- [ ] Shipping address fields: street, city, state, zip
- [ ] Shipping rate selection from roaster's rates (radio buttons)
- [ ] Default shipping rate pre-selected if `isDefault = true`
- [ ] Shipping cost displayed from selected rate
- [ ] Order summary shows subtotal + shipping = estimated total
- [ ] Per-step validation before advancement
- [ ] "Back to cart" returns to step 1
- [ ] "Continue to payment" advances to step 3

### Step 3 -- Payment

- [ ] Order summary displayed (items + shipping + total)
- [ ] Stripe Elements card input renders
- [ ] "Pay $XX.XX" button calls `POST /api/checkout/create-intent` then `stripe.confirmPayment()`
- [ ] Request body matches API schema: `campaignId`, `items[]`, `buyerEmail`, `buyerName`, `shippingRateId`
- [ ] Loading state during API call and payment processing
- [ ] On success: redirect to `[slug]/order/[pi_id]`
- [ ] On failure: display error message, allow retry
- [ ] Rate limiting handled gracefully (429 from API shows user-friendly message)

### General

- [ ] Progress indicator shows current step (1/2/3)
- [ ] Back navigation between steps preserves form data
- [ ] Mobile responsive with 44x44px touch targets
- [ ] Scaffold placeholder text removed
- [ ] `@stripe/react-stripe-js` and `@stripe/stripe-js` added to `apps/web` dependencies

---

## Suggested implementation steps

1. Add Stripe client dependencies:
   ```bash
   pnpm add @stripe/react-stripe-js @stripe/stripe-js --filter web
   ```
2. Create `_lib/stripe-provider.tsx` -- Stripe Elements provider:
   - `loadStripe(NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)`
   - `Elements` wrapper component
3. Create `_lib/schema.ts` -- Zod schemas for shipping form fields.
4. Update `checkout/page.tsx` (server component):
   - Load `Org` by slug, active `Campaign`, `RoasterShippingRate`s for the campaign's roaster
   - Guard: redirect if slug invalid, campaign inactive, or no campaign
   - Render `CheckoutForm` client component wrapped in Stripe provider
5. Build `checkout-form.tsx` (client component):
   - Step state (1, 2, 3) with forward/back navigation
   - Form state for shipping details (React hook form or useState)
   - Progress indicator
6. Build `step-cart-review.tsx`:
   - Read from `useCartStore()`
   - Display items with quantity controls
   - Subtotal calculation
   - Guard: redirect if empty
7. Build `step-shipping.tsx`:
   - Buyer name + email inputs
   - Address fields
   - Shipping rate radio buttons (props from server)
   - Order summary with subtotal + shipping
8. Build `step-payment.tsx`:
   - Order summary display
   - Call `POST /api/checkout/create-intent` with form data + cart items
   - On success: set `clientSecret` on Elements
   - Render `PaymentElement` or `CardElement`
   - "Pay" button calls `stripe.confirmPayment({ confirmParams: { return_url } })`
   - Handle errors
9. Build `order-summary-sidebar.tsx` -- optional running total display.
10. Test: full flow from cart review through payment, error cases, mobile.

---

## Handoff notes

- The `create-intent` API returns `{ clientSecret, orderId, orderNumber }`. The `clientSecret` is used with `stripe.confirmPayment()`. The redirect URL after payment should be `/[slug]/order/[pi_id]` where `pi_id` is the PaymentIntent ID (Stripe includes it in the redirect).
- Stripe Elements will handle SCA (3D Secure) automatically when `confirmPayment` is used with a `return_url`.
- The shipping address is captured client-side for the confirmation page but is NOT stored in the `Order` model (no address columns in MVP schema -- see `docs/joe_perks_db_schema.md` section 1.2). Consider storing in `localStorage` keyed by `orderId` for the confirmation display, or adding schema columns in a follow-up migration.
- The `create-intent` API already handles: campaign validation, item availability, single-roaster check, split calculation, buyer upsert, order creation, and order event logging. The checkout UI is primarily a client-side form that calls this existing endpoint.

---

## Revision log

| Version | Date | Notes |
|---------|------|-------|
| 0.1 | 2026-03-30 | Initial story created for Sprint 3 planning. |

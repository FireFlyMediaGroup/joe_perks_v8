# US-04-03 -- Three-Step Checkout: Cart Review, Shipping Details, Payment

**Story ID:** US-04-03 | **Epic:** EP-04 (Buyer Storefront & Checkout)
**Points:** 8 | **Priority:** High
**Status:** `Done`
**Owner:** Full-stack
**Dependencies:** US-04-02 (Zustand Cart), US-01-05 (Stripe Checkout API)
**Depends on this:** US-04-04 (Order Confirmation Page)

---

## Goal

The checkout at `apps/web/app/[locale]/[slug]/checkout/page.tsx` implements a three-step flow: (1) cart review with quantity adjustments, (2) shipping details and rate selection, (3) payment via Stripe Elements. The flow calls `POST /api/checkout/create-intent` to create the PaymentIntent and Order, then uses Stripe Elements for payment confirmation. On success, the buyer is redirected to the order confirmation page.

---

## Diagram references

- **Order lifecycle:** [`docs/04-order-lifecycle.mermaid`](../../04-order-lifecycle.mermaid) -- Phase 1 (Checkout: POST /api/checkout/create-intent, calculateSplits, PaymentIntent, Order PENDING)
- **Stripe payment flow:** [`docs/07-stripe-payment-flow.mermaid`](../../07-stripe-payment-flow.mermaid) -- Charge section (buyer submits checkout, server calculateSplits, all splits FROZEN, paymentIntents.create, buyer pays via Stripe Elements)
- **Order state machine:** [`docs/08-order-state-machine.mermaid`](../../08-order-state-machine.mermaid) -- PENDING state (PaymentIntent created)
- **Database ERD:** [`docs/06-database-schema.mermaid`](../../06-database-schema.mermaid) -- `Order`, `OrderItem`, `OrderEvent`, `Buyer`, `RoasterShippingRate`

---

## Current repo evidence

- **`apps/web/app/[locale]/[slug]/checkout/page.tsx`** -- Server component: `getStorefrontData(slug)`; if `!hasShippingRates`, `redirect` to `/{locale}/{slug}?error=no-shipping`; else renders **`CheckoutForm`** with campaign id, shipping rates, locale, org name.
- **`apps/web/app/api/checkout/create-intent/route.ts`** -- Validates body; creates PI + Order; returns JSON:
  - `clientSecret`, `orderId`, `orderNumber`, **`paymentIntentId`**, **`grossAmount`** (charge amount in cents)
  - Rate limited via `limitCheckout(ip)` (5 req/hr per IP)
- **`apps/web/package.json`** -- Depends on **`@stripe/react-stripe-js`** and **`@stripe/stripe-js`**
- **`step-payment.tsx`** -- Wraps **`PaymentElement`** in Stripe **`Elements`** with `options={{ clientSecret }}`; **`confirmPayment`** uses `return_url` = `{origin}/{locale}/{slug}/order/{paymentIntentId}` (set client-side after mount)
- Optional files from the original file table (**`order-summary-sidebar.tsx`**, standalone **`stripe-provider.tsx`**) were not added — summaries live in **`checkout-form`** (step 3) and **`step-shipping`**

---

## AGENTS.md rules that apply

- **Money as cents:** All prices, shipping rates, and totals are in cents. Display: `(cents / 100).toFixed(2)`.
- **Split calculations:** Handled by `POST /api/checkout/create-intent` using `calculateSplits()` -- no client-side split math for persisted orders.
- **CampaignItem prices:** Cart uses `CampaignItem.retailPrice`. The `create-intent` API re-validates all prices server-side.
- **Stripe:** Never import the server Stripe SDK in an app. For Elements, use **`@stripe/react-stripe-js`** / **`@stripe/stripe-js`**. The publishable key (`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`) is a client-side env var (see `apps/web/env.ts`).
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

- Order summary context in **`checkout-form`** (step 3) + **`step-payment`**
- Stripe **`PaymentElement`**
- **`POST /api/checkout/create-intent`** when entering step 3 (see **`checkout-form`** `useEffect`) to obtain `clientSecret`
- **`stripe.confirmPayment()`** with `return_url` to `/{locale}/{slug}/order/{paymentIntentId}`
- Loading/processing states during API call and payment confirmation
- Error display for declined/failed payments

### Dependencies

- **`@stripe/react-stripe-js`** and **`@stripe/stripe-js`** on **`apps/web`**

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
| Done | `apps/web/app/[locale]/[slug]/checkout/page.tsx` | Server component -- `getStorefrontData`, shipping guard redirect |
| Done | `apps/web/app/[locale]/[slug]/checkout/_components/checkout-form.tsx` | Client -- 3-step form, `create-intent` on step 3 |
| Done | `apps/web/app/[locale]/[slug]/checkout/_components/step-cart-review.tsx` | Step 1 |
| Done | `apps/web/app/[locale]/[slug]/checkout/_components/step-shipping.tsx` | Step 2 + react-hook-form |
| Done | `apps/web/app/[locale]/[slug]/checkout/_components/step-payment.tsx` | Step 3 -- Stripe Elements |
| Done | `apps/web/app/[locale]/[slug]/checkout/_lib/schema.ts` | Zod shipping schema |
| Done | `apps/web/app/api/checkout/create-intent/route.ts` | Response extended with `paymentIntentId`, `grossAmount` |

---

## Acceptance criteria

### Step 1 -- Cart review

- [x] Displays all cart items with product name, variant description, quantity, unit price, line total
- [x] Quantity can be adjusted (+/- buttons or input)
- [x] Removing all items redirects to storefront
- [x] Subtotal displayed (sum of line totals)
- [x] "Continue to shipping" advances to step 2

### Step 2 -- Shipping details

- [x] Buyer name field (required)
- [x] Buyer email field (required, email format validated)
- [x] Shipping address fields: street, city, state, zip
- [x] Shipping rate selection from roaster's rates (radio buttons)
- [x] Default shipping rate pre-selected if `isDefault = true`
- [x] Shipping cost displayed from selected rate
- [x] Order summary shows subtotal + shipping = estimated total
- [x] Per-step validation before advancement
- [x] "Back to cart" returns to step 1
- [x] "Continue to payment" advances to step 3

### Step 3 -- Payment

- [x] Order summary displayed (items + shipping + total / gross from API)
- [x] Stripe Elements card input renders (`PaymentElement`)
- [x] `create-intent` then `stripe.confirmPayment()`
- [x] Request body matches API schema: `campaignId`, `items[]`, `buyerEmail`, `buyerName`, `shippingRateId`
- [x] Loading state during API call and payment processing
- [x] On success: redirect to `{locale}/{slug}/order/{pi_id}`
- [x] On failure: display error message, allow retry
- [x] Rate limiting handled gracefully (429 from API shows user-friendly message)

### General

- [x] Progress indicator shows current step (1/2/3)
- [x] Back navigation between steps preserves form data
- [x] Mobile responsive with 44x44px touch targets
- [x] Scaffold placeholder text removed
- [x] `@stripe/react-stripe-js` and `@stripe/stripe-js` added to `apps/web` dependencies

---

## Handoff notes

- The **`create-intent`** API returns **`{ clientSecret, orderId, orderNumber, paymentIntentId, grossAmount }`**. The client builds **`return_url`** using **`paymentIntentId`** and the **`[locale]/[slug]`** segments.
- Stripe Elements handles SCA (3D Secure) when **`confirmPayment`** is used with a **`return_url`**.
- Shipping address is captured in the checkout form but is **not** stored on the **`Order`** row in MVP (schema has no address columns). Optional follow-up: persist for confirmation display.
- **`getStorefrontData`** supplies **`shippingRates`** and **`hasShippingRates`**; checkout assumes rates exist (page redirects otherwise).

---

## Revision log

| Version | Date | Notes |
|---------|------|-------|
| 0.1 | 2026-03-30 | Initial story created for Sprint 3 planning. |
| 0.2 | 2026-04-01 | Marked Done; aligned evidence and API response with implementation. |

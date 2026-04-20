# US-04-05 -- Shipping Rate Availability Guard on Storefront and Checkout

**Story ID:** US-04-05 | **Epic:** EP-04 (Buyer Storefront & Checkout)
**Points:** 2 | **Priority:** Low
**Status:** `Done`
**Owner:** Frontend
**Dependencies:** US-02-05 (Shipping Rate Configuration), US-04-01 (Public Org Storefront)
**Depends on this:** None

---

## Goal

Add a guard to the storefront and checkout that checks whether the campaign's roaster has any `RoasterShippingRate` records. If no shipping rates exist, the storefront displays a notice that purchases are temporarily unavailable and disables add-to-cart functionality. The checkout page redirects back to the storefront if no rates are available. This prevents buyers from building a cart that cannot be fulfilled.

---

## Diagram references

- **Database ERD:** [`docs/06-database-schema.mermaid`](../../06-database-schema.mermaid) -- `RoasterShippingRate`, `Roaster` models
- **Order lifecycle:** [`docs/04-order-lifecycle.mermaid`](../../04-order-lifecycle.mermaid) -- Phase 1 (checkout requires `shipping_rate_id`)

---

## Current repo evidence

- `RoasterShippingRate` model: `roasterId`, `label`, `carrier`, `flatRate` (cents), `isDefault`
- `apps/web/app/api/checkout/create-intent/route.ts` already validates `shippingRateId`:
  - Returns 400 if shipping rate not found or does not belong to the campaign's roaster
  - This server-side validation is the last line of defense; the UI guard prevents the buyer from reaching this point
- Roaster portal (US-02-05) shows a warning when zero shipping rates exist: "You must add at least one shipping rate before products can be sold"
- Storefront page (`[slug]/page.tsx`) from US-04-01 will load campaign data including roaster info

---

## AGENTS.md rules that apply

- **Soft deletes:** Not applicable for `RoasterShippingRate` (hard delete is allowed for shipping rates).
- **Tenant isolation:** The storefront is public -- no tenant scoping. The query uses the campaign's `roasterId` to find shipping rates.

**CONVENTIONS.md patterns:**
- Server component data check -- include shipping rate count in storefront data loading
- Conditional rendering based on availability

---

## In scope

- Storefront page: check if the campaign's roaster has any `RoasterShippingRate` records
- If no rates: display a banner/notice ("This store is temporarily unavailable for purchases")
- If no rates: disable or hide add-to-cart buttons
- Checkout page: verify roaster has shipping rates before rendering checkout form
- If no rates at checkout: redirect to storefront with error message

---

## Out of scope

- Multiple shipping rate selection UX (handled in US-04-03 checkout step 2)
- Shipping rate creation in the roaster portal (US-02-05, already done)
- International shipping
- Real-time shipping rate calculation (flat rates only for MVP)

---

## Primary files to create or modify

| Action | File | Purpose |
|--------|------|---------|
| Done | `apps/web/app/[locale]/[slug]/_lib/queries.ts` | `hasShippingRates` + `shippingRates` on `StorefrontData` |
| Done | `apps/web/app/[locale]/[slug]/_components/shipping-guard.tsx` | Banner when purchases are unavailable |
| Done | `apps/web/app/[locale]/[slug]/page.tsx` | `purchasesEnabled`, `ShippingGuard`, optional `?error=no-shipping` copy |
| Done | `apps/web/app/[locale]/[slug]/_components/add-to-cart-button.tsx` | `disabled` when `!purchasesEnabled` |
| Done | `apps/web/app/[locale]/[slug]/_components/product-grid.tsx` / `product-card.tsx` | Pass `purchasesEnabled` |
| Done | `apps/web/app/[locale]/[slug]/_components/cart-drawer.tsx` | Disable checkout CTA when `!purchasesEnabled` |
| Done | `apps/web/app/[locale]/[slug]/checkout/page.tsx` | `redirect` when `!hasShippingRates` |

---

## Acceptance criteria

- [x] Storefront with shipping rates: normal product grid with working add-to-cart buttons
- [x] Storefront without shipping rates: displays an unavailability banner at the top of the page
- [x] Storefront without shipping rates: add-to-cart buttons are disabled or hidden
- [x] Checkout page with shipping rates: renders normally
- [x] Checkout page without shipping rates: redirects to storefront (with `?error=no-shipping`)
- [x] The `create-intent` API's existing validation (400 for invalid shipping rate) remains as server-side fallback
- [x] The check uses roaster `RoasterShippingRate` rows for the campaign roaster (`findMany` with `hasShippingRates = rates.length > 0`)

---

## Suggested implementation steps

1. Update `_lib/queries.ts` to include shipping rate availability:
   - In the storefront data query, add a count of `RoasterShippingRate` for the campaign's roaster
   - Or include a boolean `hasShippingRates` in the returned data
2. Create `shipping-guard.tsx`:
   - Simple banner component: "This store is temporarily unavailable for purchases. Please check back soon."
   - Styled with warning/info colors from design system
3. Update `page.tsx`:
   - Pass `hasShippingRates` to storefront components
   - Conditionally render `ShippingGuard` banner when false
4. Update `add-to-cart-button.tsx`:
   - Accept `disabled` prop
   - When disabled: show tooltip/title explaining why ("Purchases temporarily unavailable")
5. Update `checkout/page.tsx`:
   - Check shipping rate availability in server component
   - If no rates: `redirect('/[slug]?error=no-shipping')` or equivalent
6. Test: storefront with/without rates, checkout with/without rates.

---

## Handoff notes

- This is a low-priority guard that prevents a poor buyer experience. The `create-intent` API already handles the server-side validation, so this is purely a UX improvement.
- The roaster portal (US-02-05) already warns roasters to add shipping rates. This guard is the buyer-facing counterpart.
- If the roaster adds shipping rates after the storefront was loaded, the buyer needs to refresh the page to see the updated state. No real-time notification is needed for MVP.

---

## Revision log

| Version | Date | Notes |
|---------|------|-------|
| 0.1 | 2026-03-30 | Initial story created for Sprint 3 planning. |
| 0.2 | 2026-04-01 | Marked Done; file list and AC aligned with `getStorefrontData` + UI. |

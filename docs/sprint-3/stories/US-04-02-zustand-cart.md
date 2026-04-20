# US-04-02 -- Zustand Cart with Add, Remove, Quantity Update

**Story ID:** US-04-02 | **Epic:** EP-04 (Buyer Storefront & Checkout)
**Points:** 5 | **Priority:** High
**Status:** `Done`
**Owner:** Frontend
**Dependencies:** US-04-01 (Public Org Storefront)
**Depends on this:** US-04-03 (Three-Step Checkout)

---

## Goal

Expand the minimal Zustand cart store in `packages/ui/src/store/cart.ts` into a full-featured buyer cart with add, remove, and quantity update capabilities. Build the storefront UI components: add-to-cart buttons on product cards, a cart drawer/sheet, and cart line items with quantity controls. The cart persists to `localStorage` via Zustand's `persist` middleware (already configured). No DB-backed cart for MVP -- that is Phase 2.

---

## Diagram references

- **Order lifecycle:** [`docs/04-order-lifecycle.mermaid`](../../04-order-lifecycle.mermaid) -- Phase 1 entry point (buyer adds items, proceeds to checkout)
- **Database ERD:** [`docs/06-database-schema.mermaid`](../../06-database-schema.mermaid) -- `CampaignItem` (prices used for display)
- **Project structure:** [`docs/01-project-structure.mermaid`](../../01-project-structure.mermaid) -- `[locale]/[slug]/` storefront routes

---

## Current repo evidence

- `packages/ui/src/store/cart.ts` — full cart: `CartLine` with display fields; `addLine(ctx, line)` with `AddLineContext` (`campaignId`, `orgSlug`); `removeLine`, `updateQuantity`, `clear`, `getLineCount`, `getTotalQuantity`, `getSubtotalCents`; persist `joe-perks-cart`; invalid legacy persisted rows cleared on rehydrate.
- `apps/web` depends on `@joe-perks/ui` (`package.json`).
- Storefront components: `add-to-cart-button.tsx`, `cart-drawer.tsx`, `cart-line-item.tsx`, `cart-trigger.tsx`, `storefront-cart-sync.tsx` (clears cart when navigating to a different org slug).
- `campaign-header.tsx` accepts optional `actions` (cart trigger).
- `getStorefrontData` in `_lib/queries.ts` returns `splitPreviewDefaults` for cart estimate; `cart-drawer.tsx` uses `calculateSplits()` from **`@joe-perks/stripe/splits`** (client-safe; do not import main `@joe-perks/stripe` barrel in client components).

---

## AGENTS.md rules that apply

- **Money as cents:** Cart line prices are `CampaignItem.retailPrice` (cents). Display as `(cents / 100).toFixed(2)`.
- **CampaignItem prices:** Always use `CampaignItem.retailPrice` for display and totals, never `ProductVariant.retailPrice`.

**CONVENTIONS.md patterns:**
- Client component for cart interaction (`'use client'` with `useCartStore`)
- Add-to-cart buttons are client components
- Server components for data display (product grid, cards)
- Mobile-first: bottom sheet on mobile, side drawer on desktop
- Touch targets: min 44x44px on all interactive elements

---

## In scope

### Cart store expansion

- Expand `CartLine` type with display metadata (product name, variant desc, price, image URL)
- Add `removeLine(campaignItemId)` action
- Add `updateQuantity(campaignItemId, quantity)` action -- removes line if quantity is 0
- Add derived getters: `lineCount`, `totalQuantity`, `subtotalCents`
- Maintain existing `addLine` and `clear` methods
- Keep `persist` middleware with `joe-perks-cart` storage key

### Cart UI components

- Add-to-cart button on product cards (client component)
- Cart drawer/sheet with line items and quantity controls
- Cart trigger icon with badge in storefront header
- Cart line item component with quantity +/- buttons and remove

---

## Out of scope

- DB-backed cart (Phase 2 -- `Cart` and `CartItem` models)
- Abandoned cart recovery
- Cross-campaign carting (buyer can only cart items from one campaign)
- Checkout flow (US-04-03)
- Server-side cart validation (checkout API handles this)

---

## Primary files to create or modify

| Action | File | Purpose |
|--------|------|---------|
| Modify | `packages/ui/src/store/cart.ts` | Expand cart store with remove, update, getters |
| Modify | `packages/ui/src/index.ts` | Export new types if needed |
| Create | `apps/web/app/[locale]/[slug]/_components/add-to-cart-button.tsx` | Client component -- add item to cart from product card |
| Create | `apps/web/app/[locale]/[slug]/_components/cart-drawer.tsx` | Client component -- cart sheet/drawer |
| Create | `apps/web/app/[locale]/[slug]/_components/cart-line-item.tsx` | Client component -- line item display with controls |
| Create | `apps/web/app/[locale]/[slug]/_components/cart-trigger.tsx` | Client component -- cart icon + badge in header |
| Modify | `apps/web/app/[locale]/[slug]/_components/product-card.tsx` | Add slot/prop for add-to-cart button |
| Modify | `apps/web/app/[locale]/[slug]/_components/storefront-layout.tsx` | Add cart trigger to header, cart drawer to layout |

---

## Acceptance criteria

### Cart store

- [x] `removeLine(campaignItemId)` removes the line from the cart
- [x] `updateQuantity(campaignItemId, quantity)` updates the quantity; removes line if quantity <= 0
- [x] `addLine(ctx, line)` upserts when switching campaigns; increments quantity when same item (cap 99)
- [x] `clear()` removes all lines (existing behavior preserved)
- [x] `getLineCount` returns the number of unique items in the cart
- [x] `getTotalQuantity` returns the sum of all line quantities
- [x] `getSubtotalCents` returns the sum of `retailPrice * quantity` for all lines
- [x] `CartLine` includes: `campaignItemId`, `quantity`, `productName`, `variantDesc`, `retailPrice`, `imageUrl?`
- [x] Cart persists across page refresh via `localStorage` (`joe-perks-cart` key)

### UI components

- [x] Product cards have "Add to cart" button
- [x] Clicking "Add to cart" adds the item with quantity 1 (or increments if already in cart)
- [x] Visual feedback on add (button state change, toast, or animation)
- [x] Cart trigger icon in storefront header shows badge with `lineCount`
- [x] Clicking cart trigger opens cart drawer
- [x] Cart drawer slides from right on desktop, bottom sheet on mobile
- [x] Each line item shows: product name, variant description, unit price, quantity, line total
- [x] Quantity controls: + and - buttons, minimum 1, maximum 99
- [x] Remove button per line item
- [x] Cart subtotal displayed at bottom of drawer
- [x] "Checkout" button links to `[slug]/checkout`
- [x] Empty cart shows appropriate message and link back to storefront
- [x] All interactive elements have 44x44px minimum touch targets

---

## Handoff notes

- US-04-03 (Checkout) reads from `useCartStore()` to populate the cart review step and build the `items` array for `POST /api/checkout/create-intent`.
- The checkout API re-validates all prices from the DB (`CampaignItem.retailPrice`), so client-side price data in the cart is for display only -- it does not affect the charged amount.
- The `joe-perks-cart` localStorage key may need a campaign ID prefix or clear-on-campaign-change logic if cross-campaign carting becomes an issue. For MVP, a single cart is sufficient; `StorefrontCartSync` clears the cart when navigating to a different org slug.
- Phase 2 will add a DB-backed `Cart` model for abandoned cart recovery. The Zustand store will sync to the DB cart when that feature ships.

---

## Revision log

| Version | Date | Notes |
|---------|------|-------|
| 0.1 | 2026-03-30 | Initial story created for Sprint 3 planning. |
| 0.2 | 2026-04-01 | Marked `Done`. Implementation includes `splitPreviewDefaults` + `calculateSplits` from `@joe-perks/stripe/splits` in cart drawer; `cart-trigger`, `storefront-cart-sync`; `apps/web` → `@joe-perks/ui`. |

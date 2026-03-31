# US-04-02 -- Zustand Cart with Add, Remove, Quantity Update

**Story ID:** US-04-02 | **Epic:** EP-04 (Buyer Storefront & Checkout)
**Points:** 5 | **Priority:** High
**Status:** `Todo`
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

- `packages/ui/src/store/cart.ts` exists with **minimal store**:
  - `CartLine` type: `{ campaignItemId: string; quantity: number }`
  - Actions: `addLine(line)` (upserts by `campaignItemId`), `clear()`
  - Uses `zustand/persist` with key `joe-perks-cart`
  - Comment: "expand when CampaignItem / Cart models ship (Sprint 3+)"
- `packages/ui/src/index.ts` exports `useCartStore` and `CartLine`
- `packages/ui/package.json` has `zustand` as dependency
- No cart UI components exist anywhere in the codebase
- `apps/web/app/[locale]/[slug]/` will have the storefront from US-04-01
- `docs/CONVENTIONS.md` documents the storefront component pattern: server fetch + client cart

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
- Keep `persist` middleware with `joe-perks-cart` key

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

- [ ] `removeLine(campaignItemId)` removes the line from the cart
- [ ] `updateQuantity(campaignItemId, quantity)` updates the quantity; removes line if quantity <= 0
- [ ] `addLine(line)` upserts: if `campaignItemId` exists, replaces the line (existing behavior preserved)
- [ ] `clear()` removes all lines (existing behavior preserved)
- [ ] `lineCount` returns the number of unique items in the cart
- [ ] `totalQuantity` returns the sum of all line quantities
- [ ] `subtotalCents` returns the sum of `retailPrice * quantity` for all lines
- [ ] `CartLine` includes: `campaignItemId`, `quantity`, `productName`, `variantDesc`, `retailPrice`, `imageUrl?`
- [ ] Cart persists across page refresh via `localStorage` (`joe-perks-cart` key)

### UI components

- [ ] Product cards have "Add to cart" button
- [ ] Clicking "Add to cart" adds the item with quantity 1 (or increments if already in cart)
- [ ] Visual feedback on add (button state change, toast, or animation)
- [ ] Cart trigger icon in storefront header shows badge with `lineCount`
- [ ] Clicking cart trigger opens cart drawer
- [ ] Cart drawer slides from right on desktop, bottom sheet on mobile
- [ ] Each line item shows: product name, variant description, unit price, quantity, line total
- [ ] Quantity controls: + and - buttons, minimum 1, maximum 99
- [ ] Remove button per line item
- [ ] Cart subtotal displayed at bottom of drawer
- [ ] "Checkout" button links to `[slug]/checkout`
- [ ] Empty cart shows appropriate message and link back to storefront
- [ ] All interactive elements have 44x44px minimum touch targets

---

## Suggested implementation steps

1. Expand the cart store (`packages/ui/src/store/cart.ts`):
   - Extend `CartLine` type with display fields
   - Add `removeLine`, `updateQuantity` actions
   - Add computed selectors (or inline derivations) for `lineCount`, `totalQuantity`, `subtotalCents`
   - Keep `persist` middleware unchanged
2. Update `packages/ui/src/index.ts` exports if new types are added.
3. Build `add-to-cart-button.tsx` (client component):
   - Receives `campaignItemId`, `productName`, `variantDesc`, `retailPrice`, `imageUrl` as props
   - Calls `useCartStore().addLine()`
   - Shows visual feedback (e.g. button text changes to "Added" for 2 seconds)
4. Integrate `AddToCartButton` into `product-card.tsx` from US-04-01.
5. Build `cart-trigger.tsx` (client component):
   - Cart icon with badge showing `lineCount`
   - Controls open/closed state of cart drawer
6. Build `cart-drawer.tsx` (client component):
   - Uses Radix `Sheet` or `Dialog` (from `@repo/design-system`) or custom drawer
   - Maps `useCartStore().lines` to `CartLineItem` components
   - Shows subtotal from `subtotalCents`
   - "Checkout" link and "Clear cart" button
7. Build `cart-line-item.tsx` (client component):
   - Product info display
   - Quantity +/- buttons calling `updateQuantity()`
   - Remove button calling `removeLine()`
   - Line total display
8. Wire `CartTrigger` into `storefront-layout.tsx` header.
9. Wire `CartDrawer` into `storefront-layout.tsx` (rendered at layout level).
10. Test: add/remove/update quantities, persistence across refresh, mobile UX.

---

## Handoff notes

- US-04-03 (Checkout) reads from `useCartStore()` to populate the cart review step and build the `items` array for `POST /api/checkout/create-intent`.
- The checkout API re-validates all prices from the DB (`CampaignItem.retailPrice`), so client-side price data in the cart is for display only -- it does not affect the charged amount.
- The `joe-perks-cart` localStorage key may need a campaign ID prefix or clear-on-campaign-change logic if cross-campaign carting becomes an issue. For MVP, a single cart is sufficient.
- Phase 2 will add a DB-backed `Cart` model for abandoned cart recovery. The Zustand store will sync to the DB cart when that feature ships.

---

## Revision log

| Version | Date | Notes |
|---------|------|-------|
| 0.1 | 2026-03-30 | Initial story created for Sprint 3 planning. |

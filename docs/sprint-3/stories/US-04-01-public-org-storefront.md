# US-04-01 -- Public Org Storefront at joeperks.com/[slug]

**Story ID:** US-04-01 | **Epic:** EP-04 (Buyer Storefront & Checkout)
**Points:** 8 | **Priority:** High
**Status:** `Todo`
**Owner:** Frontend / Full-stack
**Dependencies:** US-03-04 (Org Stripe Connect + Campaign)
**Depends on this:** US-04-02 (Zustand Cart), US-04-05 (Shipping Guard)

---

## Goal

Replace the scaffold at `apps/web/app/[locale]/[slug]/page.tsx` with a real org storefront. When a buyer visits `joeperks.com/[slug]`, they see the org's active campaign with product cards, pricing, and an org branding header. This is the public-facing buyer experience -- no authentication required. The page loads `Org`, active `Campaign`, `CampaignItem`s with `Product` and `ProductVariant` data server-side.

---

## Diagram references

- **Approval chain:** [`docs/05-approval-chain.mermaid`](../../05-approval-chain.mermaid) -- node **OA13** (Campaign.status = ACTIVE, Storefront live at `joeperks.com/[slug]`)
- **Database ERD:** [`docs/06-database-schema.mermaid`](../../06-database-schema.mermaid) -- `Org`, `Campaign`, `CampaignItem`, `Product`, `ProductVariant` models
- **Project structure:** [`docs/01-project-structure.mermaid`](../../01-project-structure.mermaid) -- `[locale]/[slug]/` route
- **Order lifecycle:** [`docs/04-order-lifecycle.mermaid`](../../04-order-lifecycle.mermaid) -- buyer visits storefront (Phase 1 entry point)

---

## Current repo evidence

- `apps/web/app/[locale]/[slug]/page.tsx` exists as **scaffold** -- reserved-slug guard via `RESERVED_SLUGS` from `@joe-perks/types`, placeholder "Storefront" copy
- `RESERVED_SLUGS` in `packages/types/src/slugs.ts` -- blocks known routes like `roasters`, `orgs`, `blog`, etc.
- `Org` model: `slug` (unique), `status` (`OrgStatus`)
- `Campaign` model: `orgId`, `status` (`CampaignStatus`: `DRAFT`, `ACTIVE`, `PAUSED`, `ENDED`), `orgPct`, `goalCents`, `totalRaised`, `name`
- `CampaignItem` model: `campaignId`, `productId`, `variantId`, `retailPrice` (cents), `wholesalePrice` (cents), `isFeatured`
- `Product` model: `name`, `roastLevel`, `imageUrl`, `description`, `origin`, `deletedAt` (soft delete)
- `ProductVariant` model: `sizeOz`, `grind`, `isAvailable`, `deletedAt` (soft delete)
- `apps/web` uses `app/[locale]/...` for pages (next-forge i18n)
- Design specs at [`docs/joe_perks_design_specs.md`](../../joe_perks_design_specs.md) -- color system, typography, spacing, responsive breakpoints

---

## AGENTS.md rules that apply

- **CampaignItem prices:** Display `CampaignItem.retailPrice` -- never `ProductVariant.retailPrice`. Variant prices may have changed since campaign creation.
- **Soft deletes:** Filter `Product.deletedAt IS NULL` and `ProductVariant.deletedAt IS NULL` in queries.
- **Money as cents:** Display prices as `(cents / 100).toFixed(2)`.
- **No auth:** Buyer storefront is public. No authentication required.

**CONVENTIONS.md patterns:**
- Server component for data fetching (`StorefrontPage`)
- Product grid and cards are server components (no interactivity needed for display)
- Add-to-cart buttons will be client components (US-04-02) -- for now, render product display only
- Use design system tokens from `joe_perks_design_specs.md`

---

## In scope

- Storefront page at `[locale]/[slug]/page.tsx` -- server component
- Load `Org` by slug, verify org exists and is active
- Load active `Campaign` for the org (status = ACTIVE)
- Load `CampaignItem`s with `Product` and `ProductVariant` includes
- Filter: `Product.deletedAt IS NULL`, `ProductVariant.deletedAt IS NULL`, `ProductVariant.isAvailable = true`
- Campaign header with org name, campaign name, fundraiser info
- Goal progress bar if `goalCents` is set
- Product grid with cards showing: product image, name, roast level, variant options, price from `CampaignItem.retailPrice`
- Featured items (`isFeatured`) displayed prominently
- Mobile-first responsive layout (single column mobile, multi-column desktop)
- 404 for non-existent slug, inactive org, or no active campaign
- Preserve existing `RESERVED_SLUGS` guard

---

## Out of scope

- Add-to-cart functionality (US-04-02)
- Cart drawer (US-04-02)
- Checkout flow (US-04-03)
- Shipping rate guard (US-04-05)
- Dark mode for storefront (Phase 2)
- SEO metadata / OG images (Phase 2)
- Org logo/branding upload (future)

---

## Primary files to create or modify

| Action | File | Purpose |
|--------|------|---------|
| Modify | `apps/web/app/[locale]/[slug]/page.tsx` | Server component -- load org, campaign, items; render storefront |
| Create | `apps/web/app/[locale]/[slug]/_components/storefront-layout.tsx` | Layout wrapper with org branding |
| Create | `apps/web/app/[locale]/[slug]/_components/campaign-header.tsx` | Org name, campaign name, fundraiser info, goal progress |
| Create | `apps/web/app/[locale]/[slug]/_components/product-grid.tsx` | Server component -- grid of product cards |
| Create | `apps/web/app/[locale]/[slug]/_components/product-card.tsx` | Individual product display card |
| Create | `apps/web/app/[locale]/[slug]/_lib/queries.ts` | DB query helpers for storefront data loading |

---

## Acceptance criteria

- [ ] Navigating to `joeperks.com/[slug]` with an active campaign shows the storefront
- [ ] Non-existent slug returns 404
- [ ] Org with no active campaign returns 404
- [ ] Reserved slug (e.g. `roasters`, `orgs`) returns 404 (existing guard preserved)
- [ ] Campaign header shows org name, campaign name
- [ ] If `goalCents` is set, a progress bar shows `totalRaised / goalCents`
- [ ] Fundraiser percentage displayed ("X% of every purchase supports [org name]")
- [ ] Product grid shows all campaign items with images, names, roast levels
- [ ] Prices displayed from `CampaignItem.retailPrice` (not `ProductVariant.retailPrice`)
- [ ] Prices formatted as dollars: `$XX.XX`
- [ ] Featured items (`isFeatured`) are visually distinguished
- [ ] Variant options (size, grind) displayed on cards
- [ ] Deleted products (`deletedAt IS NOT NULL`) are hidden
- [ ] Unavailable variants (`isAvailable = false`) are hidden
- [ ] Layout is mobile-first responsive (single column < 640px, multi-column >= 640px)
- [ ] Touch targets are minimum 44x44px
- [ ] Page renders as server component (no client-side data fetching)
- [ ] Scaffold placeholder text is removed

---

## Suggested implementation steps

1. Create `_lib/queries.ts` with storefront data loading helpers:
   - `getStorefrontData(slug: string)` -- loads Org + active Campaign + CampaignItems with Product/Variant includes
   - Apply soft delete and availability filters
2. Update `page.tsx`:
   - Preserve `RESERVED_SLUGS` guard
   - Call `getStorefrontData(slug)` -- return `notFound()` if no data
   - Render `StorefrontLayout` with data
3. Build `storefront-layout.tsx` -- page wrapper with consistent header/footer.
4. Build `campaign-header.tsx`:
   - Org name, campaign name
   - Fundraiser percentage message
   - Goal progress bar (if `goalCents` set)
5. Build `product-grid.tsx` -- maps campaign items to product cards.
6. Build `product-card.tsx`:
   - Product image (or placeholder)
   - Product name, roast level badge
   - Variant info (size, grind)
   - Price from `CampaignItem.retailPrice` formatted as dollars
   - Featured badge if `isFeatured`
   - Placeholder for add-to-cart button (US-04-02 will add interactivity)
7. Style with design system tokens -- use `jp-terra`, `jp-teal`, font families from design specs.
8. Test: active campaign, no campaign, deleted products, mobile/desktop responsive.

---

## Handoff notes

- US-04-02 (Zustand Cart) will add `AddToCartButton` client components to the product cards. The card component should have a clear slot or prop for the cart button.
- US-04-05 (Shipping Guard) will add a banner when the roaster has no shipping rates. The storefront layout should accommodate this banner.
- The `_lib/queries.ts` helper will be reused by the checkout page (US-04-03) to validate campaign data.
- Consider generating `metadata` (page title, description) from org/campaign data for SEO.

---

## Revision log

| Version | Date | Notes |
|---------|------|-------|
| 0.1 | 2026-03-30 | Initial story created for Sprint 3 planning. |

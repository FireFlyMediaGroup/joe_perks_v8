# US-02-04 — Product and Variant Creation with Wholesale/Retail Pricing

**Story ID:** US-02-04 | **Epic:** EP-02 (Roaster Onboarding)
**Points:** 8 | **Priority:** High
**Status:** `Todo`
**Owner:** Full-stack
**Dependencies:** US-02-03 (Stripe Connect Onboarding)
**Depends on this:** US-02-05 (Shipping Rate Configuration)

---

## Goal

Replace the scaffold page at `apps/roaster/app/(authenticated)/products/page.tsx` with a real product and variant management system. Roasters can create, edit, and soft-delete coffee products with multiple variants (size, grind, wholesale/retail pricing). All queries are tenant-scoped.

---

## Diagram references

- **Approval chain:** [`docs/05-approval-chain.mermaid`](../../05-approval-chain.mermaid) — node **RA9** (Roaster adds products + shipping rates)
- **Database ERD:** [`docs/06-database-schema.mermaid`](../../06-database-schema.mermaid) — `Product` and `ProductVariant` models
- **Project structure:** [`docs/01-project-structure.mermaid`](../../01-project-structure.mermaid) — `(authenticated)/products/` route

---

## Current repo evidence

- `apps/roaster/app/(authenticated)/products/page.tsx` exists as scaffold text ("Catalog management scaffold")
- `Product` model in schema: `id`, `roasterId`, `name`, `description`, `origin`, `roastLevel` (`RoastLevel`), `status` (`ProductStatus`), `isCollab`, `imageUrl`, `deletedAt`
- `ProductVariant` model in schema: `id`, `productId`, `sku`, `sizeOz`, `grind` (`GrindOption`), `wholesalePrice`, `retailPrice`, `isAvailable`, `deletedAt`
- `RoastLevel` enum: `LIGHT`, `MEDIUM`, `MEDIUM_DARK`, `DARK`
- `GrindOption` enum: `WHOLE_BEAN`, `GROUND_DRIP`, `GROUND_ESPRESSO`, `GROUND_FRENCH_PRESS`
- `ProductStatus` enum: `DRAFT`, `ACTIVE`, `ARCHIVED`
- Clerk auth is configured for `apps/roaster`
- UploadThing credentials are in `apps/web/.env.local` (may need to add to `apps/roaster` for product images)

---

## AGENTS.md rules that apply

- **Money as cents:** `wholesalePrice` and `retailPrice` are `Int` cents. `$19.99` = `1999`. Convert to dollars only at display: `(cents / 100).toFixed(2)`.
- **Tenant isolation:** Every query **must** include `WHERE roasterId = session.roasterId`. Never trust a `roasterId` from the request body.
- **Soft deletes:** `Product` and `ProductVariant` use `deletedAt DateTime?`. Queries must filter `WHERE deletedAt IS NULL`. Never hard-delete.

**CONVENTIONS.md patterns:**
- Server components for list and detail pages; client components for forms
- Soft delete queries: always filter `deletedAt: null`
- Tenant scoping: read `roasterId` from session, never from request body
- Money: stored/transmitted as cents; display formatting only in components

---

## In scope

### Product CRUD
- **List view:** Show all products for the roaster with status badges (DRAFT/ACTIVE/ARCHIVED), variant count, and image thumbnail
- **Create:** Form with fields: name, description, origin, roast level (enum select), image URL, status
- **Edit:** Same form pre-populated, with save
- **Soft delete:** Set `deletedAt = now()` — never remove the row. Deleted products hidden from list (filtered by `deletedAt IS NULL`)

### Variant CRUD (nested under product)
- **List:** Show variants for a product with size, grind, prices, availability toggle
- **Create:** Form with fields: size (oz), grind option (enum select), wholesale price (cents input), retail price (cents input), SKU (optional), availability toggle
- **Edit:** Same form pre-populated
- **Soft delete:** Same pattern as product

### Price validation
- `retailPrice` must be greater than `wholesalePrice`
- Both prices must be positive integers (cents)
- Minimum retail spread should be reasonable (warn if margin is < 20%)

### Image upload
- Optional product image via UploadThing or URL input
- Store as `imageUrl` on the `Product` record

---

## Out of scope

- Campaign item creation (that's org-side, Sprint 3+)
- Price snapshot logic (happens when a campaign item is created from a variant)
- Inventory/stock tracking
- Bulk import/export
- Product search or filtering beyond status

---

## Primary files to create or modify

| Action | File | Purpose |
|--------|------|---------|
| Modify | `apps/roaster/app/(authenticated)/products/page.tsx` | Server component — list all products for the roaster |
| Create | `apps/roaster/app/(authenticated)/products/new/page.tsx` | Server component shell for product creation form |
| Create | `apps/roaster/app/(authenticated)/products/[id]/page.tsx` | Server component — product detail with variant list |
| Create | `apps/roaster/app/(authenticated)/products/[id]/edit/page.tsx` | Server component shell for product edit form |
| Create | `apps/roaster/app/(authenticated)/products/_components/product-form.tsx` | Client component — create/edit product form |
| Create | `apps/roaster/app/(authenticated)/products/_components/product-list.tsx` | Component — product card grid or table |
| Create | `apps/roaster/app/(authenticated)/products/_components/variant-form.tsx` | Client component — create/edit variant form |
| Create | `apps/roaster/app/(authenticated)/products/_components/variant-list.tsx` | Component — variant table for a product |
| Create | `apps/roaster/app/(authenticated)/products/_actions/product-actions.ts` | Server actions — create, update, soft-delete product |
| Create | `apps/roaster/app/(authenticated)/products/_actions/variant-actions.ts` | Server actions — create, update, soft-delete variant |
| Create | `apps/roaster/app/(authenticated)/products/_lib/schema.ts` | Zod validation schemas for product and variant |

---

## Acceptance criteria

- [ ] The products page lists all non-deleted products for the authenticated roaster
- [ ] Products show: name, roast level, status badge, variant count, image thumbnail
- [ ] A "New product" button navigates to the creation form
- [ ] The product form captures: name, description, origin, roast level, status, image
- [ ] The product detail page lists all non-deleted variants for that product
- [ ] Variants show: size (oz), grind option, wholesale price, retail price, availability status
- [ ] Variant prices are entered in dollar format and stored as integer cents
- [ ] `retailPrice > wholesalePrice` is enforced at both client and server validation
- [ ] Both prices must be positive
- [ ] All database queries include `roasterId = session.roasterId` (tenant isolation)
- [ ] All database queries include `deletedAt: null` (soft delete filtering)
- [ ] "Delete" soft-deletes the record (`deletedAt = now()`) — no row is removed
- [ ] A product with status `DRAFT` can be edited but should not appear in campaign item selection (future enforcement)
- [ ] Products belonging to other roasters are not visible (tenant isolation)
- [ ] The scaffold placeholder text is removed

---

## Suggested implementation steps

1. Define Zod schemas in `_lib/schema.ts` for product and variant forms.
2. Implement product server actions in `_actions/product-actions.ts`:
   - `createProduct`: validate, scope to session roaster, insert
   - `updateProduct`: validate, verify ownership, update
   - `deleteProduct`: verify ownership, set `deletedAt = now()`
3. Implement variant server actions in `_actions/variant-actions.ts`:
   - `createVariant`: validate (including price constraints), verify product ownership, insert
   - `updateVariant`: validate, verify ownership chain, update
   - `deleteVariant`: verify ownership chain, soft delete
4. Build product list page — server component querying with tenant + soft delete filters.
5. Build product form (client component) with roast level enum select, price inputs, image URL.
6. Build product detail page with variant list.
7. Build variant form with size/grind/price inputs and dollar-to-cents conversion.
8. Add price validation: retail > wholesale, both positive.
9. Test: create product + variants, verify DB records, verify tenant isolation (cannot see other roasters' products), verify soft delete.

---

## Handoff notes

- US-02-05 (Shipping) depends on the product system existing. The routing and component patterns established here should be reused.
- Campaign item creation (future sprint) will reference `ProductVariant.retailPrice` and `wholesalePrice` as snapshot sources. Ensure these fields are reliably populated.
- The `ProductStatus` enum (`DRAFT`, `ACTIVE`, `ARCHIVED`) is used to control visibility. Future stories may gate `ACTIVE` status on having at least one shipping rate configured (US-02-05).

---

## Revision log

| Version | Date | Notes |
|---------|------|-------|
| 0.1 | 2026-03-29 | Initial story created for Sprint 2 planning. |

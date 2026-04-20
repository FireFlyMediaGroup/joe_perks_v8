# US-02-05 — Roaster Shipping Rate Configuration

**Story ID:** US-02-05 | **Epic:** EP-02 (Roaster Onboarding)
**Points:** 5 | **Priority:** High
**Status:** `Done`
**Owner:** Full-stack
**Dependencies:** US-02-04 (Product and Variant Creation)
**Depends on this:** None within Sprint 2

---

## Goal

Replace the scaffold page at `apps/roaster/app/(authenticated)/settings/shipping/page.tsx` with a real shipping rate management UI. Roasters configure flat-rate shipping options that are passed through to buyers at checkout. Shipping is 100% passthrough to the roaster and is never included in split calculations.

---

## Diagram references

- **Approval chain:** [`docs/05-approval-chain.mermaid`](../../05-approval-chain.mermaid) — node **RA9** (Roaster adds products + shipping rates)
- **Database ERD:** [`docs/06-database-schema.mermaid`](../../06-database-schema.mermaid) — `RoasterShippingRate` model
- **Project structure:** [`docs/01-project-structure.mermaid`](../../01-project-structure.mermaid) — `(authenticated)/settings/shipping/` route

---

## Current repo evidence

- `apps/roaster/app/(authenticated)/settings/shipping/page.tsx` exists as scaffold text ("Flat rate configuration scaffold")
- `RoasterShippingRate` model in schema: `id`, `roasterId`, `label`, `carrier`, `flatRate` (Int cents), `isDefault` (Boolean)
- Index on `roasterId` for efficient queries
- No existing API routes or server actions for shipping rate management
- `AGENTS.md` rule: "Shipping is 100% passthrough to roaster — never included in split math"

---

## AGENTS.md rules that apply

- **Money as cents:** `flatRate` is `Int` cents. `$8.95` = `895`. Display: `(cents / 100).toFixed(2)`.
- **Tenant isolation:** Every query **must** include `WHERE roasterId = session.roasterId`.
- **Shipping and splits:** Shipping is 100% passthrough. It is added to `Order.shippingAmount` but excluded from split calculations. The `calculateSplits()` function in `@joe-perks/stripe` already handles this correctly.

**CONVENTIONS.md patterns:**
- Server component for the settings page; client component for rate forms
- Money stored as cents; dollar display only in UI components
- Tenant scoping from session, never from request body

---

## In scope

- List view of all shipping rates for the authenticated roaster
- Create form: label (e.g. "Standard 3-5 days"), carrier (e.g. "USPS"), flat rate (dollars input → stored as cents), is-default toggle
- Edit existing rates inline or via modal
- Delete a rate (hard delete is acceptable for shipping rates — they are not referenced by historical orders; orders snapshot the shipping amount)
- Enforce that exactly one rate is marked `isDefault`
- Enforce at least one rate exists before products can be set to `ACTIVE` status (validation message, not blocking)
- Validate: flat rate must be a positive integer (cents), label is required

---

## Out of scope

- Per-product shipping rates (all rates are roaster-level)
- Weight-based or calculated shipping (MVP is flat rate only)
- Shipping label generation (Phase 2 — EasyPost)
- Free shipping option (can be added later by setting flatRate = 0, but not a UI feature for MVP)
- International shipping

---

## Primary files to create or modify

| Action | File | Purpose |
|--------|------|---------|
| Modify | `apps/roaster/app/(authenticated)/settings/shipping/page.tsx` | Server component — list shipping rates for the roaster |
| Create | `apps/roaster/app/(authenticated)/settings/shipping/_components/rate-form.tsx` | Client component — create/edit shipping rate form |
| Create | `apps/roaster/app/(authenticated)/settings/shipping/_components/rate-list.tsx` | Component — table or card list of rates |
| Create | `apps/roaster/app/(authenticated)/settings/shipping/_actions/shipping-actions.ts` | Server actions — create, update, delete rate, toggle default |
| Create | `apps/roaster/app/(authenticated)/settings/shipping/_lib/schema.ts` | Zod validation schema for shipping rate |

---

## Acceptance criteria

- [x] The shipping settings page lists all `RoasterShippingRate` records for the authenticated roaster
- [x] Each rate shows: label, carrier, flat rate (formatted as dollars), default badge
- [x] A "Add rate" button opens a form to create a new rate
- [x] The form captures: label (required), carrier (required), flat rate in dollars (converted to cents), is-default toggle
- [x] Flat rate must be a positive amount (server-side validation)
- [x] Exactly one rate can be marked as default at a time (setting a new default unsets the previous one)
- [x] Rates can be edited (label, carrier, flat rate, default status)
- [x] Rates can be deleted (if not the only rate — at least one must remain, or show a warning)
- [x] All queries are scoped to `roasterId = session.roasterId` (tenant isolation)
- [x] If no rates exist, a prompt encourages the roaster to add at least one before listing products
- [x] The scaffold placeholder text is removed

---

## Suggested implementation steps

1. Define a Zod schema in `_lib/schema.ts` for the shipping rate form (label, carrier, flatRate as number, isDefault as boolean).
2. Implement server actions in `_actions/shipping-actions.ts`:
   - `createRate`: validate, scope to session roaster, if `isDefault` then unset other defaults first, insert
   - `updateRate`: validate, verify ownership, if `isDefault` changed then manage default flag, update
   - `deleteRate`: verify ownership, warn if it's the only rate, delete
3. Update `page.tsx` to query `RoasterShippingRate` filtered by `roasterId = session.roasterId`.
4. Build the rate list component with inline edit or edit button.
5. Build the rate form component with dollar-to-cents conversion on submit.
6. Handle the default-rate toggle: when a rate is set as default, unset all others for that roaster in the same transaction.
7. Test: create rates, verify default toggling, verify tenant isolation, verify deletion.

---

## Handoff notes

- When a buyer checks out (existing checkout route in `apps/web`), the shipping rate is selected and its `flatRate` value is used for `Order.shippingAmount`. This is already handled by the checkout flow; this story just provides the roaster-side management.
- The existence of at least one shipping rate is a prerequisite for the roaster's products being selectable in campaigns. Consider adding a status check in the roaster dashboard or product list that warns if no rates are configured.
- This is the final story in the EP-02 roaster onboarding chain. After this, the roaster is fully set up: approved, Stripe connected, products created, shipping configured.

---

## Revision log

| Version | Date | Notes |
|---------|------|-------|
| 0.1 | 2026-03-29 | Initial story created for Sprint 2 planning. |
| 0.2 | 2026-03-30 | Implemented: `settings/shipping/` CRUD, default handling, product-page warnings. |

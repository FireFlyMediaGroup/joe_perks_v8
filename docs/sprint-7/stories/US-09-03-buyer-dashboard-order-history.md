# US-09-03 — Buyer Account Dashboard and Order History

**Story ID:** US-09-03 | **Epic:** EP-09 (Buyer Accounts)
**Points:** 5 | **Priority:** High
**Status:** `Done`
**Owner:** Full-stack
**Dependencies:** US-09-00, US-09-01
**Depends on this:** US-09-04

---

## Goal

Create an authenticated buyer dashboard that shows a buyer’s order history and impact in a clear, mobile-friendly, buyer-safe way. This is the main entry point for the new buyer account surface.

---

## Planning baseline

Read first:

- [`docs/sprint-7/buyer-accounts-epic-v3.md`](../buyer-accounts-epic-v3.md)
- [`docs/sprint-7/README.md`](../README.md)
- [`docs/sprint-7/stories/US-09-01-buyer-magic-link-auth.md`](./US-09-01-buyer-magic-link-auth.md)

Normalized decisions this story implements:

- account routes are locale-aware
- buyer history uses persisted order data
- status labels should be buyer-friendly, not raw internal enum labels

---

## Current repo evidence

- `apps/web/app/[locale]/account/page.tsx` now exists as the locale-aware buyer dashboard route.
- Buyer account access is protected by a shared helper that validates the signed buyer session against a live `Buyer` row and preserves locale-aware redirects to sign-in.
- Order data already contains the frozen financial values needed for impact/history display.

---

## In scope

- Locale-aware buyer dashboard route
- Session protection / redirect to sign-in
- Buyer-only order-history query
- Buyer-friendly order list UI
- High-level impact summary from real order data

---

## Out of scope

- Order detail tracking view itself
- Guest lookup
- Billing management
- Profile editing
- Marketing preferences

---

## Primary files to create or modify

| Action | File | Purpose |
|--------|------|---------|
| Create | `apps/web/app/[locale]/account/page.tsx` | Buyer dashboard route |
| Create | route-local `_components/` | Order cards, impact summary, empty state |
| Create | route-local `_lib/` | Dashboard queries and formatting helpers |
| Modify | shared account/session helpers | Route protection and buyer session resolution |

---

## Acceptance criteria

- [x] Locale-aware dashboard route exists
- [x] Unauthenticated access redirects to sign-in with preserved redirect
- [x] Dashboard queries only the signed-in buyer’s orders
- [x] Orders are sorted newest first
- [x] Order cards show enough summary information to orient the buyer quickly
- [x] Impact summary uses persisted order data and buyer-friendly copy
- [x] Empty state includes a clear next action back into the storefront
- [x] Status labels are readable, buyer-friendly, and not color-only

---

## UX / accessibility / mobile requirements

- [x] Initial dashboard load is server-rendered where practical
- [x] Heading structure is clean and screen-reader friendly
- [x] Order cards stack cleanly on mobile
- [x] Key information remains visible without depending on hover
- [x] Focus management works after redirect from auth
- [x] Touch targets remain large enough for mobile use

---

## Suggested implementation steps

1. Create dashboard route.
2. Add auth guard using buyer session helper.
3. Create buyer-specific order query.
4. Build order-history UI with buyer-friendly labels and empty state.
5. Add top-level impact summary from persisted order fields.
6. Link each order card to the future detail route.

---

## QA and verification

- [x] Signed-in buyer only sees their own orders
- [x] Redirect to sign-in works for unsigned users
- [x] Empty state renders correctly for buyer with no orders
- [x] Dashboard is usable at mobile widths
- [x] Keyboard navigation order is sensible

---

## Handoff notes

- Keep this story focused on list/history and high-level impact, not order-detail complexity.
- Any status pill or label should have text, not rely on color alone.
- Use persisted order snapshots, not mutable product or buyer-profile data, for historical display.

---

## Revision log

| Version | Date | Notes |
|---------|------|-------|
| 0.1 | 2026-04-05 | Initial buyer dashboard/history story created from the normalized Sprint 7 plan. |
| 1.0 | 2026-04-05 | Implemented the protected locale-aware `/account` route, buyer-scoped order history query, impact summary, empty state, and auth-redirect focus management. |

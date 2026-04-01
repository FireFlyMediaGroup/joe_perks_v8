# US-07-02 -- PlatformSettings Editor in Admin

**Story ID:** US-07-02 | **Epic:** EP-07 (Admin Dashboard)
**Points:** 5 | **Priority:** Medium
**Status:** `Todo`
**Owner:** Full-stack
**Dependencies:** US-01-02, US-01-03
**Depends on this:** None

---

## Goal

Replace the admin settings scaffold with an editor for platform business rules so the platform team can update future-order fee, SLA, payout-hold, and dispute settings without changing code.

---

## Diagram references

- **Database ERD:** [`docs/06-database-schema.mermaid`](../../06-database-schema.mermaid) -- `PlatformSettings`
- **Stripe payment flow:** [`docs/07-stripe-payment-flow.mermaid`](../../07-stripe-payment-flow.mermaid) -- fee/dispute settings context
- **Order lifecycle:** [`docs/04-order-lifecycle.mermaid`](../../04-order-lifecycle.mermaid) -- SLA and payout settings impact

---

## Current repo evidence

- `packages/db/prisma/schema.prisma` already defines the `PlatformSettings` singleton with fee, org %, SLA, payout-hold, and dispute-fee fields.
- `apps/admin/app/settings/page.tsx` exists but is only a placeholder scaffold.
- Sprint 4 code already reads `PlatformSettings` at request/runtime in the payment webhook and SLA job.

---

## In scope

- Load and display current `PlatformSettings`
- Edit supported fields from the current schema
- Validate input ranges
- Persist changes to the singleton record
- Clearly communicate that changes affect future behavior

---

## Out of scope

- Backfilling existing orders after settings changes
- A full historical settings audit subsystem unless explicitly added
- Environment-variable editing from the admin UI

---

## Primary files to create or modify

| Action | File | Purpose |
|--------|------|---------|
| Modify | `apps/admin/app/settings/page.tsx` | Replace scaffold with editor |
| Create | `apps/admin/app/settings/_actions/` | Server actions for update flow |
| Create / Modify | validation helper(s) under the settings route | Shared input validation |
| Create | `packages/db/admin-action-log.ts` and related schema support | Audit settings changes |

---

## Acceptance criteria

- [ ] Admin settings page loads the current `PlatformSettings` singleton values
- [ ] All supported current-schema fields are editable with labels and brief descriptions
- [ ] Save flow validates percentages, hours, days, and fee amounts
- [ ] Save flow clearly warns that changes affect future orders/operations
- [ ] Changes take effect without a deploy or restart
- [ ] Settings changes are written to an admin audit trail

---

## Normalized implementation decisions

- Drop `min_retail_spread_pct` from Sprint 5. The editor should expose only fields that exist in the current `PlatformSettings` schema unless a later schema PR explicitly adds more.
- Add `AdminActionLog` coverage for settings changes so the team can answer who changed what and when.
- Keep the UI explicit that settings affect future requests and jobs, not historical frozen order splits.

---

## Suggested implementation steps

1. Load the singleton in the page server component.
2. Build a form shaped to the actual schema fields on `main`.
3. Add validation + update server action.
4. Add a confirmation step and success/error messaging.
5. Record changes in `AdminActionLog`.

---

## Handoff notes

- The current runtime behavior is already favorable for this story because payment/SLA code reads settings from the database, not from a build-time constant.
- This story is now normalized to the current schema and should not add extra business-rule fields unless explicitly approved.

---

## Revision log

| Version | Date | Notes |
|---------|------|-------|
| 0.1 | 2026-04-01 | Initial Sprint 5 story created from source planning doc and current repo review. |
| 0.2 | 2026-04-01 | Normalized to the current `PlatformSettings` schema and updated to require `AdminActionLog` coverage for settings changes. |

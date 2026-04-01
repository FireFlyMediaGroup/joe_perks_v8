# US-07-01 -- Admin Order List with SLA Flag Indicators

**Story ID:** US-07-01 | **Epic:** EP-07 (Admin Dashboard)
**Points:** 5 | **Priority:** High
**Status:** `Done`
**Owner:** Full-stack
**Dependencies:** US-05-01, US-01-03
**Depends on this:** US-07-03, US-07-04

---

## Goal

Turn the admin orders area into an operational monitoring surface so platform admins can identify late orders quickly, drill into full detail, and take the most important interventions from one place.

---

## Diagram references

- **Order lifecycle:** [`docs/04-order-lifecycle.mermaid`](../../04-order-lifecycle.mermaid) -- admin intervention context
- **Order state machine:** [`docs/08-order-state-machine.mermaid`](../../08-order-state-machine.mermaid) -- `CONFIRMED`, `SHIPPED`, `DELIVERED`, `REFUNDED`
- **Database ERD:** [`docs/06-database-schema.mermaid`](../../06-database-schema.mermaid) -- `Order`, `OrderEvent`, `DisputeRecord`, `PlatformSettings`

---

## Current repo evidence

- SLA timing data exists via `Order.fulfillBy` and `PlatformSettings` SLA fields; Sprint 4 order detail, delivery confirmation, and timeline remain the baseline.
- Package A now provides `apps/admin/app/orders/_lib/sla.ts` with shared `getOrderSlaState()` logic for `PlatformSettings`-driven row badges and summary rollups.
- `apps/admin/app/orders/page.tsx` now loads campaign/org labels, payout status, dispute callouts, status/roaster/org/date filters, and explicit 50/page pagination.
- `apps/admin/app/orders/_components/order-list.tsx` now renders row-level SLA badges plus page-level Critical / Warning / On Track rollups.
- `apps/admin/app/orders/[id]/page.tsx` and `_components/order-detail.tsx` now show richer payout/dispute context and expose the approved low-risk actions: `Mark Delivered` and `Contact Roaster`.
- Vitest: `apps/admin/__tests__/us-07-01-sla.test.ts` covers `getOrderSlaState()`; see `docs/SPRINT_5_CHECKLIST.md` for `pnpm --filter admin test` and `pnpm admin:smoke:us-07`.

---

## In scope

- Add row-level SLA indicators
- Add SLA summary rollups
- Expand the orders list filters and data columns
- Expand the order detail page with dispute/payout/admin action context
- Keep Sprint 5 focused on visibility plus low-risk interventions

---

## Out of scope

- Full CRM/ticketing workflow for "contact roaster"
- Rebuilding the Sprint 4 order detail from scratch
- Real-time websockets; simple refresh/reload is enough for MVP

---

## Primary files to create or modify

| Action | File | Purpose |
|--------|------|---------|
| Modify | `apps/admin/app/orders/page.tsx` | Expand query, filters, and summary data |
| Modify | `apps/admin/app/orders/_components/order-list.tsx` | Add SLA column, rollups, pagination/filter controls |
| Modify | `apps/admin/app/orders/[id]/page.tsx` and related components/actions | Add dispute/payout context and any approved admin actions |
| Create | `apps/admin/app/orders/_lib/sla.ts` | Shared SLA state and badge logic |

---

## Acceptance criteria

- [x] Admin orders page shows all key fields needed for ops triage, including SLA state
- [x] SLA indicator colors are derived from `PlatformSettings` / `fulfillBy`
- [x] Page-level SLA summary cards surface critical / warning / on-track counts
- [x] Filters support at least the approved MVP subset of status, roaster, org, and date range
- [x] Order detail shows payout breakdown, full event timeline, and dispute state when present
- [x] The only Sprint 5 action buttons on this surface are `Mark Delivered` and a non-destructive `Contact Roaster` action
- [x] Any new admin actions create durable audit/event records

---

## Normalized implementation decisions

- Replace the Sprint 4 200-row cap with explicit server pagination at 50 rows per page.
- Include row columns for org/campaign label, payout status, and SLA state in addition to the Sprint 4 baseline fields.
- Keep `Contact Roaster` as a convenience action only (`mailto:` or equivalent); do not turn it into a workflow system in Sprint 5.
- Defer destructive financial actions such as refund issuance and manual payout release to a post-Sprint 5 follow-up unless they are explicitly pulled back into scope.
- If flagging/notes are needed during Sprint 5, store them in `AdminActionLog` rather than inventing a one-off order flag system.

---

## Suggested implementation steps

1. Create a shared helper for SLA badge state from `Order.status`, `fulfillBy`, and `PlatformSettings`.
2. Expand the page query and row shape.
3. Add summary cards and agreed filter controls.
4. Add dispute/payout context to detail.
5. Keep actions intentionally minimal and auditable.

---

## Handoff notes

- Reuse the Sprint 4 event timeline and delivery confirmation patterns instead of duplicating them.
- Treat `DisputeRecord` as the dispute source of truth unless the schema is later extended with order-level flags.
- The normalized Sprint 5 scope for this story is visibility-first, not a full admin command center.

---

## Revision log

| Version | Date | Notes |
|---------|------|-------|
| 0.1 | 2026-04-01 | Initial Sprint 5 story created from source planning doc and current repo review. |
| 0.2 | 2026-04-01 | Normalized to a visibility-first admin MVP: 50/page pagination, richer filters/columns, and only low-risk actions on the order surface. |
| 0.3 | 2026-04-01 | Package A landed: shared admin SLA helper now exists in the repo and this story status is now `Partial`. |
| 0.4 | 2026-04-01 | Story implemented: orders page now has 50/page pagination, SLA rollups/badges, richer filters/columns, payout/dispute detail context, and only the approved low-risk actions. |

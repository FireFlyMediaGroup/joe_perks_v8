# US-07-03 -- Basic Metrics Dashboard for Admin

**Story ID:** US-07-03 | **Epic:** EP-07 (Admin Dashboard)
**Points:** 5 | **Priority:** Medium
**Status:** `Todo`
**Owner:** Full-stack
**Dependencies:** US-05-01, US-07-01
**Depends on this:** None

---

## Goal

Replace the admin home scaffold with a simple server-rendered dashboard that gives the platform team immediate visibility into order volume, GMV, revenue, payout exposure, campaigns, disputes, and recent activity.

---

## Diagram references

- **Order lifecycle:** [`docs/04-order-lifecycle.mermaid`](../../04-order-lifecycle.mermaid) -- event/activity context
- **Database ERD:** [`docs/06-database-schema.mermaid`](../../06-database-schema.mermaid) -- metrics source models
- **Stripe payment flow:** [`docs/07-stripe-payment-flow.mermaid`](../../07-stripe-payment-flow.mermaid) -- GMV, revenue, payouts, disputes

---

## Current repo evidence

- `apps/admin/app/page.tsx` is still the default Next.js starter page.
- The underlying data needed for a basic dashboard already exists in `Order`, `Campaign`, `Roaster`, `Org`, `DisputeRecord`, and `OrderEvent`.
- Sprint 4 already established admin orders, payout tracking, and event timelines that this dashboard can link into.

---

## In scope

- Server-rendered metric cards
- Click-through links into orders/disputes/admin surfaces
- Recent order event feed
- Simple manual refresh or timed refresh

---

## Out of scope

- Advanced charts, BI tooling, or warehouse-backed analytics
- Client-heavy dashboards with custom chart libraries unless later requested
- Non-order audit streams unless explicitly added during Sprint 5

---

## Primary files to create or modify

| Action | File | Purpose |
|--------|------|---------|
| Modify | `apps/admin/app/page.tsx` | Replace scaffold with dashboard |
| Create / Modify | dashboard-specific components under `apps/admin/app/` | Metric cards, event feed, refresh affordances |

---

## Acceptance criteria

- [ ] Admin home page shows 7 metric cards: Orders Today, GMV This Month, Platform Revenue This Month, Active Campaigns, Roasters Active, Pending Payouts ($), Open Disputes
- [ ] Metric values are calculated server-side on initial load
- [ ] Metric cards link to the relevant filtered admin pages where possible
- [ ] Recent activity feed shows the latest 20 `OrderEvent` rows in reverse chronological order
- [ ] Dashboard can be refreshed manually or via a lightweight auto-refresh pattern

---

## Normalized implementation decisions

- Keep the seven-card dashboard from the source story text, including `Open Disputes`, because `DisputeRecord` already exists and the disputes route scaffold is present.
- Define financial metrics using existing platform behavior: GMV from non-cancelled orders; platform revenue from transferred `platformAmount`; pending payouts from payout-eligible-but-not-transferred order value.
- Limit the activity feed to `OrderEvent` in Sprint 5. If `AdminActionLog` lands during Sprint 5, it can be linked separately later rather than mixed into the same feed immediately.

---

## Suggested implementation steps

1. Define the exact aggregate queries.
2. Replace the starter page with server-rendered cards.
3. Add recent `OrderEvent` feed.
4. Link cards into orders/disputes routes that exist in the repo.
5. Add basic refresh behavior.

---

## Handoff notes

- Keep the dashboard simple and operational, not analytical.
- Prefer clear metric definitions in code comments or helper names so future docs stay aligned.
- Prefer links into routes that already exist or are already planned in Sprint 5 rather than introducing extra dashboard-only surfaces.

---

## Revision log

| Version | Date | Notes |
|---------|------|-------|
| 0.1 | 2026-04-01 | Initial Sprint 5 story created from source planning doc and current repo review. |
| 0.2 | 2026-04-01 | Normalized metric definitions and dashboard scope to match the current payout/dispute model and a server-rendered admin MVP. |

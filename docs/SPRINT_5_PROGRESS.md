# Joe Perks -- Sprint 5 Progress Tracker

**Tracker version:** 0.3
**Baseline document:** [`docs/SPRINT_5_CHECKLIST.md`](SPRINT_5_CHECKLIST.md) (v1.1)
**Story documents:** [`docs/sprint-5/stories/`](sprint-5/stories/)
**Sprint overview:** [`docs/sprint-5/README.md`](sprint-5/README.md)
**Purpose:** Track what is actually complete in this repository for Sprint 5 compared with the sprint checklist.

---

## How to use this file

- Treat `docs/SPRINT_5_CHECKLIST.md` as the implementation plan.
- Treat this file as the current-state tracker.
- Update this file whenever Sprint 5 work lands so the diff shows exactly what changed.
- Each story has its own document in `docs/sprint-5/stories/` with current repo evidence and the normalized implementation decisions for Sprint 5.

### Status legend

| Status | Meaning |
|--------|---------|
| `Done` | Implemented and verified in the repo. |
| `Partial` | Foundations exist, but the story is not complete. |
| `Todo` | Not yet started beyond planning docs. |

---

## Revision log

| Review version | Date | Summary |
|----------------|------|---------|
| 0.1 | 2026-04-01 | Initial Sprint 5 tracker created. Planning docs added. Codebase readiness review completed against current `main`. |
| 0.2 | 2026-04-01 | Sprint 5 docs normalized for implementation: dispute events mapped onto existing enums/payloads, `DisputeRecord` retained as source of truth, `min_retail_spread_pct` removed from scope, `AdminActionLog` chosen as the shared admin audit pattern, and suspension/reactivation reframed as a request-and-review workflow with admin readiness checks and suspended-portal UX. |
| 0.3 | 2026-04-01 | Docs tightened for dev handoff: implementation package order added, deferred items called out, `AdminActionLog` made explicit Sprint 5 scope, dashboard feed limited to `OrderEvent`, suspension/reactivation emails made explicit, and dispute-threshold auto-suspension kept in scope. |

---

## Snapshot summary

| Area | Status | Notes |
|------|--------|-------|
| Chargeback webhook + debt recovery (US-06-02) | `Partial` | `DisputeRecord`, `FaultType`, `DisputeOutcome`, `RoasterDebt`, and chargeback diagrams exist; no `charge.dispute.*` webhook handling yet. Normalized decision: keep `DISPUTE_OPENED` / `DISPUTE_CLOSED`, carry outcome/fault in payload, and keep threshold-triggered auto-suspension in Sprint 5 |
| Admin order list with SLA flags (US-07-01) | `Partial` | `apps/admin/app/orders/` list/detail exists, but no SLA indicator column, SLA rollups, advanced filters, or 50/page pagination. Normalized decision: keep Sprint 5 actions low-risk (`Mark Delivered`, `Contact Roaster`) |
| PlatformSettings editor (US-07-02) | `Partial` | `PlatformSettings` singleton exists; `apps/admin/app/settings/page.tsx` is scaffold only. Normalized decision: remove `min_retail_spread_pct` from Sprint 5 scope and include `AdminActionLog` in Sprint 5 |
| Basic metrics dashboard (US-07-03) | `Todo` | Admin home route exists but is still the default Next.js starter page. Normalized decision: feed is latest 20 `OrderEvent` rows only |
| Roaster/org account management (US-07-04) | `Partial` | `Roaster.status` and `Org.status` support `SUSPENDED`, but there are no admin lifecycle routes or actions. Normalized decision: reactivation becomes request-and-review with suspended-portal guidance, explicit readiness checks, and notification emails |

---

## Phase 1 -- Admin Orders with SLA Flags (US-07-01)

| Item | Status | Evidence / current state | Next step |
|------|--------|--------------------------|-----------|
| Orders list route | `Done` | `apps/admin/app/orders/page.tsx` renders an orders page with status tabs | Expand query shape and pagination |
| Orders table | `Partial` | `order-list.tsx` shows order number, roaster, buyer, created/shipped dates, tracking, status | Add SLA badge, payout state, org/campaign label, and richer filters |
| Order detail | `Partial` | Detail page/timeline shipped in Sprint 4 | Add dispute panel, payout controls, and any approved admin actions |
| SLA summary | `Todo` | No top-level SLA cards yet | Add `PlatformSettings`-driven rollups |

---

## Phase 2 -- PlatformSettings Editor (US-07-02)

| Item | Status | Evidence / current state | Next step |
|------|--------|--------------------------|-----------|
| Settings route | `Done` | `apps/admin/app/settings/page.tsx` exists | Replace scaffold with real server-loaded form |
| Singleton model | `Done` | `PlatformSettings` model exists with fee/SLA/payout/dispute fields | Add validation and update action |
| Editable UI | `Todo` | No form fields or save action yet | Build editor and confirmation flow |
| Audit trail | `Partial` | Normalized on docs to a shared `AdminActionLog` concept | Add model/helper and wire settings, disputes, and lifecycle actions to it |

---

## Phase 3 -- Chargeback Webhook + Debt Recovery (US-06-02)

| Item | Status | Evidence / current state | Next step |
|------|--------|--------------------------|-----------|
| Webhook routing | `Todo` | `apps/web/app/api/webhooks/stripe/route.ts` handles payment/account events only | Add `charge.dispute.created` and `charge.dispute.closed` |
| Dispute data model | `Partial` | `DisputeRecord` exists in Prisma schema | Implement normalized approach: keep current enums and derive row/list state from `DisputeRecord` |
| Debt recovery | `Partial` | `RoasterDebt` exists and payout job already deducts debts | Add dispute-origin debt creation and apply normalized `DebtReason` mapping |
| Admin dispute visibility | `Partial` | `apps/admin/app/disputes/page.tsx` scaffold exists | Build real list/detail/countdown UI |

---

## Phase 4 -- Basic Metrics Dashboard (US-07-03)

| Item | Status | Evidence / current state | Next step |
|------|--------|--------------------------|-----------|
| Admin home route | `Done` | `apps/admin/app/page.tsx` exists | Replace starter content |
| Metric cards | `Todo` | No metrics UI yet | Add server-side aggregate queries and cards |
| Live event feed | `Todo` | No dashboard activity feed yet | Query latest `OrderEvent`s |
| Cross-links | `Todo` | No dashboard links into filtered admin routes yet | Wire cards to orders/disputes once routes exist |

---

## Phase 5 -- Roaster and Org Account Controls (US-07-04)

| Item | Status | Evidence / current state | Next step |
|------|--------|--------------------------|-----------|
| Lifecycle status fields | `Done` | `Roaster.status` / `Org.status` include `SUSPENDED` | Build admin management UI around them |
| Suspension-safe onboarding webhook | `Done` | `handleAccountUpdated()` does not re-promote suspended roasters | Preserve this behavior when adding admin actions |
| Admin account pages | `Todo` | No `roasters/` or `orgs/` admin lifecycle routes | Create list/detail pages |
| Suspend/reactivate actions | `Todo` | No lifecycle mutation actions, reactivation requests, or audit-note capture | Add request/review workflow plus `AdminActionLog` |
| Suspended portal UX | `Todo` | No roaster/org blocked-state UI yet | Add status banner/page, remediation checklist, reactivation request flow, and clear blocked-state messaging |
| Storefront enforcement | `Todo` | Storefront does not currently block orders based on roaster suspension | Add roaster status checks in storefront/query layer |

---

## Normalized decisions now in force

1. Keep `DISPUTE_OPENED` and `DISPUTE_CLOSED`; use event payload and `DisputeRecord` for outcome/fault detail.
2. Do not add an `Order.isDisputed` field in Sprint 5; derive dispute state from the relation.
3. Drop `min_retail_spread_pct` from Sprint 5.
4. Use a shared `AdminActionLog` pattern instead of the vague `ApplicationEvent` reference from the source story text.
5. Keep Sprint 5 order-admin actions focused on visibility and low-risk intervention; manual refund/payout stays out unless explicitly promoted.
6. Reactivation is a request/review flow with admin readiness checks, not an immediate toggle.
7. Keep dispute-threshold auto-suspension in Sprint 5; reactivation stays manual.
8. Dashboard activity feed is `OrderEvent` only in Sprint 5.

---

## Document sync checklist

- [x] Sprint 5 README created (`docs/sprint-5/README.md`)
- [x] Sprint 5 checklist created (`docs/SPRINT_5_CHECKLIST.md`)
- [x] Sprint 5 progress tracker created (this file)
- [x] Sprint 5 story documents created with current repo evidence and normalized implementation decisions
- [ ] `docs/01-project-structure.mermaid` update when implementation adds new admin routes
- [ ] `docs/06-database-schema.mermaid` update if Sprint 5 changes dispute/account audit schema
- [ ] `docs/07-stripe-payment-flow.mermaid` update if implemented dispute handling differs from planned flow

**Last full sync:** 2026-04-01 — planning docs only; no Sprint 5 implementation landed yet.

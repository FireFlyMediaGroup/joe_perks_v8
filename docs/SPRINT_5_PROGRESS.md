# Joe Perks -- Sprint 5 Progress Tracker

**Tracker version:** 0.7
**Baseline document:** [`docs/SPRINT_5_CHECKLIST.md`](SPRINT_5_CHECKLIST.md) (v1.5)
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
| 0.4 | 2026-04-01 | Package A implemented: `AdminActionLog` model + migration, `logAdminAction()` export, shared admin actor helper, shared admin SLA helper, and related Sprint 5/schema docs updated in sync. |
| 0.5 | 2026-04-01 | `US-07-01` implemented: admin orders now have 50/page pagination, status/roaster/org/date filters, SLA rollups and row badges, payout/dispute context, and a `Contact Roaster` detail action. |
| 0.6 | 2026-04-01 | `US-07-02` implemented: admin settings page loads the `PlatformSettings` singleton, full schema-aligned editor with validation, acknowledgment of future-only impact, save via server action + `revalidatePath`, and `AdminActionLog` rows with before/after JSON and optional note. |
| 0.7 | 2026-04-01 | Sprint 5 docs sync: progress Phase 2 table aligned with shipped settings editor; checklist prerequisites and doc-sync checkboxes updated; sprint README “current repo alignment” corrected for admin orders + settings; admin Vitest smoke tests and `pnpm admin:smoke:us-07` documented in checklist. |

---

## Snapshot summary

| Area | Status | Notes |
|------|--------|-------|
| Shared foundations (Package A) | `Done` | `AdminActionLog` is now in Prisma schema with a migration, `packages/db/admin-action-log.ts` exports `logAdminAction()`, `packages/types` exposes a shared admin actor helper, and `apps/admin/app/orders/_lib/sla.ts` centralizes SLA state derivation |
| Chargeback webhook + debt recovery (US-06-02) | `Partial` | `DisputeRecord`, `FaultType`, `DisputeOutcome`, `RoasterDebt`, and chargeback diagrams exist; no `charge.dispute.*` webhook handling yet. Normalized decision: keep `DISPUTE_OPENED` / `DISPUTE_CLOSED`, carry outcome/fault in payload, and keep threshold-triggered auto-suspension in Sprint 5 |
| Admin order list with SLA flags (US-07-01) | `Done` | `apps/admin/app/orders/` now includes 50/page pagination, status/roaster/org/date filters, row-level SLA state, SLA summary cards, payout/dispute context, and detail-page `Contact Roaster` while keeping actions low-risk |
| PlatformSettings editor (US-07-02) | `Done` | `apps/admin/app/settings/` now server-loads the singleton, exposes all current-schema fields with helper copy, validates and saves via `_actions/update-platform-settings.ts`, and writes `PLATFORM_SETTINGS_UPDATED` audit rows with before/after snapshots |
| Basic metrics dashboard (US-07-03) | `Todo` | Admin home route exists but is still the default Next.js starter page. Normalized decision: feed is latest 20 `OrderEvent` rows only |
| Roaster/org account management (US-07-04) | `Partial` | `Roaster.status` and `Org.status` support `SUSPENDED`, but there are no admin lifecycle routes or actions. Normalized decision: reactivation becomes request-and-review with suspended-portal guidance, explicit readiness checks, and notification emails |

---

## Package A -- Shared Foundations

| Item | Status | Evidence / current state | Next step |
|------|--------|--------------------------|-----------|
| Admin audit schema | `Done` | `packages/db/prisma/schema.prisma` now defines `AdminActionLog` and a matching Prisma migration exists | Wire dispute and lifecycle writes; settings updates use inline `adminActionLog.create` in the save transaction |
| Audit helper | `Done` | `packages/db/admin-action-log.ts` exports `logAdminAction()` and `packages/db/index.ts` re-exports it | Use for new admin mutations where a shared helper fits (settings use transaction-local create today) |
| Shared admin actor helper | `Done` | `packages/types/src/admin-basic-auth.ts` now exports `getAdminActor()` / `getAdminActorLabel()`; admin delivery uses the shared helper | Reuse it for future admin actions and admin-only APIs |
| Shared SLA helper | `Done` | `apps/admin/app/orders/_lib/sla.ts` now centralizes `PlatformSettings`-driven SLA thresholds and badge state | Consume it in the orders list/detail UI and rollups |

---

## Phase 1 -- Admin Orders with SLA Flags (US-07-01)

| Item | Status | Evidence / current state | Next step |
|------|--------|--------------------------|-----------|
| Orders list route | `Done` | `apps/admin/app/orders/page.tsx` now loads richer row data, filter params, summary counts, and 50/page pagination | Reuse the pattern for future filtered admin routes |
| Orders table | `Done` | `order-list.tsx` now shows org/campaign, SLA state, payout status, dispute callouts, and the approved MVP filters | Refine visual polish only if product wants it |
| Order detail | `Done` | Detail page now shows payout context, dispute state, richer ops fields, existing timeline, `Mark Delivered`, and `Contact Roaster` | Extend later only if manual payout/refund returns to scope |
| SLA summary | `Done` | Shared SLA helper now feeds summary cards and row badges from `PlatformSettings` + `fulfillBy` | Reuse the same helper for dashboard/account readiness views |

---

## Phase 2 -- PlatformSettings Editor (US-07-02)

| Item | Status | Evidence / current state | Next step |
|------|--------|--------------------------|-----------|
| Settings route | `Done` | `apps/admin/app/settings/page.tsx` server-loads singleton; `layout.tsx` nav includes Settings | Extend when schema adds fields |
| Singleton model | `Done` | `PlatformSettings` model exists with fee/SLA/payout/dispute fields | — |
| Editable UI | `Done` | `_components/platform-settings-form.tsx`, `_lib/validate-platform-settings.ts`, `_actions/update-platform-settings.ts` | — |
| Audit trail | `Done` | `PLATFORM_SETTINGS_UPDATED` rows with `before`/`after` JSON; optional note; actor from `getAdminActorLabel()` | Same pattern for US-06-02 / US-07-04 |

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
- [x] `docs/01-project-structure.mermaid` update when implementation adds new admin routes
- [x] `docs/06-database-schema.mermaid` update if Sprint 5 changes dispute/account audit schema
- [ ] `docs/07-stripe-payment-flow.mermaid` update if implemented dispute handling differs from planned flow

**Last full sync:** 2026-04-01 (v0.7) — Progress Phase 2 table and checklist prerequisites aligned with shipped US-07-02; sprint README repo-alignment bullets updated; admin story smoke tests and HTTP smoke script referenced in checklist.

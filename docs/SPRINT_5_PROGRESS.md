# Joe Perks -- Sprint 5 Progress Tracker

**Tracker version:** 1.0
**Baseline document:** [`docs/SPRINT_5_CHECKLIST.md`](SPRINT_5_CHECKLIST.md) (v1.7)
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
| 0.8 | 2026-04-01 | `US-07-03` implemented: admin home now shows seven server-rendered operational cards, orders/disputes links where available, a manual refresh control, and the latest 20 `OrderEvent` rows; sprint docs updated in sync. |
| 0.9 | 2026-04-01 | `US-06-02` implemented: Stripe webhook now handles dispute open/close events, admin disputes supports fault attribution + evidence export, payout release skips unresolved/lost roaster-fault disputes, roaster-fault losses create debt via normalized mapping, and 3-loss auto-suspension now writes `AdminActionLog` plus admin alert email. |
| 1.0 | 2026-04-01 | `US-07-04` implemented: admin `roasters/` + `orgs/` lifecycle routes now support suspend/reactivate review with readiness context and audit logging, roaster/org dashboards show suspended-state guidance plus reactivation requests, mutation paths reject suspended accounts, storefront eligibility blocks suspended actors earlier, and suspension/reactivation emails now ship for manual review plus dispute-threshold auto-suspension. |

---

## Snapshot summary

| Area | Status | Notes |
|------|--------|-------|
| Shared foundations (Package A) | `Done` | `AdminActionLog` is now in Prisma schema with a migration, `packages/db/admin-action-log.ts` exports `logAdminAction()`, `packages/types` exposes a shared admin actor helper, and `apps/admin/app/orders/_lib/sla.ts` centralizes SLA state derivation |
| Chargeback webhook + debt recovery (US-06-02) | `Done` | `apps/web/app/api/webhooks/stripe/route.ts` now handles `charge.dispute.created` / `charge.dispute.closed`, `apps/admin/app/disputes/` supports ops review + evidence export + fault attribution, payout release skips unresolved/lost roaster-fault disputes, and lost roaster-fault cases create debt plus threshold-triggered auto-suspension |
| Admin order list with SLA flags (US-07-01) | `Done` | `apps/admin/app/orders/` now includes 50/page pagination, status/roaster/org/date filters, row-level SLA state, SLA summary cards, payout/dispute context, and detail-page `Contact Roaster` while keeping actions low-risk |
| PlatformSettings editor (US-07-02) | `Done` | `apps/admin/app/settings/` now server-loads the singleton, exposes all current-schema fields with helper copy, validates and saves via `_actions/update-platform-settings.ts`, and writes `PLATFORM_SETTINGS_UPDATED` audit rows with before/after snapshots |
| Basic metrics dashboard (US-07-03) | `Done` | `apps/admin/app/page.tsx` now renders seven server-side metric cards, links into orders/disputes where available, a manual `router.refresh()` control, and the latest 20 `OrderEvent` rows |
| Roaster/org account management (US-07-04) | `Done` | Admin `roasters/` + `orgs/` list/detail routes now support suspend/reactivate review with readiness checks and `AdminActionLog`, suspended portal dashboards show remediation guidance plus request forms, and storefront/runtime guards block suspended accounts from new activity |

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
| Webhook routing | `Done` | `apps/web/app/api/webhooks/stripe/route.ts` now processes `charge.dispute.created` / `charge.dispute.closed` while keeping signature verification and post-success `StripeEvent` idempotency intact | Extend only if automated evidence submission is later reprioritized |
| Dispute data model | `Done` | `DisputeRecord` is now created/updated from Stripe events; `respondBy`, `outcome`, and admin-set `faultAttribution` drive the admin surface and timeline payloads | Keep `DisputeRecord` as the single source of truth in Sprint 5 |
| Debt recovery | `Done` | Lost roaster-fault disputes now create `DISPUTE_LOSS` / `CHARGEBACK` debt rows through `packages/db/dispute-loss.ts`, attempt roaster transfer reversal when available, and refresh `Roaster.disputeCount90d` + auto-suspension | Revisit only if product later wants org-transfer reversal or a richer recovery ledger |
| Admin dispute visibility | `Done` | `apps/admin/app/disputes/page.tsx` now lists open/closed disputes, shows respond-by / order evidence context, supports fault attribution, and links to JSON evidence export via `disputes/[id]/evidence/route.ts` | Add deeper dispute detail/history only if ops asks for it |

---

## Phase 4 -- Basic Metrics Dashboard (US-07-03)

| Item | Status | Evidence / current state | Next step |
|------|--------|--------------------------|-----------|
| Admin home route | `Done` | `apps/admin/app/page.tsx` now replaces the starter screen with a dashboard header, operational summary, and refresh affordance | Keep copy aligned if more cards are added later |
| Metric cards | `Done` | Seven server-rendered cards now show Orders Today, GMV This Month, Platform Revenue This Month, Active Campaigns, Roasters Active, Pending Payouts, and Open Disputes | Add deeper filtered routes later if product wants more drill-down |
| Live event feed | `Done` | Dashboard queries and renders the latest 20 `OrderEvent` rows in reverse chronological order with links to order detail | Keep feed scoped to `OrderEvent` during Sprint 5 |
| Cross-links | `Done` | Cards link into `/orders` date slices and `/disputes` where a relevant route exists; dashboard CTA links to orders | Add more targeted routes/filters alongside future dispute/account pages |

---

## Phase 5 -- Roaster and Org Account Controls (US-07-04)

| Item | Status | Evidence / current state | Next step |
|------|--------|--------------------------|-----------|
| Lifecycle status fields | `Done` | `Roaster.status` / `Org.status` include `SUSPENDED` | Build admin management UI around them |
| Suspension-safe onboarding webhook | `Done` | `handleAccountUpdated()` does not re-promote suspended roasters | Preserve this behavior when adding admin actions |
| Admin account pages | `Done` | `apps/admin/app/roasters/` and `apps/admin/app/orgs/` now provide lifecycle list/detail routes with profile context, recent orders, and recent audit activity | Extend filters/polish later only if ops asks for it |
| Suspend/reactivate actions | `Done` | Admin detail views now submit suspend/reactivate actions with required reason/audit note handling, `AdminActionLog`, readiness-aware status outcomes, and notification emails | Keep audit payloads aligned if lifecycle policy expands later |
| Suspended portal UX | `Done` | Roaster/org authenticated layouts now show suspension banners; dashboards render blocked-state guidance and `Request Reactivation` forms with the latest request timestamp | Extend into broader portal surfaces later only if product wants more self-service detail |
| Storefront enforcement | `Done` | Buyer storefront lookup now excludes campaigns tied to suspended roasters, checkout hard-stops inactive org/roaster flows, and org campaign mutations reject suspended accounts | Add deeper storefront copy only if product wants a public-facing suspension explanation |

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
- [x] `docs/07-stripe-payment-flow.mermaid` update if implemented dispute handling differs from planned flow

**Last full sync:** 2026-04-01 (v1.0) — `US-07-04` account lifecycle controls landed; progress/checklist/story/README and project structure docs now reflect admin lifecycle routes, request/review reactivation, suspended portal UX, stricter storefront guards, and lifecycle notification emails.

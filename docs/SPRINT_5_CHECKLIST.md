# Joe Perks -- Sprint 5 Implementation Checklist

## Admin dashboard, chargebacks, platform settings, and account controls

**Version:** 1.5 | **Sprint:** 5 (Weeks 9-10) | **Points:** 26 | **Stories:** 5
**Audience:** AI coding agents, developers implementing Sprint 5 stories
**Companion documents:**
- Sprint overview: [`docs/sprint-5/README.md`](sprint-5/README.md)
- Story documents: [`docs/sprint-5/stories/`](sprint-5/stories/)
- Progress tracker: [`docs/SPRINT_5_PROGRESS.md`](SPRINT_5_PROGRESS.md)
- Sprint 4 baseline: [`docs/SPRINT_4_CHECKLIST.md`](SPRINT_4_CHECKLIST.md)

---

## Prerequisites (from Sprint 4)

Before starting Sprint 5 work, verify these Sprint 4 deliverables are in place on `main`:

- [x] `apps/admin/app/orders/` -- admin order list/detail with delivery confirmation and event timeline baseline
- [x] `apps/web/lib/inngest/run-sla-check.tsx` -- SLA job using `PlatformSettings` thresholds
- [x] `apps/web/lib/inngest/run-payout-release.ts` -- payout release logic with `RoasterDebt` deduction
- [x] `packages/db/log-event.ts` -- `logOrderEvent()` helper and order events API support
- [x] `packages/db/prisma/schema.prisma` -- `PlatformSettings`, `DisputeRecord`, `RoasterDebt`, `OrderEvent`, `Roaster.status`, `Org.status`
- [x] `apps/web/app/api/webhooks/stripe/route.ts` -- webhook foundation with Stripe signature verification and `StripeEvent` idempotency
- [x] `apps/admin/app/settings/` -- platform settings editor (US-07-02): load singleton, validate, save, `AdminActionLog` audit
- [x] `apps/admin/app/disputes/page.tsx` -- scaffold route exists
- [x] `apps/admin/app/page.tsx` -- admin home route exists and can be replaced

---

## Normalized implementation decisions

These decisions align Sprint 5 to the current repo and should be treated as the working baseline:

- [x] Keep `DISPUTE_OPENED` and `DISPUTE_CLOSED`; store dispute outcome/fault details in payload instead of adding new dispute event enums
- [x] Keep the current `DebtReason` enum; use `DISPUTE_LOSS` for dispute fee + non-refundable Stripe fee and `CHARGEBACK` for principal / reversal shortfall recovery
- [x] Use `DisputeRecord` as the dispute source of truth; do not add `Order.isDisputed` in Sprint 5
- [x] Drop `PlatformSettings.min_retail_spread_pct` from Sprint 5 scope
- [x] Replace `ApplicationEvent` with a focused `AdminActionLog` audit trail for settings changes, fault attribution, suspension/reactivation, and reactivation requests
- [x] Keep US-07-01 focused on visibility and low-risk ops actions; defer manual payout and manual refund to a post-Sprint 5 follow-up unless explicitly reprioritized
- [x] Use a request-and-review reactivation flow: suspended roaster/org sees blocked-state guidance and submits a reactivation request; admin reviews readiness before reactivating

---

## Package A -- Shared Foundations

> **Status:** Implemented. These shared helpers land before the story-specific admin surfaces.

- [x] Add `AdminActionLog` model to `packages/db/prisma/schema.prisma`
- [x] Add `packages/db/admin-action-log.ts` with `logAdminAction()`
- [x] Export the new audit helper from `@joe-perks/db`
- [x] Add a shared admin actor helper for normalized HTTP Basic admin identity
- [x] Add `apps/admin/app/orders/_lib/sla.ts` with shared `PlatformSettings`-driven SLA state logic

---

## Phase 1 -- Admin Orders with SLA Flags (US-07-01)

> **Why first:** Highest-value admin workflow and dependency for later dashboard/account stories.

### 1.1 Upgrade the orders query

- [x] Extend `apps/admin/app/orders/page.tsx` query with campaign/org label, payout status, `fulfillBy`, and dispute summary for row badges
- [x] Replace the current fixed 200-row cap with explicit server pagination at 50 rows per page
- [x] Add filter inputs for status, roaster, org, and date range

### 1.2 SLA indicator logic

- [x] Add a shared SLA state helper using `PlatformSettings`
- [x] Render row-level SLA badges: green / amber / red / grey
- [x] Add page-level SLA summary cards: Critical / Warning / On Track

### 1.3 Order detail expansion

- [x] Show payout breakdown, dispute record (if present), and all relevant order fields on the detail page
- [x] Keep Sprint 5 admin actions to `Mark Delivered` plus a non-destructive `Contact Roaster` convenience action (`mailto:` or equivalent)
- [x] Keep order-surface actions low-risk; no new high-risk order mutation was introduced, and existing delivery confirmation continues to write `OrderEvent`

**Reference:** [`docs/sprint-5/stories/US-07-01-admin-order-list-sla-flags.md`](sprint-5/stories/US-07-01-admin-order-list-sla-flags.md)

---

## Phase 2 -- PlatformSettings Editor (US-07-02)

> **Can run in parallel with Phase 1.** Builds on an existing scaffold page and singleton model.

### 2.1 Settings form

- [x] Replace `apps/admin/app/settings/page.tsx` scaffold with server-loaded current settings
- [x] Add labeled inputs for all supported `PlatformSettings` fields in the current schema
- [x] Add helper text describing what each field controls

### 2.2 Validation and save flow

- [x] Create server actions for update + confirmation flow
- [x] Validate percentages, hours, day ranges, and floor/fee values
- [x] Save to the `PlatformSettings` singleton and revalidate the page

### 2.3 Audit trail

- [x] Add `AdminActionLog` model/helper with fields for actor label, action type, target type, target ID, note, payload, and timestamp
- [x] Record settings changes with before/after summary and optional note

**Reference:** [`docs/sprint-5/stories/US-07-02-platform-settings-editor.md`](sprint-5/stories/US-07-02-platform-settings-editor.md)

---

## Phase 3 -- Chargeback Webhook + Debt Recovery (US-06-02)

> **Can run in parallel with Phases 1-2.** Most schema-sensitive Sprint 5 story.

### 3.1 Webhook coverage

- [ ] Add `charge.dispute.created` handling to `apps/web/app/api/webhooks/stripe/route.ts`
- [ ] Add `charge.dispute.closed` handling with outcome-specific logic
- [ ] Preserve existing Stripe signature verification and `StripeEvent` idempotency rules

### 3.2 Dispute record lifecycle

- [ ] Create/update `DisputeRecord` on dispute open/close
- [ ] Set and display `respondBy`
- [ ] Add evidence export support as an admin helper/button; do not require automated Stripe evidence submission in Sprint 5

### 3.3 Debt and payout handling

- [ ] Create `RoasterDebt` entries when a lost dispute is roaster fault using the normalized `DebtReason` mapping
- [ ] Represent active dispute handling via `DisputeRecord` + existing `PayoutStatus` states instead of adding new payout states in Sprint 5
- [ ] If a roaster reaches 3+ roaster-fault disputes in trailing 90 days, auto-suspend the roaster, write `AdminActionLog`, and notify admin

**Reference:** [`docs/sprint-5/stories/US-06-02-chargeback-webhook-handler.md`](sprint-5/stories/US-06-02-chargeback-webhook-handler.md)

---

## Phase 4 -- Basic Metrics Dashboard (US-07-03)

> **Depends on:** Phase 1 for useful filtered links into orders.

### 4.1 Replace admin home scaffold

- [ ] Replace `apps/admin/app/page.tsx` starter content with server-rendered dashboard cards
- [ ] Add metric cards for orders, GMV, platform revenue, campaigns, active accounts, pending payouts, and open disputes
- [ ] Make cards link into relevant filtered admin routes

### 4.2 Live event feed

- [ ] Show the latest order events across orders
- [ ] Limit the feed to the latest 20 `OrderEvent` rows in Sprint 5
- [ ] Add manual refresh or timed refresh behavior

**Reference:** [`docs/sprint-5/stories/US-07-03-basic-metrics-dashboard.md`](sprint-5/stories/US-07-03-basic-metrics-dashboard.md)

---

## Phase 5 -- Roaster and Org Account Controls (US-07-04)

> **Depends on:** Phase 1 patterns and shared admin list/detail conventions.

### 5.1 Admin account detail surfaces

- [ ] Create admin roaster list/detail pages
- [ ] Create admin org list/detail pages
- [ ] Show lifecycle status, key profile details, and relevant business context (orders, debt, campaign/account readiness)

### 5.2 Suspend / reactivate actions

- [ ] Add required suspend reason / audit note capture
- [ ] Update `Roaster.status` / `Org.status`
- [ ] Write suspension/reactivation/reactivation-request events to `AdminActionLog`
- [ ] Send suspension notification email and reactivation-approved email using `sendEmail()`

### 5.3 Runtime behavior and UX

- [ ] Prevent suspended roasters from receiving new storefront orders
- [ ] Prevent suspended orgs from presenting an active public storefront
- [ ] Confirm existing confirmed orders continue to completion
- [ ] Ensure suspension logic does not fight Stripe `account.updated` promotion behavior
- [ ] Add suspended-state portal UI in `apps/roaster` and `apps/org`: clear banner/status card, what is blocked, why, what to do next
- [ ] Add `Request Reactivation` flow with remediation note, visible review status, and expected response guidance
- [ ] Add admin reactivation-readiness panel: open disputes, unsettled debt, Stripe readiness, open fulfillment obligations, recent admin notes

### 5.4 Reactivation decision rules

- [ ] Default reactivation requires no open disputes, no unsettled dispute-linked debt requiring review, and Stripe onboarding still in a valid state
- [ ] Allow admin override reactivation with explicit confirmation and audit note when blockers remain
- [ ] If prerequisites are still incomplete after reactivation, keep the account non-active and show the missing steps clearly

**Reference:** [`docs/sprint-5/stories/US-07-04-admin-account-management.md`](sprint-5/stories/US-07-04-admin-account-management.md)

---

## Cross-cutting concerns

### Document sync checklist

- [x] `docs/sprint-5/README.md` kept in sync with actual implementation status
- [x] `docs/SPRINT_5_PROGRESS.md` updated after each story lands
- [x] Story documents updated with real evidence and checked acceptance criteria (US-07-01 / US-07-02 Done; see story files)
- [ ] `docs/01-project-structure.mermaid` updated for new admin routes
- [ ] `docs/06-database-schema.mermaid` updated if dispute/account audit schema changes
- [ ] `docs/07-stripe-payment-flow.mermaid` updated if the implemented dispute flow differs from the planned one
- [ ] `docs/AGENTS.md` / `docs/CONVENTIONS.md` updated if Sprint 5 introduces new platform rules or admin patterns

### AGENTS.md rules checklist

- [ ] Money values remain integer cents
- [ ] `PlatformSettings` is the source of truth for future-order business rules
- [ ] Order split fields are never recalculated for existing orders
- [ ] Webhook handlers use Stripe signature verification and `StripeEvent` idempotency
- [ ] `sendEmail()` is used for any new admin/account notification emails
- [ ] `logOrderEvent()` is used for non-transactional order timeline writes
- [ ] `AdminActionLog` is used for non-order admin audit actions
- [ ] No PII is logged in webhook, refund, dispute, or admin flows

### Ready-for-build defaults

- [x] `AdminActionLog` is part of Sprint 5, not post-Sprint follow-up
- [x] Dashboard feed shows `OrderEvent` only
- [x] Orders page actions are limited to low-risk ops actions in Sprint 5
- [x] Manual refund and manual payout remain deferred
- [x] Dispute threshold auto-suspension remains in Sprint 5
- [x] Reactivation is request/review with admin override support

### Testing commands

```bash
pnpm dev
pnpm typecheck
pnpm check
pnpm build

# Admin — US-07-01 / US-07-02 Vitest (SLA helper + settings validation)
pnpm --filter admin test

# Admin — HTTP smoke for /orders + /settings (requires admin on :3003 + ADMIN_EMAIL / ADMIN_PASSWORD)
pnpm admin:smoke:us-07

# Email preview
pnpm --filter email dev

# Local Stripe webhook forwarding
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Inngest dev, if needed
npx inngest-cli@latest dev
```

---

## Quick reference -- Story-to-file mapping

| Story | Phase | Key files |
|-------|-------|-----------|
| US-07-01 | 1 | `apps/admin/app/orders/page.tsx`, `apps/admin/app/orders/_components/order-list.tsx`, `apps/admin/app/orders/[id]/page.tsx`, `apps/admin/app/orders/_lib/sla.ts`, `apps/admin/__tests__/us-07-01-*.test.ts` |
| US-07-02 | 2 | `apps/admin/app/settings/` (`page.tsx`, `_actions/`, `_components/`, `_lib/`), `AdminActionLog` on save; `apps/admin/__tests__/us-07-02-*.test.ts` |
| US-06-02 | 3 | `apps/web/app/api/webhooks/stripe/route.ts`, dispute/admin detail surfaces, possible schema updates |
| US-07-03 | 4 | `apps/admin/app/page.tsx`, dashboard components |
| US-07-04 | 5 | `apps/admin/app/roasters/`, `apps/admin/app/orgs/`, suspend/reactivate actions, `apps/roaster/app/(authenticated)/dashboard/page.tsx`, `apps/org/app/(authenticated)/dashboard/page.tsx`, storefront guards |

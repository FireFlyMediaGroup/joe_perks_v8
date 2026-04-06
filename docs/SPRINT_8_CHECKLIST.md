# Joe Perks — Sprint 8 Implementation Checklist

## Roaster fulfillment enhancement, issue reporting, reminder refresh, portal order queue, portal detail, and payouts visibility

**Version:** 0.1 | **Sprint:** 8-9 | **Stories:** 7
**Audience:** AI coding agents, developers implementing Sprint 8 stories
**Companion documents:**
- Sprint overview: [`docs/sprint-8/README.md`](sprint-8/README.md)
- Story documents: [`docs/sprint-8/stories/`](sprint-8/stories/)
- Progress tracker: [`docs/SPRINT_8_PROGRESS.md`](SPRINT_8_PROGRESS.md)
- Planning baseline: [`docs/sprint-8/roaster-fulfillment-epic-v4.md`](sprint-8/roaster-fulfillment-epic-v4.md)
- Pre-flight decisions: [`docs/sprint-8/roaster-fulfillment-preflight-decisions.md`](sprint-8/roaster-fulfillment-preflight-decisions.md)

---

## Before starting

Read these first:

- [x] [`docs/sprint-8/roaster-fulfillment-epic-v4.md`](sprint-8/roaster-fulfillment-epic-v4.md)
- [x] [`docs/sprint-8/roaster-fulfillment-preflight-decisions.md`](sprint-8/roaster-fulfillment-preflight-decisions.md)
- [x] [`docs/sprint-8/README.md`](sprint-8/README.md)
- [x] [`docs/AGENTS.md`](AGENTS.md)
- [x] [`docs/CONVENTIONS.md`](CONVENTIONS.md)
- [x] [`docs/joe_perks_db_schema.md`](joe_perks_db_schema.md)

Do not start Sprint 8 implementation from `docs/sprint-8/roaster-fulfillmet` alone. Use the normalized Sprint 8 docs as the source of truth.

---

## Prerequisites from prior work

Verify the current baseline is still true before changing code:

- [x] `apps/web/app/api/webhooks/stripe/route.ts` already creates a deduped `ORDER_FULFILLMENT` link
- [x] `apps/roaster/app/fulfill/[token]/page.tsx` already provides the live token fulfillment route
- [x] `apps/roaster/app/fulfill/[token]/_actions/submit-tracking.ts` already transitions `CONFIRMED -> SHIPPED`
- [x] `apps/admin/app/orders/_actions/confirm-delivery.ts` already transitions `SHIPPED -> DELIVERED`
- [x] `apps/web/lib/inngest/run-sla-check.tsx` already sends reminder/urgent/buyer-delay/admin SLA emails
- [x] `apps/web/lib/inngest/run-payout-release.ts` already releases payouts from `DELIVERED + HELD`
- [x] `apps/roaster/app/(authenticated)/dashboard/page.tsx` is still placeholder-level
- [x] `apps/roaster/app/(authenticated)/payouts/page.tsx` is still placeholder-level

If any of the above changed, update the Sprint 8 docs before implementing the affected story.

---

## Phase 0 — Foundation decisions and doc alignment

> **Why first:** Sprint 8 depends on a few explicit architecture decisions so agents do not improvise incompatible fulfillment-link, resend, flagging, or payout-state behavior.

### 0.1 Confirm normalized decisions

- [x] Keep one live fulfillment-link row per order
- [x] Reuse active token while valid; rotate only on expiry or explicit regeneration
- [x] Expired-link recovery is token-based, not order-ID-based
- [x] Unresolved flags pause automated fulfillment-side SLA actions
- [x] Portal mutations use server actions with `requireRoasterId()`
- [x] Tracking correction is portal-only and emits `TRACKING_UPDATED`
- [x] `fulfillmentNote` is in scope
- [x] Payout UI uses live `HELD / TRANSFERRED / FAILED` vocabulary

### 0.2 Confirm cross-story UX rules

- [ ] Token and portal fulfillment surfaces feel operationally consistent
- [ ] All new interactive targets meet 44x44px minimum touch target guidance
- [ ] New loading and animation states support `prefers-reduced-motion`
- [ ] Async success/error states manage focus intentionally
- [ ] Buyer PII never appears in new logs

### 0.3 Confirm document sync plan

- [x] Sprint overview
- [x] Story docs
- [x] Checklist
- [x] Progress tracker
- [x] `docs/01-project-structure.mermaid`
- [x] `docs/04-order-lifecycle.mermaid`
- [x] `docs/06-database-schema.mermaid`
- [x] `docs/08-order-state-machine.mermaid`
- [x] `docs/AGENTS.md` and/or `docs/CONVENTIONS.md` if route/auth guidance changes

---

## Phase 1 — US-10-00 Fulfillment schema and event alignment

> **Why first:** Every later Sprint 8 story depends on schema and event naming being explicit.

### 1.1 Schema updates

- [ ] Add `Order.fulfillmentNote`
- [ ] Add `Order.flagReason`
- [ ] Add `Order.flagNote`
- [ ] Add `Order.resolutionOffered`
- [ ] Add `Order.flaggedAt`
- [ ] Add `Order.flagResolvedAt`
- [ ] Add `Order.adminAcknowledgedFlag`
- [ ] Regenerate Prisma client after migration

### 1.2 Event updates

- [ ] Add `ORDER_FLAGGED`
- [ ] Add `FLAG_RESOLVED`
- [ ] Add `MAGIC_LINK_RESENT`
- [ ] Add `TRACKING_UPDATED`
- [ ] Preserve live event names such as `PAYMENT_SUCCEEDED`, `FULFILLMENT_VIEWED`, `SHIPPED`, `DELIVERED`

### 1.3 Acceptance checks

- [ ] Migration applies cleanly
- [ ] Existing fulfillment code still compiles after schema expansion
- [ ] Schema docs/diagrams are updated

**Reference:** [`docs/sprint-8/stories/US-10-00-fulfillment-schema-event-alignment.md`](sprint-8/stories/US-10-00-fulfillment-schema-event-alignment.md)

---

## Phase 2 — US-10-01 Magic-link fulfillment page enhancement

> **Depends on:** Phase 1

### 2.1 Token-page UX upgrade

- [ ] Add full shipping snapshot display
- [ ] Improve token-page layout and hierarchy
- [ ] Add optional `fulfillmentNote`
- [ ] Improve expired/used/already-shipped states

### 2.2 Mutation preservation

- [ ] Tracking submission stays transactional and idempotent
- [ ] `fulfillmentNote` persists on ship
- [ ] Buyer shipped email includes the note when present

### 2.3 Expired-token recovery

- [ ] Recovery is driven by expired-token context
- [ ] Regeneration only works when order is still `CONFIRMED`
- [ ] No portal session is minted from this path

**Reference:** [`docs/sprint-8/stories/US-10-01-magic-link-fulfillment-page-enhancement.md`](sprint-8/stories/US-10-01-magic-link-fulfillment-page-enhancement.md)

---

## Phase 3 — US-10-02 Structured "Can't fulfill" flow

> **Depends on:** Phases 1-2

### 3.1 Roaster issue reporting

- [ ] Add "Can't fulfill this order" entry point
- [ ] Require reason
- [ ] Require resolution offer
- [ ] Allow optional note
- [ ] Persist issue fields on `Order`
- [ ] Write `ORDER_FLAGGED`

### 3.2 Admin visibility and resolution

- [ ] Flagged orders surface clearly in admin list/detail
- [ ] Admin can acknowledge a flag
- [ ] Admin can explicitly resolve a flag
- [ ] Resolution writes `FLAG_RESOLVED`

### 3.3 SLA handling

- [ ] Unresolved flagged orders are skipped by reminder/urgent/buyer-delay/auto-refund automation
- [ ] Admin acknowledgement alone does not resume automation

**Reference:** [`docs/sprint-8/stories/US-10-02-structured-cant-fulfill-flow.md`](sprint-8/stories/US-10-02-structured-cant-fulfill-flow.md)

---

## Phase 4 — US-10-03 Fulfillment reminders and escalation refresh

> **Depends on:** Phases 1-2

### 4.1 Reminder / urgent email behavior

- [ ] Reminder and urgent emails include a valid fulfillment CTA
- [ ] Active token is reused while still valid
- [ ] Expired active token regenerates in place only when eligible
- [ ] Regeneration writes `MAGIC_LINK_RESENT`

### 4.2 Dedupe / template strategy

- [ ] Template names remain distinct enough for `EmailLog` dedupe
- [ ] Global dedupe model is unchanged
- [ ] No duplicate live `MagicLink` rows are created

### 4.3 Flag-awareness

- [ ] Reminder/urgent sends do not run for unresolved flagged orders

**Reference:** [`docs/sprint-8/stories/US-10-03-fulfillment-reminders-escalation-refresh.md`](sprint-8/stories/US-10-03-fulfillment-reminders-escalation-refresh.md)

---

## Phase 5 — US-10-04 Authenticated roaster order queue

> **Depends on:** Phase 1

### 5.1 Dashboard route

- [ ] Replace placeholder dashboard with real order-management view
- [ ] Require roaster auth through existing portal flow
- [ ] Scope reads by `requireRoasterId()`

### 5.2 Queue views

- [ ] `To ship` for `CONFIRMED`
- [ ] `Shipped` for `SHIPPED`
- [ ] `Delivered` for `DELIVERED`
- [ ] `All` for full roaster history

### 5.3 State visibility

- [ ] `To ship` orders sort by `fulfillBy`
- [ ] Unresolved flagged orders show clear action-needed state
- [ ] Rows link into portal order detail

**Reference:** [`docs/sprint-8/stories/US-10-04-authenticated-roaster-order-queue.md`](sprint-8/stories/US-10-04-authenticated-roaster-order-queue.md)

---

## Phase 6 — US-10-05 Portal order detail, fulfillment, and tracking correction

> **Depends on:** Phases 1, 2, and 5

### 6.1 Portal detail route

- [ ] Create authenticated tenant-safe order-detail route
- [ ] Show order snapshots, payout snapshot, shipping snapshot, and event history

### 6.2 In-portal fulfillment

- [ ] `CONFIRMED` orders can be fulfilled in portal
- [ ] Behavior matches the token flow at the state/mutation layer

### 6.3 Tracking correction

- [ ] Portal-only tracking correction is supported for `SHIPPED` orders
- [ ] Correction writes `TRACKING_UPDATED`
- [ ] Buyer tracking-update email is sent

**Reference:** [`docs/sprint-8/stories/US-10-05-portal-order-detail-fulfillment-tracking-correction.md`](sprint-8/stories/US-10-05-portal-order-detail-fulfillment-tracking-correction.md)

---

## Phase 7 — US-10-06 Roaster payouts, debts, and disputes view

> **Depends on:** Phase 5

### 7.1 Payouts route

- [ ] Replace placeholder payouts page with real read model
- [ ] Scope reads by `requireRoasterId()`

### 7.2 Payout vocabulary

- [ ] `HELD + future eligible date` renders as in hold period
- [ ] `HELD + past eligible date` renders as awaiting release
- [ ] `TRANSFERRED` renders as paid
- [ ] `FAILED` renders as transfer failed

### 7.3 Finance visibility

- [ ] Show payout history
- [ ] Show unresolved `RoasterDebt`
- [ ] Show disputes tied to the roaster's orders

**Reference:** [`docs/sprint-8/stories/US-10-06-roaster-payouts-debts-disputes-view.md`](sprint-8/stories/US-10-06-roaster-payouts-debts-disputes-view.md)

---

## Cross-story QA checklist

Use this before marking any Sprint 8 story `Done`:

- [ ] One story only was implemented in the session
- [ ] Relevant tests/checks were run
- [ ] Any introduced issues were fixed
- [ ] Token behavior still respects the one-live-link rule
- [ ] No new logs expose buyer PII
- [ ] Portal mutations use server actions and tenant scoping
- [ ] Story docs and sprint trackers were updated alongside implementation

---

## Deferred items checklist

These should remain unchecked in Sprint 8 unless scope is explicitly changed:

- [ ] EasyPost label generation
- [ ] Packing slips
- [ ] Batch fulfillment
- [ ] Carrier webhook delivery confirmation replacement
- [ ] Magic-link-based portal login
- [ ] Multi-roaster fulfillment

---

## Document sync checklist

- [ ] Sprint 8 README updated
- [ ] Sprint 8 story docs updated
- [ ] Sprint 8 checklist updated
- [ ] Sprint 8 progress tracker updated
- [ ] Relevant mermaid diagrams updated if implementation changed architecture
- [ ] `AGENTS.md` / `CONVENTIONS.md` updated if implementation changed canonical guidance

---

## Revision log

| Version | Date | Notes |
|---------|------|-------|
| 0.1 | 2026-04-05 | Initial Sprint 8 checklist created from EP-10 v4, the pre-flight decisions note, and the Sprint 7 sprint-doc structure. |

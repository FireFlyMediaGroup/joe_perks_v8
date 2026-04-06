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
- [x] `apps/roaster/app/(authenticated)/dashboard/page.tsx` now serves the real roaster order queue
- [x] `apps/roaster/app/(authenticated)/payouts/page.tsx` now serves the real roaster finance view

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

- [x] Token and portal fulfillment surfaces feel operationally consistent
- [x] All new interactive targets meet 44x44px minimum touch target guidance
- [x] New loading and animation states support `prefers-reduced-motion`
- [x] Async success/error states manage focus intentionally
- [x] Buyer PII never appears in new logs

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

- [x] Add `Order.fulfillmentNote`
- [x] Add `Order.flagReason`
- [x] Add `Order.flagNote`
- [x] Add `Order.resolutionOffered`
- [x] Add `Order.flaggedAt`
- [x] Add `Order.flagResolvedAt`
- [x] Add `Order.adminAcknowledgedFlag`
- [x] Regenerate Prisma client after migration

### 1.2 Event updates

- [x] Add `ORDER_FLAGGED`
- [x] Add `FLAG_RESOLVED`
- [x] Add `MAGIC_LINK_RESENT`
- [x] Add `TRACKING_UPDATED`
- [x] Preserve live event names such as `PAYMENT_SUCCEEDED`, `FULFILLMENT_VIEWED`, `SHIPPED`, `DELIVERED`

### 1.3 Acceptance checks

- [x] Migration applies cleanly
- [x] Existing fulfillment code still compiles after schema expansion
- [x] Schema docs/diagrams are updated

**Reference:** [`docs/sprint-8/stories/US-10-00-fulfillment-schema-event-alignment.md`](sprint-8/stories/US-10-00-fulfillment-schema-event-alignment.md)

---

## Phase 2 — US-10-01 Magic-link fulfillment page enhancement

> **Depends on:** Phase 1

### 2.1 Token-page UX upgrade

- [x] Add full shipping snapshot display
- [x] Improve token-page layout and hierarchy
- [x] Add optional `fulfillmentNote`
- [x] Improve expired/used/already-shipped states

### 2.2 Mutation preservation

- [x] Tracking submission stays transactional and idempotent
- [x] `fulfillmentNote` persists on ship
- [x] Buyer shipped email includes the note when present

### 2.3 Expired-token recovery

- [x] Recovery is driven by expired-token context
- [x] Regeneration only works when order is still `CONFIRMED`
- [x] No portal session is minted from this path

**Reference:** [`docs/sprint-8/stories/US-10-01-magic-link-fulfillment-page-enhancement.md`](sprint-8/stories/US-10-01-magic-link-fulfillment-page-enhancement.md)

---

## Phase 3 — US-10-02 Structured "Can't fulfill" flow

> **Depends on:** Phases 1-2

### 3.1 Roaster issue reporting

- [x] Add "Can't fulfill this order" entry point
- [x] Require reason
- [x] Require resolution offer
- [x] Allow optional note
- [x] Persist issue fields on `Order`
- [x] Write `ORDER_FLAGGED`

### 3.2 Admin visibility and resolution

- [x] Flagged orders surface clearly in admin list/detail
- [x] Admin can acknowledge a flag
- [x] Admin can explicitly resolve a flag
- [x] Resolution writes `FLAG_RESOLVED`

### 3.3 SLA handling

- [x] Unresolved flagged orders are skipped by reminder/urgent/buyer-delay/auto-refund automation
- [x] Admin acknowledgement alone does not resume automation

**Reference:** [`docs/sprint-8/stories/US-10-02-structured-cant-fulfill-flow.md`](sprint-8/stories/US-10-02-structured-cant-fulfill-flow.md)

---

## Phase 4 — US-10-03 Fulfillment reminders and escalation refresh

> **Depends on:** Phases 1-2

### 4.1 Reminder / urgent email behavior

- [x] Reminder and urgent emails include a valid fulfillment CTA
- [x] Active token is reused while still valid
- [x] Expired active token regenerates in place only when eligible
- [x] Regeneration writes `MAGIC_LINK_RESENT`

### 4.2 Dedupe / template strategy

- [x] Template names remain distinct enough for `EmailLog` dedupe
- [x] Global dedupe model is unchanged
- [x] No duplicate live `MagicLink` rows are created

### 4.3 Flag-awareness

- [x] Reminder/urgent sends do not run for unresolved flagged orders

**Reference:** [`docs/sprint-8/stories/US-10-03-fulfillment-reminders-escalation-refresh.md`](sprint-8/stories/US-10-03-fulfillment-reminders-escalation-refresh.md)

---

## Phase 5 — US-10-04 Authenticated roaster order queue

> **Depends on:** Phase 1

### 5.1 Dashboard route

- [x] Replace placeholder dashboard with real order-management view
- [x] Require roaster auth through existing portal flow
- [x] Scope reads by `requireRoasterId()`

### 5.2 Queue views

- [x] `To ship` for `CONFIRMED`
- [x] `Shipped` for `SHIPPED`
- [x] `Delivered` for `DELIVERED`
- [x] `All` for full roaster history

### 5.3 State visibility

- [x] `To ship` orders sort by `fulfillBy`
- [x] Unresolved flagged orders show clear action-needed state
- [x] Rows link into portal order detail

**Reference:** [`docs/sprint-8/stories/US-10-04-authenticated-roaster-order-queue.md`](sprint-8/stories/US-10-04-authenticated-roaster-order-queue.md)

---

## Phase 6 — US-10-05 Portal order detail, fulfillment, and tracking correction

> **Depends on:** Phases 1, 2, and 5

### 6.1 Portal detail route

- [x] Create authenticated tenant-safe order-detail route
- [x] Show order snapshots, payout snapshot, shipping snapshot, and event history

### 6.2 In-portal fulfillment

- [x] `CONFIRMED` orders can be fulfilled in portal
- [x] Behavior matches the token flow at the state/mutation layer

### 6.3 Tracking correction

- [x] Portal-only tracking correction is supported for `SHIPPED` orders
- [x] Correction writes `TRACKING_UPDATED`
- [x] Buyer tracking-update email is sent

**Reference:** [`docs/sprint-8/stories/US-10-05-portal-order-detail-fulfillment-tracking-correction.md`](sprint-8/stories/US-10-05-portal-order-detail-fulfillment-tracking-correction.md)

---

## Phase 7 — US-10-06 Roaster payouts, debts, and disputes view

> **Depends on:** Phase 5

### 7.1 Payouts route

- [x] Replace placeholder payouts page with real read model
- [x] Scope reads by `requireRoasterId()`

### 7.2 Payout vocabulary

- [x] `HELD + future eligible date` renders as in hold period
- [x] `HELD + past eligible date` renders as awaiting release
- [x] `TRANSFERRED` renders as paid
- [x] `FAILED` renders as transfer failed

### 7.3 Finance visibility

- [x] Show payout history
- [x] Show unresolved `RoasterDebt`
- [x] Show disputes tied to the roaster's orders

**Reference:** [`docs/sprint-8/stories/US-10-06-roaster-payouts-debts-disputes-view.md`](sprint-8/stories/US-10-06-roaster-payouts-debts-disputes-view.md)

---

## Cross-story QA checklist

Use this before marking any Sprint 8 story `Done`:

- [x] One story only was implemented in the session
- [x] Relevant tests/checks were run
- [x] Any introduced issues were fixed
- [x] Token behavior still respects the one-live-link rule
- [x] No new logs expose buyer PII
- [x] Portal mutations use server actions and tenant scoping
- [x] Story docs and sprint trackers were updated alongside implementation

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

- [x] Sprint 8 README updated
- [x] Sprint 8 story docs updated
- [x] Sprint 8 checklist updated
- [x] Sprint 8 progress tracker updated
- [x] Relevant mermaid diagrams updated if implementation changed architecture
- [ ] `AGENTS.md` / `CONVENTIONS.md` updated if implementation changed canonical guidance

---

## Revision log

| Version | Date | Notes |
|---------|------|-------|
| 0.1 | 2026-04-05 | Initial Sprint 8 checklist created from EP-10 v4, the pre-flight decisions note, and the Sprint 7 sprint-doc structure. |
| 0.2 | 2026-04-06 | Updated after US-10-02: issue-reporting, admin resolution, and flagged-order SLA pause checks are now marked complete. |
| 0.3 | 2026-04-06 | Updated after US-10-03: reminder/urgent CTA links, active-token reuse, in-place regeneration, and resend-event tracking are now marked complete. |
| 0.4 | 2026-04-06 | Updated after US-10-04: the authenticated dashboard now shows roaster-scoped queue filters, action-needed flagged orders, and linked order handoff pages. |
| 0.5 | 2026-04-06 | Updated after US-10-05: the authenticated order route now supports portal fulfillment, tracking correction, event history, and buyer tracking-update emails. |
| 0.6 | 2026-04-06 | Updated after US-10-06: the payouts route now shows roaster-scoped payout history, derived payout labels, unresolved debt, dispute visibility, and focused payout-state verification. |
| 0.7 | 2026-04-06 | Follow-up audit: disputed held-order payout labels now honor `payoutEligibleAt`, async Sprint 8 status messages move focus intentionally, reduced-motion coverage was verified on transitioned controls, and the Sprint 8 PII log audit is now checked off. |

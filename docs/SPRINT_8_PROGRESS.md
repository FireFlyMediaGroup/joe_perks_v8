# Joe Perks — Sprint 8 Progress Tracker

**Tracker version:** 0.1
**Baseline document:** [`docs/SPRINT_8_CHECKLIST.md`](SPRINT_8_CHECKLIST.md)
**Story documents:** [`docs/sprint-8/stories/`](sprint-8/stories/)
**Sprint overview:** [`docs/sprint-8/README.md`](sprint-8/README.md)
**Planning baseline:** [`docs/sprint-8/roaster-fulfillment-epic-v4.md`](sprint-8/roaster-fulfillment-epic-v4.md)
**Purpose:** Track the actual implementation state of Sprint 8 roaster-fulfillment work relative to the normalized sprint plan.

---

## How to use this file

- Treat [`docs/SPRINT_8_CHECKLIST.md`](SPRINT_8_CHECKLIST.md) as the implementation plan.
- Treat this file as the current-state tracker.
- Update this file whenever Sprint 8 work lands so the git diff shows exactly what changed.
- Update the relevant story file in `docs/sprint-8/stories/` in the same PR as implementation.

### Status legend

| Status | Meaning |
|--------|---------|
| `Done` | Implemented and verified in the repo. |
| `Partial` | Started but incomplete. |
| `Todo` | Not yet started. |

---

## Revision log

| Review version | Date | Summary |
|----------------|------|---------|
| 0.1 | 2026-04-05 | Initial tracker. All Sprint 8 stories start at `Todo`. |
| 0.2 | 2026-04-06 | US-10-00 completed: fulfillment schema fields, event enums, migration, and schema docs aligned. |
| 0.3 | 2026-04-06 | US-10-01 completed: token page UX upgrade, shipping snapshot display, fulfillment note support, expired-token recovery, and shipped email note copy. |
| 0.4 | 2026-04-06 | US-10-02 completed: structured issue reporting on the token page, admin acknowledge/resolve controls, admin alerting, and SLA pause behavior for unresolved flagged orders. |
| 0.5 | 2026-04-06 | US-10-03 completed: reminder and urgent emails now include fulfillment CTAs, the SLA job reuses or regenerates the single fulfillment link in place, and reminder automation keeps `MAGIC_LINK_RESENT` aligned with token recovery. |
| 0.6 | 2026-04-06 | US-10-04 completed: the roaster dashboard now serves a tenant-safe order queue with queue filters, action-needed flagged states, and linked order handoff routes. |
| 0.7 | 2026-04-06 | US-10-05 completed: the authenticated order route now shows full order detail, portal fulfillment, tracking correction with `TRACKING_UPDATED`, and buyer tracking-update emails. |
| 0.8 | 2026-04-06 | US-10-06 completed: the payouts route now renders a tenant-safe finance dashboard with live payout labels, unresolved debt visibility, dispute rows, and focused helper tests. |
| 0.9 | 2026-04-06 | Sprint 8 completion follow-up: dispute payout labels now respect `payoutEligibleAt`, Sprint 8 async status messaging manages focus intentionally, reduced-motion coverage was verified on transitioned controls, and the remaining cross-story QA checkboxes were closed. |

---

## Snapshot summary

| Area | Status | Notes |
|------|--------|-------|
| US-10-00 — Fulfillment schema and event alignment | `Done` | Schema fields, event enums, migration, and core schema docs landed |
| US-10-01 — Magic-link fulfillment page enhancement | `Done` | Token page now shows the shipping snapshot, richer state handling, fulfillment-note support, and expired-token recovery |
| US-10-02 — Structured "Can't fulfill" flow | `Done` | Token page can report issues, admin can acknowledge/resolve them, and unresolved flags pause SLA automation |
| US-10-03 — Fulfillment reminders and escalation refresh | `Done` | Reminder and urgent emails now carry valid fulfillment CTAs, reuse active tokens, and regenerate the single link in place when needed |
| US-10-04 — Authenticated roaster order queue | `Done` | Dashboard route now shows roaster-scoped queue filters, action-needed flagged orders, and order links |
| US-10-05 — Portal order detail / fulfillment / tracking correction | `Done` | The authenticated order route now supports full detail display, in-portal fulfillment, tracking correction, and roaster-facing event history |
| US-10-06 — Roaster payouts / debts / disputes view | `Done` | Payouts route now shows live payout history, unsettled debt, disputes, and derived finance-state summary cards |

---

## Phase 0 — Foundation decisions and doc alignment

| Item | Status | Evidence / current state | Next step |
|------|--------|--------------------------|-----------|
| One-live-link model | `Done` | Locked in Sprint 8 epic + pre-flight docs | Enforce in all implementation stories |
| Hybrid token reuse / rotation | `Done` | Locked in pre-flight docs and Sprint 8 README/checklist | Implement in US-10-03 and token recovery flows |
| Expired-token recovery model | `Done` | Normalized to token-based recovery, not order-ID-based recovery | Implement in US-10-01 |
| Flagged-order SLA pause decision | `Done` | Normalized in epic + pre-flight docs | Implement in US-10-02 |
| Portal server-action pattern | `Done` | Normalized in epic + docs | Enforce in US-10-04/05/06 |
| Payout vocabulary alignment | `Done` | Normalized to live `HELD / TRANSFERRED / FAILED` | Keep future finance UI aligned to the same live labels |

---

## Phase 1 — US-10-00 Fulfillment schema and event alignment

| Item | Status | Evidence / current state | Next step |
|------|--------|--------------------------|-----------|
| `fulfillmentNote` support | `Done` | Added to live Prisma schema and migration | Consume in US-10-01 / US-10-05 |
| Flag fields on `Order` | `Done` | Added to live Prisma schema and migration | Consume in US-10-02 admin/roaster flows |
| New event types | `Done` | Added `ORDER_FLAGGED`, `FLAG_RESOLVED`, `MAGIC_LINK_RESENT`, `TRACKING_UPDATED` | Emit in downstream stories |
| Schema docs sync | `Done` | ERD, schema reference, and order state machine updated | Keep downstream docs aligned |

---

## Phase 2 — US-10-01 Magic-link fulfillment page enhancement

| Item | Status | Evidence / current state | Next step |
|------|--------|--------------------------|-----------|
| Shipping snapshot display | `Done` | Token page now shows the immutable ship-to snapshot alongside the order summary and payout card | Reuse the same presentation patterns in US-10-05 where helpful |
| `fulfillmentNote` in token flow | `Done` | The public tracking form stores `Order.fulfillmentNote` and includes it in the buyer shipped email | Reuse the same note semantics in the future portal flow |
| Improved token states | `Done` | Expired, invalid, used, shipped, and delivered states now render dedicated calm UI instead of plain text | Keep portal detail UX operationally consistent in US-10-05 |
| Token-based expired recovery | `Done` | Expired links can regenerate only from the existing token context and only while the order remains `CONFIRMED` | Extend the same one-live-link behavior into reminder automation in US-10-03 |

---

## Phase 3 — US-10-02 Structured "Can't fulfill" flow

| Item | Status | Evidence / current state | Next step |
|------|--------|--------------------------|-----------|
| Roaster issue-reporting entry point | `Done` | Token page now offers a structured can't-fulfill flow with required reason/resolution and optional note | Reuse the flagged confirmation UX in later portal work if needed |
| Issue persistence | `Done` | Submission stores issue fields, resets admin acknowledgement, and writes `ORDER_FLAGGED` | Reuse the same order fields in future portal flows |
| Admin visibility | `Done` | Admin list/detail pages now show unresolved flags, acknowledgement state, and explicit resolve controls | Keep future admin workflows aligned to the same unresolved/resolved semantics |
| SLA pause behavior | `Done` | `run-sla-check.tsx` now skips unresolved flagged orders without letting acknowledgement silently resume automation | Extend the same flag awareness into reminder-link behavior in US-10-03 |

---

## Phase 4 — US-10-03 Reminder and escalation refresh

| Item | Status | Evidence / current state | Next step |
|------|--------|--------------------------|-----------|
| Fulfillment CTA in reminder emails | `Done` | Reminder and urgent tiers now render direct fulfillment CTA links in the roaster email templates | Keep copy aligned with future manual resend wording if that flow expands |
| Hybrid token behavior in reminders | `Done` | The SLA job now resolves the existing active token or regenerates the same `MagicLink` row in place when it is expired and the order is still `CONFIRMED` | Reuse the same helper in future reminder/manual resend work |
| `MAGIC_LINK_RESENT` logging | `Done` | In-place regeneration now writes `MAGIC_LINK_RESENT` during SLA-triggered resend handling | Keep future resend reasons explicit in the event payload |
| Flag-aware reminder suppression | `Done` | `run-sla-check.tsx` now skips unresolved flagged orders as part of US-10-02 | Reuse the same paused-state semantics when reminder CTA/link behavior is refreshed |

---

## Phase 5 — US-10-04 Authenticated roaster order queue

| Item | Status | Evidence / current state | Next step |
|------|--------|--------------------------|-----------|
| Real dashboard queue | `Done` | Dashboard route now serves a roaster-scoped order queue read model | Use it as the navigation source for US-10-05 detail work |
| Queue tabs | `Done` | `To ship`, `Shipped`, `Delivered`, and `All` views are live on the dashboard route | Preserve the same filter vocabulary in future portal work |
| Action-needed flag state | `Done` | Unresolved flagged orders render with a clear action-needed treatment in queue rows | Reuse the same flagged semantics in the full detail route |
| Detail linking | `Done` | Queue rows now link to an authenticated order handoff route | Expand that route into the full detail/fulfillment surface in US-10-05 |

---

## Phase 6 — US-10-05 Portal order detail and tracking correction

| Item | Status | Evidence / current state | Next step |
|------|--------|--------------------------|-----------|
| Authenticated order-detail route | `Done` | `orders/[id]` is now a tenant-safe roaster detail route with frozen order snapshots and event history | Use the same route as the base for any future finance tie-ins |
| In-portal fulfillment | `Done` | `CONFIRMED` orders now ship in-portal through the same shared shipping logic used by the token flow | Keep portal/token shipping behavior aligned if fulfillment expands later |
| Portal-only tracking correction | `Done` | `SHIPPED` orders can now update carrier/tracking and write `TRACKING_UPDATED` atomically | Preserve the portal-only boundary for future correction work |
| Buyer tracking-update email | `Done` | Tracking corrections now send a buyer email through the shipped-email family with a distinct dedupe key | Reuse the same update template semantics if more correction surfaces are added |

---

## Phase 7 — US-10-06 Roaster payouts, debts, and disputes

| Item | Status | Evidence / current state | Next step |
|------|--------|--------------------------|-----------|
| Real payouts page | `Done` | `payouts/page.tsx` now renders a roaster-scoped finance dashboard backed by route-local query helpers | Keep future finance additions on the same tenant-safe route |
| Live payout vocabulary | `Done` | `HELD` now renders as in hold period or awaiting release based on `payoutEligibleAt` across payout history and dispute surfaces; `TRANSFERRED` and `FAILED` render as paid / transfer failed | Reuse the same mapping anywhere payout state appears in the portal |
| Debt visibility | `Done` | Unsettled `RoasterDebt` rows now surface with amount, reason, and linked order context | Keep debt copy aligned with payout-event notes if manual tooling expands |
| Dispute visibility | `Done` | `DisputeRecord` rows tied to roaster orders now surface with attribution, outcome, payout context, and response deadline | Reuse the same read model if roaster dispute workflows expand later |

---

## Known Sprint 8 constraints

1. **One-live-link fulfillment is a blocker rule** for token regeneration and reminder behavior.
2. **SLA automation already exists**; Sprint 8 should extend it, not replace it.
3. **The payouts route is now a read-only finance surface**; keep future work scoped to visibility unless the payout engine itself is being deliberately changed.
4. **Payout UI must reflect live states**; do not reintroduce stale planning vocabulary.
5. **EasyPost remains deferred**; do not imply the schema is already wired for it.

---

## Document sync checklist

- [x] Sprint 8 README created
- [x] Sprint 8 story docs created
- [x] Sprint 8 checklist created
- [x] Sprint 8 progress tracker created
- [x] Final epic baseline created
- [x] Pre-flight decisions doc created
- [x] Relevant mermaid diagrams updated when implementation begins
- [ ] `AGENTS.md` / `CONVENTIONS.md` updated when implementation changes canonical guidance

---

## Last full sync

Synced after the Sprint 8 completion follow-up on 2026-04-06. `US-10-00` through `US-10-06` are now `Done`, and the cross-story mandatory QA items are checked off in the live checklist.

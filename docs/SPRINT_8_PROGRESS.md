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

---

## Snapshot summary

| Area | Status | Notes |
|------|--------|-------|
| US-10-00 — Fulfillment schema and event alignment | `Todo` | Planning complete; no implementation landed yet |
| US-10-01 — Magic-link fulfillment page enhancement | `Todo` | Planning complete; token page is still the Sprint 4 baseline |
| US-10-02 — Structured "Can't fulfill" flow | `Todo` | Planning complete; no issue-reporting flow exists yet |
| US-10-03 — Fulfillment reminders and escalation refresh | `Todo` | Planning complete; SLA reminder system still uses the pre-EP-10 baseline |
| US-10-04 — Authenticated roaster order queue | `Todo` | Dashboard route is still placeholder-level |
| US-10-05 — Portal order detail / fulfillment / tracking correction | `Todo` | No authenticated order-detail route yet |
| US-10-06 — Roaster payouts / debts / disputes view | `Todo` | Payouts route is still placeholder-level |

---

## Phase 0 — Foundation decisions and doc alignment

| Item | Status | Evidence / current state | Next step |
|------|--------|--------------------------|-----------|
| One-live-link model | `Done` | Locked in Sprint 8 epic + pre-flight docs | Enforce in all implementation stories |
| Hybrid token reuse / rotation | `Done` | Locked in pre-flight docs and Sprint 8 README/checklist | Implement in US-10-03 and token recovery flows |
| Expired-token recovery model | `Done` | Normalized to token-based recovery, not order-ID-based recovery | Implement in US-10-01 |
| Flagged-order SLA pause decision | `Done` | Normalized in epic + pre-flight docs | Implement in US-10-02 |
| Portal server-action pattern | `Done` | Normalized in epic + docs | Enforce in US-10-04/05/06 |
| Payout vocabulary alignment | `Done` | Normalized to live `HELD / TRANSFERRED / FAILED` | Implement in US-10-06 |

---

## Phase 1 — US-10-00 Fulfillment schema and event alignment

| Item | Status | Evidence / current state | Next step |
|------|--------|--------------------------|-----------|
| `fulfillmentNote` support | `Todo` | Planned only | Add to schema and docs |
| Flag fields on `Order` | `Todo` | Planned only | Add to schema and docs |
| New event types | `Todo` | Planned only | Add `ORDER_FLAGGED`, `FLAG_RESOLVED`, `MAGIC_LINK_RESENT`, `TRACKING_UPDATED` |
| Schema docs sync | `Todo` | Planning docs exist | Update ERD + schema reference with implementation |

---

## Phase 2 — US-10-01 Magic-link fulfillment page enhancement

| Item | Status | Evidence / current state | Next step |
|------|--------|--------------------------|-----------|
| Shipping snapshot display | `Todo` | Token page still shows buyer name only | Expand order detail UI |
| `fulfillmentNote` in token flow | `Todo` | Not implemented | Add form field and persistence |
| Improved token states | `Todo` | Expired/used/invalid states are still minimal | Upgrade UX and token recovery flow |
| Token-based expired recovery | `Todo` | Not implemented | Add token-context regeneration logic |

---

## Phase 3 — US-10-02 Structured "Can't fulfill" flow

| Item | Status | Evidence / current state | Next step |
|------|--------|--------------------------|-----------|
| Roaster issue-reporting entry point | `Todo` | Not implemented | Add token-page action/UI |
| Issue persistence | `Todo` | Not implemented | Store order fields + emit `ORDER_FLAGGED` |
| Admin visibility | `Todo` | Not implemented | Add list/detail surfacing in admin |
| SLA pause behavior | `Todo` | Not implemented | Update `run-sla-check.tsx` |

---

## Phase 4 — US-10-03 Reminder and escalation refresh

| Item | Status | Evidence / current state | Next step |
|------|--------|--------------------------|-----------|
| Fulfillment CTA in reminder emails | `Todo` | Current roaster SLA templates lack fulfillment CTA | Update templates and send path |
| Hybrid token behavior in reminders | `Todo` | Current SLA job is not fulfillment-link-aware | Add resolve/regenerate behavior |
| `MAGIC_LINK_RESENT` logging | `Todo` | Not implemented | Add event emission when regeneration occurs |
| Flag-aware reminder suppression | `Todo` | Not implemented | Skip unresolved flagged orders |

---

## Phase 5 — US-10-04 Authenticated roaster order queue

| Item | Status | Evidence / current state | Next step |
|------|--------|--------------------------|-----------|
| Real dashboard queue | `Todo` | Dashboard route still placeholder-level | Replace with roaster-scoped order views |
| Queue tabs | `Todo` | Not implemented | Add `To ship`, `Shipped`, `Delivered`, `All` |
| Action-needed flag state | `Todo` | Not implemented | Surface unresolved flagged orders |
| Detail linking | `Todo` | Not implemented | Link into future portal order detail |

---

## Phase 6 — US-10-05 Portal order detail and tracking correction

| Item | Status | Evidence / current state | Next step |
|------|--------|--------------------------|-----------|
| Authenticated order-detail route | `Todo` | Not implemented | Add tenant-safe route |
| In-portal fulfillment | `Todo` | Not implemented | Reuse token-flow semantics |
| Portal-only tracking correction | `Todo` | Not implemented | Add update action and `TRACKING_UPDATED` |
| Buyer tracking-update email | `Todo` | Not implemented | Extend shipped-email family |

---

## Phase 7 — US-10-06 Roaster payouts, debts, and disputes

| Item | Status | Evidence / current state | Next step |
|------|--------|--------------------------|-----------|
| Real payouts page | `Todo` | Payouts route still placeholder-level | Replace with roaster-scoped finance view |
| Live payout vocabulary | `Todo` | Not implemented in UI | Map `HELD / TRANSFERRED / FAILED` into display labels |
| Debt visibility | `Todo` | Not implemented in portal | Add `RoasterDebt` section |
| Dispute visibility | `Todo` | Not implemented in portal | Add `DisputeRecord` section |

---

## Known Sprint 8 constraints

1. **One-live-link fulfillment is a blocker rule** for token regeneration and reminder behavior.
2. **SLA automation already exists**; Sprint 8 should extend it, not replace it.
3. **Portal routes are still scaffolds**; do not assume queue/detail/payout surfaces already exist.
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
- [ ] Relevant mermaid diagrams updated when implementation begins
- [ ] `AGENTS.md` / `CONVENTIONS.md` updated when implementation changes canonical guidance

---

## Last full sync

Synced for Sprint 8 planning handoff on 2026-04-05. Sprint 8 stories `US-10-00` through `US-10-06` are fully documented and all remain `Todo` until implementation work begins.

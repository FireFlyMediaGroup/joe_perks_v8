# Joe Perks — Sprint 7 Progress Tracker

**Tracker version:** 0.1
**Baseline document:** [`docs/SPRINT_7_CHECKLIST.md`](SPRINT_7_CHECKLIST.md)
**Story documents:** [`docs/sprint-7/stories/`](sprint-7/stories/)
**Sprint overview:** [`docs/sprint-7/README.md`](sprint-7/README.md)
**Planning baseline:** [`docs/sprint-7/buyer-accounts-epic-v3.md`](sprint-7/buyer-accounts-epic-v3.md)
**Purpose:** Track the actual implementation state of Sprint 7 buyer accounts work relative to the normalized sprint plan.

---

## How to use this file

- Treat [`docs/SPRINT_7_CHECKLIST.md`](SPRINT_7_CHECKLIST.md) as the implementation plan.
- Treat this file as the current-state tracker.
- Update this file whenever Sprint 7 work lands so the git diff shows exactly what changed.
- Update the relevant story file in `docs/sprint-7/stories/` in the same PR as implementation.

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
| 0.1 | 2026-04-05 | Initial tracker. All Sprint 7 stories start at `Todo`. |

---

## Snapshot summary

| Area | Status | Notes |
|------|--------|-------|
| US-09-00 — Buyer account foundation | `Todo` | Shipping snapshots, buyer auth purpose, guest lookup field/index, session env prep not yet implemented |
| US-09-01 — Buyer magic-link auth | `Todo` | No buyer auth routes or session helpers exist yet |
| US-09-02 — Account-aware checkout | `Todo` | Checkout is guest-first only; no signed-in buyer context or post-purchase account prompt yet |
| US-09-03 — Buyer dashboard/history | `Todo` | No `/account` route exists |
| US-09-04 — Buyer order detail/tracking MVP | `Todo` | Confirmation page exists, but buyer account detail/tracking route does not |
| US-09-06 — Guest order lookup | `Todo` | No lookup route or API exists |

---

## Phase 0 — Foundation decisions and doc alignment

| Item | Status | Evidence / current state | Next step |
|------|--------|--------------------------|-----------|
| Shipping snapshot decision | `Done` | Normalized in Sprint 7 docs | Implement in US-09-00 |
| Buyer-auth TTL decision | `Done` | Normalized to 15 minutes in Sprint 7 docs | Implement in US-09-00 / US-09-01 |
| Guest lookup model decision | `Done` | Normalized to `Order.buyerEmail` + `orderNumber` | Implement in US-09-00 / US-09-06 |
| Tracking MVP decision | `Done` | Normalized to direct-link tracking only | Implement in US-09-04 / US-09-06 |
| Marketing scope deferral | `Done` | Deferred out of Sprint 7 | Keep out of implementation unless reprioritized |

---

## Phase 1 — US-09-00 Buyer account foundation

| Item | Status | Evidence / current state | Next step |
|------|--------|--------------------------|-----------|
| Shipping snapshot fields on `Order` | `Todo` | Not in live schema | Add schema + migration |
| `Order.buyerEmail` snapshot | `Todo` | Not in live schema | Add schema + wire from checkout |
| Guest lookup index | `Todo` | Not in live schema | Add schema + query plan |
| `BUYER_AUTH` enum value | `Todo` | `MagicLinkPurpose` lacks it today | Add enum + generate client |
| Session env prep | `Todo` | `.env.example` lacks buyer session secret | Add env contract |

---

## Phase 2 — US-09-01 Buyer magic-link auth

| Item | Status | Evidence / current state | Next step |
|------|--------|--------------------------|-----------|
| Sign-in route | `Todo` | No buyer sign-in route | Create locale-aware page |
| Token redemption route | `Todo` | No buyer auth redemption route | Create locale-aware page |
| Session cookie helper | `Todo` | No buyer session helper | Implement secure cookie utilities |
| Sign-out route | `Todo` | No buyer sign-out path | Add route and clear-cookie flow |
| Buyer auth email template | `Todo` | No buyer auth email template | Add template via `packages/email` |

---

## Phase 3 — US-09-02 Account-aware checkout

| Item | Status | Evidence / current state | Next step |
|------|--------|--------------------------|-----------|
| Signed-in checkout context | `Todo` | Checkout is guest-first only | Add session-aware state |
| Prefill from recent order snapshot | `Todo` | No snapshot fields yet | Implement after US-09-00 |
| Post-purchase create-account prompt | `Todo` | Confirmation page lacks prompt | Add inline prompt flow |
| Non-blocking account creation | `Todo` | Not implemented | Keep separate from purchase success path |

---

## Phase 4 — US-09-03 Buyer dashboard/history

| Item | Status | Evidence / current state | Next step |
|------|--------|--------------------------|-----------|
| `/account` route | `Todo` | No route exists | Create locale-aware page |
| Buyer session guard | `Todo` | No buyer auth layer yet | Add redirect behavior |
| Order history query | `Todo` | No dashboard query exists | Load signed-in buyer orders only |
| Buyer impact summary | `Todo` | No dashboard exists | Add from frozen order data |

---

## Phase 5 — US-09-04 Buyer order detail/tracking MVP

| Item | Status | Evidence / current state | Next step |
|------|--------|--------------------------|-----------|
| `/account/orders/[id]` route | `Todo` | No route exists | Create account order detail page |
| Ownership enforcement | `Todo` | No buyer-owned route exists | Add server-side guard |
| Shipping snapshot display | `Todo` | Snapshot fields not yet modeled | Implement after US-09-00 |
| Direct carrier-link tracking | `Todo` | Only confirmation page exists today | Add buyer-facing tracking state UI |

---

## Phase 6 — US-09-06 Guest order lookup

| Item | Status | Evidence / current state | Next step |
|------|--------|--------------------------|-----------|
| `/order-lookup` route | `Todo` | No route exists | Create locale-aware page |
| Lookup API | `Todo` | No API route exists | Add `buyerEmail` + `orderNumber` lookup |
| Shared tracking read model | `Todo` | No lookup detail surface exists | Reuse buyer order detail model where practical |
| Secondary account-creation CTA | `Todo` | No lookup page exists | Add optional prompt after result |

---

## Known Sprint 7 constraints

1. **Shipping/contact persistence is a blocker** for buyer history, prefill, and guest lookup. Treat it as foundation work.
2. **PaymentElement already exists**; do not expand Sprint 7 into saved-payment method work.
3. **Marketing/preferences are deferred**; do not smuggle them into Sprint 7 stories.
4. **Tracking MVP is direct-link only**; do not add embedded carrier widgets in this sprint.
5. **Locale-aware routing is required** because `apps/web` is structured under `app/[locale]/...`.

---

## Document sync checklist

- [ ] Sprint 7 README updated
- [ ] Sprint 7 story docs updated
- [ ] Sprint 7 checklist updated
- [ ] Sprint 7 progress tracker updated
- [ ] Relevant mermaid diagrams updated if changed by implementation
- [ ] `AGENTS.md` / `CONVENTIONS.md` updated if changed by implementation

---

## Last full sync

Not yet synced against implementation. This tracker was created before Sprint 7 feature work began.

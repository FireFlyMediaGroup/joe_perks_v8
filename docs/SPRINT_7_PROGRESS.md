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
| 1.0 | 2026-04-05 | `US-09-00` completed: schema foundation, migration, checkout snapshot persistence, and shared docs synchronized. |
| 1.1 | 2026-04-05 | `US-09-01` completed: buyer magic-link request/redeem flow, signed session cookie helpers, rate limiting, buyer-auth email template, and route/auth docs synchronized. |
| 1.2 | 2026-04-05 | `US-09-02` completed: checkout now shows signed-in buyer context, prefill uses the latest order snapshot, checkout can sign out inline, and confirmation can send a buyer-auth link without leaving the page. |
| 1.3 | 2026-04-05 | `US-09-03` completed: `/account` now requires a live buyer session, shows buyer-scoped order history sorted newest first, and summarizes fundraiser impact from frozen order data. |
| 1.4 | 2026-04-05 | `US-09-04` completed: `/account/orders/[id]` now enforces buyer ownership, renders frozen item/totals/shipping snapshots, derives delayed/refunded/delivered buyer messaging, and links directly to supported carrier tracking pages. |
| 1.5 | 2026-04-05 | `US-09-06` completed: `/{locale}/order-lookup` now posts to a rate-limited lookup API, matches orders by snapshot email + order number, reuses the direct-link tracking/detail view model, and keeps buyer sign-in secondary. |

---

## Snapshot summary

| Area | Status | Notes |
|------|--------|-------|
| US-09-00 — Buyer account foundation | `Done` | Order buyer/shipping snapshots, `BUYER_AUTH`, guest-lookup index, `SESSION_SECRET` docs, and checkout persistence are implemented |
| US-09-01 — Buyer magic-link auth | `Done` | Locale-aware sign-in and redeem routes, signed buyer session helpers, sign-out route, rate limiting, and buyer-auth email are implemented |
| US-09-02 — Account-aware checkout | `Done` | Checkout now reads the buyer session for signed-in context, reuses the latest order snapshot for editable prefill, and confirmation can send a create-account magic link inline |
| US-09-03 — Buyer dashboard/history | `Done` | `/{locale}/account` now renders a protected buyer dashboard with order history, impact summary, and empty-state CTA |
| US-09-04 — Buyer order detail/tracking MVP | `Done` | Protected `/{locale}/account/orders/[id]` route now renders buyer-owned detail, shipping snapshot, and direct-link tracking UI |
| US-09-06 — Guest order lookup | `Done` | `/{locale}/order-lookup` and `/api/order-lookup` now provide rate-limited guest order matching plus shared tracking/detail presentation |

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
| Shipping snapshot fields on `Order` | `Done` | `Order` now stores immutable buyer/shipping snapshot columns | Reuse in later Sprint 7 buyer surfaces |
| `Order.buyerEmail` snapshot | `Done` | Stored separately from `Buyer` on each order | Use for guest lookup and auth redirects |
| Guest lookup index | `Done` | `Order` now has a buyer-email + order-number lookup index | Consume in US-09-06 query path |
| `BUYER_AUTH` enum value | `Done` | `MagicLinkPurpose` includes `BUYER_AUTH` in live schema | Use in US-09-01 token flow |
| Session env prep | `Done` | `.env.example` and `docs/AGENTS.md` document `SESSION_SECRET` | Use when session cookie helpers land |

---

## Phase 2 — US-09-01 Buyer magic-link auth

| Item | Status | Evidence / current state | Next step |
|------|--------|--------------------------|-----------|
| Sign-in route | `Done` | `/{locale}/account/sign-in` now ships a buyer sign-in form with enumeration-safe request UI | Reuse in future protected-route redirects |
| Token redemption route | `Done` | `/{locale}/account/auth/[token]` plus `/api/account/auth/redeem` validate and consume `BUYER_AUTH` links | Reuse for post-purchase create-account flows |
| Session cookie helper | `Done` | Shared helpers now sign, read, and clear a buyer session cookie backed by `SESSION_SECRET` | Reuse in checkout/account surfaces |
| Sign-out route | `Done` | `/api/account/session` clears the buyer session cookie | Wire into signed-in UI in later stories |
| Buyer auth email template | `Done` | Buyer-auth transactional template now sends sign-in links via `sendEmail()` | Reuse for resend flows where needed |

---

## Phase 3 — US-09-02 Account-aware checkout

| Item | Status | Evidence / current state | Next step |
|------|--------|--------------------------|-----------|
| Signed-in checkout context | `Done` | Checkout banner now reflects buyer-session state and exposes sign-out inline | Reuse in `/account` and future buyer surfaces |
| Prefill from recent order snapshot | `Done` | Checkout now maps the latest buyer-owned order snapshot into editable shipping defaults | Reuse for later account/profile convenience work |
| Post-purchase create-account prompt | `Done` | Confirmation now renders an inline buyer-auth CTA plus signed-in confirmation state | Reuse for lookup/detail surfaces where appropriate |
| Non-blocking account creation | `Done` | Confirmation CTA sends a magic link inline and never blocks the completed purchase flow | Keep future account prompts secondary |

---

## Phase 4 — US-09-03 Buyer dashboard/history

| Item | Status | Evidence / current state | Next step |
|------|--------|--------------------------|-----------|
| `/account` route | `Done` | `apps/web/app/[locale]/account/page.tsx` now serves the locale-aware buyer dashboard | Reuse for future buyer account surfaces |
| Buyer session guard | `Done` | Shared helper now validates the signed cookie against a live `Buyer` row and preserves locale-aware sign-in redirects | Reuse for `US-09-04` protected routes |
| Order history query | `Done` | Dashboard loads only orders matching the signed-in `buyerId`, newest first | Extend in `US-09-04` for detail/tracking reads |
| Buyer impact summary | `Done` | Dashboard summarizes total orders, spend, and fundraiser impact from frozen order values | Reuse in later buyer account UI as needed |

---

## Phase 5 — US-09-04 Buyer order detail/tracking MVP

| Item | Status | Evidence / current state | Next step |
|------|--------|--------------------------|-----------|
| `/account/orders/[id]` route | `Done` | `apps/web/app/[locale]/account/orders/[id]/page.tsx` now serves the locale-aware buyer order-detail view | Reuse in `US-09-06` where shared detail/tracking presentation helps |
| Ownership enforcement | `Done` | Detail query scopes to the signed-in `buyerId`, and non-owned/missing orders resolve via `notFound()` after session guard | Reuse the same buyer-owned query pattern for future protected account pages |
| Shipping snapshot display | `Done` | Detail page renders `Order` shipping/contact snapshot fields instead of mutable buyer data | Reuse for guest lookup result presentation |
| Direct carrier-link tracking | `Done` | Buyer detail page derives buyer-friendly delayed/refunded/delivered messaging and builds direct links for supported carriers | Reuse the helper model in `US-09-06` |

---

## Phase 6 — US-09-06 Guest order lookup

| Item | Status | Evidence / current state | Next step |
|------|--------|--------------------------|-----------|
| `/order-lookup` route | `Done` | `apps/web/app/[locale]/order-lookup/page.tsx` now serves a locale-aware guest lookup page with POST-based result loading | Reuse for future guest support flows if needed |
| Lookup API | `Done` | `apps/web/app/api/order-lookup/route.ts` validates input, rate limits by IP, and matches `Order.buyerEmail` + `orderNumber` without exposing which field failed | Reuse the same generic failure pattern for future public lookup surfaces |
| Shared tracking read model | `Done` | Guest lookup now hydrates a shared order-detail payload and reuses the existing direct-link tracking/detail presentation components | Keep guest and signed-in tracking copy aligned |
| Secondary account-creation CTA | `Done` | Lookup results end with a secondary buyer sign-in CTA that links into the account flow without blocking guest access | Keep future account CTAs optional |

---

## Known Sprint 7 constraints

1. **Shipping/contact persistence is a blocker** for buyer history, prefill, and guest lookup. Treat it as foundation work.
2. **PaymentElement already exists**; do not expand Sprint 7 into saved-payment method work.
3. **Marketing/preferences are deferred**; do not smuggle them into Sprint 7 stories.
4. **Tracking MVP is direct-link only**; do not add embedded carrier widgets in this sprint.
5. **Locale-aware routing is required** because `apps/web` is structured under `app/[locale]/...`.

---

## Document sync checklist

- [x] Sprint 7 README updated
- [x] Sprint 7 story docs updated
- [x] Sprint 7 checklist updated
- [x] Sprint 7 progress tracker updated
- [x] Relevant mermaid diagrams updated if changed by implementation
- [x] `AGENTS.md` / `CONVENTIONS.md` updated if changed by implementation

---

## Last full sync

Synced for `US-09-06` on 2026-04-05. Sprint 7 stories `US-09-00` through `US-09-06` are complete, so the next session should start only if the user reprioritizes new scope outside this sprint sequence.

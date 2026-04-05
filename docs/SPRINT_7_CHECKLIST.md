# Joe Perks — Sprint 7 Implementation Checklist

## Buyer accounts, order visibility, tracking MVP, and guest lookup

**Version:** 0.1 | **Sprint:** 7 | **Points:** 29 | **Stories:** 6
**Audience:** AI coding agents, developers implementing Sprint 7 stories
**Companion documents:**
- Sprint overview: [`docs/sprint-7/README.md`](sprint-7/README.md)
- Story documents: [`docs/sprint-7/stories/`](sprint-7/stories/)
- Progress tracker: [`docs/SPRINT_7_PROGRESS.md`](SPRINT_7_PROGRESS.md)
- Planning baseline: [`docs/sprint-7/buyer-accounts-epic-v3.md`](sprint-7/buyer-accounts-epic-v3.md)

---

## Before starting

Read these first:

- [x] [`docs/sprint-7/buyer-accounts-epic-v3.md`](sprint-7/buyer-accounts-epic-v3.md)
- [x] [`docs/sprint-7/README.md`](sprint-7/README.md)
- [x] [`docs/AGENTS.md`](AGENTS.md)
- [x] [`docs/CONVENTIONS.md`](CONVENTIONS.md)
- [x] [`docs/joe_perks_db_schema.md`](joe_perks_db_schema.md)

Do not start Sprint 7 implementation from `docs/sprint-7/buyer-accounts-epic` alone. Use the normalized Sprint 7 docs as the source of truth.

---

## Prerequisites from prior work

Verify the current baseline is still true before changing code:

- [x] `apps/web/app/api/checkout/create-intent/route.ts` already creates `Buyer` and `Order`
- [x] `apps/web/app/api/webhooks/stripe/route.ts` confirms orders and sends buyer order-confirmation email
- [x] `apps/web/app/[locale]/[slug]/checkout/` already uses Stripe `PaymentElement`
- [x] `apps/web/app/[locale]/[slug]/order/[pi_id]/page.tsx` is the current buyer-facing confirmation route
- [x] `packages/db/prisma/schema.prisma` still lacks buyer-auth/session fields and shipping snapshot fields on `Order`
- [x] `MagicLinkPurpose` still lacks `BUYER_AUTH`

If any of the above changed, update the Sprint 7 docs before implementing the affected story.

---

## Phase 0 — Foundation decisions and doc alignment

> **Why first:** Sprint 7 depends on a few architecture decisions being explicit so agents do not improvise incompatible solutions.

### 0.1 Confirm normalized decisions

- [x] Shipping/contact snapshots will be added directly to `Order`
- [x] Buyer-auth magic links use a 15-minute TTL
- [x] Buyer account routes are locale-aware under `apps/web/app/[locale]/...`
- [x] Guest lookup uses `Order.buyerEmail` + `Order.orderNumber`
- [x] Tracking MVP is direct-link only
- [x] Marketing/preferences remain out of Sprint 7 scope

### 0.2 Confirm cross-story UX rules

- [ ] Account creation remains optional and never blocks checkout
- [ ] All new buyer forms support keyboard navigation
- [ ] All new interactive targets meet 44x44px minimum touch target guidance
- [ ] New loading and animation states support `prefers-reduced-motion`
- [ ] Async success/error states manage focus intentionally
- [ ] Auth and lookup flows preserve state and redirect intent

### 0.3 Confirm document sync plan

- [x] Sprint overview
- [x] Story docs
- [x] Checklist
- [x] Progress tracker
- [x] `docs/01-project-structure.mermaid`
- [x] `docs/04-order-lifecycle.mermaid`
- [x] `docs/06-database-schema.mermaid`
- [x] `docs/AGENTS.md` and/or `docs/CONVENTIONS.md` if route/auth guidance changes

---

## Phase 1 — US-09-00 Buyer account foundation: schema, shipping snapshots, auth/env prep

> **Why first:** Every other Sprint 7 story depends on these foundations.

### 1.1 Schema updates

- [x] Add shipping/contact snapshot fields to `Order`
- [x] Add `buyerEmail` snapshot field to `Order`
- [x] Add an index supporting guest order lookup
- [x] Add the minimum buyer-account fields needed for auth/account access
- [x] Add `BUYER_AUTH` to `MagicLinkPurpose`
- [x] Regenerate Prisma client after migration

### 1.2 Checkout wiring

- [x] Update `create-intent` request parsing to accept and persist all required shipping snapshot fields
- [x] Persist buyer email and shipping/contact snapshot fields when creating the order
- [x] Preserve current checkout behavior for guest purchase flow
- [x] Keep order creation concurrency-safe and idempotent where required

### 1.3 Environment and session prep

- [x] Add buyer-session env var(s) such as `SESSION_SECRET` to `.env.example`
- [x] Document minimum security expectations for buyer session signing
- [x] Keep env naming and loading patterns consistent with repo conventions

### 1.4 Acceptance checks

- [x] New migration applies cleanly
- [x] `Order` rows contain shipping/contact snapshots after checkout
- [x] Existing confirmation flow still works after schema changes
- [x] No buyer PII is added to unsafe logs

**Reference:** [`docs/sprint-7/stories/US-09-00-buyer-account-foundation.md`](sprint-7/stories/US-09-00-buyer-account-foundation.md)

---

## Phase 2 — US-09-01 Buyer magic-link auth and session flow

> **Depends on:** Phase 1

### 2.1 Route and API surface

- [x] Create locale-aware sign-in page
- [x] Create buyer-auth token redemption page
- [x] Create session sign-out route
- [x] Add helper(s) for session read/validate/clear

### 2.2 Magic-link request flow

- [x] Request accepts email only
- [x] Rate limit sign-in requests
- [x] Do not leak whether the email exists
- [x] Send buyer-auth email via `sendEmail()`
- [x] Preserve `redirect` param safely

### 2.3 Token redemption flow

- [x] Validate token exists, not expired, not used, correct purpose
- [x] Consume token atomically
- [x] Set session cookie only after successful validation
- [x] Update buyer sign-in metadata if modeled
- [x] Handle expired/used/invalid token states clearly

### 2.4 UX / accessibility requirements

- [x] Email input uses mobile-friendly attributes
- [x] Focus moves to confirmation/error heading after submit
- [x] Success and error states are screen-reader friendly
- [x] No dead-end state after invalid/expired links

**Reference:** [`docs/sprint-7/stories/US-09-01-buyer-magic-link-auth.md`](sprint-7/stories/US-09-01-buyer-magic-link-auth.md)

---

## Phase 3 — US-09-02 Account-aware checkout and post-purchase create-account prompt

> **Depends on:** Phases 1-2

### 3.1 Checkout account awareness

- [x] If buyer session exists, show signed-in context clearly in checkout
- [x] Add non-blocking prefill from most recent eligible order snapshot
- [x] Provide sign-out path from checkout account context
- [x] Do not gate purchase behind sign-in

### 3.2 Post-purchase create-account prompt

- [x] Add non-intrusive prompt on confirmation page for unsigned buyers
- [x] Trigger buyer-auth magic-link send without leaving the page
- [x] Replace prompt with account-aware state when already signed in
- [x] Keep copy simple and value-driven

### 3.3 State handling

- [x] Back navigation preserves checkout form state
- [x] Post-purchase prompt handles resend/loading/error cleanly
- [x] Confirmation page remains useful even if account creation is skipped

**Reference:** [`docs/sprint-7/stories/US-09-02-account-aware-checkout.md`](sprint-7/stories/US-09-02-account-aware-checkout.md)

---

## Phase 4 — US-09-03 Buyer account dashboard and order history

> **Depends on:** Phases 1-2

### 4.1 Route and data loading

- [x] Create locale-aware `/account`
- [x] Require valid buyer session
- [x] Redirect unauthenticated users to sign-in with preserved redirect
- [x] Query only the signed-in buyer’s orders

### 4.2 Dashboard content

- [x] Buyer-facing order history sorted newest first
- [x] Status labels use buyer-friendly language
- [x] Impact summary uses frozen order data
- [x] Empty state has a clear next action

### 4.3 UX / accessibility requirements

- [x] Full server-rendered initial load where practical
- [x] Keyboard and screen-reader-friendly card/list structure
- [x] Mobile-friendly stacking and spacing
- [x] Status is never conveyed by color alone

**Reference:** [`docs/sprint-7/stories/US-09-03-buyer-dashboard-order-history.md`](sprint-7/stories/US-09-03-buyer-dashboard-order-history.md)

---

## Phase 5 — US-09-04 Buyer order detail and tracking MVP

> **Depends on:** Phase 4

### 5.1 Buyer order detail route

- [x] Create locale-aware `/account/orders/[id]`
- [x] Enforce buyer ownership on the server
- [x] Show order snapshot data, not mutable live catalog data
- [x] Show shipping snapshot data from `Order`

### 5.2 Tracking MVP

- [x] Show buyer-friendly order-state messaging
- [x] Show carrier and tracking number when available
- [x] Provide direct carrier-link behavior only
- [x] Support delivered/refunded/delayed states with clear copy

### 5.3 UX / motion requirements

- [x] No critical tracking information depends on animation
- [x] Any loading/transition state supports reduced motion
- [x] Mobile layout prioritizes readability and thumb reach

**Reference:** [`docs/sprint-7/stories/US-09-04-buyer-order-detail-tracking.md`](sprint-7/stories/US-09-04-buyer-order-detail-tracking.md)

---

## Phase 6 — US-09-06 Guest order lookup with direct-link tracking

> **Depends on:** Phases 1 and 5

### 6.1 Guest lookup route and API

- [x] Create locale-aware `/order-lookup`
- [x] Create lookup API using `buyerEmail` snapshot + `orderNumber`
- [x] Rate limit lookup requests
- [x] Do not reveal which field was incorrect on failure

### 6.2 Shared tracking/read model

- [x] Reuse the order-detail/tracking presentation model where practical
- [x] Keep guest lookup focused and low-friction
- [x] Do not require account creation to use guest lookup

### 6.3 UX / accessibility requirements

- [x] Labels, validation, and errors work with screen readers
- [x] Focus moves to result or error after submit
- [x] Mobile layout keeps the form above the fold where practical
- [x] Optional create-account CTA remains secondary and non-blocking

**Reference:** [`docs/sprint-7/stories/US-09-06-guest-order-lookup.md`](sprint-7/stories/US-09-06-guest-order-lookup.md)

---

## Cross-story QA checklist

Use this before marking any Sprint 7 story `Done`:

- [x] Locale-aware routes work correctly
- [x] Redirects preserve locale and intent
- [x] Keyboard-only navigation works end to end
- [x] Focus states are visible
- [x] `aria-invalid` and `aria-describedby` are used where validation errors exist
- [x] Async success/error messages are announced clearly
- [x] 375px mobile width is usable without horizontal overflow
- [x] Reduced Motion mode is respected
- [x] No PII leaks appear in logs or debug output
- [x] Story docs and sprint tracker were updated alongside implementation

---

## Deferred items checklist

These should remain unchecked in Sprint 7 unless scope is explicitly changed:

- [ ] Marketing preferences center
- [ ] Newsletter unsubscribe flow
- [ ] Saved payment methods
- [ ] Buyer billing portal
- [ ] Reorder
- [ ] Self-service cancellation
- [ ] Buyer profile editing
- [ ] Account deletion/anonymization

---

## Document sync checklist

- [x] Sprint 7 README updated
- [x] Sprint 7 story docs updated
- [x] Sprint 7 checklist updated
- [x] Sprint 7 progress tracker updated
- [x] Relevant mermaid diagrams updated if implementation changed architecture
- [x] `AGENTS.md` / `CONVENTIONS.md` updated if route/auth guidance changed

---

## Revision log

| Version | Date | Notes |
|---------|------|-------|
| 0.1 | 2026-04-05 | Initial Sprint 7 checklist created from normalized buyer-accounts planning and repo sprint-doc conventions. |
| 0.2 | 2026-04-05 | Updated for `US-09-01` implementation status, buyer auth route surface, and shared doc sync. |
| 0.3 | 2026-04-05 | Updated for `US-09-02` completion, including checkout session awareness, snapshot prefill, confirmation create-account prompt, and cross-story QA verification. |
| 0.4 | 2026-04-05 | Updated for `US-09-03` completion, including the protected buyer dashboard route, buyer-scoped order history, impact summary, and auth-redirect focus handling. |
| 0.5 | 2026-04-05 | Updated for `US-09-04` completion, including the protected buyer order-detail route, buyer-owned snapshot rendering, direct carrier-link tracking helpers, delayed/refunded/delivered messaging, and dashboard-to-detail linking. |
| 0.6 | 2026-04-05 | Updated for `US-09-06` completion, including the locale-aware guest lookup route/API, lookup rate limiting, shared order-detail/tracking reuse, and the secondary buyer sign-in CTA. |

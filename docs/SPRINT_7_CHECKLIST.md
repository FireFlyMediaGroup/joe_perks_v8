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

- [ ] Shipping/contact snapshots will be added directly to `Order`
- [ ] Buyer-auth magic links use a 15-minute TTL
- [ ] Buyer account routes are locale-aware under `apps/web/app/[locale]/...`
- [ ] Guest lookup uses `Order.buyerEmail` + `Order.orderNumber`
- [ ] Tracking MVP is direct-link only
- [ ] Marketing/preferences remain out of Sprint 7 scope

### 0.2 Confirm cross-story UX rules

- [ ] Account creation remains optional and never blocks checkout
- [ ] All new buyer forms support keyboard navigation
- [ ] All new interactive targets meet 44x44px minimum touch target guidance
- [ ] New loading and animation states support `prefers-reduced-motion`
- [ ] Async success/error states manage focus intentionally
- [ ] Auth and lookup flows preserve state and redirect intent

### 0.3 Confirm document sync plan

- [ ] Sprint overview
- [ ] Story docs
- [ ] Checklist
- [ ] Progress tracker
- [ ] `docs/01-project-structure.mermaid`
- [ ] `docs/04-order-lifecycle.mermaid`
- [ ] `docs/06-database-schema.mermaid`
- [ ] `docs/AGENTS.md` and/or `docs/CONVENTIONS.md` if route/auth guidance changes

---

## Phase 1 — US-09-00 Buyer account foundation: schema, shipping snapshots, auth/env prep

> **Why first:** Every other Sprint 7 story depends on these foundations.

### 1.1 Schema updates

- [ ] Add shipping/contact snapshot fields to `Order`
- [ ] Add `buyerEmail` snapshot field to `Order`
- [ ] Add an index supporting guest order lookup
- [ ] Add the minimum buyer-account fields needed for auth/account access
- [ ] Add `BUYER_AUTH` to `MagicLinkPurpose`
- [ ] Regenerate Prisma client after migration

### 1.2 Checkout wiring

- [ ] Update `create-intent` request parsing to accept and persist all required shipping snapshot fields
- [ ] Persist buyer email and shipping/contact snapshot fields when creating the order
- [ ] Preserve current checkout behavior for guest purchase flow
- [ ] Keep order creation concurrency-safe and idempotent where required

### 1.3 Environment and session prep

- [ ] Add buyer-session env var(s) such as `SESSION_SECRET` to `.env.example`
- [ ] Document minimum security expectations for buyer session signing
- [ ] Keep env naming and loading patterns consistent with repo conventions

### 1.4 Acceptance checks

- [ ] New migration applies cleanly
- [ ] `Order` rows contain shipping/contact snapshots after checkout
- [ ] Existing confirmation flow still works after schema changes
- [ ] No buyer PII is added to unsafe logs

**Reference:** [`docs/sprint-7/stories/US-09-00-buyer-account-foundation.md`](sprint-7/stories/US-09-00-buyer-account-foundation.md)

---

## Phase 2 — US-09-01 Buyer magic-link auth and session flow

> **Depends on:** Phase 1

### 2.1 Route and API surface

- [ ] Create locale-aware sign-in page
- [ ] Create buyer-auth token redemption page
- [ ] Create session sign-out route
- [ ] Add helper(s) for session read/validate/clear

### 2.2 Magic-link request flow

- [ ] Request accepts email only
- [ ] Rate limit sign-in requests
- [ ] Do not leak whether the email exists
- [ ] Send buyer-auth email via `sendEmail()`
- [ ] Preserve `redirect` param safely

### 2.3 Token redemption flow

- [ ] Validate token exists, not expired, not used, correct purpose
- [ ] Consume token atomically
- [ ] Set session cookie only after successful validation
- [ ] Update buyer sign-in metadata if modeled
- [ ] Handle expired/used/invalid token states clearly

### 2.4 UX / accessibility requirements

- [ ] Email input uses mobile-friendly attributes
- [ ] Focus moves to confirmation/error heading after submit
- [ ] Success and error states are screen-reader friendly
- [ ] No dead-end state after invalid/expired links

**Reference:** [`docs/sprint-7/stories/US-09-01-buyer-magic-link-auth.md`](sprint-7/stories/US-09-01-buyer-magic-link-auth.md)

---

## Phase 3 — US-09-02 Account-aware checkout and post-purchase create-account prompt

> **Depends on:** Phases 1-2

### 3.1 Checkout account awareness

- [ ] If buyer session exists, show signed-in context clearly in checkout
- [ ] Add non-blocking prefill from most recent eligible order snapshot
- [ ] Provide sign-out path from checkout account context
- [ ] Do not gate purchase behind sign-in

### 3.2 Post-purchase create-account prompt

- [ ] Add non-intrusive prompt on confirmation page for unsigned buyers
- [ ] Trigger buyer-auth magic-link send without leaving the page
- [ ] Replace prompt with account-aware state when already signed in
- [ ] Keep copy simple and value-driven

### 3.3 State handling

- [ ] Back navigation preserves checkout form state
- [ ] Post-purchase prompt handles resend/loading/error cleanly
- [ ] Confirmation page remains useful even if account creation is skipped

**Reference:** [`docs/sprint-7/stories/US-09-02-account-aware-checkout.md`](sprint-7/stories/US-09-02-account-aware-checkout.md)

---

## Phase 4 — US-09-03 Buyer account dashboard and order history

> **Depends on:** Phases 1-2

### 4.1 Route and data loading

- [ ] Create locale-aware `/account`
- [ ] Require valid buyer session
- [ ] Redirect unauthenticated users to sign-in with preserved redirect
- [ ] Query only the signed-in buyer’s orders

### 4.2 Dashboard content

- [ ] Buyer-facing order history sorted newest first
- [ ] Status labels use buyer-friendly language
- [ ] Impact summary uses frozen order data
- [ ] Empty state has a clear next action

### 4.3 UX / accessibility requirements

- [ ] Full server-rendered initial load where practical
- [ ] Keyboard and screen-reader-friendly card/list structure
- [ ] Mobile-friendly stacking and spacing
- [ ] Status is never conveyed by color alone

**Reference:** [`docs/sprint-7/stories/US-09-03-buyer-dashboard-order-history.md`](sprint-7/stories/US-09-03-buyer-dashboard-order-history.md)

---

## Phase 5 — US-09-04 Buyer order detail and tracking MVP

> **Depends on:** Phase 4

### 5.1 Buyer order detail route

- [ ] Create locale-aware `/account/orders/[id]`
- [ ] Enforce buyer ownership on the server
- [ ] Show order snapshot data, not mutable live catalog data
- [ ] Show shipping snapshot data from `Order`

### 5.2 Tracking MVP

- [ ] Show buyer-friendly order-state messaging
- [ ] Show carrier and tracking number when available
- [ ] Provide direct carrier-link behavior only
- [ ] Support delivered/refunded/delayed states with clear copy

### 5.3 UX / motion requirements

- [ ] No critical tracking information depends on animation
- [ ] Any loading/transition state supports reduced motion
- [ ] Mobile layout prioritizes readability and thumb reach

**Reference:** [`docs/sprint-7/stories/US-09-04-buyer-order-detail-tracking.md`](sprint-7/stories/US-09-04-buyer-order-detail-tracking.md)

---

## Phase 6 — US-09-06 Guest order lookup with direct-link tracking

> **Depends on:** Phases 1 and 5

### 6.1 Guest lookup route and API

- [ ] Create locale-aware `/order-lookup`
- [ ] Create lookup API using `buyerEmail` snapshot + `orderNumber`
- [ ] Rate limit lookup requests
- [ ] Do not reveal which field was incorrect on failure

### 6.2 Shared tracking/read model

- [ ] Reuse the order-detail/tracking presentation model where practical
- [ ] Keep guest lookup focused and low-friction
- [ ] Do not require account creation to use guest lookup

### 6.3 UX / accessibility requirements

- [ ] Labels, validation, and errors work with screen readers
- [ ] Focus moves to result or error after submit
- [ ] Mobile layout keeps the form above the fold where practical
- [ ] Optional create-account CTA remains secondary and non-blocking

**Reference:** [`docs/sprint-7/stories/US-09-06-guest-order-lookup.md`](sprint-7/stories/US-09-06-guest-order-lookup.md)

---

## Cross-story QA checklist

Use this before marking any Sprint 7 story `Done`:

- [ ] Locale-aware routes work correctly
- [ ] Redirects preserve locale and intent
- [ ] Keyboard-only navigation works end to end
- [ ] Focus states are visible
- [ ] `aria-invalid` and `aria-describedby` are used where validation errors exist
- [ ] Async success/error messages are announced clearly
- [ ] 375px mobile width is usable without horizontal overflow
- [ ] Reduced Motion mode is respected
- [ ] No PII leaks appear in logs or debug output
- [ ] Story docs and sprint tracker were updated alongside implementation

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

- [ ] Sprint 7 README updated
- [ ] Sprint 7 story docs updated
- [ ] Sprint 7 checklist updated
- [ ] Sprint 7 progress tracker updated
- [ ] Relevant mermaid diagrams updated if implementation changed architecture
- [ ] `AGENTS.md` / `CONVENTIONS.md` updated if route/auth guidance changed

---

## Revision log

| Version | Date | Notes |
|---------|------|-------|
| 0.1 | 2026-04-05 | Initial Sprint 7 checklist created from normalized buyer-accounts planning and repo sprint-doc conventions. |

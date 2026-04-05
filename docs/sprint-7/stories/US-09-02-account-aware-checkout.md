# US-09-02 — Account-Aware Checkout and Post-Purchase Create-Account Prompt

**Story ID:** US-09-02 | **Epic:** EP-09 (Buyer Accounts)
**Points:** 4 | **Priority:** High
**Status:** `Todo`
**Owner:** Full-stack
**Dependencies:** US-09-00, US-09-01, US-04-03
**Depends on this:** None

---

## Goal

Add buyer-account awareness to the existing checkout and post-purchase flow without making sign-in a requirement. Signed-in buyers should see helpful context and optional prefill, while unsigned buyers should get a low-friction create-account prompt after purchase.

---

## Planning baseline

Read first:

- [`docs/sprint-7/buyer-accounts-epic-v3.md`](../buyer-accounts-epic-v3.md)
- [`docs/sprint-7/README.md`](../README.md)
- [`docs/sprint-7/stories/US-09-00-buyer-account-foundation.md`](./US-09-00-buyer-account-foundation.md)
- [`docs/sprint-7/stories/US-09-01-buyer-magic-link-auth.md`](./US-09-01-buyer-magic-link-auth.md)

Normalized decisions this story implements:

- account creation must never block purchase
- order snapshots are the source of truth for future prefill
- marketing/preferences are not part of Sprint 7

---

## Current repo evidence

- `apps/web/app/[locale]/[slug]/checkout/_components/step-shipping.tsx` collects buyer/shipping info already.
- `apps/web/app/[locale]/[slug]/checkout/_components/step-payment-wrapper.tsx` already preserves shipping state while stepping through checkout.
- `apps/web/app/[locale]/[slug]/order/[pi_id]/page.tsx` is the current post-purchase buyer surface.
- There is currently no signed-in buyer context in checkout or confirmation.

---

## In scope

### Checkout

- Show signed-in buyer context when a buyer session exists
- Support optional prefill from the most recent eligible order snapshot
- Provide sign-out access from signed-in checkout context

### Post-purchase

- Add a non-intrusive account-creation prompt on the confirmation surface for unsigned buyers
- Trigger a buyer-auth magic-link send inline without leaving the page
- Replace the prompt with account-aware messaging when already signed in

---

## Out of scope

- Marketing/newsletter opt-in
- Saved payment methods
- Billing portal
- Multi-address management
- Buyer profile editing

---

## Primary files to create or modify

| Action | File | Purpose |
|--------|------|---------|
| Modify | `apps/web/app/[locale]/[slug]/checkout/_components/step-shipping.tsx` | Signed-in context and prefill behavior |
| Modify | `apps/web/app/[locale]/[slug]/checkout/_components/checkout-form.tsx` | Session-aware flow wiring |
| Modify | `apps/web/app/[locale]/[slug]/order/[pi_id]/page.tsx` | Post-purchase prompt integration |
| Modify | order confirmation components under `order/[pi_id]/_components/` | Prompt and account-aware states |
| Create/modify | helper/query files under `apps/web` | Load session and recent order snapshot for prefill |

---

## Acceptance criteria

- [ ] Signed-in buyer sees clear signed-in context in checkout
- [ ] Signed-in buyer can sign out from checkout flow
- [ ] Checkout prefill uses the latest eligible order snapshot rather than mutable profile-only data
- [ ] Prefill remains optional and editable
- [ ] Unsigned buyer sees a non-blocking create-account prompt on the confirmation surface
- [ ] Create-account prompt sends a buyer-auth link inline without requiring a form re-entry
- [ ] Signed-in buyer sees account-aware confirmation messaging instead of the create-account prompt
- [ ] Checkout continues to work fully for guest buyers

---

## UX / accessibility / mobile requirements

- [ ] Account context is informative but low visual weight
- [ ] Purchase flow remains identical whether the buyer ignores account features or not
- [ ] New buttons/links meet mobile touch-target requirements
- [ ] Prompt/error/success states are screen-reader friendly
- [ ] Focus moves appropriately after inline create-account actions
- [ ] Back navigation does not unexpectedly wipe entered checkout state
- [ ] Reduced motion is respected for any visual feedback added here

---

## Suggested implementation steps

1. Add a buyer-session read path to checkout server/client boundary.
2. Add signed-in context display in checkout.
3. Implement recent-order-snapshot prefill logic.
4. Ensure the shipping form remains editable after prefill.
5. Add post-purchase create-account prompt to the confirmation experience.
6. Reuse buyer-auth send flow from US-09-01 for the inline create-account CTA.

---

## QA and verification

- [ ] Guest checkout remains unchanged
- [ ] Signed-in buyer sees expected checkout context
- [ ] Prefill loads correct snapshot data
- [ ] Inline create-account prompt works without leaving the confirmation page
- [ ] Signed-in state and unsigned state both render correctly on confirmation
- [ ] Mobile checkout remains usable at narrow widths

---

## Handoff notes

- This story is about account awareness, not account gating.
- Do not introduce marketing consent here.
- Keep the confirmation prompt simple: the buyer has already completed a successful purchase and should not feel interrupted.
- If prefill logic becomes complex, prefer a small shared query/helper over duplicating fetch logic in multiple components.

---

## Revision log

| Version | Date | Notes |
|---------|------|-------|
| 0.1 | 2026-04-05 | Initial account-aware checkout story created from the normalized Sprint 7 plan. |

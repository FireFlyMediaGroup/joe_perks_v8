# US-09-01 — Buyer Magic-Link Auth and Session Flow

**Story ID:** US-09-01 | **Epic:** EP-09 (Buyer Accounts)
**Points:** 5 | **Priority:** High
**Status:** `Done`
**Owner:** Full-stack
**Dependencies:** US-09-00, US-01-04, US-01-09
**Depends on this:** US-09-02, US-09-03

---

## Goal

Let a buyer sign in to their account using a fast, low-friction magic-link flow on `apps/web`, with a secure session cookie and locale-aware redirects. This is the first true buyer-account capability in the product.

---

## Planning baseline

Read first:

- [`docs/sprint-7/buyer-accounts-epic-v3.md`](../buyer-accounts-epic-v3.md)
- [`docs/sprint-7/README.md`](../README.md)
- [`docs/sprint-7/stories/US-09-00-buyer-account-foundation.md`](./US-09-00-buyer-account-foundation.md)

Normalized decisions this story implements:

- Buyer auth uses custom magic-link sign-in, not Clerk
- Buyer-auth token TTL is 15 minutes
- Routes are locale-aware
- Account creation remains optional; auth is a value-add layer on top of checkout

---

## Current repo evidence

- `MagicLink` already exists, and `BUYER_AUTH` is now wired into a buyer-facing sign-in flow.
- `packages/email/send-email.ts` provides transactional send + `EmailLog` dedupe.
- Buyer auth now ships locale-aware sign-in and token-redemption routes plus session helpers.
- Existing `apps/web` routes remain locale-scoped under `app/[locale]/...`.

---

## In scope

### Route surface

- `/{locale}/account/sign-in`
- `/{locale}/account/auth/[token]`
- sign-out/session clear path

### Request flow

- Email-only sign-in request form
- Buyer-auth magic link email send
- Rate limiting
- Enumeration-safe UX

### Redemption flow

- Token validation
- Atomic token consumption
- Secure session cookie creation
- Redirect preservation

---

## Out of scope

- Checkout prefill behavior
- Dashboard/order history UI
- Guest order lookup
- Marketing preferences
- Saved payment methods

---

## Primary files to create or modify

| Action | File | Purpose |
|--------|------|---------|
| Create | `apps/web/app/[locale]/account/sign-in/page.tsx` | Buyer sign-in page |
| Create | `apps/web/app/[locale]/account/auth/[token]/page.tsx` | Buyer token redemption page |
| Create | `apps/web/app/api/account/session/route.ts` or equivalent | Sign-out/session clear |
| Create | buyer session helper(s) under `apps/web` | Read, write, clear session |
| Create | buyer auth email template under `packages/email/templates/` | Send sign-in email |
| Modify | relevant docs/diagrams | Keep route/auth docs aligned |

---

## Acceptance criteria

- [x] Buyer sign-in page exists at a locale-aware route
- [x] Sign-in request form has a single email field and clear value proposition
- [x] Sign-in requests are rate limited
- [x] Success UI does not reveal whether the email exists
- [x] Buyer-auth token has a 15-minute TTL
- [x] Buyer-auth token is validated for:
  - existence
  - correct purpose
  - not expired
  - not used
- [x] Token is consumed atomically before session creation
- [x] Successful redemption creates a secure session cookie
- [x] Redirect parameter is preserved safely
- [x] Sign-out clears the buyer session cookie
- [x] Invalid/expired/used token states show clear recovery paths

---

## UX / accessibility / Apple HIG-aligned requirements

- [x] Explain why signing in is useful: order history, tracking, faster future access
- [x] Keep one primary action on the sign-in screen
- [x] Email field uses:
  - `type="email"`
  - `inputMode="email"`
  - `autoCapitalize="none"`
  - `autoCorrect="off"`
- [x] Focus moves to confirmation heading after request submit
- [x] Focus moves to error heading/container on invalid token states
- [x] Loading states include explanatory copy, not spinner-only treatment
- [x] Any motion or animation respects `prefers-reduced-motion`
- [x] Touch targets meet minimum mobile size guidance

---

## AGENTS.md and CONVENTIONS.md rules that apply

- **Magic links:** Generate securely, validate purpose/expiry/used state, consume once.
- **sendEmail():** Use the shared email package; do not import Resend directly in the app.
- **PII/logging:** Avoid logging raw buyer auth request bodies or sensitive details.
- **App Router patterns:** Keep locale-aware route structure and server/client boundaries consistent.

---

## Suggested implementation steps

1. Create buyer session helper(s):
   - sign session cookie
   - read session cookie
   - clear session cookie
2. Create sign-in page:
   - email field
   - request action/API
   - redirect param handling
   - request-sent confirmation state
3. Create buyer-auth email template:
   - single clear CTA
   - no extra marketing content
4. Create token redemption route:
   - validate token
   - consume atomically
   - create session
   - redirect safely
5. Create sign-out route/path.
6. Update docs/diagrams if route/auth surface changed.

---

## Implementation summary

- Added `/{locale}/account/sign-in` with a single-field buyer sign-in form, enumeration-safe success state, and mobile/accessibility affordances.
- Added `/{locale}/account/auth/[token]` plus `/api/account/auth/redeem` to validate `BUYER_AUTH` links, consume them atomically, update `Buyer.lastSignInAt`, and write a signed buyer session cookie.
- Added `/api/account/sign-in`, `/api/account/session`, shared buyer-auth helpers under `apps/web/lib/buyer-auth/`, a buyer-auth email template, and a dedicated `limitBuyerAuth()` limiter in `@joe-perks/stripe`.
- For this story only, direct sign-in without an explicit redirect falls back to the locale home route rather than `/account`, because the dashboard route is still owned by `US-09-03`.

## Verification run

- `pnpm exec vitest run apps/web/lib/buyer-auth/redirect.test.ts apps/web/lib/buyer-auth/session-token.test.ts`
- `pnpm --filter web typecheck`
- `pnpm --filter @joe-perks/stripe typecheck`
- `pnpm --filter @joe-perks/email typecheck`

---

## QA and verification

- [ ] Sign-in request works for known buyer emails
- [ ] Reused token fails safely
- [ ] Expired token fails safely
- [ ] Sign-out removes session
- [ ] Keyboard-only flow works
- [ ] Mobile flow works on narrow width
- [ ] Locale is preserved through auth flow

---

## Handoff notes

- Buyer auth must not accidentally become mandatory for checkout.
- Do not copy the 72-hour roaster fulfillment TTL into buyer auth.
- Keep the session model simple and tightly scoped to buyer account access.
- If a buyer record does not exist, the UX should stay enumeration-safe and still provide a useful next step.

---

## Revision log

| Version | Date | Notes |
|---------|------|-------|
| 0.1 | 2026-04-05 | Initial buyer magic-link auth story created from the normalized Sprint 7 plan. |
| 1.0 | 2026-04-05 | Implemented buyer sign-in request/redeem flow, signed session cookie helpers, buyer-auth email template, and required doc sync. |

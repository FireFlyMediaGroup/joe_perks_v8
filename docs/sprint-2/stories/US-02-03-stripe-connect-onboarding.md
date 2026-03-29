# US-02-03 — Stripe Connect Express Onboarding for Roasters

**Story ID:** US-02-03 | **Epic:** EP-02 (Roaster Onboarding)
**Points:** 5 | **Priority:** High
**Status:** `Todo`
**Owner:** Full-stack
**Dependencies:** US-02-02 (Admin Approval Queue)
**Depends on this:** US-02-04 (Product and Variant Creation)

---

## Goal

Wire the scaffold page at `apps/roaster/app/(authenticated)/onboarding/page.tsx` into a real Stripe Connect Express onboarding experience. The backend route (`POST /api/stripe/connect`) already works. This story builds the UI: redirect to Stripe, handle return/refresh, and display Connect status.

---

## Diagram references

- **Approval chain:** [`docs/05-approval-chain.mermaid`](../../05-approval-chain.mermaid) — nodes **RA6** (Stripe Express account created), **RA7** (Roaster completes Stripe KYC), **RA8** (account.updated webhook, charges_enabled + payouts_enabled = true, Roaster.status = ACTIVE)
- **Stripe payment flow:** [`docs/07-stripe-payment-flow.mermaid`](../../07-stripe-payment-flow.mermaid) — Connect onboarding flow
- **Database ERD:** [`docs/06-database-schema.mermaid`](../../06-database-schema.mermaid) — `Roaster` model (`stripeAccountId`, `stripeOnboarding`, `chargesEnabled`, `payoutsEnabled`)

---

## Current repo evidence

- `apps/roaster/app/(authenticated)/onboarding/page.tsx` exists as scaffold text
- `apps/roaster/app/api/stripe/connect/route.ts` is **fully implemented**: authenticates via Clerk, loads User + Roaster, creates Express account if needed, returns Account Link URL
- `packages/stripe/src/connect.ts` exports `createExpressConnectedAccount`, `createExpressAccountLink`
- `packages/stripe/src/stripe-account-status.ts` exports `mapStripeAccountToOnboardingStatus`
- `apps/web/app/api/webhooks/stripe/route.ts` handles `account.updated` — updates `Roaster.stripeOnboarding`, `chargesEnabled`, `payoutsEnabled`, and sets `Roaster.status = ACTIVE` when both are true
- The Connect route already sets return URL to `/onboarding?stripe_return=1` and refresh URL to `/onboarding?stripe_refresh=1`

---

## AGENTS.md rules that apply

- **Stripe:** Never import Stripe directly in an app — use `@joe-perks/stripe`. The Connect route already follows this.
- **Tenant isolation:** The Connect route already scopes by `session.userId` → `User.roasterId`. The onboarding page must also scope its status queries by the authenticated roaster.

**CONVENTIONS.md patterns:**
- The page should be a server component that fetches the roaster's Connect status
- Interactive elements (button to initiate onboarding, status polling) should be client components
- The API call to `POST /api/stripe/connect` returns `{ url: string }` — redirect the browser to that URL

---

## In scope

- Replace the scaffold with a real onboarding page showing Stripe Connect status
- "Start onboarding" / "Continue onboarding" button that calls `POST /api/stripe/connect` and redirects to the returned URL
- Handle `?stripe_return=1` query param (user completed or exited Stripe flow) — refresh status from DB
- Handle `?stripe_refresh=1` query param (link expired) — automatically re-initiate onboarding
- Status display: show current `stripeOnboarding` status (`NOT_STARTED`, `PENDING`, `IN_PROGRESS`, `COMPLETE`) with appropriate messaging
- Show `chargesEnabled` and `payoutsEnabled` flags
- When fully onboarded (`COMPLETE` + both flags true), show success state and link to products/dashboard
- Guard: if roaster has no `Roaster` record yet (shouldn't happen post-approval), show appropriate error

---

## Out of scope

- Modifying the `POST /api/stripe/connect` route (already complete)
- Modifying the `account.updated` webhook handler (already complete)
- Creating the Stripe Express account via API (the route handles this)
- Org Stripe Connect onboarding (future sprint)

---

## Primary files to create or modify

| Action | File | Purpose |
|--------|------|---------|
| Modify | `apps/roaster/app/(authenticated)/onboarding/page.tsx` | Server component — fetch Roaster status, render onboarding UI |
| Create | `apps/roaster/app/(authenticated)/onboarding/_components/connect-status.tsx` | Client component — status display with refresh capability |
| Create | `apps/roaster/app/(authenticated)/onboarding/_components/start-onboarding-button.tsx` | Client component — calls POST /api/stripe/connect, redirects browser |

---

## Acceptance criteria

- [ ] The onboarding page at `/onboarding` shows the current Stripe Connect status
- [ ] A "Start onboarding" button appears when `stripeOnboarding` is `NOT_STARTED` or `PENDING`
- [ ] Clicking the button calls `POST /api/stripe/connect` and redirects the browser to the Stripe-hosted URL
- [ ] When the user returns from Stripe (`?stripe_return=1`), the page refreshes and shows updated status
- [ ] When the Stripe link expires (`?stripe_refresh=1`), the page automatically re-initiates onboarding
- [ ] When `stripeOnboarding = COMPLETE` and `chargesEnabled = true` and `payoutsEnabled = true`, the page shows a success message and links to products/dashboard
- [ ] When onboarding is in progress but incomplete, the page shows "Continue onboarding" with clear next-step messaging
- [ ] The page handles the case where the `Roaster` record doesn't exist (redirect to sign-in or show error)
- [ ] All data is fetched scoped to the authenticated roaster (tenant isolation)
- [ ] The scaffold placeholder text is removed

---

## Suggested implementation steps

1. Update `page.tsx` to be a server component that:
   - Gets the authenticated user via `auth()`
   - Loads `User` → `Roaster` from DB
   - Passes the roaster's Connect status to child components
2. Build `connect-status.tsx` (client component) that:
   - Displays current status with visual indicators (pending/in-progress/complete)
   - Shows `chargesEnabled` / `payoutsEnabled` as checkmarks
   - Handles `?stripe_return=1` and `?stripe_refresh=1` search params via `useSearchParams()`
3. Build `start-onboarding-button.tsx` (client component) that:
   - Calls `POST /api/stripe/connect` via `fetch()`
   - Shows loading state while waiting for the URL
   - Redirects browser to the returned URL via `window.location.href`
4. Add conditional rendering: different views for NOT_STARTED, IN_PROGRESS, COMPLETE states.
5. Test: click "Start onboarding" → verify redirect to Stripe → return → verify status update. Test `?stripe_refresh=1` re-initiation.

---

## Handoff notes

- US-02-04 (Products) should gate product creation on `Roaster.status = ACTIVE` or at minimum `stripeOnboarding = COMPLETE`. A roaster without Stripe cannot receive payouts, so products created before Connect completion should not be purchasable.
- The `account.updated` webhook on `apps/web` handles the status transition to `ACTIVE`. The onboarding page should poll or check status on load — it does not need a websocket or real-time mechanism for MVP.
- The roaster sidebar (`apps/roaster/app/(authenticated)/components/sidebar.tsx`) is still next-forge demo nav. Consider updating it to include real links (dashboard, onboarding, products, shipping, payouts) as part of this story or a follow-up.

---

## Revision log

| Version | Date | Notes |
|---------|------|-------|
| 0.1 | 2026-03-29 | Initial story created for Sprint 2 planning. |

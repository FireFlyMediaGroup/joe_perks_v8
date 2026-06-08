# Stripe Connect V2 Migration and Smoke Evidence

**Date**: 2026-06-07
**Scope**: Stripe Connect V2 account creation, account links, status retrieval, thin-event webhooks, docs, and targeted tests.
**Non-goals preserved**: checkout stays platform `PaymentIntent`; payout stays delayed separate Stripe transfers after the hold period; no Stripe Products/Prices or hosted Checkout migration.

## What Changed

### Dependencies and Stripe client

- Upgraded `stripe` from `^20.4.1` to `^22.2.0` in:
  - `packages/stripe/package.json`
  - `packages/payments/package.json`
- Updated `pnpm-lock.yaml`.
- Removed explicit `apiVersion: "2026-02-25.clover"` from:
  - `packages/stripe/src/client.ts`
  - `packages/payments/index.ts`
- `@joe-perks/stripe` now relies on the SDK-pinned Stripe API version instead of an app-level override.

### Connect V2 helper layer

Updated `packages/stripe/src/connect.ts` and exports in `packages/stripe/src/index.ts`:

- Replaced legacy Express helper names with marketplace V2 helpers:
  - `createRecipientConnectedAccount()`
  - `createRecipientAccountLink()`
  - `retrieveRecipientAccountStatus()`
  - `normalizeRecipientAccountStatus()`
- Account creation now uses `stripe.v2.core.accounts.create()` with:
  - `display_name`
  - `contact_email`
  - `identity.country`
  - `dashboard: "express"`
  - `defaults.responsibilities`
  - `configuration.merchant`
  - `configuration.recipient.capabilities.stripe_balance.stripe_transfers.requested = true`
- Account links now use `stripe.v2.core.accountLinks.create()` with:
  - `use_case.type = "account_onboarding"` or `"account_update"`
  - `configurations = ["recipient", "merchant"]`
- V2 account create/retrieve uses `include: ["configuration.customer", "configuration.merchant", "configuration.recipient", "defaults", "identity", "requirements"]`.
- `packages/stripe/src/payouts.ts` had type-only return updates for the newer SDK; transfer/refund runtime behavior was not changed.

Note: the sandbox evidence below was captured during the original recipient-only migration smoke. The code has since been hardened to create and onboard accounts with both `recipient` and `merchant` configurations; repeat the sandbox smoke before live beta and expect new disposable accounts to have `applied_configurations: ["recipient", "merchant"]`.

### Status mapping

Updated `packages/stripe/src/stripe-account-status.ts`:

- Kept legacy `mapStripeAccountToOnboardingStatus()` for `account.updated` migration compatibility.
- Added `mapRecipientAccountStatusToOnboardingStatus()` for V2 recipient status.
- Current V2 mapping:
  - `readyToReceivePayments = transferStatus === "active"`
  - `requirementsStatus = account.requirements?.summary?.minimum_deadline?.status`
  - `onboardingComplete = requirementsStatus !== "currently_due" && requirementsStatus !== "past_due"`
  - `COMPLETE` requires both onboarding complete and active recipient transfer readiness.
  - `RESTRICTED` is used for past-due requirements or restricted transfer capability.

The existing DB booleans remain compatibility fields:

- `chargesEnabled`
- `payoutsEnabled`

For this migration, both mirror V2 recipient transfer readiness.

### Roaster and org onboarding

Updated:

- `apps/roaster/app/api/stripe/connect/route.ts`
- `apps/org/app/api/stripe/connect/route.ts`
- `apps/roaster/app/(authenticated)/onboarding/page.tsx`
- `apps/org/app/(authenticated)/onboarding/page.tsx`
- `apps/roaster/app/(authenticated)/onboarding/_components/connect-status.tsx`
- `apps/org/app/(authenticated)/onboarding/_components/connect-status.tsx`

Behavior now:

- Existing accounts are refreshed directly from Stripe V2 status before account-link creation.
- New accounts are created through V2 marketplace helpers that apply both merchant and recipient configurations.
- Portal pages fetch live Stripe status when `stripeAccountId` exists and persist readiness back to DB.
- UI language now describes recipient transfer readiness instead of legacy charges/payouts wording.

### Stripe webhook route

Updated `apps/web/app/api/webhooks/stripe/route.ts`:

- Legacy snapshot events still use `stripe.webhooks.constructEvent()`.
- V2 thin events use `stripe.parseEventNotification()`, then `stripe.v2.core.events.retrieve(eventId)`.
- Added V2 event handling for:
  - `v2.core.account[requirements].updated`
  - `v2.core.account[configuration.recipient].capability_status_updated`
- Existing handlers are preserved for:
  - `account.updated`
  - `payment_intent.succeeded`
  - `payment_intent.payment_failed`
  - `charge.dispute.created`
  - `charge.dispute.closed`
  - `charge.refunded`
- `StripeEvent` idempotency remains check-first and create-after-success.
- V2 recipient readiness updates the matching `Roaster` or `Org` row and can demote an account from `ACTIVE` back to `ONBOARDING` if Stripe readiness regresses.

## Tests Added or Updated

- Added route-level tests:
  - `apps/roaster/app/api/stripe/connect/route.test.ts`
  - `apps/org/app/api/stripe/connect/route.test.ts`
- Updated status mapping tests:
  - `packages/stripe/src/stripe-account-status.test.ts`
- Updated docs:
  - `docs/AGENTS.md`
  - `docs/SCAFFOLD_CHECKLIST.md`
  - `docs/runbooks/v1-launch-runbook.md`
  - `docs/testing/v1-launch-money-path-e2e-execution.md`

## Automated Verification

Passed:

- `pnpm --filter @joe-perks/stripe test`
- `pnpm --filter roaster test -- app/api/stripe/connect/route.test.ts`
- `pnpm --filter org test -- app/api/stripe/connect/route.test.ts`
- `pnpm --filter @joe-perks/stripe typecheck`
- `pnpm --filter roaster typecheck`
- `pnpm --filter org typecheck`
- `pnpm --filter web typecheck`
- `pnpm --filter @repo/payments typecheck`
- IDE lint check on edited code files

Known unrelated issue:

- Full repo `pnpm typecheck` still has existing `@repo/ai` failures outside this migration scope.

## Sandbox Smoke Evidence

### Stripe CLI

- Upgraded local Stripe CLI from `1.31.0` to `1.42.1` via Homebrew.
- `stripe trigger --help` still does **not** list `v2.core.account[...]` fixtures. Do not rely on `stripe trigger` for Connect V2 thin-account events.
- The practical local V2 webhook smoke path is:
  1. Create or use a real Stripe test-mode V2 account.
  2. List/retrieve real V2 Core Events via `stripe.v2.core.events.list()`.
  3. Sign a thin notification payload locally with `stripe.webhooks.generateTestHeaderString()`.
  4. POST it to `apps/web` `/api/webhooks/stripe`.
  5. The route calls `parseEventNotification()` and retrieves the real event from Stripe by id.

### Helper-level Stripe sandbox smoke

Using `sk_test_...`, a V2 recipient account was created through the new helper layer. Initial status came back as expected for an incomplete account:

- `onboarding = RESTRICTED`
- `onboardingComplete = false`
- `readyToReceivePayments = false`
- `requirementsStatus = past_due`
- `transferStatus = restricted`

The helper created a valid `v2.core.account_link` hosted onboarding URL.

### Restricted-account webhook smoke

A disposable local `Org` DB row was pointed at an incomplete Stripe test V2 account. A real V2 recipient capability event id was delivered through a signed thin notification.

Expected and observed DB result:

- `status = ONBOARDING`
- `stripeOnboarding = RESTRICTED`
- `chargesEnabled = false`
- `payoutsEnabled = false`

Idempotency and signature checks:

- Duplicate signed event returned `200`.
- Bad signature returned `400`.
- `StripeEvent` row was created only for the successfully processed event.

Disposable DB rows/events were deleted after the smoke. This pre-hardening disposable Stripe test account was closed with `applied_configurations: ["recipient"]`.

### Hosted Express onboarding smoke

A fresh Stripe test-mode V2 recipient account was created and its hosted Express onboarding link was opened in the browser.

After completing the hosted flow, `retrieveRecipientAccountStatus()` returned:

- `onboarding = COMPLETE`
- `onboardingComplete = true`
- `readyToReceivePayments = true`
- `requirementsStatus = eventually_due`
- `transferStatus = active`

The hosted flow generated real V2 Core Events including:

- `v2.core.account[requirements].updated`
- `v2.core.account[configuration.recipient].capability_status_updated`

A completed-account V2 thin notification was then replayed through local `/api/webhooks/stripe` against a disposable local `Org` row that started restricted. Expected and observed DB result:

- `status = ACTIVE`
- `stripeOnboarding = COMPLETE`
- `chargesEnabled = true`
- `payoutsEnabled = true`

The disposable DB row/event was deleted after the smoke. This pre-hardening hosted-onboarding Stripe test account was closed with `applied_configurations: ["recipient"]`.

## Local Testing Caveats

- Clerk-protected portal routes require a real Clerk browser session mapped to `User.externalAuthId`.
- Plain `curl` to authenticated portal pages can fail with Clerk `dev-browser-missing` and Arcjet "No bots allowed"; that is an auth/security boundary, not a Connect regression.
- `POST /api/stripe/connect` correctly returns `401` without a Clerk session.
- The authenticated portal button itself was not clicked via automation in this smoke because it requires an interactive Clerk session. The hosted Stripe onboarding flow and the webhook/status handling were verified directly.
- If an agent needs full portal click-through later, first sign in through Clerk as the seeded roaster/org user and ensure the matching DB `User.externalAuthId` has been updated from `clerk_pending:*` to the real Clerk user id.

## Go-Live Implications

- Preview and production webhook endpoints must subscribe to:
  - `payment_intent.succeeded`
  - `payment_intent.payment_failed`
  - `charge.refunded`
  - `charge.dispute.created`
  - `charge.dispute.closed`
  - `v2.core.account[requirements].updated`
  - `v2.core.account[configuration.recipient].capability_status_updated`
- Keep legacy `account.updated` subscribed during the migration window until existing Express accounts are verified or retired.
- Before live beta, run a preview dress rehearsal with a real Clerk-authenticated portal user clicking the Connect button and returning from hosted onboarding.
- Checkout/payout routes were not intentionally changed. The only money-path effect is indirect: checkout already gates availability on `payoutsEnabled`, and that boolean now mirrors V2 recipient transfer readiness.

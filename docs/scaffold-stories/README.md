# Joe Perks — Scaffold Story Series

**Series version:** 0.2  
**Baseline checklist:** `docs/SCAFFOLD_CHECKLIST.md`  
**Current-state tracker:** `docs/SCAFFOLD_PROGRESS.md`

---

## Purpose

This directory turns the scaffold checklist into a **workable story sequence**. Each file is a focused unit of work that can be assigned, estimated, implemented, and closed on its own.

Use these documents like this:

1. Read `docs/SCAFFOLD_CHECKLIST.md` for the full baseline plan.
2. Read `docs/SCAFFOLD_PROGRESS.md` for current repo status.
3. Pull the **next story** from this folder and execute only that scope.
4. When the story lands, update:
   - `docs/SCAFFOLD_PROGRESS.md`
   - the story file's revision log / status
   - any affected checklist notes in `docs/SCAFFOLD_CHECKLIST.md`

---

## Story order

| Order | Story | Status | Why it comes now |
|---|---|---|---|
| 00 | `story-00-manual-foundation.md` | `In Progress` | External accounts, secrets, and branch/process setup unblock later work. |
| 01 | `story-01-db-foundation.md` | `Done` | Joe Perks Prisma schema, migrations, seed singletons (`docs/SCAFFOLD_PROGRESS.md`). |
| 02 | `story-02-stripe-core.md` | `Done` | `@joe-perks/stripe` — client, splits, rate limit, Connect helpers. |
| 03 | `story-03-checkout-webhooks.md` | `Done` | Checkout PI + order creation; Stripe webhooks with idempotency. |
| 04 | `story-04-email-pipeline.md` | `Done` | `sendEmail()` + `EmailLog` dedupe; contact form on `@joe-perks/email/send`. |
| 05 | `story-05-inngest-jobs.md` | `Done` | Inngest `serve()` + `sla-check`, `payout-release`, `cart-cleanup` on `apps/web`. |
| 06 | `story-06-auth-admin.md` | `Todo` | Protected surfaces should be wired once the domain model is in place. |
| 07 | `story-07-deploy-verify.md` | `Todo` | Deployment, smoke tests, and go-live checks come after the app scaffold is real. |

---

## Rules for this series

- One story should be **small enough to focus on**, but **complete enough to ship meaningful progress**.
- Stories are ordered by dependency, not just convenience.
- Each story must stay aligned with:
  - `docs/AGENTS.md`
  - `docs/CONVENTIONS.md`
  - `docs/SCAFFOLD_CHECKLIST.md`
  - `docs/SCAFFOLD_PROGRESS.md`
- Do not mark a story `Done` until both the code and the tracker docs are updated.

---

## Completion workflow

When a story is finished:

1. Change the story status from `Todo` / `In Progress` to `Done`.
2. Add a line to that story's revision log.
3. Update `docs/SCAFFOLD_PROGRESS.md` so the repo-wide tracker reflects reality.
4. If the baseline checklist was inaccurate or too vague, tighten `docs/SCAFFOLD_CHECKLIST.md` without turning it into a changelog.

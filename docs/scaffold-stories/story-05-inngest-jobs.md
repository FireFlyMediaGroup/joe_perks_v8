# Story 05 — Inngest Jobs

**Story version:** 0.3  
**Status:** `Done`  
**Owner:** Backend / platform  
**Depends on:** `story-01-db-foundation.md`, `story-03-checkout-webhooks.md`, `story-04-email-pipeline.md`

---

## Goal

Replace the stub Inngest route with a real job registration and execution path for the first Joe Perks scheduled workflows. **Delivered:** `serve()` on `apps/web/app/api/inngest/route.ts` with three cron jobs and supporting Stripe/email code (see **Current repo evidence**).

---

## Current repo evidence

Implemented:

- `apps/web/app/api/inngest/route.ts` — exports **`GET` / `POST` / `PUT`** from Inngest **`serve()`** (`runtime: nodejs`).
- `apps/web/lib/inngest/` — `client.ts`, `functions.ts` (three cron functions), `run-sla-check.tsx`, `run-payout-release.ts`, `run-cart-cleanup.ts`.
- `packages/stripe/src/payouts.ts` — `transferToConnectedAccount`, `refundCharge` (used by payout + SLA auto-refund).
- `packages/email/templates/sla.tsx` — React Email templates for SLA notifications (`@joe-perks/email/templates/sla`).

Optional: **`PLATFORM_ALERT_EMAIL`** in root `.env` for breach/critical emails to platform ops.

---

## Checklist alignment

- `docs/SCAFFOLD_CHECKLIST.md` — Inngest account setup, endpoint registration, and background job references
- `docs/SCAFFOLD_PROGRESS.md` — Inngest scaffold row
- `docs/AGENTS.md` — `sla-check`, `payout-release`, `cart-cleanup` job expectations and SLA rules

---

## In scope

- Wire `serve()` into the Inngest route
- Register the initial job set:
  - `sla-check`
  - `payout-release`
  - `cart-cleanup`
- Use real DB reads/writes and shared package boundaries

---

## Out of scope

- Every possible future job
- Full production tuning of cron schedules if product requirements change

---

## Primary files to change

- `apps/web/app/api/inngest/route.ts`
- Inngest function definitions under `apps/web` or a shared package as appropriate
- supporting DB / email / Stripe integrations required by those jobs

---

## Acceptance criteria

- Inngest route uses `serve()`
- All three baseline jobs are registered and discoverable
- Job implementations respect current platform rules from `docs/AGENTS.md`
- Local and deployed sync steps are documented enough for the team to operate
- `docs/SCAFFOLD_PROGRESS.md` is updated accordingly

---

## Suggested implementation steps

1. Add shared event / function organization for the jobs.
2. Implement `sla-check` first, then `payout-release`, then `cart-cleanup`.
3. Confirm the route shape matches the deployed endpoint expected in the checklist.
4. Validate job registration with the Inngest dashboard once credentials exist.

---

## Handoff notes for the next story

Story 06 can assume the platform has working backend workflows and should focus on access control / user-facing protected surfaces.

---

## Revision log

| Version | Date | Notes |
|---|---|---|
| `0.1` | 2026-03-22 | Initial story created. |
| `0.2` | 2026-03-28 | Implemented `serve()`, three cron jobs, SLA templates, Stripe payout/refund helpers; updated `SCAFFOLD_PROGRESS`. |
| `0.3` | 2026-03-29 | Story closed: checklist, `SCAFFOLD.md`, scaffold README, and progress tracker aligned with codebase. |

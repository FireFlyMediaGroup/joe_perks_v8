# Story 02 — Stripe Core Package

**Story version:** 0.1  
**Status:** `Todo`  
**Owner:** Backend / payments  
**Depends on:** `story-01-db-foundation.md`

---

## Goal

Implement the shared `@joe-perks/stripe` package so app code can use a real Stripe client, split calculation, and rate limiting without importing Stripe directly.

---

## Current repo evidence

The package exists, but the client is still a placeholder:

- `packages/stripe/src/client.ts`
- `packages/stripe/src/splits.ts`
- `packages/stripe/src/ratelimit.ts`

---

## Checklist alignment

- `docs/SCAFFOLD_CHECKLIST.md` — Stripe sections in Phases 3, 5, 7, and 9
- `docs/SCAFFOLD_PROGRESS.md` — Stripe scaffold / manual Stripe account rows
- `docs/AGENTS.md` — split rules, transfer group rules, idempotency expectations, no direct Stripe imports in app code

---

## In scope

- Real shared Stripe client initialization
- `calculateSplits()` implementation following Joe Perks money rules
- Shared rate limiting utilities for checkout/payment flows
- Guardrails around environment usage where appropriate

---

## Out of scope

- Web checkout route implementation
- Stripe webhook route implementation
- Background payout job implementation

---

## Primary files to change

- `packages/stripe/src/client.ts`
- `packages/stripe/src/splits.ts`
- `packages/stripe/src/ratelimit.ts`
- `packages/stripe/src/index.ts`

---

## Acceptance criteria

- `@joe-perks/stripe` exports a usable Stripe client
- `calculateSplits()` implements:
  - integer cents only
  - shipping excluded from split math
  - platform fee rules from `docs/AGENTS.md`
- Rate limit helpers are wired for later checkout use
- App code can import from `@joe-perks/stripe` instead of Stripe directly
- `docs/SCAFFOLD_PROGRESS.md` is updated from “stub” toward “implemented”

---

## Suggested implementation steps

1. Implement Stripe client singleton.
2. Implement split math with tests.
3. Implement Upstash-backed limiter helpers, or clearly document fallback behavior until Upstash is configured.
4. Export the finalized package API.

---

## Handoff notes for the next story

Story 03 should consume this package directly. It should not reimplement Stripe client setup or split logic inside `apps/web`.

---

## Revision log

| Version | Date | Notes |
|---|---|---|
| `0.1` | 2026-03-22 | Initial story created. |

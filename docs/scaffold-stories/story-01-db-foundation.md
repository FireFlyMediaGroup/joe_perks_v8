# Story 01 — Database Foundation

**Story version:** 0.1  
**Status:** `Done`  
**Owner:** Backend / platform  
**Depends on:** `story-00-manual-foundation.md`

---

## Goal

Replace the next-forge Prisma placeholder with the real Joe Perks database foundation so the rest of the platform can be built on actual domain models instead of stubs.

---

## Current repo evidence

Implemented (Story 01 complete):

- `packages/db/prisma/schema.prisma` — Joe Perks domain models + enums
- `packages/db/prisma/migrations/` — initial migration(s), e.g. `20260328161045`
- `packages/db/seed.ts` — upserts `PlatformSettings` and `OrderSequence` singletons
- `packages/db/order-number.ts` — atomic `JP-#####` via `OrderSequence`
- `docs/SCAFFOLD_PROGRESS.md` — database scaffold marked `Done`
- `docs/SCAFFOLD_CHECKLIST.md` — Phase 5.6 / Remaining / Quick Reference aligned with real schema

---

## Checklist alignment

- `docs/SCAFFOLD_CHECKLIST.md` — Phase 5.6, Phase 7.3, and the “Remaining for a complete Joe Perks technical scaffold” section
- `docs/SCAFFOLD_PROGRESS.md` — Database scaffold / Prisma rows
- `docs/AGENTS.md` — money, tenant isolation, append-only order events, snapshots, soft deletes, magic links

---

## In scope

- Replace the Prisma stub schema with the Joe Perks schema
- Generate Prisma client from the new schema
- Create initial migrations
- Implement a real seed for foundational singleton/setup rows
- Ensure local Prisma tooling works with the project scripts

---

## Out of scope

- Full Stripe event handling
- Checkout route implementation
- Resend sending
- Inngest jobs
- Clerk auth flows

---

## Primary files to change

- `packages/db/prisma/schema.prisma`
- `packages/db/seed.ts`
- `packages/db/index.ts`
- `packages/db/order-number.ts`
- any generated Prisma outputs required by the schema update

---

## Acceptance criteria

- Prisma schema no longer contains the placeholder `Page` model as the only domain model
- Joe Perks core models exist, including enough structure to support:
  - users / roasters / orgs
  - products / variants / campaigns
  - buyers / orders / order events
  - Stripe event idempotency
  - email logging
  - platform settings / order sequence
- `pnpm migrate` works against the development database
- `packages/db/seed.ts` creates the expected foundational rows instead of only logging a stub message
- `pnpm dev:studio` can show the Joe Perks schema when `DATABASE_URL` is configured
- `docs/SCAFFOLD_PROGRESS.md` marks the database scaffold appropriately

---

## Suggested implementation steps

1. Replace the schema stub with the Joe Perks model set.
2. Verify model constraints against `docs/AGENTS.md`.
3. Run Prisma generate and migration flow.
4. Implement seed logic for singleton/setup data.
5. Re-test Studio and local type imports from `@joe-perks/db`.

---

## Handoff notes for the next story

Story 02 and Story 03 should assume the schema is real and should build on the database contracts added here, not invent their own shapes.

---

## Revision log

| Version | Date | Notes |
|---|---|---|
| `0.1` | 2026-03-22 | Initial story created. |
| `0.2` | 2026-03-28 | Story completed; checklist + progress + AGENTS updated; production migrate/seed/smoke path documented. |

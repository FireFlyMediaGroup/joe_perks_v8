# US-10-00 — Fulfillment Schema and Event Alignment

**Story ID:** US-10-00 | **Epic:** EP-10 (Roaster Fulfillment)
**Points:** 3 | **Priority:** High
**Status:** `Todo`
**Owner:** Full-stack
**Dependencies:** US-01-02, Sprint 4 fulfillment baseline
**Depends on this:** US-10-01, US-10-02, US-10-03, US-10-04, US-10-05, US-10-06

---

## Goal

Add the minimum schema and enum support required for the EP-10 fulfillment enhancements without reworking the existing fulfillment backbone or prematurely adding EasyPost-only fields.

---

## Planning baseline

Read first:

- [`docs/sprint-8/roaster-fulfillment-epic-v4.md`](../roaster-fulfillment-epic-v4.md)
- [`docs/sprint-8/roaster-fulfillment-preflight-decisions.md`](../roaster-fulfillment-preflight-decisions.md)

Normalized decisions this story implements:

- fulfillment note is in scope
- flagging needs explicit unresolved / resolved state
- tracking correction is portal-only and needs its own event type
- the one-live-link model stays intact

---

## Current repo evidence

- `packages/db/prisma/schema.prisma` currently supports:
  - `trackingNumber`
  - `carrier`
  - `shippedAt`
  - `deliveredAt`
  - `MagicLink.dedupeKey`
- `OrderEventType` currently includes `PAYMENT_SUCCEEDED`, `FULFILLMENT_VIEWED`, `SHIPPED`, `DELIVERED`, `PAYOUT_TRANSFERRED`, `PAYOUT_FAILED`, `SLA_WARNING`, `SLA_BREACH`, and `NOTE_ADDED`.
- The live schema does **not** currently include:
  - fulfillment-note fields
  - roaster-flagging fields
  - flag-resolution fields
  - `MAGIC_LINK_RESENT`
  - `TRACKING_UPDATED`
- `docs/joe_perks_db_schema.md` explicitly says EasyPost-oriented fields like `shipping_label_url` and `label_generated_by` are not in the live Prisma schema.

---

## In scope

### Schema additions

- Add `Order.fulfillmentNote String?`
- Add `Order.flagReason String?`
- Add `Order.flagNote String?`
- Add `Order.resolutionOffered String?`
- Add `Order.flaggedAt DateTime?`
- Add `Order.flagResolvedAt DateTime?`
- Add `Order.adminAcknowledgedFlag Boolean @default(false)`

### Event additions

- Add `OrderEventType.ORDER_FLAGGED`
- Add `OrderEventType.FLAG_RESOLVED`
- Add `OrderEventType.MAGIC_LINK_RESENT`
- Add `OrderEventType.TRACKING_UPDATED`

### Docs sync

- Update the schema diagram and schema reference to reflect the live additions

---

## Out of scope

- EasyPost-only schema fields
- Multi-shipment or split-fulfillment models
- New payout business logic
- Full admin workflow implementation

---

## Primary files to create or modify

| Action | File | Purpose |
|--------|------|---------|
| Modify | `packages/db/prisma/schema.prisma` | Add EP-10 fields and event enums |
| Create | Prisma migration under `packages/db/prisma/migrations/` | Persist schema changes |
| Modify | `docs/06-database-schema.mermaid` | Keep ERD aligned |
| Modify | `docs/joe_perks_db_schema.md` | Keep schema reference aligned |
| Modify | `docs/08-order-state-machine.mermaid` | Reflect explicit flagged/resolved behavior if needed |

---

## Acceptance criteria

- [ ] `Order` includes optional `fulfillmentNote`
- [ ] `Order` includes the fields required for roaster issue reporting and explicit resolution tracking
- [ ] `OrderEventType` includes `ORDER_FLAGGED`, `FLAG_RESOLVED`, `MAGIC_LINK_RESENT`, and `TRACKING_UPDATED`
- [ ] Existing live event names such as `SHIPPED`, `DELIVERED`, and `FULFILLMENT_VIEWED` remain unchanged
- [ ] No EasyPost-only fields are added in this story
- [ ] Prisma migration applies successfully
- [ ] Prisma client regenerates successfully
- [ ] Schema docs are updated in the same change
- [ ] Existing webhook, token-fulfillment, SLA-job, and payout-job codepaths still typecheck against the expanded schema

---

## AGENTS.md and CONVENTIONS.md rules that apply

- Keep money/storage rules untouched; this is a fulfillment-state story, not a pricing story.
- `OrderEvent` remains append-only.
- Do not rework `MagicLink.dedupeKey` or the one-live-link model.
- If future portal flows depend on these fields, they must still scope through `requireRoasterId()`.

---

## Suggested implementation steps

1. Update `schema.prisma` with the new `Order` fields and `OrderEventType` values.
2. Generate a migration and Prisma client.
3. Update schema/reference diagrams in the same PR.
4. Verify no existing fulfillment or payout queries break due to new nullable fields.

---

## Required doc updates

- [ ] `docs/sprint-8/roaster-fulfillment-epic-v4.md` if field names change
- [ ] `docs/SPRINT_8_CHECKLIST.md`
- [ ] `docs/SPRINT_8_PROGRESS.md`
- [ ] `docs/06-database-schema.mermaid`
- [ ] `docs/joe_perks_db_schema.md`
- [ ] `docs/08-order-state-machine.mermaid` if flag state changes the diagram

---

## QA and verification

- [ ] Prisma migration runs cleanly
- [ ] Prisma client regenerates successfully
- [ ] Touched files pass targeted lint / type checks
- [ ] Existing fulfillment code still compiles against the expanded schema
- [ ] At minimum run:
  - `pnpm typecheck`
  - any required Prisma generate / migrate commands for the story

---

## Handoff notes

- This story is a blocker story for the rest of EP-10. Do not start the token-page, flagging, or portal tracking-correction work before these field and enum decisions land.
- Keep this story focused on foundational schema support only.
- If implementation reveals a better unresolved/resolved flag-state model, update the epic and this story in the same PR before proceeding.

---

## Revision log

| Version | Date | Notes |
|---------|------|-------|
| 0.1 | 2026-04-05 | Initial EP-10 foundation story created from the final fulfillment planning baseline. |
| 0.2 | 2026-04-05 | Tightened for execution with concrete points, doc-update requirements, and minimum verification expectations. |

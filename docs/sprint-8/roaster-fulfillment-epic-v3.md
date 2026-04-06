# EP-10 — Roaster Fulfillment Epic v3

Combined product + implementation version.

This document keeps:

- the product and UX intent from `docs/sprint-8/roaster-fulfillmet`
- the codebase reconciliation from `docs/sprint-8/roaster-fulfillment-epic-v2.md`
- the additional risk review in `docs/sprint-8/roaster-fulfillment-preflight-decisions.md`

It should be treated as a combined draft for Sprint 8+ and finalized only after the pre-flight decisions document is reflected in the final epic and story set.

Important: where this document and `docs/sprint-8/roaster-fulfillment-preflight-decisions.md` differ, the pre-flight note is the current source of truth. In particular, the fulfillment-link strategy should follow the hybrid reuse-then-rotate model from the pre-flight note rather than the earlier pure-rotation draft language below.

## Final Decisions

### 1. Fulfillment-link strategy

Decision: rotate the single live fulfillment token in place.

Why:

- The live code and schema already enforce one live fulfillment link per order via `MagicLink.dedupeKey`.
- Reusing the same token forever is simpler, but rotation gives better security and cleaner escalation semantics.
- Creating multiple simultaneous valid links conflicts with the current database design and should not be used.

Implementation rule:

- Keep one `MagicLink` row per order for `ORDER_FULFILLMENT`.
- On reminder, urgent resend, manual resend, or expired-link recovery, update the existing row in place:
  - generate a new `token`
  - set a new `expiresAt`
  - leave `usedAt = null`
- Record the resend in `OrderEvent` with `MAGIC_LINK_RESENT` and a payload such as `{ tier, reason }`.
- Use distinct email templates per tier so `EmailLog` dedupe still works.

Do not use a sentinel `usedAt` value. Do not create multiple active fulfillment-link rows for the same order.

### 2. Tracking correction scope

Decision: keep post-ship tracking correction in scope, but portal-only.

Why:

- It is useful operationally.
- It does not belong on the consumed magic-link flow.
- The authenticated roaster portal is the right place for controlled edits.

Canonical event name:

- `TRACKING_UPDATED`

Rule:

- Initial ship action remains `SHIPPED`
- Any later correction to `trackingNumber` or `carrier` logs `TRACKING_UPDATED`

### 3. Fulfillment note scope

Decision: include fulfillment notes in this epic.

Why:

- It is a small schema and UI addition.
- It improves the shipped communication without changing the fulfillment architecture.
- It was one of the better UX ideas in the original draft.

Rule:

- Add optional `Order.fulfillmentNote`
- Allow it on the magic-link flow and portal fulfillment flow
- Include it in buyer shipped email when present

## What Already Exists

The repo already implements the MVP fulfillment backbone:

- `payment_intent.succeeded` confirms the order
- a deduped `ORDER_FULFILLMENT` magic link is created
- the roaster receives `magic_link_fulfillment`
- the roaster can fulfill from `/fulfill/[token]` without signing in
- submitting tracking moves the order to `SHIPPED`
- the buyer receives `order_shipped`
- admin confirms delivery
- payout eligibility starts after `DELIVERED`
- SLA warning, breach, critical, and auto-refund logic already exist
- payout release already exists

This epic therefore enhances and extends the live flow. It does not replace it.

## Epic Goal

Make roaster fulfillment feel complete across both email-first and portal-first workflows while staying aligned with the current auth model, event model, schema, and diagrams.

## Scope

### In scope

- Enhance the existing magic-link fulfillment page
- Add structured "Can't fulfill" escalation
- Refresh fulfillment reminder / urgent emails around the single-live-link rule
- Build a real authenticated roaster order queue
- Build authenticated roaster order detail with fulfillment and tracking correction
- Build roaster payouts / debts / disputes visibility

### Out of scope

- Multiple simultaneous valid fulfillment links
- EasyPost label generation
- Packing slips
- Batch fulfillment
- Carrier webhook delivery confirmation replacement
- Magic-link-based portal login

## Product Principles To Preserve

- Magic link is still the MVP roaster fulfillment path.
- The portal is additive, not a replacement.
- The token page and the portal detail page should feel like the same product.
- The token page remains fast, focused, and server-rendered.
- The portal remains Clerk-authenticated and tenant-scoped through `requireRoasterId()`.
- Shipping address can be shown on the token page because the magic link is the auth for that page, but buyer PII must still never be logged.
- EasyPost remains future scope and should not be implied as schema-ready today.

## Story Plan

### US-10-00 — Fulfillment schema and event alignment

Purpose:
Add the minimal schema and enum support required for the enhancement epic.

Additions:

- `Order.fulfillmentNote String?`
- `Order.flagReason String?`
- `Order.flagNote String?`
- `Order.flaggedAt DateTime?`
- `Order.adminAcknowledgedFlag Boolean @default(false)` if the flag-pause workflow is kept
- `OrderEventType.ORDER_FLAGGED`
- `OrderEventType.FLAG_RESOLVED`
- `OrderEventType.MAGIC_LINK_RESENT`
- `OrderEventType.TRACKING_UPDATED`

Notes:

- Keep live event names such as `SHIPPED`, `DELIVERED`, and `FULFILLMENT_VIEWED`
- Do not add EasyPost-only fields here
- If the team later wants structured resolution types, add them only if the portal/admin flows require them now

### US-10-01 — Magic-link fulfillment page enhancement

Purpose:
Upgrade the existing `/fulfill/[token]` flow to match the PRD more closely.

Requirements:

- keep no-auth access
- keep current token validation rules
- show order number, org/campaign context, items, frozen payout data
- add full immutable shipping snapshot from `Order`
- add optional `fulfillmentNote`
- improve success / expired / already-shipped states
- keep tracking submission idempotent and transactional
- show a post-success CTA to the roaster portal without minting a session

UX intent preserved from v1:

- focused task screen
- large payout emphasis
- strong mobile treatment
- clear primary CTA
- supportive copy

Implementation note:

- If a shared fulfillment component is extracted, do it from this story rather than inventing it before this story starts

### US-10-02 — Structured "Can't fulfill" flow

Purpose:
Let a roaster report a blocked order in a structured way and stop the order from silently aging toward refund.

Requirements:

- add "Can't fulfill this order" to the token page and portal detail
- collect required reason and optional note
- write `ORDER_FLAGGED`
- set the order-level flag fields
- show the issue in admin orders
- send admin alert email
- show confirmation to the roaster
- exclude flagged-and-unacknowledged orders from normal SLA auto-refund handling

Admin behavior:

- admin can acknowledge and resolve the flag
- resolution writes `FLAG_RESOLVED`
- acknowledged / resolved state resumes the normal operational path or transitions to refund/admin action as appropriate

### US-10-03 — Fulfillment reminders and escalation emails

Purpose:
Keep the current SLA email ladder, but make it fulfillment-aware and compatible with the one-live-link model.

Requirements:

- preserve the initial roaster fulfillment email after confirmation
- add or refresh reminder and urgent variants
- rotate the single live token in place for each resend tier
- log `MAGIC_LINK_RESENT`
- keep per-tier template names distinct for `EmailLog` dedupe
- keep links on `ROASTER_APP_ORIGIN/fulfill/[token]`

Suggested template set:

- `magic_link_fulfillment`
- `magic_link_fulfillment_reminder`
- `magic_link_fulfillment_urgent`
- optional `magic_link_fulfillment_critical`

Important:

- this story refines the existing SLA + roaster-email system
- it does not replace the current Inngest job architecture

### US-10-04 — Authenticated roaster order queue

Purpose:
Turn the placeholder dashboard into a real order-management surface.

Requirements:

- Clerk-authenticated access
- all queries scoped via `requireRoasterId()`
- "To ship" view for `CONFIRMED` orders ordered by `fulfillBy`
- historical views for `SHIPPED` and `DELIVERED`
- status / SLA indicators aligned with live order data
- flagged orders visible with a clear action-needed state

Recommended initial tabs:

- `To ship`
- `Shipped`
- `Delivered`
- `All`

### US-10-05 — Portal order detail and fulfillment

Purpose:
Give the roaster a signed-in order detail page that mirrors the token experience where useful and extends it where authenticated access is better.

Requirements:

- tenant-safe order lookup
- shared fulfillment form or shared fulfillment form logic
- `CONFIRMED` orders can be fulfilled in-portal
- `SHIPPED` orders become read-only by default
- allow portal-only tracking correction
- tracking correction writes `TRACKING_UPDATED`
- send buyer tracking-update email using the shipped template family
- show a user-facing event history derived from live enum values

### US-10-06 — Roaster payouts, debts, and disputes

Purpose:
Turn the placeholder payouts page into a working roaster finance view.

Requirements:

- roaster-only authenticated access
- metrics driven from live `Order`, `RoasterDebt`, and `DisputeRecord` data
- payout history
- pending / held / transferred / failed visibility
- outstanding debt visibility
- dispute visibility and attribution where present

This story should reuse live payout data and logic rather than inventing new payout rules.

## Build Order

### Sprint 8

1. `US-10-00`
2. `US-10-01`
3. `US-10-02`
4. `US-10-03`

### Sprint 9

1. `US-10-04`
2. `US-10-05`
3. `US-10-06`

## Required Doc Updates

When implementation starts, keep these in sync:

- `docs/01-project-structure.mermaid`
- `docs/04-order-lifecycle.mermaid`
- `docs/06-database-schema.mermaid`
- `docs/08-order-state-machine.mermaid`
- `docs/joe_perks_db_schema.md`
- `docs/AGENTS.md` if a new canonical rule is introduced

## Final Summary

The original EP-10 draft was strong on product intent and UX, but weak on repo alignment.

The v2 reconciliation was strong on repo alignment, but intentionally conservative.

This v3 version is the combined planning document the team can actually build from:

- preserve the v1 UX and product direction
- preserve the v2 codebase constraints
- rotate one live token in place
- keep tracking correction portal-only with `TRACKING_UPDATED`
- include `fulfillmentNote` now

That gives the team one coherent epic for implementation instead of two competing documents.

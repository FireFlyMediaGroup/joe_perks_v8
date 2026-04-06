# EP-10 — Roaster Fulfillment Epic v2

Updated for Sprint 8 planning on 2026-04-05.

This version replaces the current draft intent with a codebase-aligned plan based on:

- `docs/AGENTS.md`
- `docs/04-order-lifecycle.mermaid`
- `docs/08-order-state-machine.mermaid`
- `docs/01-project-structure.mermaid`
- `docs/06-database-schema.mermaid`
- `docs/joe_perks_db_schema.md`
- Sprint 4 implementation docs and stories
- The current code in `apps/web`, `apps/roaster`, `apps/admin`, `packages/db`, and `packages/email`
- The PRD and epics source documents in `docs/*.docx`

## Executive Summary

The codebase already implements the MVP roaster fulfillment baseline:

- Stripe webhook confirms the order and creates a single deduped `ORDER_FULFILLMENT` magic link.
- The roaster can fulfill the order from `apps/roaster/app/fulfill/[token]` without signing in.
- Tracking submission moves the order from `CONFIRMED` to `SHIPPED`, consumes the magic link, and emails the buyer.
- Admin can confirm delivery, which moves the order to `DELIVERED` and starts payout eligibility.
- SLA warnings, breach handling, critical alerts, and auto-refund logic already exist in the hourly Inngest job.
- Payout release already exists after `DELIVERED` plus the hold period.

The next roaster-fulfillment epic should therefore be treated as an enhancement epic, not a greenfield build. The highest-value gaps are:

1. Improve the existing magic-link fulfillment page so it matches the PRD more closely.
2. Add a real "Can't fulfill" escalation flow with admin visibility.
3. Bring roaster portal order management online using Clerk auth and `requireRoasterId()`.
4. Add a real payouts/debts/disputes view to the roaster portal.

## Current Baseline In Repo

### Implemented today

- `apps/web/app/api/webhooks/stripe/route.ts`
  - Confirms orders on `payment_intent.succeeded`
  - Creates a deduped `MagicLink` with `purpose = ORDER_FULFILLMENT`
  - Sends `magic_link_fulfillment` to the roaster
- `apps/roaster/app/fulfill/[token]/page.tsx`
  - Validates the token
  - Loads order details
  - Logs `FULFILLMENT_VIEWED`
  - Renders the tracking form for `CONFIRMED` orders
- `apps/roaster/app/fulfill/[token]/_actions/submit-tracking.ts`
  - Re-validates and consumes the token in a transaction
  - Sets `status = SHIPPED`, `trackingNumber`, `carrier`, `shippedAt`
  - Creates `OrderEvent` with `eventType = SHIPPED`
  - Sends `order_shipped` to the buyer
- `apps/admin/app/orders/_actions/confirm-delivery.ts`
  - Marks `SHIPPED -> DELIVERED`
  - Sets `payoutEligibleAt`
  - Logs `DELIVERED`
  - Sends `order_delivered`
- `apps/web/lib/inngest/run-sla-check.tsx`
  - Runs warn, breach, critical, and auto-refund logic against `CONFIRMED` orders
- `apps/web/lib/inngest/run-payout-release.ts`
  - Handles payout release after delivery and hold period

### Present but still scaffolded

- `apps/roaster/app/(authenticated)/dashboard/page.tsx`
  - Placeholder dashboard, not a real order queue
- `apps/roaster/app/(authenticated)/payouts/page.tsx`
  - Placeholder payouts page, not a ledger

## Canonical Constraints For v2

These constraints are already encoded in the repo and must drive implementation:

- Fulfillment remains email-first MVP behavior; the authenticated portal is additive, not a replacement.
- Roaster portal auth is Clerk-based. New portal mutations must use `requireRoasterId()` or an extracted shared equivalent.
- Money remains stored in integer cents only.
- Order split fields are frozen on the `Order` row and must not be recalculated later.
- Magic links are single-use and must validate `purpose`, `expiresAt`, and `usedAt`.
- The repo currently enforces one live fulfillment link per order via `MagicLink.dedupeKey`.
- `sendEmail()` plus `EmailLog` dedupe remains the only transactional email path.
- `OrderEvent` is append-only.
- Buyer PII must never be logged even if shipping-address display is expanded on the token page.

## Major Gaps In The Current Sprint-8 Draft

| Area | Current draft says | Repo / docs reality | v2 resolution |
| --- | --- | --- | --- |
| Fulfillment links | A new valid `MagicLink` row is created at each escalation tier and old links stay valid | The live schema + code use one deduped live fulfillment link per order; `docs/AGENTS.md` explicitly requires deterministic dedupe | Keep one live link per order. Reminder/escalation emails must either reuse the current token or rotate the single live token in place. Do not design for multiple simultaneous valid fulfillment links. |
| Shared component | `OrderFulfillmentSheet` in `packages/ui` already anchors both magic-link and portal flows | No such shared component exists in the codebase today | Treat the shared sheet as new work. Build it only if it materially reduces duplication between the enhanced token page and the portal order detail. |
| Magic-link page content | Full shipping address, copy actions, fulfillment note, richer success/expired states are already part of the plan | Current page shows item/payout details plus buyer name only; no address UI, no fulfillment note, no resend UI | Keep these as enhancement scope, not as already-true assumptions. |
| "Can't fulfill" | Fully designed structured flag flow | No schema fields, no event types, no admin UI for roaster-submitted flags | Make this a net-new story with explicit schema, event, admin, and SLA behavior. |
| Portal dashboard | Full tabbed queue is already part of the same product surface | Current dashboard route is a placeholder | Treat as net-new portal work, scoped behind Clerk auth and tenant isolation. |
| Portal payouts | Full payout ledger exists conceptually | Current payouts route is a placeholder | Treat as net-new portal work driven by live `Order`, `RoasterDebt`, and `DisputeRecord` data. |
| Event naming | Uses values like `ORDER_SHIPPED`, `ORDER_DELIVERED` | Live schema uses `SHIPPED`, `DELIVERED`, `FULFILLMENT_VIEWED`, etc. | Align new stories to live enum names; only add new enum values when truly needed. |
| EasyPost readiness | `shipping_label_url` and `label_generated_by` are already in schema | `docs/joe_perks_db_schema.md` explicitly says those fields are not in the live Prisma schema | Mark EasyPost as future scope. Do not claim schema readiness that does not exist. |
| Portal session nudge from magic link | Older epic material suggests issuing a roaster session cookie after fulfill | Current auth model is Clerk for the portal; the current doc set says not to mint a portal session from the magic link page | Keep magic-link auth single-order only. Post-success CTA should redirect to Clerk sign-in when needed. |
| Sprint naming | Uses Sprint 4 / 5 language throughout | This planning doc lives in `docs/sprint-8` and the Sprint 4 baseline is already complete | Reframe implementation into Sprint 8+ follow-on work. |

## Epic Goal

Enhance roaster fulfillment so the platform keeps the proven email-first MVP flow, closes the missing operational escalation path, and adds an authenticated roaster portal for queue management and payout visibility without contradicting the existing schema, auth model, or diagrams.

## Proposed Scope

### In scope

- Upgrade the existing token fulfillment page to better match the PRD
- Add structured "Can't fulfill" escalation
- Add reminder/escalation fulfillment emails that respect the single-live-link model
- Build a real roaster order queue in the authenticated portal
- Build roaster order detail with authenticated fulfillment and tracking correction
- Build a roaster payouts/debts/disputes view

### Out of scope

- Multiple simultaneous valid fulfillment links per order
- EasyPost label purchase and download
- Batch fulfillment or bulk tracking entry
- Platform-generated packing slips
- Carrier webhook delivery confirmation replacement
- Multi-roaster campaign fulfillment
- Portal session creation from a magic link

## Story Plan

### US-10-00 — Fulfillment alignment and schema additions

Purpose:
Add only the schema and enum changes that are required for the new flows.

Must include:

- Order fields for roaster-submitted flagging, if that remains on `Order`
- Event types needed for flagging and flag resolution
- Any field required for a roaster-facing fulfillment note if we decide to persist one
- No EasyPost-only fields in this story

Notes:

- The current draft's `TRACKING_ADDED` requirement was not included in its own schema story. If tracking edits remain in scope, the event name must be finalized here before implementation.
- Keep the migration minimal and directly tied to real stories below.

### US-10-01 — Magic-link fulfillment page enhancements

Purpose:
Evolve the existing `/fulfill/[token]` page instead of rewriting the whole fulfillment system.

Acceptance targets:

- Continue to require no authentication
- Continue to validate `ORDER_FULFILLMENT`, `expiresAt`, and `usedAt`
- Show the immutable shipping snapshot from `Order` so the token page matches the PRD
- Keep buyer email and payment details hidden
- Preserve the existing tracking submission transaction semantics
- Add clearer success, expired, and already-shipped states
- Optionally add `fulfillmentNote` if the schema story lands first

Implementation notes:

- Reuse the existing route and action shape in `apps/roaster/app/fulfill/[token]/`
- Do not introduce client-side data fetching for initial load
- If a shared fulfillment component is created, it should be extracted from this story rather than invented first

### US-10-02 — "Can't fulfill" escalation with admin visibility

Purpose:
Give roasters a structured way to report a blocked order and pause normal fulfillment handling until the platform responds.

Acceptance targets:

- Add a "Can't fulfill this order" path on the token page
- Capture a required reason and an optional note
- Create an append-only order event for the flag
- Surface the flag in the admin orders experience
- Define whether flagged orders are excluded from SLA auto-refund while unresolved
- Send an admin alert through `sendEmail()`
- Show a confirmation state to the roaster after submission

Implementation notes:

- This is not in the current codebase today
- The SLA skip logic must be explicit in `run-sla-check.tsx`
- If the product wants admin acknowledgement state, define it clearly in schema and UI rather than hiding it in copy

### US-10-03 — Reminder and escalation email refresh

Purpose:
Improve fulfillment reminder emails without breaking the one-live-link rule.

Acceptance targets:

- Preserve the existing initial roaster fulfillment email after order confirmation
- Add reminder and urgent variants that align with the SLA stages already present in the job
- Ensure each tier has a distinct template name so `EmailLog` dedupe does not suppress later sends
- Reuse or rotate the single live fulfillment token; never depend on multiple active tokens
- Keep the order action URL on `ROASTER_APP_ORIGIN/fulfill/[token]`

Implementation notes:

- The current SLA job already sends roaster reminder and urgent emails; v2 should refine and connect them to the fulfillment action, not recreate the job from scratch
- If token rotation is chosen, it must replace the current live token cleanly and preserve the one-live-link guarantee

### US-10-04 — Authenticated roaster order queue

Purpose:
Turn the placeholder dashboard into a real fulfillment queue.

Acceptance targets:

- Require Clerk auth
- Scope every query by `session.roasterId` via `requireRoasterId()`
- Provide at minimum a "To ship" queue for `CONFIRMED` orders ordered by `fulfillBy`
- Provide a historical view for shipped and delivered orders
- Display SLA state using the existing order timestamps and platform settings

Implementation notes:

- Start with the minimum set of tabs that map cleanly to live statuses
- Avoid inventing a more complex portal IA than the current route structure needs

### US-10-05 — Portal order detail and authenticated fulfillment

Purpose:
Give roasters a signed-in order detail page that mirrors the token flow where appropriate.

Acceptance targets:

- Tenant-safe order detail lookup
- Shared fulfillment form or shared form logic with the token page
- `CONFIRMED` orders can be fulfilled from the portal
- `SHIPPED` orders show read-only shipping info
- If tracking correction is in scope, define the event name and buyer-email behavior explicitly
- Show the order event timeline with user-facing labels derived from live event names

Implementation notes:

- Keep the token flow and portal flow behaviorally aligned
- Do not recalculate payout data in this page; use frozen order values

### US-10-06 — Roaster payouts, debts, and disputes view

Purpose:
Turn the placeholder payouts page into a real ledger backed by existing finance data.

Acceptance targets:

- Clerk-authenticated roaster-only access
- Summary cards driven by live `Order`, `RoasterDebt`, and `DisputeRecord` rows
- History of paid / held / failed payouts
- Visibility into unsettled debt deductions
- Dispute status and attribution visibility where present

Implementation notes:

- This story should reuse existing payout concepts already implemented for admin + jobs
- It should not require new payout-side business logic unless a real reporting gap is discovered

## Recommended Delivery Order

### Sprint 8

1. `US-10-00` — schema alignment
2. `US-10-01` — token-page enhancements
3. `US-10-02` — can't-fulfill escalation
4. `US-10-03` — reminder/escalation email refresh

### Sprint 9

1. `US-10-04` — authenticated order queue
2. `US-10-05` — portal order detail and fulfillment
3. `US-10-06` — payouts/debts/disputes view

## Required Document Sync

If this epic is implemented, the same PRs should also update:

- `docs/01-project-structure.mermaid`
- `docs/04-order-lifecycle.mermaid`
- `docs/06-database-schema.mermaid`
- `docs/08-order-state-machine.mermaid`
- `docs/joe_perks_db_schema.md`
- `docs/AGENTS.md` if any new canonical rule is introduced

## Open Questions To Resolve Before Coding

These are the only material items still needing a product decision:

1. Should reminder/escalation emails reuse the current fulfillment token, or should they rotate the single live token in place?
2. Does post-ship tracking correction stay in scope for this epic, and if yes, what is the canonical event name?
3. Does a roaster-submitted fulfillment note belong in this phase, or should the page enhancement stay limited to address visibility and improved status handling?

## Summary Decision

EP-10 v2 should be implemented as a codebase-aligned enhancement epic:

- keep the existing magic-link fulfillment backbone
- add the missing escalation path
- add the missing roaster portal order queue
- add the missing roaster payouts view

It should not assume multiple active fulfillment links, pre-existing shared UI, pre-existing portal order management, or EasyPost-ready schema fields, because none of those are true in the current repository.

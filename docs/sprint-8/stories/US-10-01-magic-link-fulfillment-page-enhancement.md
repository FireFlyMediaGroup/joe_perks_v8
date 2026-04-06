# US-10-01 — Magic-Link Fulfillment Page Enhancement

**Story ID:** US-10-01 | **Epic:** EP-10 (Roaster Fulfillment)
**Points:** 8 | **Priority:** High
**Status:** `Todo`
**Owner:** Full-stack
**Dependencies:** US-10-00, US-05-02
**Depends on this:** US-10-02, US-10-03, US-10-05

---

## Goal

Upgrade the existing `/fulfill/[token]` page so it better matches the PRD and original product intent while preserving the current unauthenticated magic-link architecture, idempotent ship action, and single-order auth scope.

---

## Planning baseline

Read first:

- [`docs/sprint-8/roaster-fulfillment-epic-v4.md`](../roaster-fulfillment-epic-v4.md)
- [`docs/sprint-8/roaster-fulfillment-preflight-decisions.md`](../roaster-fulfillment-preflight-decisions.md)
- [`docs/sprint-8/roaster-fulfillmet`](../roaster-fulfillmet)

Normalized decisions this story implements:

- token page remains public
- no portal session is created from the magic link
- shipping address display is now in scope
- fulfillment note is now in scope
- expired-link recovery must be token-based, not public order lookup

---

## Current repo evidence

- `apps/roaster/app/fulfill/[token]/page.tsx` already:
  - validates the token
  - loads the order
  - logs `FULFILLMENT_VIEWED`
  - shows the tracking form for `CONFIRMED` orders
- `apps/roaster/app/fulfill/[token]/_components/fulfillment-details.tsx` currently shows:
  - order number
  - item snapshots
  - payout breakdown
  - buyer name only, not the full shipping snapshot
- `apps/roaster/app/fulfill/[token]/_actions/submit-tracking.ts` already:
  - re-validates the token
  - consumes `usedAt`
  - sets `status = SHIPPED`
  - saves `trackingNumber` and `carrier`
  - emits `SHIPPED`
  - sends `order_shipped`
- The current expired / used / invalid states are simple text states only.

---

## In scope

### Fulfillment page UX upgrade

- Improve layout and hierarchy of the existing token page
- Add full immutable shipping snapshot display from `Order`
- Keep frozen payout display prominent
- Add optional `fulfillmentNote`
- Keep the submit flow focused and mobile-friendly

### State handling

- Improve `expired`, `used`, and already-shipped states
- For expired links, support token-based recovery/regeneration when allowed
- Show a more informative shipped/read-only state when the order has already moved beyond `CONFIRMED`

### Existing mutation preservation

- Preserve the current transactional ship action semantics
- Preserve token validation rules
- Preserve no-auth access

---

## Out of scope

- Clerk portal sign-in via the magic link
- Batch fulfillment
- EasyPost labels
- Tracking correction on the token page
- Public order-ID-based resend/recovery

---

## Primary files to create or modify

| Action | File | Purpose |
|--------|------|---------|
| Modify | `apps/roaster/app/fulfill/[token]/page.tsx` | Upgrade page states and layout |
| Modify | `apps/roaster/app/fulfill/[token]/_components/fulfillment-details.tsx` | Add shipping snapshot and improved presentation |
| Modify | `apps/roaster/app/fulfill/[token]/_components/tracking-form.tsx` | Add fulfillment-note support and refined UX |
| Modify | `apps/roaster/app/fulfill/[token]/_actions/submit-tracking.ts` | Persist `fulfillmentNote` and preserve idempotency |
| Create | route-local recovery action or helper | Handle expired-token regeneration rules |
| Modify | `packages/email/templates/order-shipped.tsx` | Include fulfillment note when present |

---

## Acceptance criteria

- [ ] `/fulfill/[token]` remains accessible without authentication
- [ ] A valid token shows:
  - order number
  - fundraiser context
  - item snapshots
  - frozen payout summary
  - full immutable shipping snapshot
  - tracking form
- [ ] The page supports an optional `fulfillmentNote`
- [ ] Tracking submission remains transactional and idempotent
- [ ] On successful submission, the order stores `fulfillmentNote` when present
- [ ] The buyer shipped email includes the note when present
- [ ] Expired-token recovery is driven by the expired token, not a free-form order lookup
- [ ] Expired-token regeneration reuses the existing `MagicLink` row instead of creating a second active fulfillment-link row
- [ ] If the order has already shipped, the page shows a useful read-only state instead of only a generic status message
- [ ] No session cookie or portal login is created from this flow
- [ ] No new logs expose buyer PII

---

## UX / accessibility / mobile requirements

- [ ] Keep one clear primary action
- [ ] Maintain minimum 44x44px touch targets
- [ ] Preserve a fast, server-rendered first load
- [ ] Avoid client-side data fetching for the initial page state
- [ ] Keep error and expired states calm and explicit
- [ ] Make the page usable on mobile without horizontal overflow

---

## Suggested implementation steps

1. Expand the order read model on the token page to include the shipping snapshot fields.
2. Upgrade the details component and page state handling.
3. Add optional `fulfillmentNote` to the tracking form and server action.
4. Add token-based expired-link regeneration logic using the live `MagicLink` row.
5. Update the shipped email template to render the note when present.

---

## Required doc updates

- [ ] target story doc
- [ ] `docs/SPRINT_8_CHECKLIST.md`
- [ ] `docs/SPRINT_8_PROGRESS.md`
- [ ] `docs/sprint-8/README.md` if sprint-level scope or verification changes
- [ ] `docs/04-order-lifecycle.mermaid` if the expired-link recovery path changes the lifecycle diagram
- [ ] `docs/01-project-structure.mermaid` if route-local structure changes materially

---

## QA and verification

- [ ] Valid token renders shipping snapshot correctly
- [ ] Expired token can regenerate only when the order is still `CONFIRMED`
- [ ] Used token does not reopen the ship flow
- [ ] Shipping the order still consumes the token and emits `SHIPPED`
- [ ] `fulfillmentNote` persists and appears in the buyer email
- [ ] Mobile page remains usable without layout breakage
- [ ] At minimum run:
  - targeted tests for token validation / tracking action if added
  - `pnpm --filter roaster typecheck`
  - relevant `web` / `roaster` build or focused verification needed by changed files

---

## Handoff notes

- Do not overreach into a new portal order-detail abstraction here; this story upgrades the existing token page first.
- If a shared fulfillment component emerges naturally, extract it from this work and reuse it later in US-10-05.
- Keep token recovery tightly bound to the expired-token context to avoid creating a broader unauthenticated lookup surface.

---

## Revision log

| Version | Date | Notes |
|---------|------|-------|
| 0.1 | 2026-04-05 | Initial EP-10 token-page enhancement story created from the final fulfillment planning baseline. |
| 0.2 | 2026-04-05 | Tightened for execution with concrete points, sharper token criteria, and minimum verification expectations. |

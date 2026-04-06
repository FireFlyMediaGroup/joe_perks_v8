# US-10-03 — Fulfillment Reminders and Escalation Refresh

**Story ID:** US-10-03 | **Epic:** EP-10 (Roaster Fulfillment)
**Points:** 5 | **Priority:** High
**Status:** `Done`
**Owner:** Full-stack
**Dependencies:** US-10-00, US-10-01, SLA baseline
**Depends on this:** none

---

## Goal

Refresh the roaster fulfillment reminder/escalation experience so reminder emails always carry a valid fulfillment CTA, remain compatible with the one-live-link model, and reuse the existing SLA job rather than introducing a second competing automation path.

---

## Planning baseline

Read first:

- [`docs/sprint-8/roaster-fulfillment-epic-v4.md`](../roaster-fulfillment-epic-v4.md)
- [`docs/sprint-8/roaster-fulfillment-preflight-decisions.md`](../roaster-fulfillment-preflight-decisions.md)
- [`docs/sprint-8/roaster-fulfillmet`](../roaster-fulfillmet)

Normalized decisions this story implements:

- reuse the active token while it is still valid
- rotate the single `MagicLink` row only on expiry or explicit regeneration
- keep resend behavior compatible with `EmailLog` dedupe
- preserve the current SLA job architecture

---

## Current repo evidence

- `apps/web/lib/inngest/run-sla-check.tsx` already sends:
  - `sla_roaster_reminder`
  - `sla_roaster_urgent`
  - `sla_buyer_delay`
  - `sla_admin_breach`
  - `sla_admin_critical`
- The current roaster SLA templates do not include the fulfillment CTA URL.
- `packages/email/templates/magic-link-fulfillment.tsx` exists for the initial fulfillment email.
- `sendEmail()` dedupes on `(entityType, entityId, template)`, so resend behavior must keep distinct template names.

---

## In scope

### Reminder-email upgrade

- Add fulfillment CTA support to the existing roaster reminder / urgent ladder
- Ensure reminder tiers always link to a valid fulfillment token
- Reuse the active token while still valid

### Token regeneration behavior

- If the active token is expired and the order is still `CONFIRMED`, regenerate the existing `MagicLink` row in place
- Log operational resend activity with `MAGIC_LINK_RESENT`

### Critical-tier decision

- If a roaster-facing critical email is added, it must use a distinct template name and fit the existing SLA job timing

### Manual resend compatibility

- Leave room for a future/manual resend flow to use a distinct template string without breaking dedupe

---

## Out of scope

- Multiple active fulfillment links per order
- Replacing the existing SLA job architecture
- Building a public order-lookup resend flow
- Changing global `EmailLog` dedupe behavior

---

## Primary files to create or modify

| Action | File | Purpose |
|--------|------|---------|
| Modify | `apps/web/lib/inngest/run-sla-check.tsx` | Add fulfillment-link-aware resend/regeneration behavior |
| Add | `packages/db/fulfillment-link.ts` | Centralize active-link reuse and in-place regeneration rules |
| Modify | `packages/email/templates/sla.tsx` | Add fulfillment CTA support to roaster reminder/urgent emails |
| Modify | `packages/email/templates/magic-link-fulfillment.tsx` if needed | Align initial/manual resend content |
| Modify | `apps/web/app/api/webhooks/stripe/route.ts` only if initial email props need alignment | Keep initial email consistent with the enhanced flow |

---

## Acceptance criteria

- [x] Initial order-confirmation-side roaster fulfillment email still uses `magic_link_fulfillment`
- [x] Reminder and urgent SLA emails include a fulfillment CTA
- [x] When the current fulfillment token is still valid, reminder/urgent emails reuse it
- [x] When the current fulfillment token is expired and the order is still `CONFIRMED`, the existing `MagicLink` row is regenerated in place before sending
- [x] Regeneration writes `MAGIC_LINK_RESENT`
- [x] Existing template names `sla_roaster_reminder` and `sla_roaster_urgent` remain valid unless the epic/docs are updated in the same PR
- [x] Template names remain distinct enough for `EmailLog` dedupe to work as intended
- [x] No story path creates multiple active fulfillment-link rows for one order
- [x] Reminder/escalation emails do not send for unresolved flagged orders

---

## UX / copy requirements

- [x] Reminder email tone stays helpful and action-oriented
- [x] Urgent email tone stays serious without becoming hostile
- [ ] If a critical roaster email is added, it clearly communicates refund risk
- [x] Email CTA copy should point roasters back into the exact fulfillment action, not a vague dashboard destination

---

## Suggested implementation steps

1. Add a helper that resolves the active fulfillment token for reminder tiers.
2. Reuse the active token when valid; regenerate in place only when expired and still eligible.
3. Update `sla.tsx` templates to include fulfillment action links.
4. Log regeneration events with `MAGIC_LINK_RESENT`.
5. Verify flagged-order skip behavior still holds after the email refresh.

---

## Required doc updates

- [x] target story doc
- [x] `docs/SPRINT_8_CHECKLIST.md`
- [x] `docs/SPRINT_8_PROGRESS.md`
- [ ] `docs/sprint-8/roaster-fulfillment-epic-v4.md` if template naming strategy changes
- [x] `docs/04-order-lifecycle.mermaid` if reminder/escalation flow changes
- [ ] `docs/AGENTS.md` only if a new canonical resend rule is introduced

---

## QA and verification

- [x] Reminder email uses the active token when still valid
- [x] Expired active token regenerates in place only for `CONFIRMED` orders
- [x] `EmailLog` dedupe still prevents duplicate sends for the same tier
- [x] No duplicate `MagicLink` rows are created
- [x] Flagged unresolved orders do not receive reminder/urgent sends
- [x] At minimum run:
  - targeted tests for token-resolution / reminder-send behavior if added
  - `pnpm --filter web typecheck`
  - focused verification for the touched email templates and Inngest function

---

## Handoff notes

- Prefer enhancing the existing `sla_roaster_reminder` and `sla_roaster_urgent` path over introducing a second reminder template family unless implementation reveals a compelling reason.
- The main goal here is operational correctness plus clearer roaster actionability, not a full rebrand of the email system.

---

## Revision log

| Version | Date | Notes |
|---------|------|-------|
| 0.1 | 2026-04-05 | Initial EP-10 reminder/escalation story created from the final fulfillment planning baseline. |
| 0.2 | 2026-04-05 | Tightened for execution with concrete points, resend constraints, and minimum verification expectations. |
| 0.3 | 2026-04-06 | Completed: SLA reminder and urgent emails now resolve a valid fulfillment CTA, reuse or regenerate the single fulfillment link in place, and keep manual resend behavior aligned with the same helper. |

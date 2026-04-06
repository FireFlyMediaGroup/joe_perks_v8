# EP-10 — Roaster Fulfillment Enhancement v4

**Sprint:** 8-9 | **Stories:** 7 | **Epic:** EP-10 (Roaster Fulfillment)
**Audience:** AI coding agents, developers

**Companion documents:**

- Pre-flight decisions: [`docs/sprint-8/roaster-fulfillment-preflight-decisions.md`](./roaster-fulfillment-preflight-decisions.md)
- Reconciliation draft: [`docs/sprint-8/roaster-fulfillment-epic-v2.md`](./roaster-fulfillment-epic-v2.md)
- Combined draft: [`docs/sprint-8/roaster-fulfillment-epic-v3.md`](./roaster-fulfillment-epic-v3.md)
- Original product draft: [`docs/sprint-8/roaster-fulfillmet`](./roaster-fulfillmet)

This is the final planning baseline for EP-10. Story docs should follow this file plus the pre-flight decisions note.

---

## Sprint objective

Extend the existing email-first roaster fulfillment MVP into a complete, codebase-aligned operational flow:

- enhance the unauthenticated magic-link fulfillment experience
- add a structured "Can't fulfill" escalation path
- improve fulfillment reminders without violating the one-live-link rule
- add a real authenticated roaster order queue and order detail flow
- add a real roaster-facing payouts / debts / disputes view

This epic builds on the fulfillment backbone already implemented in Sprint 4. It does not replace it.

---

## Source-of-truth planning inputs

Every EP-10 story should stay aligned with:

- this epic: [`docs/sprint-8/roaster-fulfillment-epic-v4.md`](./roaster-fulfillment-epic-v4.md)
- pre-flight decisions: [`docs/sprint-8/roaster-fulfillment-preflight-decisions.md`](./roaster-fulfillment-preflight-decisions.md)
- original product draft: [`docs/sprint-8/roaster-fulfillmet`](./roaster-fulfillmet)
- PRD: `docs/joe_perks_prd.docx`
- engineering rules: [`docs/AGENTS.md`](../AGENTS.md)
- code conventions: [`docs/CONVENTIONS.md`](../CONVENTIONS.md)
- schema reference: [`docs/joe_perks_db_schema.md`](../joe_perks_db_schema.md)
- live schema: `packages/db/prisma/schema.prisma`
- order lifecycle diagram: [`docs/04-order-lifecycle.mermaid`](../04-order-lifecycle.mermaid)
- order state machine: [`docs/08-order-state-machine.mermaid`](../08-order-state-machine.mermaid)
- roaster portal structure: [`docs/01-project-structure.mermaid`](../01-project-structure.mermaid)

If implementation reveals a mismatch between these docs and the live code, update the relevant docs in the same PR.

---

## Current repo alignment

These realities are already true in the repository and must shape EP-10:

- `apps/web/app/api/webhooks/stripe/route.ts` already confirms the order and creates a deduped `ORDER_FULFILLMENT` magic link.
- The live fulfillment URL is `apps/roaster/app/fulfill/[token]/page.tsx`.
- Tracking submission already transitions `CONFIRMED -> SHIPPED` and consumes the token in a transaction.
- Buyer shipped email already exists via `order_shipped`.
- Admin delivery confirmation already transitions `SHIPPED -> DELIVERED`.
- The SLA job already exists at `apps/web/lib/inngest/run-sla-check.tsx`.
- The payout release job already exists at `apps/web/lib/inngest/run-payout-release.ts`.
- `apps/roaster/app/(authenticated)/dashboard/page.tsx` now serves the authenticated roaster order queue.
- `apps/roaster/app/(authenticated)/orders/[id]/page.tsx` now serves the authenticated roaster order-detail route.
- `apps/roaster/app/(authenticated)/payouts/page.tsx` now serves the roaster finance view for payout history, unsettled debt, and disputes.
- Live `OrderEventType` values in use include `PAYMENT_SUCCEEDED`, `FULFILLMENT_VIEWED`, `SHIPPED`, and `DELIVERED`.
- Live payout execution works from `status = DELIVERED` and `payoutStatus = HELD`.

---

## Normalized implementation decisions

These decisions are the EP-10 source of truth.

### 1. One-live-link fulfillment model

- Keep exactly one live `ORDER_FULFILLMENT` `MagicLink` row per order.
- Preserve the current `MagicLink.dedupeKey` design.
- Do not create multiple simultaneous valid fulfillment-link rows.

### 2. Hybrid token reuse / rotation rule

- Reuse the current active token for normal SLA reminder and urgent emails while it is still valid.
- Rotate the same `MagicLink` row in place only when:
  - the token is expired and the order is still `CONFIRMED`
  - a manual resend explicitly regenerates it

This avoids generic invalid-link UX for still-valid older emails while preserving the single-live-link constraint.

### 3. Email dedupe strategy

- Keep `sendEmail()` and `EmailLog` as-is.
- Continue using distinct template names per operational tier.
- Preserve the existing initial fulfillment email as `magic_link_fulfillment`.
- Preserve and enhance the live SLA tier emails (`sla_roaster_reminder`, `sla_roaster_urgent`) instead of creating a second competing reminder ladder.
- If manual resend is added, use a distinct template string for that flow.

### 4. Expired-link recovery

- Do not build a public order-ID-based resend endpoint.
- Recovery should be driven by the expired token context itself.
- Regeneration is allowed only if the token row exists, is expired, unused, and still points to a `CONFIRMED` order.

### 5. Flagged-order SLA behavior

- `ORDER_FLAGGED` pauses automated fulfillment-side SLA handling.
- Issue reporting stores a structured reason, resolution offer, and optional note on the order record.
- While unresolved:
  - pause roaster SLA reminder / urgent automation
  - pause buyer delay email automation
  - pause auto-refund
- Admin acknowledgement alone does not resume the timer.
- Admin resolution must be explicit, should write `FLAG_RESOLVED`, and should leave a resolved-state marker on the order record.

### 6. Portal mutation pattern

- Authenticated roaster portal mutations use server actions, not API routes, by default.
- Portal actions must scope through `requireRoasterId()`.
- Public token-based flows remain limited to the magic-link fulfillment surface and its token-based recovery path.

### 7. Payout vocabulary

Use live payout states and derive nicer UI labels from them:

- `HELD` + future `payoutEligibleAt` = in hold period
- `HELD` + past `payoutEligibleAt` = awaiting release
- `TRANSFERRED` = paid
- `FAILED` = transfer failed

Do not plan payout UI around `PENDING` as the main post-delivery state.

### 8. Event naming and timeline labels

Base user-facing history on actual or newly added live event names:

- `PAYMENT_SUCCEEDED` -> order confirmed
- `FULFILLMENT_VIEWED` -> fulfillment link opened
- `SHIPPED` -> marked as shipped
- `TRACKING_UPDATED` -> tracking updated
- `DELIVERED` -> delivered
- `ORDER_FLAGGED` -> issue reported
- `FLAG_RESOLVED` -> issue resolved

Do not write story docs using `ORDER_SHIPPED` or `ORDER_DELIVERED`.

### 9. Fulfillment note scope

- `fulfillmentNote` is in scope for this epic.
- It should be optional.
- It should be usable from both the token flow and the portal fulfillment flow.
- It should be included in buyer shipped communication when present.

### 10. Tracking correction scope

- Post-ship tracking correction is in scope.
- It is portal-only.
- It should write `TRACKING_UPDATED`.

---

## Product principles to preserve

These product choices from the original EP-10 draft remain valid:

- The magic-link page and portal order detail should feel like one product.
- The token page should stay focused, fast, and mobile-friendly.
- Payout information should be prominent and understandable.
- "Can't fulfill" should be supportive, not punitive.
- The portal should reduce dependence on email, not invalidate the email-first path.
- EasyPost remains future scope and must not be described as already wired into the live schema.

---

## Deferred from EP-10

These remain valid future enhancements but are not part of this epic:

| Area | Deferred item | Reason |
|------|---------------|--------|
| Shipping | EasyPost label purchase/download | Requires later schema + integration work |
| Shipping | Platform-generated packing slips | Separate fulfillment tooling scope |
| Fulfillment | Batch tracking entry | Higher-complexity portal workflow |
| Delivery | Carrier webhook delivery confirmation replacement | Current admin-confirmed flow already exists |
| Auth | Magic-link-based portal login | Conflicts with Clerk portal model |
| Commerce | Multi-roaster fulfillment | Phase 3 architecture |

---

## Epic and stories

### EP-10 — Roaster Fulfillment Enhancement

| Story ID | Title | Priority | Dependencies | App/Package |
|----------|-------|----------|--------------|-------------|
| US-10-00 | Fulfillment schema and event alignment | High | US-01-02, Sprint 4 fulfillment baseline | `packages/db`, docs |
| US-10-01 | Magic-link fulfillment page enhancement | High | US-10-00, US-05-02 | `apps/roaster`, `packages/email` |
| US-10-02 | Structured "Can't fulfill" flow | High | US-10-00, US-10-01, admin orders baseline | `apps/roaster`, `apps/admin`, `apps/web` |
| US-10-03 | Fulfillment reminders and escalation email refresh | High | US-10-00, US-10-01, SLA baseline | `apps/web`, `packages/email` |
| US-10-04 | Authenticated roaster order queue | High | US-10-00, roaster auth baseline | `apps/roaster` |
| US-10-05 | Portal order detail, fulfillment, and tracking correction | High | US-10-00, US-10-01, US-10-04 | `apps/roaster`, `packages/email` |
| US-10-06 | Roaster payouts, debts, and disputes view | High | US-10-04, payout baseline | `apps/roaster` |

---

## Recommended implementation order

### Sprint 8

1. `US-10-00` — schema and event alignment
2. `US-10-01` — token-page enhancement
3. `US-10-02` — can't-fulfill flow
4. `US-10-03` — reminder/escalation refresh

### Sprint 9

1. `US-10-04` — authenticated order queue
2. `US-10-05` — portal order detail and tracking correction
3. `US-10-06` — payouts / debts / disputes view

---

## Required doc sync

When implementation starts, keep these in sync:

- `docs/01-project-structure.mermaid`
- `docs/04-order-lifecycle.mermaid`
- `docs/06-database-schema.mermaid`
- `docs/08-order-state-machine.mermaid`
- `docs/joe_perks_db_schema.md`
- `docs/AGENTS.md` if a new canonical rule is introduced

---

## Final summary

The original EP-10 draft was directionally strong on product and UX but not aligned to the live codebase.

The pre-flight review resolved the remaining implementation risks:

- keep one live fulfillment link per order
- reuse active tokens for normal reminder tiers
- rotate only on expiry or explicit regeneration
- keep resend behavior compatible with `EmailLog` dedupe
- pause SLA automation explicitly on unresolved flags
- use live event names and live payout states
- use server actions for authenticated portal mutations

This epic is now the correct baseline for writing EP-10 story documents.

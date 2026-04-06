# Roaster Fulfillment Pre-Flight Decisions

Use this note before finalizing the EP-10 epic and writing story documents.

This document captures the items most likely to cause another reconciliation cycle if they are not locked first.

## Status

The fulfillment enhancement work is viable, but the epic should not be treated as final until the decisions below are reflected in the final planning doc.

## 1. Fulfillment Link Strategy

### Problem

The live system enforces one live `ORDER_FULFILLMENT` link per order via `MagicLink.dedupeKey`.

At the same time:

- the old planning doc assumed many simultaneous valid links
- pure token rotation makes older emailed links fail as generic `Invalid link`
- the current validator cannot distinguish a superseded token from a bad token

## Recommendation

Use a hybrid single-link strategy:

- reuse the current active token for normal SLA reminder and urgent emails while it is still valid
- rotate the same `MagicLink` row in place only when:
  - the token has expired and the order is still `CONFIRMED`
  - platform support or a manual resend explicitly regenerates the link

### Why this is the safest fit

- preserves the one-live-link guarantee
- preserves the useful older-email behavior while the token is still valid
- avoids the degraded UX where a reminder email becomes an unexplained invalid-link page
- still allows secure regeneration when the active token is expired

### Story implication

Do not write stories that create multiple active fulfillment-link rows.

## 2. Resend and Email Dedupe Strategy

### Problem

`sendEmail()` dedupes on:

- `entityType`
- `entityId`
- `template`

So resend behavior must be intentionally designed. Sending the same template twice for the same order will be skipped.

## Recommendation

Use distinct template names for each resend tier:

- `magic_link_fulfillment`
- `magic_link_fulfillment_reminder`
- `magic_link_fulfillment_urgent`
- `magic_link_fulfillment_critical` if critical tier email remains in scope
- `magic_link_fulfillment_manual_resend` for support/manual regeneration

Keep:

- `entityType = "order"`
- `entityId = order.id`

Log operational resend activity in `OrderEvent` with:

- `MAGIC_LINK_RESENT`

### Story implication

Do not change the global `EmailLog` dedupe model for this epic.

## 3. Expired-Link Recovery Flow

### Problem

The earlier draft assumed a public endpoint like `POST /api/roaster/request-new-link?order_id=X`.

That is underspecified and too loose for a public unauthenticated recovery flow.

## Recommendation

Design expired-link recovery around the expired token, not a free-form order ID:

- the expired page can post the expired `token`
- the server looks up the existing `MagicLink`
- if:
  - the row exists
  - `purpose = ORDER_FULFILLMENT`
  - `expiresAt <= now`
  - `usedAt IS NULL`
  - the linked order is still `CONFIRMED`
then regenerate the token in the same row and resend the roaster email

If those conditions are not met, fall back to support contact instead of exposing more account/order recovery surface.

### Story implication

Do not write the expired-link story as a generic public order lookup endpoint.

## 4. Flagged-Order SLA Semantics

### Problem

The current SLA job processes unshipped `CONFIRMED` orders only. A roaster-flagged order introduces a second operational state that does not exist today.

## Recommendation

While an order is flagged and unresolved:

- pause all automated roaster-side SLA actions
- pause automated buyer delay emails
- pause auto-refund
- surface the order prominently in admin

Admin acknowledgement alone should not silently resume the old timer. Resolution must be explicit.

Recommended rule:

- `ORDER_FLAGGED` pauses the automated SLA path
- admin resolution writes `FLAG_RESOLVED`
- after resolution, admin must choose the next path explicitly, for example:
  - resume fulfillment monitoring
  - refund / cancel
  - hold for manual handling

### Story implication

Do not write stories that only skip auto-refund but leave other SLA automation ambiguous.

## 5. Portal Mutation Pattern

### Problem

Earlier planning language drifted toward authenticated API routes for portal fulfillment and tracking correction.

The project conventions for portal apps prefer server actions.

## Recommendation

Use:

- server actions for authenticated roaster portal mutations
- `requireRoasterId()` for tenant scoping

Use public token-based flows only for:

- `/fulfill/[token]`
- expired-link recovery from that token context

### Story implication

Portal stories should default to `page.tsx` + `_actions/` + `_components/` + `_lib/` structure.

## 6. Payout State Vocabulary

### Problem

Planning language still mixes UI words like "pending payout" with schema states that do not match the live implementation.

Live payout processing uses:

- `HELD`
- `TRANSFERRED`
- `FAILED`

and the release job runs from `DELIVERED + HELD`.

## Recommendation

Keep the schema model as-is.

If the UI wants more expressive labels, derive them from the live fields:

- `HELD` + `payoutEligibleAt > now()` → "In hold period"
- `HELD` + `payoutEligibleAt <= now()` → "Awaiting release"
- `TRANSFERRED` → "Paid"
- `FAILED` → "Transfer failed"

### Story implication

Do not write new payout stories as if `PENDING` is the primary live post-delivery payout state.

## 7. Event Timeline Mapping

### Problem

The planning docs still assume event names that do not match the live enum or the live event emission behavior.

For example:

- current code emits `PAYMENT_SUCCEEDED`
- current code emits `SHIPPED`
- current code emits `DELIVERED`
- current code emits `FULFILLMENT_VIEWED`
- current code does not currently emit `ORDER_CONFIRMED` in the webhook

## Recommendation

Base the roaster-facing timeline on the events that are actually emitted.

Recommended labels:

| Event type | User-facing label |
| --- | --- |
| `PAYMENT_SUCCEEDED` | `Order confirmed` |
| `FULFILLMENT_VIEWED` | `Fulfillment link opened` |
| `SHIPPED` | `Marked as shipped` |
| `TRACKING_UPDATED` | `Tracking updated` |
| `DELIVERED` | `Delivered` |
| `ORDER_FLAGGED` | `Issue reported` |
| `FLAG_RESOLVED` | `Issue resolved` |

Use `ORDER_CREATED` or `ORDER_CONFIRMED` in timeline copy only if the code is updated to emit them consistently.

## Final Recommendation

Before writing the final epic and the story documents:

1. lock the hybrid single-link strategy
2. lock per-tier email template names
3. lock expired-link recovery around expired-token regeneration, not public order lookup
4. lock flagged-order SLA pause semantics
5. lock portal stories to server actions
6. lock payout wording to the live `HELD -> TRANSFERRED/FAILED` model
7. lock the event-label mapping above

Once those seven decisions are reflected in the epic, the story docs can be written with much lower risk of drifting from the actual codebase.

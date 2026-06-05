# `isCollab` and `FulfillerType.PLATFORM` are reserved, dormant scaffolding

Two schema constructs exist with **no behavior** and must not be built on until specified:

- **`isCollab`** (on `Product` and `Order`, default `false`) is never read or written by application
  code. Its intended meaning is a **co-branded, limited-edition product** a roaster creates with an
  org for its campaign — a future capability, not part of v1.
- **`FulfillerType.PLATFORM`** is never set — every roaster and order is hardcoded `ROASTER`
  (`approvals/roasters/.../approve-application.ts` sets `fulfillerType: "ROASTER"`; checkout copies
  `roaster.fulfillerType`). Its intended meaning is **platform-operated fulfillment** — Joe Perks
  holding inventory and shipping orders itself, rather than the roaster drop-shipping.

We are keeping these columns/enum values reserved (rather than removing them or implementing them) so
the MVP schema doesn't churn when these phases arrive, while recording their intended meaning so they
are not misread or wired up prematurely.

## Why this needs recording

A reader sees an `isCollab` boolean and a `PLATFORM` enum value and will reasonably assume they do
something. They do not. Worse, naively setting `fulfillerType = PLATFORM` would silently break money
and SLA assumptions that are all roaster-centric today:

- **Splits** assume the roaster is the merchant of the goods and bears product cost; platform
  fulfillment changes who earns the roaster share entirely.
- **The fulfillment SLA** ([ADR 0005](./0005-sla-and-refund-policy.md)) and its escalation emails are
  addressed to the roaster; a platform-fulfilled order has no roaster to chase.
- **Payouts** transfer the roaster share to the roaster's Stripe account; platform fulfillment has no
  such transfer.

Before anything sets `PLATFORM` or acts on `isCollab`, the split, SLA, and payout semantics for those
cases must be designed and recorded in a follow-up ADR.

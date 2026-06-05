# Joe Perks

A multi-tenant B2B2C marketplace that connects specialty coffee **Roasters** with local
**Orgs** (schools, teams, nonprofits) to run coffee **fundraisers**. **Buyers** purchase through
an org-branded storefront, and a share of every sale is routed to the org automatically.

## Language

### Actors

**Roaster**:
A specialty coffee business that owns a product catalog and fulfills orders. Onboards via Stripe
Connect Express and is the default fulfiller.
_Avoid_: Vendor, seller, supplier, merchant.

**Org**:
The financial entity that runs fundraisers and gets paid — e.g. a school, club, or nonprofit. An
org owns one Stripe Connect account, one storefront slug, and one or more campaigns. Sub-groups
(a school's boys' and girls' teams) are campaigns under the org, not orgs themselves; all their
funds pool to the org's account.
_Avoid_: Organization (spelled out), customer, group, account, team, nonprofit (an org need not be
a registered nonprofit).

**Buyer**:
A consumer who purchases coffee on an org storefront. Identified by email at checkout. A buyer can
sign in via a magic-link **buyer session** to view their order history (a "buyer account"), but is
never a Clerk-backed User and has no portal access. Distinct from a User.
_Avoid_: Customer, shopper, user.

**User**:
An authenticated portal account (Clerk-backed) belonging to a Roaster, Org, or the Platform. A
person who logs in to manage things. Distinct from a Buyer.
_Avoid_: Account, member.

**Platform**:
Joe Perks itself — the marketplace operator. Acts through the admin app and retains a platform fee
on every order.
_Avoid_: Joe Perks (when referring to the actor/role), us, the company.

### Onboarding

**Roaster–org partnership**:
The approved relationship between an org and its single roaster, established when the roaster
approves the org's application. An org sells only its partner roaster's catalog.
_Avoid_: Relationship, link, association, contract.

**Primary roaster**:
The org's first-choice roaster on its application (`priority` 1). Approached first for approval.
_Avoid_: Preferred roaster, default roaster.

**Backup roaster**:
The org's optional second-choice roaster (`priority` 2), approached only if the primary declines.
There is at most one backup — the matching chain is two deep and then the application is rejected.
_Avoid_: Secondary roaster, fallback (use "backup").

**Magic link**:
A single-use, expiring tokenized URL that lets an actor without a portal login take one scoped
action — fulfilling an order, reviewing an org request, or buyer auth (`MagicLinkPurpose`).
_Avoid_: Invite link, access token, one-time link.

### Commerce

**Campaign** (= **Fundraiser**):
One fundraising drive run by an org, with its own product selection, org-share %, goal, and
running total. "Campaign" and "Fundraiser" are synonyms — Campaign is the canonical term in code
and docs. An org may run one campaign (e.g. a single scout troop) or several concurrent ones
(e.g. a school raising for its boys' and girls' teams at the same time).
_Avoid_: Drive, promotion, sale event.

**Storefront**:
The public-facing page where buyers browse and purchase. There is one storefront per org, under
the org's slug at joeperks.com/[slug]; it presents all of that org's active campaigns, and the
buyer chooses which campaign (cause) to support before checking out.
_Avoid_: Shop, store, microsite, landing page.

**Collab product** _(reserved — not active in v1)_:
A co-branded, limited-edition product a roaster creates in collaboration with an org for its
campaign. Flagged by `isCollab` on Product/Order, which is dormant scaffolding today — no behavior
depends on it. See [ADR 0006](./docs/adr/0006-reserved-collab-and-platform-fulfillment.md).
_Avoid_: Collaboration, special, co-brand.

> **Org-level fund aggregation.** All funds raised across an org's campaigns are collected by the
> one org (its single Stripe Connect account) — even when concurrent campaigns nominally raise for
> different sub-causes (the boys' vs girls' team). Sub-causes are modeled as separate Campaigns
> under one Org, not as separate Orgs; the org is responsible for any downstream distribution.

### Fulfillment & refunds

**Fulfiller**:
The party that ships an order (`FulfillerType`). In v1 this is always the **roaster** (drop-ship).
**Platform fulfillment** — Joe Perks holding inventory and shipping orders itself — is the reserved
`PLATFORM` value: dormant today, and using it requires first defining its split, SLA, and payout
ownership. See [ADR 0006](./docs/adr/0006-reserved-collab-and-platform-fulfillment.md).
_Avoid_: Shipper, fulfillment partner.

**Fulfillment SLA**:
The deadline by which the roaster must **ship** a confirmed order (`fulfillBy = confirmed +
slaBreachHours`). The clock runs only while the order is `CONFIRMED` and stops at shipment — it
measures time-to-ship, not time-to-deliver.
_Avoid_: Delivery SLA, deadline, due date.

**SLA escalation**:
The tiered response as a confirmed-but-unshipped order ages past configurable thresholds: warning →
breach → critical → auto-refund (`PlatformSettings.sla*Hours`). Each tier emails the roaster/buyer/
admin and records an `OrderEvent`.
_Avoid_: Reminder, dunning, chase.

**Auto-refund**:
The automatic full refund issued when a confirmed order is still unshipped at the auto-refund
threshold. Voids the order (`REFUNDED`) and the payout, and charges the roaster a debt for the
Stripe fee.
_Avoid_: Timeout refund, cancellation.

**Refund**:
Returning a *completed* payment to the buyer (whole-order only in v1 — no partial or line-item
refunds). Triggered by SLA auto-refund, an admin (pre-payout, `HELD` orders), or a lost dispute.
Distinct from a cancellation.
_Avoid_: Reversal, void, chargeback (a chargeback is buyer-initiated via the bank).

**Cancellation**:
An order whose payment never succeeded — a failed or abandoned PaymentIntent moves it
`PENDING → CANCELLED`. No money changed hands. Distinct from a refund (where it did).
_Avoid_: Cancel (as a verb for refunding), void.

### Money

**Fundraiser share**:
The percentage of an order's product subtotal (5–25%) that the org earns on each sale. A commercial
revenue split the org earns — **not** a charitable donation, gift, or tax-deductible contribution.
Stored as `orgPctSnapshot`, frozen on the order at PaymentIntent creation.
_Avoid_: Donation, gift, proceeds, contribution, charity cut.

**Split**:
The division of an order's **product subtotal** (shipping excluded) into three frozen amounts: the
org's fundraiser share, the platform fee, and the roaster's share. The Stripe processing fee is shared
between the org and the roaster in proportion to their product-subtotal shares (the platform is
exempt and keeps its full fee). Shipping is passed through to the roaster in full. Splits are frozen
on the order at PaymentIntent creation and never recalculated.
_Avoid_: Breakdown, allocation, distribution.

**Payout**:
The transfer of an order's frozen split amounts to the roaster's and org's Stripe Connect accounts,
run by a daily job after the payout hold elapses. `PayoutStatus`: PENDING (pre-payment) →
**HELD** (the normal waiting state during the hold window) → TRANSFERRED | FAILED.
_Avoid_: Disbursement, settlement (settlement means something else in Stripe).

**Payout hold**:
The waiting period between delivery and payout (`payoutEligibleAt = delivered + N days`,
`PlatformSettings.payoutHoldDays`) during which funds stay HELD so a dispute can surface before money
moves. Not a penalty — every order waits.
_Avoid_: Escrow, freeze.

**Roaster debt**:
Money a roaster owes the platform — from a lost roaster-fault dispute, a chargeback, a platform fee,
or a manual adjustment (`DebtReason`). Debts are summed across the roaster and netted out of their
next payout; a payout that can't cover outstanding debt is flagged for manual resolution.
_Avoid_: Balance owed, negative balance, clawback (clawback is the act, not the debt).

**Dispute**:
A buyer's card chargeback on an order, mirrored from Stripe into `DisputeRecord`. An admin assigns a
**fault attribution** that decides who bears the loss.
_Avoid_: Chargeback (use Dispute for the case; "chargeback" names the lost principal as a debt
reason), complaint, claim.

**Fault attribution**:
An admin's ruling on who is responsible for a dispute — ROASTER, PLATFORM, BUYER_FRAUD, or UNCLEAR
(`FaultType`). It determines who eats a lost dispute: a roaster-fault loss is charged back to the
roaster; a platform- or buyer-fraud-fault loss is absorbed by the platform and the roaster still gets
paid.
_Avoid_: Blame, liability.

# An Org is the financial entity; campaigns are sub-fundraisers under it

An **Org** models the entity that gets paid — a school, club, or nonprofit — not an individual
fundraising unit. A school's boys' and girls' teams are separate **Campaigns** under one Org, not
separate Orgs. We chose this because the money requirement is that the org (the school) collects all
funds raised across its concurrent campaigns into a single account; sub-team distribution happens
offline and is the org's responsibility, not the platform's.

This decision settles several dependent points the same way:

- **One Stripe Connect account per org.** Payouts for every campaign transfer to the org's one
  account. Per-campaign `Campaign.totalRaised` is tracking-only, so the org can see each cause's
  total; the platform does not route funds to individual teams.
- **One roaster per org.** The org has a single approved `RoasterOrgRequest`, and every campaign
  sells that roaster's catalog. The existing single-roaster-per-campaign guard in `activateCampaign`
  is sufficient because there is only one roaster.
- **One org-share % per org.** `org_pct` is negotiated once when the roaster approves the partnership
  (`application.desiredOrgPct`) and applies to all campaigns. The per-campaign `Campaign.orgPct`
  column remains as the frozen snapshot.
- **One storefront per org.** The public page lives at `joeperks.com/[slug]` (slug is unique on
  `Org`) and presents all of the org's ACTIVE campaigns; the buyer picks which campaign (cause) to
  support before checkout. One order is attributed to exactly one campaign (`Order.campaignId`).

## Considered and rejected

- **Org = the fundraising unit (each team its own Org/slug/Stripe account).** Matches the current
  code with no rework, but each team would be paid independently and the school could not aggregate
  funds — contrary to the requirement.
- **Hybrid (umbrella org with per-campaign payout destinations).** Most flexible, but requires
  per-campaign Stripe destinations and sub-entity modeling; over-scoped for v1.
- **Per-campaign roaster and per-campaign %.** Rejected to keep roaster economics predictable and the
  partnership/approval flow simple for v1.

## Consequences — code gap vs. current implementation

The codebase today assumes one campaign per org and must change to honor this decision:

- `apps/org/app/(authenticated)/campaign/` is a single-campaign route. `saveCampaignDraft` blocks a
  second campaign ("Your campaign is already live.") and reuses the single DRAFT. This must become a
  multi-campaign list + create/edit flow (one DRAFT/ACTIVE guard per campaign, not per org).
- `getStorefrontData()` in `apps/web/app/[locale]/[slug]/_lib/queries.ts` uses
  `campaign.findFirst({ where: { orgId, status: "ACTIVE" } })` — it must load all active campaigns and
  the storefront must add a buyer-facing campaign picker. Checkout already carries `campaign_id`, so
  order attribution is already in place.
- The org dashboard should surface per-campaign `totalRaised` so the school can see each cause's total.

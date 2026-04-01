# US-03-04 -- Org Stripe Connect Onboarding and Campaign Creation

**Story ID:** US-03-04 | **Epic:** EP-03 (Org Onboarding)
**Points:** 5 | **Priority:** High
**Status:** `Done`
**Owner:** Full-stack
**Dependencies:** US-03-03 (Roaster Magic Link Org Review), US-02-03 (Roaster Stripe Connect -- pattern reference)
**Depends on this:** US-04-01 (Public Org Storefront)

---

## Goal

Wire the org portal onboarding and campaign pages. After a roaster approves an org (US-03-03), the org admin signs in to `orgs.joeperks.com`, completes Stripe Connect Express onboarding (mirroring the roaster flow from US-02-03), and creates a campaign by selecting products from the approved roaster's catalog. When the campaign is activated, the storefront goes live at `joeperks.com/[slug]`.

---

## Diagram references

- **Approval chain:** [`docs/05-approval-chain.mermaid`](../../05-approval-chain.mermaid) -- nodes **OA11** (Org completes Stripe Express at `orgs.joeperks.com/onboarding`), **OA12** (Org creates campaign, sets org_pct, selects roaster products), **OA13** (Campaign.status = ACTIVE, storefront live at `joeperks.com/[slug]`)
- **Database ERD:** [`docs/06-database-schema.mermaid`](../../06-database-schema.mermaid) -- `Org`, `Campaign`, `CampaignItem`, `Product`, `ProductVariant` models
- **Stripe payment flow:** [`docs/07-stripe-payment-flow.mermaid`](../../07-stripe-payment-flow.mermaid) -- Connect onboarding context
- **Project structure:** [`docs/01-project-structure.mermaid`](../../01-project-structure.mermaid) -- org app routes

---

## Current repo evidence

- `apps/org/app/(authenticated)/onboarding/page.tsx` -- Stripe Connect UI (`connect-status`, `start-onboarding-button`, return/refresh query params)
- `apps/org/app/(authenticated)/campaign/page.tsx` -- campaign draft/activate (`campaign-form`, `product-selector`)
- `apps/org/app/(authenticated)/_lib/require-org.ts` -- `requireOrgId()` tenant helper
- `apps/org/app/api/stripe/connect/route.ts` -- POST mirrors roaster Connect (`joe_perks_org_id` metadata)
- `apps/org/load-root-env.ts` + import from `next.config.ts` -- root `.env` for `DATABASE_URL` / Stripe in dev
- `apps/org/app/(authenticated)/dashboard/page.tsx` exists
- `apps/org/app/api/webhooks/clerk/route.ts` exists for Clerk user sync
- `apps/roaster/app/(authenticated)/onboarding/` is **fully implemented** (US-02-03) -- pattern reference
- `apps/roaster/app/api/stripe/connect/route.ts` is **fully implemented** -- mirrored for org
- `packages/stripe/src/connect.ts` exports `createExpressConnectedAccount()`, `createExpressAccountLink()`
- `packages/stripe/src/stripe-account-status.ts` exports `mapStripeAccountToOnboardingStatus()`
- `apps/web/app/api/webhooks/stripe/route.ts` handles `account.updated` for **roasters and orgs** (org: `chargesEnabled`/`payoutsEnabled`, ONBOARDING→ACTIVE when fully onboarded)
- `Org` model: `slug`, `status` (`OrgStatus`), `stripeAccountId`, `stripeOnboarding` (`StripeOnboardingStatus`), `chargesEnabled`, `payoutsEnabled`, `applicationId`
- `Campaign` model: `orgId`, `name`, `status` (`CampaignStatus`: `DRAFT`, `ACTIVE`, `PAUSED`, `ENDED`), `orgPct`, `goalCents`, `totalRaised`
- `CampaignItem` model: `campaignId`, `productId`, `variantId`, `retailPrice`, `wholesalePrice`, `isFeatured`, `@@unique([campaignId, variantId])`
- `RoasterOrgRequest` with `status = APPROVED` links org to approved roaster via `applicationId`

---

## AGENTS.md rules that apply

- **Stripe:** Never import Stripe directly in an app -- use `@joe-perks/stripe`. `createExpressConnectedAccount()` and `createExpressAccountLink()` for Connect onboarding.
- **Tenant isolation:** Every org portal query must include `WHERE orgId = session.orgId`. Never trust `orgId` from request body.
- **Money as cents:** `CampaignItem.retailPrice`, `wholesalePrice`, `goalCents` are `Int` cents.
- **Price snapshotting:** When creating `CampaignItem` records, snapshot `retailPrice` and `wholesalePrice` from `ProductVariant` at campaign creation time. The storefront reads `CampaignItem` prices, not variant prices.
- **Soft deletes:** Only show products/variants where `deletedAt IS NULL` and `isAvailable = true`.

**CONVENTIONS.md patterns:**
- Server components for page shells; client components for interactive forms
- Server actions for mutations with `requireOrgId()` from `(authenticated)/_lib/require-org.ts` (mirrors `requireRoasterId()`)
- Portal route structure: `_actions/`, `_components/`, `_lib/` under route segments
- `revalidatePath` after mutations

---

## In scope

### Stripe Connect (org)

- Org Stripe Connect onboarding page at `apps/org/app/(authenticated)/onboarding/`
- Connect API route at `apps/org/app/api/stripe/connect/route.ts`
- Handle `?stripe_return=1` and `?stripe_refresh=1` query params
- Update webhook to handle org `account.updated` events (promote `Org.status` to `ACTIVE`)

### Campaign creation

- Campaign page at `apps/org/app/(authenticated)/campaign/`
- Load approved roaster's products + variants (active, non-deleted, available)
- Product/variant selector for campaign items
- Price snapshot from `ProductVariant` to `CampaignItem` on save
- Campaign name and optional goal input
- Campaign activation with guard checks (at least one item, roaster has shipping rates)
- `orgPct` from `OrgApplication.desiredOrgPct` (set at application time)

### Auth helper

- `requireOrgId()` at `apps/org/app/(authenticated)/_lib/require-org.ts` (mirrors `requireRoasterId()`)

---

## Out of scope

- Public storefront display (US-04-01)
- Cart and checkout (US-04-02, US-04-03)
- Campaign editing after activation (future)
- Multiple campaigns per org (future -- one active campaign for MVP)
- Multiple roasters per campaign (Phase 3)

---

## Primary files to create or modify

| Action | File | Purpose |
|--------|------|---------|
| Modify | `apps/org/app/(authenticated)/onboarding/page.tsx` | Server component -- Stripe Connect status + onboarding UI |
| Create | `apps/org/app/(authenticated)/onboarding/_components/connect-status.tsx` | Client component -- Connect status display |
| Create | `apps/org/app/(authenticated)/onboarding/_components/start-onboarding-button.tsx` | Client component -- initiate Connect |
| Create | `apps/org/app/(authenticated)/onboarding/_lib/fetch-stripe-connect-url.ts` | Shared fetch helper |
| Create | `apps/org/app/api/stripe/connect/route.ts` | POST route -- create/resume Connect onboarding |
| Modify | `apps/web/app/api/webhooks/stripe/route.ts` | Handle org `account.updated` events |
| Modify | `apps/org/app/(authenticated)/campaign/page.tsx` | Server component -- campaign creation UI |
| Create | `apps/org/app/(authenticated)/campaign/_actions/campaign-actions.ts` | Server actions -- `saveCampaignDraft`, `activateCampaign` |
| Create | `apps/org/app/(authenticated)/campaign/_components/campaign-form.tsx` | Client component -- campaign name, goal, product selector |
| Create | `apps/org/app/(authenticated)/campaign/_components/product-selector.tsx` | Client component -- select products for campaign |
| Create | `apps/org/app/(authenticated)/campaign/_lib/schema.ts` | Zod validation schemas |
| Create | `apps/org/app/(authenticated)/_lib/require-org.ts` | `requireOrgId()` tenant auth helper |

---

## Acceptance criteria

### Stripe Connect

- [x] Onboarding page at `/onboarding` shows Stripe Connect status
- [x] "Start onboarding" button calls `POST /api/stripe/connect` and redirects to Stripe
- [x] Return from Stripe (`?stripe_return=1`) refreshes status from DB
- [x] Expired link (`?stripe_refresh=1`) re-initiates onboarding
- [x] When `stripeOnboarding = COMPLETE` + `chargesEnabled` + `payoutsEnabled`: show success + link to campaign
- [x] `account.updated` webhook promotes `Org.status` from `ONBOARDING` to `ACTIVE`
- [x] All data scoped to authenticated org (tenant isolation)

### Campaign

- [x] Campaign page at `/campaign` is gated: require `Org.status = ACTIVE`
- [x] Shows approved roaster's products and variants (only active, non-deleted, available)
- [x] Org admin can select products/variants to include in campaign
- [x] `CampaignItem` records snapshot `retailPrice` and `wholesalePrice` from `ProductVariant`
- [x] Campaign name is required
- [x] `goalCents` is optional (positive int when provided)
- [x] `orgPct` is set from the org's application `desiredOrgPct` (not user-editable at campaign creation)
- [x] Campaign starts in `DRAFT` status
- [x] Activate action: validates at least one `CampaignItem` exists
- [x] Activate action: validates roaster has at least one `RoasterShippingRate`
- [x] On activation: `Campaign.status` transitions to `ACTIVE`
- [x] All campaign mutations scoped to `session.orgId`

---

## Suggested implementation steps (completed)

1. ~~Create `requireOrgId()`~~ at `(authenticated)/_lib/require-org.ts`.
2. Stripe Connect flow: `api/stripe/connect`, onboarding page + components, return/refresh params, `load-root-env.ts`.
3. Webhook `account.updated` for org accounts (charges/payouts/onboarding, promote to `ACTIVE`).
4. Campaign: Zod schema; `saveCampaignDraft` (upsert draft + item snapshots); `activateCampaign` (guards).
5. Campaign form UI: `campaign-form`, `product-selector`.
6. Manual QA: Connect, campaign, activation guards (`pnpm db:smoke:sprint-3` for DB/HTTP smoke).

---

## Handoff notes

- Once `Campaign.status = ACTIVE`, the storefront at `joeperks.com/[slug]` should display the campaign's items (US-04-01).
- The `orgPct` on the `Campaign` record determines the org's share of each sale. It comes from `OrgApplication.desiredOrgPct` and is frozen on the campaign.
- For MVP, one active campaign per org. The UI should handle the case where a campaign already exists (show it for editing rather than creating a new one).
- The org's Stripe Connect `stripeAccountId` is required for payouts. The payout job (`payout-release` in Inngest) transfers `orgAmount` to `org.stripeAccountId` after delivery hold.
- The `requireOrgId()` helper lives at `apps/org/app/(authenticated)/_lib/require-org.ts` for reuse across org portal features.

---

## Revision log

| Version | Date | Notes |
|---------|------|-------|
| 0.1 | 2026-03-30 | Initial story created for Sprint 3 planning. |
| 0.2 | 2026-03-31 | Story marked Done; repo evidence + AC updated to match implementation (`saveCampaignDraft`, `require-org` path, webhook org handling). |

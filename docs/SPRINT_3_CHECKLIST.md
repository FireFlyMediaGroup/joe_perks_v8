# Joe Perks -- Sprint 3 Implementation Checklist

## Org onboarding + buyer storefront -- approval chain, campaign, cart with mobile UX, checkout, shipping guard, legal links

**Version:** 1.0 | **Sprint:** 3 (Weeks 5-6) | **Points:** 46 | **Stories:** 9
**Audience:** AI coding agents, developers implementing Sprint 3 stories
**Companion documents:**
- Sprint overview: [`docs/sprint-3/README.md`](sprint-3/README.md)
- Story documents: [`docs/sprint-3/stories/`](sprint-3/stories/)
- Progress tracker: [`docs/SPRINT_3_PROGRESS.md`](SPRINT_3_PROGRESS.md)
- Sprint 2 baseline: [`docs/SPRINT_2_CHECKLIST.md`](SPRINT_2_CHECKLIST.md)

---

## Prerequisites (from Sprint 2)

Before starting Sprint 3 work, verify these Sprint 2 deliverables are in place:

- [ ] `apps/web/app/[locale]/orgs/apply/` -- Org application form creates `OrgApplication` + `RoasterOrgRequest` records (US-03-01)
- [ ] `apps/admin/app/approvals/roasters/` -- Admin roaster approval queue with approve/reject actions (US-02-02)
- [ ] `apps/roaster/app/(authenticated)/onboarding/` -- Stripe Connect Express onboarding (US-02-03)
- [ ] `apps/roaster/app/(authenticated)/products/` -- Product + variant CRUD with soft deletes (US-02-04)
- [ ] `apps/roaster/app/(authenticated)/settings/shipping/` -- Shipping rate config with default management (US-02-05)
- [ ] `packages/email/templates/` -- Application lifecycle email templates (US-08-06)
- [ ] `packages/types/src/slug-validation.ts` -- Slug validation utilities (US-02-06)
- [ ] `packages/stripe/` -- `calculateSplits()`, `createExpressConnectedAccount()`, `createExpressAccountLink()`, rate limiters
- [ ] `apps/web/app/api/checkout/create-intent/route.ts` -- Checkout API (validates campaign, creates PI + Order)
- [ ] `apps/web/app/api/order-status/route.ts` -- Order lookup by PI ID or order ID
- [ ] `apps/web/app/api/webhooks/stripe/route.ts` -- Handles `account.updated`, `payment_intent.succeeded`
- [ ] `packages/ui/src/store/cart.ts` -- Minimal Zustand cart store (addLine, clear)
- [ ] `packages/email/templates/order-confirmation.tsx` -- Order confirmation email template

---

## Phase 1 -- Admin Org Approval Queue (US-03-02)

> **Why first:** First in the EP-03 dependency chain. Org applications exist from Sprint 2; this builds the admin review surface.

### 1.1 Application list page

- [ ] Update `apps/admin/app/approvals/orgs/page.tsx` -- remove scaffold, add server component querying `OrgApplication`
- [ ] Default filter: `status = PENDING_PLATFORM_REVIEW`
- [ ] Tabs or dropdown for `PENDING_ROASTER_APPROVAL`, `APPROVED`, `REJECTED` views
- [ ] Each row: org name, contact name, email, desired slug, desired org %, submission date, status badge
- [ ] Include `RoasterOrgRequest` info (selected roaster names, priorities)
- [ ] Pagination: `?page=` (1-based), 20 rows per page, Previous/Next + range summary

### 1.2 Application detail

- [ ] Create `apps/admin/app/approvals/orgs/[id]/page.tsx`
- [ ] Shows all submitted fields from the application
- [ ] Shows selected roaster(s) with priority and current request status
- [ ] Shows platform settings bounds for org % (context for admin review)

### 1.3 Approve server action

- [ ] Create `apps/admin/app/approvals/orgs/_actions/approve-application.ts`
- [ ] Validates: application exists, status is `PENDING_PLATFORM_REVIEW`
- [ ] `database.$transaction()`:
  - Update `OrgApplication.status` to `PENDING_ROASTER_APPROVAL`
  - Update primary `RoasterOrgRequest.status` to `PENDING` (should already be, but confirm)
  - Create `MagicLink` with `purpose = ROASTER_REVIEW`, `actorId = roasterId`, `expiresAt = now + 72h`
- [ ] Call `sendEmail()` with roaster review email template (link to `roasters.joeperks.com/org-requests/[token]`)
- [ ] Revalidate page path

### 1.4 Reject server action

- [ ] Create `apps/admin/app/approvals/orgs/_actions/reject-application.ts`
- [ ] Update `OrgApplication.status` to `REJECTED`
- [ ] Call `sendEmail()` with org rejection template
- [ ] Revalidate page path

### 1.5 Email templates

- [ ] Create `packages/email/templates/org-roaster-review.tsx` -- email to roaster with magic link CTA
- [ ] Create `packages/email/templates/org-rejected.tsx` -- email to org applicant on platform rejection

### 1.6 UI components

- [ ] Application list component with table layout
- [ ] Status badges (PENDING_PLATFORM_REVIEW = yellow, PENDING_ROASTER_APPROVAL = blue, APPROVED = green, REJECTED = red)
- [ ] Confirmation dialog before approve/reject
- [ ] Guard: non-PENDING_PLATFORM_REVIEW applications hide approve/reject buttons

### 1.7 Verification

- [ ] Create a test `OrgApplication` via Sprint 2 form or direct DB insert
- [ ] Platform approve --> `OrgApplication.status = PENDING_ROASTER_APPROVAL`, `MagicLink` created, roaster email sent
- [ ] Platform reject --> status updated to `REJECTED`, org email sent
- [ ] Already-processed application --> approve/reject buttons hidden
- [ ] HTTP Basic Auth protects the page (existing middleware)
- [ ] Pagination works with multiple applications

**Reference:** [`docs/sprint-3/stories/US-03-02-admin-org-approval-queue.md`](sprint-3/stories/US-03-02-admin-org-approval-queue.md)
**Diagram:** [`docs/05-approval-chain.mermaid`](05-approval-chain.mermaid) -- OA3, OA4, OA5, OA6

---

## Phase 2 -- Roaster Magic Link Org Review (US-03-03)

> **Depends on:** Magic link created in Phase 1.

### 2.1 Magic link page

- [ ] Create `apps/roaster/app/org-requests/[token]/page.tsx` (server component, NO auth required)
- [ ] Validate token: exists, `purpose = ROASTER_REVIEW`, `expiresAt > now()`, `usedAt IS NULL`
- [ ] Load `RoasterOrgRequest` + `OrgApplication` details from token payload
- [ ] Display org info: name, description, desired slug, desired org %, contact info

### 2.2 Approve server action

- [ ] Create `apps/roaster/app/org-requests/_actions/approve-org.ts`
- [ ] Re-validate token (race condition guard)
- [ ] `database.$transaction()`:
  - Set `MagicLink.usedAt = now()`
  - Update `RoasterOrgRequest.status` to `APPROVED`
  - Update `OrgApplication.status` to `APPROVED`
  - Create `Org` record: `slug = desiredSlug`, `status = ONBOARDING`, `applicationId`, `email`
  - Create `User` record: `role = ORG_ADMIN`, `orgId`, `email`
- [ ] Call `sendEmail()` with org approved template (link to `orgs.joeperks.com`)
- [ ] Show success confirmation

### 2.3 Decline server action

- [ ] Create `apps/roaster/app/org-requests/_actions/decline-org.ts`
- [ ] Re-validate token
- [ ] `database.$transaction()`:
  - Set `MagicLink.usedAt = now()`
  - Update `RoasterOrgRequest.status` to `DECLINED`
  - Check for backup roaster (`priority = 2`): if exists, create new `MagicLink` for backup roaster, send review email
  - If no backup: update `OrgApplication.status` to `REJECTED`, send rejection email to org
- [ ] Show confirmation with appropriate message

### 2.4 Email templates

- [ ] Create `packages/email/templates/org-approved.tsx` -- email to org with login CTA
- [ ] Create `packages/email/templates/org-declined.tsx` -- email to org when all roasters decline

### 2.5 UI components

- [ ] Org details display component
- [ ] Approve/decline buttons with confirmation dialogs
- [ ] Expired/used token error state
- [ ] Success/decline confirmation states

### 2.6 Verification

- [ ] Valid token --> shows org details with approve/decline
- [ ] Approve --> `Org` + `User` created, org receives approval email
- [ ] Decline (with backup) --> backup roaster receives new magic link email
- [ ] Decline (no backup) --> org receives rejection email
- [ ] Expired token --> error message
- [ ] Already-used token --> error message
- [ ] Page accessible WITHOUT authentication

**Reference:** [`docs/sprint-3/stories/US-03-03-roaster-magic-link-org-review.md`](sprint-3/stories/US-03-03-roaster-magic-link-org-review.md)
**Diagram:** [`docs/05-approval-chain.mermaid`](05-approval-chain.mermaid) -- OA7, OA8, OA9, OA10

---

## Phase 3 -- Org Stripe Connect + Campaign Creation (US-03-04)

> **Depends on:** Org record created in Phase 2.

### 3.1 Org Stripe Connect onboarding

- [ ] Update `apps/org/app/(authenticated)/onboarding/page.tsx` -- remove scaffold
- [ ] Create `apps/org/app/api/stripe/connect/route.ts` -- mirrors roaster Connect route
- [ ] Server component: authenticate via Clerk `auth()`, load `User` -> `Org`
- [ ] Create `_components/connect-status.tsx` -- displays Stripe Connect status
- [ ] Create `_components/start-onboarding-button.tsx` -- calls POST /api/stripe/connect
- [ ] Handle `?stripe_return=1` and `?stripe_refresh=1` query params
- [ ] Success state when `stripeOnboarding = COMPLETE` + `chargesEnabled` + `payoutsEnabled`

### 3.2 Webhook update for org Connect

- [ ] Update `apps/web/app/api/webhooks/stripe/route.ts` -- handle `account.updated` for org accounts
- [ ] Promote `Org.status` from `ONBOARDING` to `ACTIVE` when Connect is complete

### 3.3 Campaign creation page

- [ ] Update `apps/org/app/(authenticated)/campaign/page.tsx` -- remove scaffold
- [ ] Server component: load org, approved roaster, roaster's products + variants (active, non-deleted)
- [ ] Gate access: require `Org.status = ACTIVE` (Stripe onboarding complete)

### 3.4 Campaign validation schema

- [ ] Create `apps/org/app/(authenticated)/campaign/_lib/schema.ts`
- [ ] Fields: name (required), goalCents (optional positive int), items array with variantId + retail/wholesale prices

### 3.5 Campaign server actions

- [ ] Create `apps/org/app/(authenticated)/campaign/_actions/campaign-actions.ts`
- [ ] `createCampaign`: validate, scope to `session.orgId`, snapshot prices from `ProductVariant` to `CampaignItem`, set `orgPct` from `Org.application.desiredOrgPct`
- [ ] `updateCampaign`: validate ownership, update name/goal
- [ ] `activateCampaign`: validate at least one `CampaignItem`, at least one shipping rate exists for roaster, transition `status` to `ACTIVE`

### 3.6 Campaign form UI

- [ ] Create `_components/campaign-form.tsx` (client component)
- [ ] Product/variant selection from approved roaster's catalog
- [ ] Price display from `ProductVariant` (snapshots to `CampaignItem` on save)
- [ ] Campaign name and optional goal
- [ ] Activate button with guard checks

### 3.7 Verification

- [ ] Org Stripe Connect flow mirrors roaster flow (start, return, refresh, complete)
- [ ] `account.updated` webhook promotes org to ACTIVE
- [ ] Campaign created with correct `orgPct` and `CampaignItem` price snapshots
- [ ] Campaign activation requires items and roaster shipping rates
- [ ] `Campaign.status = ACTIVE` makes storefront live at `joeperks.com/[slug]`
- [ ] All data scoped to authenticated org (tenant isolation via `session.orgId`)

**Reference:** [`docs/sprint-3/stories/US-03-04-org-stripe-connect-campaign.md`](sprint-3/stories/US-03-04-org-stripe-connect-campaign.md)
**Diagram:** [`docs/05-approval-chain.mermaid`](05-approval-chain.mermaid) -- OA11, OA12, OA13

---

## Phase 4 -- Public Org Storefront (US-04-01)

> **Depends on:** Campaign ACTIVE from Phase 3.

### 4.1 Storefront page

- [ ] Update `apps/web/app/[locale]/[slug]/page.tsx` -- remove scaffold
- [ ] Server component: load `Org` by slug, load active `Campaign` with `CampaignItem`s + `Product` + `ProductVariant`
- [ ] Guard: if org not found or no active campaign, return `notFound()`
- [ ] No authentication required (public page)

### 4.2 Storefront layout

- [ ] Create `apps/web/app/[locale]/[slug]/_components/storefront-layout.tsx`
- [ ] Org branding header (org name, campaign name, goal progress if goalCents set)
- [ ] Responsive layout: mobile-first, adapts to tablet and desktop

### 4.3 Product grid

- [ ] Create `apps/web/app/[locale]/[slug]/_components/product-grid.tsx` (server component)
- [ ] Create `apps/web/app/[locale]/[slug]/_components/product-card.tsx`
- [ ] Display: product image, name, roast level, price from `CampaignItem.retailPrice`, variant options
- [ ] Featured items (`isFeatured`) displayed prominently
- [ ] Filter `Product.deletedAt IS NULL` and `ProductVariant.deletedAt IS NULL` and `isAvailable = true`

### 4.4 Campaign header

- [ ] Create `apps/web/app/[locale]/[slug]/_components/campaign-header.tsx`
- [ ] Org name, campaign name, fundraiser percentage display
- [ ] Goal progress bar if `goalCents` is set (`totalRaised / goalCents`)

### 4.5 Verification

- [ ] Navigate to `joeperks.com/[slug]` with active campaign --> shows product grid
- [ ] Non-existent slug --> 404
- [ ] Org with no active campaign --> 404
- [ ] Products display with `CampaignItem.retailPrice` (not `ProductVariant.retailPrice`)
- [ ] Deleted/unavailable products hidden
- [ ] Mobile responsive with 44x44px touch targets
- [ ] Reserved slugs return 404 (existing guard in scaffold)

**Reference:** [`docs/sprint-3/stories/US-04-01-public-org-storefront.md`](sprint-3/stories/US-04-01-public-org-storefront.md)
**Diagram:** [`docs/01-project-structure.mermaid`](01-project-structure.mermaid)
**Rules:** [`docs/CONVENTIONS.md`](CONVENTIONS.md) -- CampaignItem prices, server component data fetching

---

## Phase 5 -- Order Confirmation Email (US-08-01)

> **Can run in parallel with Phase 4.** Depends only on Sprint 1 email pipeline.

### 5.1 Verify/update email template

- [ ] Review `packages/email/templates/order-confirmation.tsx` -- props match checkout data shape
- [ ] Verify template renders: order number, items with names/quantities/prices, subtotal, shipping, total, org name
- [ ] Confirm `PreviewProps` work in React Email preview

### 5.2 Wire into webhook handler

- [ ] Update `apps/web/app/api/webhooks/stripe/route.ts` -- in `payment_intent.succeeded` handler:
  - Load `Order` with items + campaign + org
  - Call `sendEmail()` with `order-confirmation` template
  - `entityType = 'order'`, `entityId = order.id`, `template = 'order_confirmation'`
- [ ] Ensure `EmailLog` dedup prevents duplicate sends on webhook retry

### 5.3 Verification

- [ ] Complete a test checkout --> buyer receives order confirmation email
- [ ] Email contains correct order number, item details, totals
- [ ] Duplicate webhook events do not send duplicate emails (`EmailLog` dedup)
- [ ] Email renders correctly at mobile widths

**Reference:** [`docs/sprint-3/stories/US-08-01-order-confirmation-email.md`](sprint-3/stories/US-08-01-order-confirmation-email.md)
**Diagram:** [`docs/04-order-lifecycle.mermaid`](04-order-lifecycle.mermaid) -- Phase 2 (sendEmail order_confirmation)

---

## Phase 6 -- Zustand Cart (US-04-02)

> **Depends on:** Storefront product grid from Phase 4.

### 6.1 Expand cart store

- [ ] Update `packages/ui/src/store/cart.ts`:
  - Add `removeLine(campaignItemId: string)` -- remove by campaign item ID
  - Add `updateQuantity(campaignItemId: string, quantity: number)` -- update quantity (remove if 0)
  - Add `lineCount` computed getter -- total number of unique items
  - Add `totalQuantity` computed getter -- sum of all quantities
- [ ] Keep existing `addLine` and `clear` methods
- [ ] Maintain `persist` middleware with `joe-perks-cart` storage key

### 6.2 Cart line metadata

- [ ] Expand `CartLine` type to include display metadata:
  - `productName: string`
  - `variantDesc: string`
  - `retailPrice: number` (cents, from `CampaignItem.retailPrice`)
  - `imageUrl?: string`
- [ ] This data is stored client-side for display only; checkout API re-validates from DB

### 6.3 Add-to-cart button

- [ ] Create `apps/web/app/[locale]/[slug]/_components/add-to-cart-button.tsx` (client component)
- [ ] Uses `useCartStore().addLine()` with campaign item data
- [ ] Visual feedback on add (toast or button state change)
- [ ] Quantity selector if product already in cart

### 6.4 Cart drawer

- [ ] Create `apps/web/app/[locale]/[slug]/_components/cart-drawer.tsx` (client component)
- [ ] Sheet/drawer component: slides from right on desktop, bottom sheet on mobile
- [ ] Shows cart line items with quantity controls (+/- buttons)
- [ ] Shows subtotal (sum of `retailPrice * quantity` for all lines)
- [ ] "Checkout" button linking to `[slug]/checkout`
- [ ] "Clear cart" action
- [ ] Empty cart state

### 6.5 Cart line item component

- [ ] Create `apps/web/app/[locale]/[slug]/_components/cart-line-item.tsx` (client component)
- [ ] Displays: product name, variant description, unit price, quantity controls, line total
- [ ] Remove button per item

### 6.6 Cart trigger

- [ ] Cart icon in storefront header with badge showing `lineCount`
- [ ] Clicking opens cart drawer

### 6.7 Verification

- [ ] Add item --> appears in cart with correct price from `CampaignItem.retailPrice`
- [ ] Update quantity --> subtotal recalculates
- [ ] Remove item --> item disappears from cart
- [ ] Clear cart --> all items removed
- [ ] Cart persists across page refresh (localStorage)
- [ ] Cart badge shows correct count
- [ ] Mobile: bottom sheet UX with 44x44px touch targets

**Reference:** [`docs/sprint-3/stories/US-04-02-zustand-cart.md`](sprint-3/stories/US-04-02-zustand-cart.md)
**Rules:** [`docs/AGENTS.md`](AGENTS.md) -- money-as-cents; [`docs/CONVENTIONS.md`](CONVENTIONS.md) -- client component for cart interaction

---

## Phase 7 -- Three-Step Checkout (US-04-03)

> **Depends on:** Cart from Phase 6. Calls existing `POST /api/checkout/create-intent`.

### 7.1 Checkout page

- [ ] Update `apps/web/app/[locale]/[slug]/checkout/page.tsx` -- remove scaffold
- [ ] Server component: load `Org` by slug, load active `Campaign`, load roaster shipping rates
- [ ] Guard: redirect to storefront if slug invalid or campaign inactive

### 7.2 Checkout validation schema

- [ ] Create `apps/web/app/[locale]/[slug]/checkout/_lib/schema.ts`
- [ ] Shipping form: buyerName (required), buyerEmail (email), address fields (street, city, state, zip)
- [ ] Address is captured client-side for display/future use; `create-intent` API currently takes `buyerEmail`, `buyerName`, `shippingRateId`

### 7.3 Checkout form component

- [ ] Create `apps/web/app/[locale]/[slug]/checkout/_components/checkout-form.tsx` (client component)
- [ ] Three-step navigation with progress indicator
- [ ] Step state management (forward/back, validation before advancement)

### 7.4 Step 1 -- Cart review

- [ ] Create `_components/step-cart-review.tsx`
- [ ] Display cart items from `useCartStore()` with quantities, prices, line totals
- [ ] Subtotal display
- [ ] Allow quantity adjustments
- [ ] Guard: redirect to storefront if cart is empty

### 7.5 Step 2 -- Shipping details

- [ ] Create `_components/step-shipping.tsx`
- [ ] Buyer info: name, email
- [ ] Shipping address: street, city, state, zip (captured for display on confirmation)
- [ ] Shipping rate selection: radio buttons for available `RoasterShippingRate`s
- [ ] Display shipping cost from selected rate
- [ ] Per-step validation before advancement

### 7.6 Step 3 -- Payment

- [ ] Create `_components/step-payment.tsx`
- [ ] Order summary: items + shipping + total
- [ ] Stripe Elements integration (`@stripe/react-stripe-js`, `@stripe/stripe-js`)
- [ ] Load Stripe with `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- [ ] Call `POST /api/checkout/create-intent` to get `clientSecret`
- [ ] Use `PaymentElement` or `CardElement` for payment input
- [ ] Submit: `stripe.confirmPayment()` with `return_url` to `[slug]/order/{PAYMENT_INTENT_ID}`
- [ ] Loading/processing states during payment
- [ ] Error display for declined/failed payments

### 7.7 Stripe Elements setup

- [ ] Add `@stripe/react-stripe-js` and `@stripe/stripe-js` dependencies to `apps/web`
- [ ] Create Stripe Elements provider wrapper
- [ ] Load publishable key from `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

### 7.8 Verification

- [ ] Full checkout flow: review -> shipping -> payment -> redirect to confirmation
- [ ] Cart items sent to `create-intent` match `CampaignItem` IDs + quantities
- [ ] Shipping rate validated server-side (existing API handles this)
- [ ] PaymentIntent created with correct split amounts (existing API)
- [ ] Stripe Elements renders card input
- [ ] Payment confirmation redirects to `/[slug]/order/[pi_id]`
- [ ] Rate limiting works (existing `limitCheckout` in API)
- [ ] Mobile responsive with 44x44px touch targets

**Reference:** [`docs/sprint-3/stories/US-04-03-three-step-checkout.md`](sprint-3/stories/US-04-03-three-step-checkout.md)
**Diagram:** [`docs/04-order-lifecycle.mermaid`](04-order-lifecycle.mermaid) -- Phase 1; [`docs/07-stripe-payment-flow.mermaid`](07-stripe-payment-flow.mermaid) -- Charge
**Rules:** [`docs/AGENTS.md`](AGENTS.md) -- money-as-cents, split calculations, Stripe singleton; [`docs/CONVENTIONS.md`](CONVENTIONS.md) -- CampaignItem prices

---

## Phase 8 -- Order Confirmation Page (US-04-04)

> **Depends on:** Checkout completing and redirecting from Phase 7.

### 8.1 Confirmation page

- [ ] Update `apps/web/app/[locale]/[slug]/order/[pi_id]/page.tsx` -- remove scaffold
- [ ] Server component: initial load queries order by `stripePiId`
- [ ] If order exists and status >= CONFIRMED, render full confirmation
- [ ] If order PENDING, render loading/polling state

### 8.2 Order status poller

- [ ] Create `_components/order-status-poller.tsx` (client component)
- [ ] Poll `GET /api/order-status?pi=[pi_id]` every 2 seconds while status = PENDING
- [ ] Transition to confirmed view when status changes to CONFIRMED
- [ ] Stop polling after confirmation or after timeout (30 seconds)
- [ ] Show spinner/loading animation during polling

### 8.3 Order summary component

- [ ] Create `_components/order-summary.tsx`
- [ ] Display: order number, items with quantities/prices, subtotal, shipping, total
- [ ] Display: fundraiser contribution amount (`orgAmount`) and percentage
- [ ] Success messaging: "Your order supports [org name]!"

### 8.4 Verification

- [ ] After checkout --> redirect to confirmation page, see polling state
- [ ] After `payment_intent.succeeded` webhook fires --> page transitions to confirmed
- [ ] Order number displayed (generated in webhook handler)
- [ ] Items, prices, totals match checkout
- [ ] Fundraiser contribution shown
- [ ] Page works even if webhook fires before page loads (no polling needed)

**Reference:** [`docs/sprint-3/stories/US-04-04-order-confirmation-page.md`](sprint-3/stories/US-04-04-order-confirmation-page.md)
**Diagram:** [`docs/08-order-state-machine.mermaid`](08-order-state-machine.mermaid) -- PENDING to CONFIRMED

---

## Phase 9 -- Shipping Rate Availability Guard (US-04-05)

> **Low priority (2 pts).** Can run in parallel with Phases 7-8.

### 9.1 Storefront guard

- [ ] In storefront page data loading, check if the campaign's roaster has any `RoasterShippingRate` records
- [ ] If no shipping rates: display a banner/notice that the store is temporarily unavailable for purchases
- [ ] Hide or disable add-to-cart buttons when no shipping rates exist

### 9.2 Checkout guard

- [ ] In checkout page server component, verify roaster has shipping rates
- [ ] If no rates available: redirect to storefront with error message
- [ ] In `create-intent` API: existing validation already returns 400 for invalid shipping rate

### 9.3 Verification

- [ ] Storefront with shipping rates --> normal product grid with working add-to-cart
- [ ] Storefront without shipping rates --> unavailability banner, disabled add-to-cart
- [ ] Checkout attempted without shipping rates --> redirect with error

**Reference:** [`docs/sprint-3/stories/US-04-05-shipping-rate-guard.md`](sprint-3/stories/US-04-05-shipping-rate-guard.md)

---

## Cross-cutting concerns

### New email templates (Sprint 3)

| Template | Story | Props | Purpose |
|----------|-------|-------|---------|
| `org-roaster-review` | US-03-02 | `orgName`, `contactName`, `description`, `reviewUrl` | Email to roaster with magic link to review org |
| `org-rejected` | US-03-02 | `orgName`, `contactName` | Platform rejection email to org applicant |
| `org-approved` | US-03-03 | `orgName`, `contactName`, `loginUrl` | Org approved, login to org portal CTA |
| `org-declined` | US-03-03 | `orgName`, `contactName` | All roasters declined, org notified |

### New dependencies (Sprint 3)

| Package | App | Story | Purpose |
|---------|-----|-------|---------|
| `@stripe/react-stripe-js` | `apps/web` | US-04-03 | Stripe Elements React bindings |
| `@stripe/stripe-js` | `apps/web` | US-04-03 | Stripe.js browser SDK |

### Document synchronization

After completing each phase, verify alignment with these documents:

| Document | Action |
|----------|--------|
| [`docs/SPRINT_3_PROGRESS.md`](SPRINT_3_PROGRESS.md) | Update status for the completed story |
| [`docs/01-project-structure.mermaid`](01-project-structure.mermaid) | Add any new routes or files created |
| [`docs/05-approval-chain.mermaid`](05-approval-chain.mermaid) | Verify org approval flow matches OA3-OA13 |
| [`docs/06-database-schema.mermaid`](06-database-schema.mermaid) | Verify model usage aligns with ERD |
| [`docs/SCAFFOLD_PROGRESS.md`](SCAFFOLD_PROGRESS.md) | Update status for cart, storefront, checkout rows |
| [`docs/AGENTS.md`](AGENTS.md) | No changes expected unless new patterns introduced |
| [`docs/CONVENTIONS.md`](CONVENTIONS.md) | Add new conventions discovered during implementation (e.g. org portal patterns) |

### AGENTS.md rules checklist (apply to every story)

- [ ] Money values stored as `Int` cents -- never floats
- [ ] Split calculations use `calculateSplits()` from `@joe-perks/stripe`
- [ ] `CampaignItem.retailPrice` used for storefront/checkout -- never `ProductVariant.retailPrice`
- [ ] Tenant isolation: org queries scoped by `session.orgId`, roaster by `session.roasterId`
- [ ] Soft deletes: `Product`/`ProductVariant` queries filter `deletedAt IS NULL`
- [ ] Email: `sendEmail()` from `@joe-perks/email` -- never import Resend directly
- [ ] Stripe: `@joe-perks/stripe` -- never import Stripe SDK in apps
- [ ] Magic links: token validation per AGENTS.md rules (exists, not expired, not used, correct purpose)
- [ ] Logging: no PII logged -- only IDs and event types
- [ ] Webhook idempotency: check `StripeEvent` before processing

### Testing commands

```bash
pnpm dev                    # Start all apps
pnpm typecheck              # Type-check all packages
pnpm check                  # Lint + format (Ultracite)
pnpm build                  # Build all apps (CI equivalent)

# Stripe local testing
stripe listen --forward-to localhost:3000/api/webhooks/stripe
stripe trigger payment_intent.succeeded
stripe trigger account.updated

# Email preview
# http://localhost:3004 (React Email preview app)
```

---

## Quick reference -- Story-to-file mapping

| Story    | Phase | Key files |
|----------|-------|-----------|
| US-03-02 | 1 | `apps/admin/app/approvals/orgs/` (page, [id], _actions, _components, _lib), `packages/email/templates/org-roaster-review.tsx`, `org-rejected.tsx` |
| US-03-03 | 2 | `apps/roaster/app/org-requests/[token]/` (page, _actions, _components), `packages/email/templates/org-approved.tsx`, `org-declined.tsx` |
| US-03-04 | 3 | `apps/org/app/(authenticated)/onboarding/` (page, _components), `apps/org/app/(authenticated)/campaign/` (page, _actions, _components, _lib), `apps/org/app/api/stripe/connect/route.ts` |
| US-04-01 | 4 | `apps/web/app/[locale]/[slug]/page.tsx`, `_components/storefront-layout.tsx`, `product-grid.tsx`, `product-card.tsx`, `campaign-header.tsx` |
| US-08-01 | 5 | `packages/email/templates/order-confirmation.tsx`, `apps/web/app/api/webhooks/stripe/route.ts` |
| US-04-02 | 6 | `packages/ui/src/store/cart.ts`, `apps/web/app/[locale]/[slug]/_components/cart-drawer.tsx`, `cart-line-item.tsx`, `add-to-cart-button.tsx` |
| US-04-03 | 7 | `apps/web/app/[locale]/[slug]/checkout/` (page, _components/checkout-form, step-cart-review, step-shipping, step-payment, _lib/schema) |
| US-04-04 | 8 | `apps/web/app/[locale]/[slug]/order/[pi_id]/page.tsx`, `_components/order-status-poller.tsx`, `order-summary.tsx` |
| US-04-05 | 9 | `apps/web/app/[locale]/[slug]/_components/shipping-guard.tsx`, checkout page validation |

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

Before starting Sprint 3 work, verify these Sprint 2 deliverables are in place (all are implemented on `main`):

- [x] `apps/web/app/[locale]/orgs/apply/` -- Org application form creates `OrgApplication` + `RoasterOrgRequest` records (US-03-01)
- [x] `apps/admin/app/approvals/roasters/` -- Admin roaster approval queue with approve/reject actions (US-02-02)
- [x] `apps/roaster/app/(authenticated)/onboarding/` -- Stripe Connect Express onboarding (US-02-03)
- [x] `apps/roaster/app/(authenticated)/products/` -- Product + variant CRUD with soft deletes (US-02-04)
- [x] `apps/roaster/app/(authenticated)/settings/shipping/` -- Shipping rate config with default management (US-02-05)
- [x] `packages/email/templates/` -- Application lifecycle email templates (US-08-06)
- [x] `packages/types/src/slug-validation.ts` -- Slug validation utilities (US-02-06)
- [x] `packages/stripe/` -- `calculateSplits()`, `createExpressConnectedAccount()`, `createExpressAccountLink()`, rate limiters
- [x] `apps/web/app/api/checkout/create-intent/route.ts` -- Checkout API (validates campaign, creates PI + Order; response includes `clientSecret`, `paymentIntentId`, `grossAmount`, …)
- [x] `apps/web/app/api/order-status/route.ts` -- Order lookup by PI ID or order ID (includes `orgName` for confirmation UI)
- [x] `apps/web/app/api/webhooks/stripe/route.ts` -- Handles `account.updated`, `payment_intent.succeeded` (order confirmation email to buyer)
- [x] `packages/ui/src/store/cart.ts` -- Zustand cart store (full Sprint 3 cart; `addLine`, `clear`, …)
- [x] `packages/email/templates/order-confirmation.tsx` -- Order confirmation email template (wired via webhook)

---

## Phase 1 -- Admin Org Approval Queue (US-03-02)

> **Why first:** First in the EP-03 dependency chain. Org applications exist from Sprint 2; this builds the admin review surface.

### 1.1 Application list page

- [x] Update `apps/admin/app/approvals/orgs/page.tsx` -- remove scaffold, add server component querying `OrgApplication`
- [x] Default filter: `status = PENDING_PLATFORM_REVIEW`
- [x] Tabs or dropdown for `PENDING_ROASTER_APPROVAL`, `APPROVED`, `REJECTED` views
- [x] Each row: org name, contact name, email, desired slug, desired org %, submission date, status badge
- [x] Include `RoasterOrgRequest` info (selected roaster names, priorities)
- [x] Pagination: `?page=` (1-based), 20 rows per page, Previous/Next + range summary

### 1.2 Application detail

- [x] Create `apps/admin/app/approvals/orgs/[id]/page.tsx`
- [x] Shows all submitted fields from the application
- [x] Shows selected roaster(s) with priority and current request status
- [x] Shows platform settings bounds for org % (context for admin review)

### 1.3 Approve server action

- [x] Create `apps/admin/app/approvals/orgs/_actions/approve-application.ts`
- [x] Validates: application exists, status is `PENDING_PLATFORM_REVIEW`
- [x] `database.$transaction()`:
  - Update `OrgApplication.status` to `PENDING_ROASTER_APPROVAL`
  - Update primary `RoasterOrgRequest.status` to `PENDING` (should already be, but confirm)
  - Create `MagicLink` with `purpose = ROASTER_REVIEW`, `actorId = roasterId`, `expiresAt = now + 72h`
- [x] Call `sendEmail()` with roaster review email template (link to `roasters.joeperks.com/org-requests/[token]`)
- [x] Revalidate page path

### 1.4 Reject server action

- [x] Create `apps/admin/app/approvals/orgs/_actions/reject-application.ts`
- [x] Update `OrgApplication.status` to `REJECTED`
- [x] Call `sendEmail()` with org rejection template
- [x] Revalidate page path

### 1.5 Email templates

- [x] Create `packages/email/templates/org-roaster-review.tsx` -- email to roaster with magic link CTA
- [x] Create `packages/email/templates/org-rejected.tsx` -- email to org applicant on platform rejection

### 1.6 UI components

- [x] Application list component with table layout
- [x] Status badges (PENDING_PLATFORM_REVIEW = yellow, PENDING_ROASTER_APPROVAL = blue, APPROVED = green, REJECTED = red)
- [x] Confirmation dialog before approve/reject
- [x] Guard: non-PENDING_PLATFORM_REVIEW applications hide approve/reject buttons

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

- [x] Create `apps/roaster/app/org-requests/[token]/page.tsx` (server component, NO auth required)
- [x] Validate token: exists, `purpose = ROASTER_REVIEW`, `expiresAt > now()`, `usedAt IS NULL`
- [x] Load `RoasterOrgRequest` + `OrgApplication` details from token payload
- [x] Display org info: name, description, desired slug, desired org %, contact info

### 2.2 Approve server action

- [x] Create `apps/roaster/app/org-requests/_actions/approve-org.ts`
- [x] Re-validate token (race condition guard)
- [x] `database.$transaction()`:
  - Set `MagicLink.usedAt = now()`
  - Update `RoasterOrgRequest.status` to `APPROVED`
  - Update `OrgApplication.status` to `APPROVED`
  - Create `Org` record: `slug = desiredSlug`, `status = ONBOARDING`, `applicationId`, `email`
  - Create `User` record: `role = ORG_ADMIN`, `orgId`, `email`
- [x] Call `sendEmail()` with org approved template (link to `orgs.joeperks.com`)
- [x] Show success confirmation

### 2.3 Decline server action

- [x] Create `apps/roaster/app/org-requests/_actions/decline-org.ts`
- [x] Re-validate token
- [x] `database.$transaction()`:
  - Set `MagicLink.usedAt = now()`
  - Update `RoasterOrgRequest.status` to `DECLINED`
  - Check for backup roaster (`priority = 2`): if exists, create new `MagicLink` for backup roaster, send review email
  - If no backup: update `OrgApplication.status` to `REJECTED`, send rejection email to org
- [x] Show confirmation with appropriate message

### 2.4 Email templates

- [x] Create `packages/email/templates/org-approved.tsx` -- email to org with login CTA
- [x] Create `packages/email/templates/org-declined.tsx` -- email to org when all roasters decline

### 2.5 UI components

- [x] Org details display component
- [x] Approve/decline buttons with confirmation dialogs
- [x] Expired/used token error state
- [x] Success/decline confirmation states

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

- [x] Update `apps/org/app/(authenticated)/onboarding/page.tsx` -- remove scaffold
- [x] Create `apps/org/app/api/stripe/connect/route.ts` -- mirrors roaster Connect route
- [x] Server component: authenticate via Clerk `auth()`, load `User` -> `Org`
- [x] Create `_components/connect-status.tsx` -- displays Stripe Connect status
- [x] Create `_components/start-onboarding-button.tsx` -- calls POST /api/stripe/connect
- [x] Handle `?stripe_return=1` and `?stripe_refresh=1` query params
- [x] Success state when `stripeOnboarding = COMPLETE` + `chargesEnabled` + `payoutsEnabled`

### 3.2 Webhook update for org Connect

- [x] Update `apps/web/app/api/webhooks/stripe/route.ts` -- handle `account.updated` for org accounts
- [x] Promote `Org.status` from `ONBOARDING` to `ACTIVE` when Connect is complete

### 3.3 Campaign creation page

- [x] Update `apps/org/app/(authenticated)/campaign/page.tsx` -- remove scaffold
- [x] Server component: load org, approved roaster, roaster's products + variants (active, non-deleted)
- [x] Gate access: require `Org.status = ACTIVE` (Stripe onboarding complete)

### 3.4 Campaign validation schema

- [x] Create `apps/org/app/(authenticated)/campaign/_lib/schema.ts`
- [x] Fields: name (required), goalCents (optional positive int), items array with variantId + retail/wholesale prices

### 3.5 Campaign server actions

- [x] Create `apps/org/app/(authenticated)/campaign/_actions/campaign-actions.ts`
- [x] `saveCampaignDraft`: validate, scope to `session.orgId`, snapshot prices from `ProductVariant` to `CampaignItem`, set `orgPct` from `Org.application.desiredOrgPct` (replaces separate create/update for draft)
- [x] `activateCampaign`: validate at least one `CampaignItem`, at least one shipping rate exists for roaster, transition `status` to `ACTIVE`

### 3.6 Campaign form UI

- [x] Create `_components/campaign-form.tsx` (client component)
- [x] Product/variant selection from approved roaster's catalog
- [x] Price display from `ProductVariant` (snapshots to `CampaignItem` on save)
- [x] Campaign name and optional goal
- [x] Activate button with guard checks

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

- [x] Update `apps/web/app/[locale]/[slug]/page.tsx` -- remove scaffold
- [x] Server component: load `Org` by slug, load active `Campaign` with `CampaignItem`s + `Product` + `ProductVariant`
- [x] Guard: if org not found or no active campaign, return `notFound()`
- [x] No authentication required (public page)
- [x] `_lib/queries.ts`: `getStorefrontData` returns `splitPreviewDefaults` (PlatformSettings + default roaster shipping rate) for **US-04-02** cart estimate — see Phase 6.8

### 4.2 Storefront layout

- [x] Create `apps/web/app/[locale]/[slug]/_components/storefront-layout.tsx`
- [x] Org branding header (org name, campaign name, goal progress if goalCents set)
- [x] Responsive layout: mobile-first, adapts to tablet and desktop

### 4.3 Product grid

- [x] Create `apps/web/app/[locale]/[slug]/_components/product-grid.tsx` (server component)
- [x] Create `apps/web/app/[locale]/[slug]/_components/product-card.tsx`
- [x] Display: product image, name, roast level, price from `CampaignItem.retailPrice`, variant options
- [x] Featured items (`isFeatured`) displayed prominently
- [x] Filter `Product.deletedAt IS NULL` and `ProductVariant.deletedAt IS NULL` and `isAvailable = true`

### 4.4 Campaign header

- [x] Create `apps/web/app/[locale]/[slug]/_components/campaign-header.tsx`
- [x] Org name, campaign name, fundraiser percentage display
- [x] Goal progress bar if `goalCents` is set (`totalRaised / goalCents`)

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

- [x] Review `packages/email/templates/order-confirmation.tsx` -- props match checkout data shape
- [x] Verify template renders: order number, items with names/quantities/prices, subtotal, shipping, total, org name
- [x] Confirm `PreviewProps` work in React Email preview

### 5.2 Wire into webhook handler

- [x] Update `apps/web/app/api/webhooks/stripe/route.ts` -- in `payment_intent.succeeded` handler:
  - Load `Order` with items + campaign + org
  - Call `sendEmail()` with `order-confirmation` template
  - `entityType = 'order'`, `entityId = order.id`, `template = 'order_confirmation'`
- [x] Ensure `EmailLog` dedup prevents duplicate sends on webhook retry

### 5.3 Verification

- [x] Complete a test checkout --> buyer receives order confirmation email
- [x] Email contains correct order number, item details, totals
- [x] Duplicate webhook events do not send duplicate emails (`EmailLog` dedup)
- [x] Email renders correctly at mobile widths

**Reference:** [`docs/sprint-3/stories/US-08-01-order-confirmation-email.md`](sprint-3/stories/US-08-01-order-confirmation-email.md)
**Diagram:** [`docs/04-order-lifecycle.mermaid`](04-order-lifecycle.mermaid) -- Phase 2 (sendEmail order_confirmation)

---

## Phase 6 -- Zustand Cart (US-04-02)

> **Depends on:** Storefront product grid from Phase 4.

### 6.1 Expand cart store

- [x] Update `packages/ui/src/store/cart.ts`:
  - Add `removeLine(campaignItemId: string)` -- remove by campaign item ID
  - Add `updateQuantity(campaignItemId: string, quantity: number)` -- update quantity (remove if 0)
  - Add `lineCount` computed getter -- total number of unique items
  - Add `totalQuantity` computed getter -- sum of all quantities
- [x] Keep existing `addLine` and `clear` methods (`addLine` takes `AddLineContext` + line; switches campaign when `campaignId` changes)
- [x] Maintain `persist` middleware with `joe-perks-cart` storage key

### 6.2 Cart line metadata

- [x] Expand `CartLine` type to include display metadata:
  - `productName: string`
  - `variantDesc: string`
  - `retailPrice: number` (cents, from `CampaignItem.retailPrice`)
  - `imageUrl?: string`
- [x] This data is stored client-side for display only; checkout API re-validates from DB

### 6.3 Add-to-cart button

- [x] Create `apps/web/app/[locale]/[slug]/_components/add-to-cart-button.tsx` (client component)
- [x] Uses `useCartStore().addLine()` with campaign item data
- [x] Visual feedback on add (toast or button state change)
- [x] Quantity selector if product already in cart

### 6.4 Cart drawer

- [x] Create `apps/web/app/[locale]/[slug]/_components/cart-drawer.tsx` (client component)
- [x] Sheet/drawer component: slides from right on desktop, bottom sheet on mobile
- [x] Shows cart line items with quantity controls (+/- buttons)
- [x] Shows subtotal (sum of `retailPrice * quantity` for all lines)
- [x] "Checkout" button linking to `[slug]/checkout`
- [x] "Clear cart" action
- [x] Empty cart state

### 6.5 Cart line item component

- [x] Create `apps/web/app/[locale]/[slug]/_components/cart-line-item.tsx` (client component)
- [x] Displays: product name, variant description, unit price, quantity controls, line total
- [x] Remove button per item

### 6.6 Cart trigger

- [x] Cart icon in storefront header with badge showing `lineCount`
- [x] Clicking opens cart drawer

### 6.7 Verification

- [x] Add item --> appears in cart with correct price from `CampaignItem.retailPrice`
- [x] Update quantity --> subtotal recalculates
- [x] Remove item --> item disappears from cart
- [x] Clear cart --> all items removed
- [x] Cart persists across page refresh (localStorage)
- [x] Cart badge shows correct count
- [x] Mobile: bottom sheet UX with 44x44px touch targets

### 6.8 Split estimate in cart (shipped with US-04-02)

- [x] `getStorefrontData` returns `splitPreviewDefaults` (`PlatformSettings` + default `RoasterShippingRate` for the campaign roaster)
- [x] Cart drawer shows estimated coffee subtotal, shipping (default rate or "At checkout"), estimated fundraiser amount for org, estimated total — using `calculateSplits()` imported from **`@joe-perks/stripe/splits`** (do **not** import the main `@joe-perks/stripe` barrel in client components; it pulls `server-only` modules)

**Reference:** [`docs/sprint-3/stories/US-04-02-zustand-cart.md`](sprint-3/stories/US-04-02-zustand-cart.md)
**Rules:** [`docs/AGENTS.md`](AGENTS.md) -- money-as-cents; [`docs/CONVENTIONS.md`](CONVENTIONS.md) -- client component for cart interaction

---

## Phase 7 -- Three-Step Checkout (US-04-03)

> **Depends on:** Cart from Phase 6. Calls existing `POST /api/checkout/create-intent`.

### 7.1 Checkout page

- [x] Update `apps/web/app/[locale]/[slug]/checkout/page.tsx` -- remove scaffold
- [x] Server component: load `Org` by slug, load active `Campaign`, load roaster shipping rates
- [x] Guard: redirect to storefront if slug invalid or campaign inactive

### 7.2 Checkout validation schema

- [x] Create `apps/web/app/[locale]/[slug]/checkout/_lib/schema.ts`
- [x] Shipping form: buyerName (required), buyerEmail (email), address fields (street, city, state, zip)
- [x] Address is captured client-side for display/future use; `create-intent` API currently takes `buyerEmail`, `buyerName`, `shippingRateId`

### 7.3 Checkout form component

- [x] Create `apps/web/app/[locale]/[slug]/checkout/_components/checkout-form.tsx` (client component)
- [x] Three-step navigation with progress indicator
- [x] Step state management (forward/back, validation before advancement)

### 7.4 Step 1 -- Cart review

- [x] Create `_components/step-cart-review.tsx`
- [x] Display cart items from `useCartStore()` with quantities, prices, line totals
- [x] Subtotal display
- [x] Allow quantity adjustments
- [x] Guard: redirect to storefront if cart is empty

### 7.5 Step 2 -- Shipping details

- [x] Create `_components/step-shipping.tsx`
- [x] Buyer info: name, email
- [x] Shipping address: street, city, state, zip (captured for display on confirmation)
- [x] Shipping rate selection: radio buttons for available `RoasterShippingRate`s
- [x] Display shipping cost from selected rate
- [x] Per-step validation before advancement

### 7.6 Step 3 -- Payment

- [x] Create `_components/step-payment.tsx`
- [x] Order summary: items + shipping + total
- [x] Stripe Elements integration (`@stripe/react-stripe-js`, `@stripe/stripe-js`)
- [x] Load Stripe with `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- [x] Call `POST /api/checkout/create-intent` to get `clientSecret`
- [x] Use `PaymentElement` or `CardElement` for payment input
- [x] Submit: `stripe.confirmPayment()` with `return_url` to `[slug]/order/{PAYMENT_INTENT_ID}`
- [x] Loading/processing states during payment
- [x] Error display for declined/failed payments

### 7.7 Stripe Elements setup

- [x] Add `@stripe/react-stripe-js` and `@stripe/stripe-js` dependencies to `apps/web`
- [x] Create Stripe Elements provider wrapper
- [x] Load publishable key from `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

### 7.8 Verification

- [x] Full checkout flow: review -> shipping -> payment -> redirect to confirmation
- [x] Cart items sent to `create-intent` match `CampaignItem` IDs + quantities
- [x] Shipping rate validated server-side (existing API handles this)
- [x] PaymentIntent created with correct split amounts (existing API)
- [x] Stripe Elements renders card input
- [x] Payment confirmation redirects to `/[slug]/order/[pi_id]`
- [x] Rate limiting works (existing `limitCheckout` in API)
- [x] Mobile responsive with 44x44px touch targets

**Reference:** [`docs/sprint-3/stories/US-04-03-three-step-checkout.md`](sprint-3/stories/US-04-03-three-step-checkout.md)
**Diagram:** [`docs/04-order-lifecycle.mermaid`](04-order-lifecycle.mermaid) -- Phase 1; [`docs/07-stripe-payment-flow.mermaid`](07-stripe-payment-flow.mermaid) -- Charge
**Rules:** [`docs/AGENTS.md`](AGENTS.md) -- money-as-cents, split calculations, Stripe singleton; [`docs/CONVENTIONS.md`](CONVENTIONS.md) -- CampaignItem prices

---

## Phase 8 -- Order Confirmation Page (US-04-04)

> **Depends on:** Checkout completing and redirecting from Phase 7.

### 8.1 Confirmation page

- [x] Update `apps/web/app/[locale]/[slug]/order/[pi_id]/page.tsx` -- remove scaffold
- [x] Server component: initial load queries order by `stripePiId`
- [x] If order exists and status >= CONFIRMED, render full confirmation
- [x] If order PENDING, render loading/polling state

### 8.2 Order status poller

- [x] Create `_components/order-status-poller.tsx` (client component)
- [x] Poll `GET /api/order-status?pi=[pi_id]` every 2 seconds while status = PENDING
- [x] Transition to confirmed view when status changes to CONFIRMED
- [x] Stop polling after confirmation or after timeout (30 seconds)
- [x] Show spinner/loading animation during polling

### 8.3 Order summary component

- [x] Create `_components/order-summary.tsx`
- [x] Display: order number, items with quantities/prices, subtotal, shipping, total
- [x] Display: fundraiser contribution amount (`orgAmount`) and percentage
- [x] Success messaging: "Your order supports [org name]!"

### 8.4 Verification

- [x] After checkout --> redirect to confirmation page, see polling state
- [x] After `payment_intent.succeeded` webhook fires --> page transitions to confirmed
- [x] Order number displayed (generated in webhook handler)
- [x] Items, prices, totals match checkout
- [x] Fundraiser contribution shown
- [x] Page works even if webhook fires before page loads (no polling needed)

**Reference:** [`docs/sprint-3/stories/US-04-04-order-confirmation-page.md`](sprint-3/stories/US-04-04-order-confirmation-page.md)
**Diagram:** [`docs/08-order-state-machine.mermaid`](08-order-state-machine.mermaid) -- PENDING to CONFIRMED

---

## Phase 9 -- Shipping Rate Availability Guard (US-04-05)

> **Low priority (2 pts).** Can run in parallel with Phases 7-8.

### 9.1 Storefront guard

- [x] In storefront page data loading, check if the campaign's roaster has any `RoasterShippingRate` records
- [x] If no shipping rates: display a banner/notice that the store is temporarily unavailable for purchases
- [x] Hide or disable add-to-cart buttons when no shipping rates exist

### 9.2 Checkout guard

- [x] In checkout page server component, verify roaster has shipping rates
- [x] If no rates available: redirect to storefront with error message
- [x] In `create-intent` API: existing validation already returns 400 for invalid shipping rate

### 9.3 Verification

- [x] Storefront with shipping rates --> normal product grid with working add-to-cart
- [x] Storefront without shipping rates --> unavailability banner, disabled add-to-cart
- [x] Checkout attempted without shipping rates --> redirect with error

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
| `@stripe/react-stripe-js` | `apps/web` | US-04-03 | Stripe Elements React bindings (added) |
| `@stripe/stripe-js` | `apps/web` | US-04-03 | Stripe.js browser SDK (added) |

### Document synchronization

After completing each phase, verify alignment with these documents:

| Document | Action |
|----------|--------|
| [`docs/SPRINT_3_PROGRESS.md`](SPRINT_3_PROGRESS.md) | Update status for the completed story |
| [`docs/01-project-structure.mermaid`](01-project-structure.mermaid) | Add any new routes or files created |
| [`docs/05-approval-chain.mermaid`](05-approval-chain.mermaid) | Verify org approval flow matches OA3-OA13 |
| [`docs/06-database-schema.mermaid`](06-database-schema.mermaid) | Verify model usage aligns with ERD |
| [`docs/SCAFFOLD_PROGRESS.md`](SCAFFOLD_PROGRESS.md) | Update status for cart, storefront, checkout rows |
| [`docs/AGENTS.md`](AGENTS.md) | Update when new platform rules (e.g. `@joe-perks/stripe/splits` for client) |
| [`docs/CONVENTIONS.md`](CONVENTIONS.md) | Add new conventions discovered during implementation (e.g. org portal patterns) |

### AGENTS.md rules checklist (apply to every story)

- [x] Money values stored as `Int` cents -- never floats
- [x] Split calculations use `calculateSplits()` — server/API from `@joe-perks/stripe`; client UI from `@joe-perks/stripe/splits` only
- [x] `CampaignItem.retailPrice` used for storefront/checkout -- never `ProductVariant.retailPrice`
- [x] Tenant isolation: org queries scoped by `session.orgId`, roaster by `session.roasterId`
- [x] Soft deletes: `Product`/`ProductVariant` queries filter `deletedAt IS NULL`
- [x] Email: `sendEmail()` from `@joe-perks/email` -- never import Resend directly
- [x] Stripe: `@joe-perks/stripe` -- never import Stripe SDK in apps (buyer UI uses `@stripe/stripe-js` / `@stripe/react-stripe-js` only)
- [x] Magic links: token validation per AGENTS.md rules (exists, not expired, not used, correct purpose)
- [x] Logging: no PII logged -- only IDs and event types
- [x] Webhook idempotency: check `StripeEvent` before processing

### Testing commands

```bash
pnpm dev                    # Start all apps
pnpm typecheck              # Type-check all packages
pnpm check                  # Lint + format (Ultracite)
pnpm build                  # Build all apps (CI equivalent)

# DB / Sprint 3 smoke (requires DATABASE_URL in packages/db/.env)
pnpm db:smoke               # Singletons + recent migrations
pnpm db:smoke:sprint-3      # EP-03 migration, Org/Campaign invariants, optional HTTP probes
pnpm db:smoke:us-04-01      # Storefront Prisma path (incl. splitPreviewDefaults mirror) + optional HTTP guards (127.0.0.1:3000; skip on refused / 5xx)
pnpm db:smoke:us-03-02      # Admin org queue + MagicLink structure (deeper US-03-02 checks)

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
| US-04-01 | 4 | `apps/web/app/[locale]/[slug]/page.tsx`, `_lib/queries.ts`, `_lib/format.ts`, `_components/storefront-layout.tsx`, `product-grid.tsx`, `product-card.tsx`, `campaign-header.tsx`; `packages/db/scripts/smoke-us-04-01-storefront.ts` |
| US-08-01 | 5 | `packages/email/templates/order-confirmation.tsx`, `apps/web/app/api/webhooks/stripe/route.ts` |
| US-04-02 | 6 | `packages/ui/src/store/cart.ts`, `apps/web/app/[locale]/[slug]/_components/cart-drawer.tsx`, `cart-line-item.tsx`, `add-to-cart-button.tsx` |
| US-04-03 | 7 | `apps/web/app/[locale]/[slug]/checkout/` (page, _components/checkout-form, step-cart-review, step-shipping, step-payment, _lib/schema) |
| US-04-04 | 8 | `apps/web/app/[locale]/[slug]/order/[pi_id]/page.tsx`, `_components/order-status-poller.tsx`, `order-summary.tsx` |
| US-04-05 | 9 | `apps/web/app/[locale]/[slug]/_components/shipping-guard.tsx`, checkout page validation |

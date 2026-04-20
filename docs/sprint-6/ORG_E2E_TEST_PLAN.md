# Sprint 6 — Org Workflow E2E Test Plan

**Version:** 1.0
**Date:** April 1, 2026
**Apps under test:**
- `apps/web` at `http://localhost:3000` (marketing + storefront + checkout)
- `apps/admin` at `http://localhost:3003` (platform admin)
- `apps/roaster` at `http://localhost:3001` (roaster magic-link review)
- `apps/org` at `http://localhost:3002` (org dashboard)
**Source specs:** `docs/AGENTS.md`, `docs/sprint-3/stories/US-03-*.md`, `docs/sprint-6/README.md`

---

## How to Use This Document

This test plan covers the **full org lifecycle** end-to-end, from application submission through storefront checkout. It spans four apps and requires database seeding and Clerk auth configuration.

Tests are grouped into **eight phases** (A–H), each building on the previous. Run them in order for the first pass; individual phases can be re-run in isolation once seed data exists.

**Pass criteria:** A test passes when every checkbox under it is checked. Mark any failures with a note describing the deviation.

---

## Phase A: Prerequisites & Seeding

### T-00: Environment Setup

#### Dev Servers

- [ ] `pnpm dev` running from repo root (starts web:3000, roaster:3001, org:3002, admin:3003)
- [ ] All four apps respond (no `EADDRINUSE` errors)

#### Database Seeding

Run the seed scripts in order from `packages/db/`:

```bash
# 1. Ensure singletons exist
bunx prisma db seed

# 2. Seed the E2E roaster (products, variants, shipping rates)
bun run ./scripts/seed-e2e-roaster.ts

# 3. Seed the E2E org (application, org, campaign, items)
bun run ./scripts/seed-e2e-org.ts
```

- [ ] `seed-e2e-roaster.ts` completes without errors
- [ ] `seed-e2e-org.ts` completes without errors
- [ ] Note the **Org ID** printed in the output (needed for Clerk setup)
- [ ] Note the **User ID** printed in the output

#### Clerk Auth Setup (for Org Dashboard testing)

The org portal (`apps/org`) uses a **separate Clerk application** from the roaster portal. To sign in:

**Option A: Full webhook flow (recommended)**

1. [ ] Clerk org app keys are configured in `apps/org/.env.local` (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`)
2. [ ] Clerk webhook endpoint configured: `POST http://localhost:3002/api/webhooks/clerk` (use ngrok or Clerk dev proxy)
3. [ ] `CLERK_WEBHOOK_SECRET` set in `apps/org/.env.local`
4. [ ] Create a test user in the Clerk dashboard with email `e2e-org@joeperks.test`
5. [ ] Set `public_metadata: { "orgId": "<org-id-from-seed>" }` on the Clerk user
6. [ ] On first sign-in at `http://localhost:3002/sign-in`, the webhook merges the `clerk_pending:` DB user with the real Clerk ID

**Option B: Direct DB update (shortcut)**

1. [ ] Create a test user in the Clerk dashboard with email `e2e-org@joeperks.test`
2. [ ] Copy the Clerk user ID (starts with `user_`)
3. [ ] Update the seeded User row directly:
   ```sql
   UPDATE "User"
   SET "externalAuthId" = 'user_YOUR_CLERK_ID'
   WHERE email = 'e2e-org@joeperks.test';
   ```
4. [ ] Sign in at `http://localhost:3002/sign-in`

#### Verification

- [ ] Storefront loads at `http://localhost:3000/en/e2e-test-org` (200, shows products)
- [ ] Org portal sign-in works at `http://localhost:3002/sign-in`
- [ ] Admin dashboard loads at `http://localhost:3003`
- [ ] Browser console has no uncaught errors on any app

---

## Phase B: Org Application Flow (apps/web)

### T-01: Org Apply Form — Multi-Step Wizard

**URL:** `http://localhost:3000/en/orgs/apply`

#### Step 1: Your Org

- [ ] Page loads with "Apply as an organization" heading (or similar)
- [ ] Form fields present: Organization name, Contact name, Email, Phone (optional)
- [ ] **Validation:** Submit with empty org name → error message shown
- [ ] **Validation:** Submit with invalid email format → error message shown
- [ ] Fill in valid data → "Next" button becomes enabled / advances

#### Step 2: Description

- [ ] Textarea for organization description
- [ ] Character counter visible (max 2000)
- [ ] Optional — can advance with empty description
- [ ] Filling in >2000 characters shows validation error

#### Step 3: Storefront

- [ ] Input for desired storefront slug (URL handle)
- [ ] Slug auto-formats to lowercase, strips invalid characters
- [ ] **Validation:** Slug <3 characters → error
- [ ] Async slug availability check fires on blur/change
- [ ] Available slug shows green indicator
- [ ] Taken slug shows red indicator ("already in use")
- [ ] Reserved slug (e.g., "roasters", "admin") rejected

#### Step 4: Roaster

- [ ] Dropdown/select of active roasters
- [ ] At least one roaster available (the E2E roaster)
- [ ] Org percentage slider visible with min/max bounds from PlatformSettings
- [ ] Selecting a primary roaster is required
- [ ] Backup roaster is optional

#### Step 5: Terms

- [ ] Terms checkbox present
- [ ] Cannot submit without checking the terms box
- [ ] Submitting with terms checked → application submitted
- [ ] Success state shown (confirmation message)
- [ ] Browser console has no errors during submission

### T-02: Slug Validation API

- [ ] `GET /api/slugs/validate?slug=e2e-test-org` returns unavailable (already exists)
- [ ] `GET /api/slugs/validate?slug=roasters` returns unavailable (reserved)
- [ ] `GET /api/slugs/validate?slug=unique-test-slug-xyz` returns available

### T-03: Rate Limiting

- [ ] Application submission is rate-limited (3 req/hour per IP via `limitOrgApplication`)
- [ ] After limit exceeded, a 429 or error message is shown

---

## Phase C: Admin Approval Flow (apps/admin)

**URL:** `http://localhost:3003`

### T-04: Pending Org Applications Queue

**URL:** `http://localhost:3003/approvals/orgs`

- [ ] Page loads with a table/list of org applications
- [ ] Filter defaults to `PENDING_PLATFORM_REVIEW` status
- [ ] Applications show org name, email, desired slug, desired org %, date
- [ ] Status filter dropdown works (PENDING_PLATFORM_REVIEW, PENDING_ROASTER_APPROVAL, APPROVED, REJECTED)
- [ ] Clicking an application row navigates to the detail view

### T-05: Application Detail View

**URL:** `http://localhost:3003/approvals/orgs/[id]`

- [ ] Full application details visible: org name, contact, email, phone, description, slug, org %
- [ ] Linked roaster request visible (primary roaster name/email)
- [ ] Terms agreed timestamp and version shown
- [ ] Approve and Reject action buttons present

### T-06: Approve Action

- [ ] Clicking "Approve" on a `PENDING_PLATFORM_REVIEW` application:
  - [ ] Application status changes to `PENDING_ROASTER_APPROVAL`
  - [ ] `RoasterOrgRequest` status changes to `PENDING`
  - [ ] `MagicLink` created with purpose `ROASTER_REVIEW`
  - [ ] Confirmation message shown in admin UI
- [ ] Application no longer appears in `PENDING_PLATFORM_REVIEW` filter
- [ ] Application appears under `PENDING_ROASTER_APPROVAL` filter

### T-07: Reject Action

- [ ] Clicking "Reject" on a `PENDING_PLATFORM_REVIEW` application:
  - [ ] Application status changes to `REJECTED`
  - [ ] No `Org` record created
  - [ ] Confirmation message shown
- [ ] Rejected application appears under `REJECTED` filter

---

## Phase D: Roaster Magic Link Review (apps/roaster)

### T-08: Magic Link Page

**URL:** `http://localhost:3001/org-requests/[token]`

- [ ] Page loads with the org application details
- [ ] Org name, contact info, description visible
- [ ] Desired org percentage shown
- [ ] Approve and Decline buttons present
- [ ] No Clerk login required (magic link pages are public)

### T-09: Approve Creates Org

- [ ] Clicking "Approve" on the magic link page:
  - [ ] `OrgApplication` status → `APPROVED`
  - [ ] `RoasterOrgRequest` status → `APPROVED`
  - [ ] `Org` record created (status: `ONBOARDING`, slug from application)
  - [ ] `User` record created (role: `ORG_ADMIN`, email from application, `externalAuthId: clerk_pending:...`)
  - [ ] `MagicLink.usedAt` set (single-use)
  - [ ] Success confirmation shown
- [ ] `org-approved` email would be sent (verify in Resend dashboard or email log)

### T-10: Error States

- [ ] Visiting an **already-used** magic link token → shows "already used" error
- [ ] Visiting an **expired** magic link token → shows "expired" error
- [ ] Visiting a **nonexistent** token → shows 404 or "not found" error
- [ ] Decline action on a valid token:
  - [ ] `RoasterOrgRequest` status → `DECLINED`
  - [ ] No `Org` record created
  - [ ] Token marked as used

---

## Phase E: Org Dashboard (apps/org)

### T-11: Sign-In Flow

**URL:** `http://localhost:3002/sign-in`

- [ ] Clerk `<SignIn>` component renders
- [ ] Sign in with `e2e-org@joeperks.test` credentials
- [ ] Redirected to `/dashboard` after successful auth
- [ ] No hydration errors in console

### T-12: Dashboard Page

**URL:** `http://localhost:3002/dashboard`

- [ ] "Org dashboard" heading visible
- [ ] Linked `org_id` shown (matches seeded org ID)
- [ ] Role shown as `ORG_ADMIN`
- [ ] User email shown as `e2e-org@joeperks.test`
- [ ] Account status shown as `ACTIVE`

### T-13: Onboarding Page

**URL:** `http://localhost:3002/onboarding`

- [ ] "Payments onboarding" heading visible
- [ ] Stripe Connect status section present
- [ ] For the seeded org (Stripe simulated as complete):
  - [ ] Status shows as complete/connected
  - [ ] Charges enabled indicator: on
  - [ ] Payouts enabled indicator: on
  - [ ] Links to `/campaign` and `/dashboard` visible
- [ ] For an org with `NOT_STARTED` status:
  - [ ] "Start onboarding" button visible
  - [ ] Clicking it would POST to `/api/stripe/connect` (may fail without real Stripe keys — expected)

### T-14: Campaign Page — Draft Mode

**URL:** `http://localhost:3002/campaign`

**Pre-condition:** Delete the seeded campaign to test draft creation, or test with a fresh org.

- [ ] Page loads with "Campaign" heading
- [ ] Partner roaster email shown
- [ ] Campaign name input field
- [ ] Goal amount input field
- [ ] Product selector with checkboxes for each variant
  - [ ] Product names visible (Morning Sunrise Blend, Dark Roast Reserve, Single Origin Kenya AA)
  - [ ] Variant labels visible (size + grind)
  - [ ] "Featured" toggle for each variant
- [ ] "Save draft" button saves without activating
- [ ] After save, values persist on page reload
- [ ] "Activate campaign" button:
  - [ ] Requires at least one item selected
  - [ ] Requires campaign name
  - [ ] On click, campaign status → `ACTIVE`
  - [ ] Success confirmation shown

### T-15: Campaign Page — Live Mode

**URL:** `http://localhost:3002/campaign`

**Pre-condition:** Campaign is `ACTIVE` (default after seeding).

- [ ] Page loads in read-only mode
- [ ] Campaign name displayed (not editable)
- [ ] Goal amount displayed
- [ ] Item count displayed
- [ ] No "Save draft" or "Activate" buttons visible
- [ ] Org percentage shown

### T-16: Suspension State

**Pre-condition:** Manually update org status to `SUSPENDED` in the database.

```sql
UPDATE "Org" SET status = 'SUSPENDED' WHERE slug = 'e2e-test-org';
```

- [ ] **Layout banner:** Yellow/amber suspension banner appears at top of all authenticated pages
- [ ] **Dashboard:** Shows "Account status" heading instead of normal dashboard
  - [ ] "Your organization account is suspended" message visible
  - [ ] Reason category shown
  - [ ] Impact description (storefront unavailable, campaigns blocked)
  - [ ] Account snapshot section: org name, status, Stripe, charges/payouts
  - [ ] Reactivation request form visible with textarea
  - [ ] Submitting reactivation request → creates `AdminActionLog` entry
- [ ] **Campaign page:** Shows message about suspension linking to dashboard
- [ ] **Storefront:** `http://localhost:3000/en/e2e-test-org` returns 404 (org not ACTIVE)

**Reset:** `UPDATE "Org" SET status = 'ACTIVE' WHERE slug = 'e2e-test-org';`

---

## Phase F: Public Storefront (apps/web)

### T-17: Storefront Page

**URL:** `http://localhost:3000/en/e2e-test-org`

- [ ] Page loads with 200 status
- [ ] Org name "E2E Test Organization" visible in header
- [ ] Campaign name "E2E Test Fundraiser" visible
- [ ] Org percentage shown (15%)
- [ ] Goal amount displayed ($500.00)
- [ ] Progress bar visible (may show $0 raised initially)
- [ ] Cart trigger button visible (bag icon)

### T-18: Product Cards

- [ ] Product grid displays all campaign items
- [ ] **Featured section** present with "Morning Sunrise Blend" variants
- [ ] **All coffee section** present with remaining products
- [ ] Each product card shows:
  - [ ] Product name
  - [ ] Roast level badge
  - [ ] Variant label (size + grind)
  - [ ] Price (formatted as dollars, e.g., "$18.99")
  - [ ] "Add to cart" button
- [ ] Products from the E2E roaster:
  1. [ ] Morning Sunrise Blend — 12 oz Whole bean ($18.99)
  2. [ ] Morning Sunrise Blend — 12 oz Drip ($18.99)
  3. [ ] Morning Sunrise Blend — 16 oz Whole bean ($23.99)
  4. [ ] Dark Roast Reserve — 12 oz Whole bean ($20.99)
  5. [ ] Dark Roast Reserve — 12 oz Espresso ($20.99)
  6. [ ] Single Origin Kenya AA — 12 oz Whole bean ($24.99)

### T-19: Cart Drawer

- [ ] Click "Add to cart" on a product → cart count badge increments
- [ ] Click cart trigger → drawer/sheet slides open
- [ ] Cart shows:
  - [ ] Line item with product name, variant, price
  - [ ] Quantity controls (+/−)
  - [ ] Remove button
  - [ ] Subtotal
  - [ ] Split preview (org amount, platform amount)
  - [ ] "Proceed to checkout" button (enabled when shipping is available)
- [ ] Increase quantity → subtotal updates
- [ ] Remove item → item disappears from cart
- [ ] Cart persists across page refresh (Zustand persist to localStorage)

### T-20: Cart Sync

- [ ] Add items on `e2e-test-org` storefront
- [ ] Navigate to a different org's storefront (if available)
- [ ] Cart should be cleared (different org slug)
- [ ] Navigate back to `e2e-test-org` → cart is empty (was cleared on switch)

### T-21: Shipping Guard

**Pre-condition:** Temporarily remove shipping rates for the E2E roaster.

```sql
DELETE FROM "RoasterShippingRate" WHERE "roasterId" = '<roaster-id>';
```

- [ ] Storefront shows a shipping unavailability banner
- [ ] "Proceed to checkout" in cart drawer is disabled
- [ ] Navigating to `/en/e2e-test-org/checkout` redirects back with `?error=no-shipping`
- [ ] Storefront shows "Checkout isn't available until shipping is configured" message

**Reset:** Re-run `seed-e2e-roaster.ts` to restore shipping rates.

### T-22: 404 and Reserved Slugs

- [ ] `http://localhost:3000/en/nonexistent-slug-xyz` → 404 page
- [ ] `http://localhost:3000/en/roasters` → 404 (reserved slug)
- [ ] `http://localhost:3000/en/admin` → 404 (reserved slug)
- [ ] `http://localhost:3000/en/api` → does not render a storefront

---

## Phase G: Checkout Flow (apps/web)

### T-23: Checkout — Step 1: Cart Review

**URL:** `http://localhost:3000/en/e2e-test-org/checkout`

**Pre-condition:** At least one item in cart for `e2e-test-org`.

- [ ] Cart review step shows all items from the Zustand cart
- [ ] Product name, variant, quantity, unit price, line total visible per item
- [ ] Subtotal matches sum of line totals
- [ ] "Continue" button advances to shipping step
- [ ] Empty cart → redirected back to storefront

### T-24: Checkout — Step 2: Shipping

- [ ] Shipping form fields present:
  - [ ] Full name (required, max 200)
  - [ ] Email (required, valid format)
  - [ ] Street address (required, max 200)
  - [ ] City (required, max 100)
  - [ ] State (required, max 50)
  - [ ] ZIP / postal code (required, min 3, max 20)
  - [ ] Shipping rate selection (radio buttons)
- [ ] Shipping rates from roaster shown:
  - [ ] Standard Shipping — $5.95
  - [ ] Priority Shipping — $9.95
- [ ] **Validation:** Submit with empty name → "Name is required" error
- [ ] **Validation:** Submit with invalid email → "Enter a valid email" error
- [ ] **Validation:** Submit without selecting shipping rate → error
- [ ] Fill all fields → "Continue to payment" advances to step 3

### T-25: Checkout — Step 3: Payment

- [ ] Stripe `PaymentElement` renders (requires `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`)
- [ ] Order summary visible (items, shipping, total)
- [ ] "Pay" button present
- [ ] Using Stripe test card `4242 4242 4242 4242`:
  - [ ] Payment processes
  - [ ] Redirected to order confirmation page
- [ ] Using Stripe test decline card `4000 0000 0000 0002`:
  - [ ] Payment fails with error message
  - [ ] User remains on payment step

### T-26: Checkout API — `POST /api/checkout/create-intent`

This can be tested directly or verified through the UI flow:

- [ ] Creates `Order` with status `PENDING`
- [ ] Creates `OrderItem` rows with snapshot prices
- [ ] Creates `Buyer` record (upsert by email)
- [ ] Creates Stripe `PaymentIntent` with `clientSecret`
- [ ] Sets `transfer_group` to order ID
- [ ] Calculates splits: `orgAmount`, `platformAmount`, `roasterAmount`
- [ ] `productSubtotal` excludes shipping
- [ ] `grossAmount` = `productSubtotal` + `shippingAmount`
- [ ] `OrderEvent` with type `PAYMENT_INTENT_CREATED` logged
- [ ] Order number format: `JP-XXXXX`
- [ ] **Error:** Invalid `campaignId` → 400 response
- [ ] **Error:** Empty items array → 400 response
- [ ] **Rate limit:** Excessive requests → 429 response

### T-27: Order Confirmation

**URL:** `http://localhost:3000/en/e2e-test-org/order/[paymentIntentId]`

- [ ] Page loads after successful payment redirect
- [ ] If order is still `PENDING`: polling spinner shown
  - [ ] Polls `GET /api/order-status?pi=...` every 2 seconds
  - [ ] Timeout after 30 seconds shows fallback message
- [ ] After `payment_intent.succeeded` webhook (or simulation):
  - [ ] Order status shows `CONFIRMED`
  - [ ] Order number displayed (JP-XXXXX format)
  - [ ] Line items with quantities and prices shown
  - [ ] Subtotal, shipping, and total displayed
  - [ ] Org contribution amount shown
- [ ] Cart is cleared after order summary renders
- [ ] Refreshing the page still shows the order (server-rendered from DB)
- [ ] `GET /api/order-status?pi=nonexistent` → 404

---

## Phase H: Cross-Cutting

### T-28: Responsive Layout

Test at three viewport widths: **375px** (mobile), **768px** (tablet), **1280px** (desktop).

#### Storefront (`/en/e2e-test-org`)

- [ ] **Mobile (375px):** Product cards stack in single column
- [ ] **Tablet (768px):** Product cards in 2-column grid
- [ ] **Desktop (1280px):** Product cards in 3-column grid (or more)
- [ ] Cart drawer is full-width on mobile, side drawer on desktop
- [ ] No horizontal scrollbar at any width

#### Checkout (`/en/e2e-test-org/checkout`)

- [ ] Form fields stack on mobile
- [ ] Shipping rate radios are tappable on mobile (adequate touch targets)
- [ ] Payment element adapts to viewport width

#### Org Dashboard (`localhost:3002`)

- [ ] Dashboard content fits within mobile viewport
- [ ] Campaign form is usable on mobile
- [ ] Product selector checkboxes are tappable

### T-29: Accessibility

#### Storefront

- [ ] All product images have `alt` text (or product name equivalent)
- [ ] "Add to cart" buttons are keyboard-focusable and activatable with Enter
- [ ] Cart drawer can be opened and closed with keyboard
- [ ] Tab order follows visual layout
- [ ] Heading hierarchy: `<h1>` for page title, `<h2>` for sections

#### Checkout

- [ ] Form labels are associated with inputs (click label focuses input)
- [ ] Error messages are announced to screen readers (`aria-invalid`, `aria-describedby`)
- [ ] Shipping rate radio group has a group label
- [ ] Focus moves to first error on form validation failure

#### Org Dashboard

- [ ] All interactive elements are keyboard-accessible
- [ ] Status indicators have text alternatives (not color-only)

### T-30: Error States

#### Storefront

- [ ] Suspended org → storefront returns 404
- [ ] Inactive campaign → storefront returns 404
- [ ] No campaign items → empty state message shown

#### Checkout

- [ ] Cart mismatch (items from different campaign) → redirected to storefront
- [ ] Network error on `create-intent` → error message shown, user can retry
- [ ] Stripe payment failure → error displayed, remains on payment step

#### Org Dashboard

- [ ] No org linked to user → helpful message ("No organization is linked...")
- [ ] Stripe Connect not started → directed to `/onboarding`
- [ ] No approved roaster partnership → message on campaign page
- [ ] Session expired → redirected to `/sign-in`

---

## Data Model Reference

```
OrgApplication ──1:1──> Org ──1:N──> Campaign ──N:M──> ProductVariant
     │                   │                │          (via CampaignItem)
     │                   │                │
     └──1:N──> RoasterOrgRequest          └──1:N──> Order ──1:N──> OrderItem
                  │
                  └──> Roaster ──1:N──> Product ──1:N──> ProductVariant
```

**Key relationships:**
- `Org.applicationId` → `OrgApplication.id` (1:1)
- `Campaign.orgId` → `Org.id` (many campaigns per org)
- `CampaignItem` bridges `Campaign` to `ProductVariant` with price snapshots
- `Order.campaignId` + `Order.roasterId` scope each order
- `User.orgId` links authenticated users to their org

---

## Test Data Summary

| Entity | Key Values |
|--------|-----------|
| Roaster | email: `e2e-roaster@joeperks.test`, business: "Sunrise Coffee Roasters", status: ACTIVE |
| Org | email: `e2e-org@joeperks.test`, slug: `e2e-test-org`, status: ACTIVE |
| Campaign | "E2E Test Fundraiser", orgPct: 15%, goal: $500.00, status: ACTIVE |
| Products | Morning Sunrise Blend (3 variants), Dark Roast Reserve (2 variants), Single Origin Kenya AA (1 variant) |
| Shipping | Standard $5.95 (default), Priority $9.95 |
| Org user | email: `e2e-org@joeperks.test`, role: ORG_ADMIN |

---

## Test Summary

| Test | Section | Phase | Result |
|------|---------|-------|--------|
| T-00 | Environment Setup | A | |
| T-01 | Org Apply Form | B | |
| T-02 | Slug Validation API | B | |
| T-03 | Rate Limiting | B | |
| T-04 | Pending Org Applications | C | |
| T-05 | Application Detail | C | |
| T-06 | Approve Action | C | |
| T-07 | Reject Action | C | |
| T-08 | Magic Link Page | D | |
| T-09 | Approve Creates Org | D | |
| T-10 | Error States (Magic Link) | D | |
| T-11 | Sign-In Flow | E | |
| T-12 | Dashboard Page | E | |
| T-13 | Onboarding Page | E | |
| T-14 | Campaign — Draft Mode | E | |
| T-15 | Campaign — Live Mode | E | |
| T-16 | Suspension State | E | |
| T-17 | Storefront Page | F | |
| T-18 | Product Cards | F | |
| T-19 | Cart Drawer | F | |
| T-20 | Cart Sync | F | |
| T-21 | Shipping Guard | F | |
| T-22 | 404 / Reserved Slugs | F | |
| T-23 | Checkout — Cart Review | G | |
| T-24 | Checkout — Shipping | G | |
| T-25 | Checkout — Payment | G | |
| T-26 | Checkout API | G | |
| T-27 | Order Confirmation | G | |
| T-28 | Responsive Layout | H | |
| T-29 | Accessibility | H | |
| T-30 | Error States | H | |

**Tested by:** _______________
**Date:** _______________
**Overall result:** PASS / FAIL
**Notes:**

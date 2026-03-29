# Joe Perks — Sprint 2 Implementation Checklist

## Roaster onboarding, admin approval, Stripe Connect, products, shipping, org application

**Version:** 1.0 | **Sprint:** 2 (Weeks 3-4) | **Points:** 44 | **Stories:** 8
**Audience:** AI coding agents, developers implementing Sprint 2 stories
**Companion documents:**
- Sprint overview: [`docs/sprint-2/README.md`](sprint-2/README.md)
- Story documents: [`docs/sprint-2/stories/`](sprint-2/stories/)
- Progress tracker: [`docs/SPRINT_2_PROGRESS.md`](SPRINT_2_PROGRESS.md)
- Sprint 1 baseline: [`docs/SCAFFOLD_CHECKLIST.md`](SCAFFOLD_CHECKLIST.md)

---

## Prerequisites (from Sprint 1)

Before starting Sprint 2 work, verify these Sprint 1 deliverables are in place:

- [x] `packages/db/prisma/schema.prisma` — All domain models exist (see [`docs/06-database-schema.mermaid`](06-database-schema.mermaid))
- [x] `@joe-perks/stripe` — Client singleton, split calculator, rate limiter, Connect helpers, status mapper
- [x] `apps/web/app/api/webhooks/stripe/route.ts` — Handles `account.updated` (Connect status transitions)
- [x] `@joe-perks/email` — `sendEmail()` with `EmailLog` dedup, `BaseEmailLayout` wrapper
- [x] `apps/roaster` — Clerk auth, middleware, `POST /api/stripe/connect` route
- [x] `apps/org` — Clerk auth, middleware
- [x] `apps/admin` — HTTP Basic Auth middleware
- [x] `packages/types` — `RESERVED_SLUGS` exported
- [x] Clerk webhooks — `User` upsert on `user.created`/`user.updated` for roaster and org apps

---

## Phase 1 — Email Templates (US-08-06)

> **Why first:** Other stories call these templates. Building them first avoids stubs.

### 1.1 Roaster application received template

- [x] Create `packages/email/templates/roaster-application-received.tsx`
- [x] Props: `businessName: string`, `email: string`
- [x] Extends `BaseEmailLayout`
- [x] Exports `PreviewProps` for React Email preview
- [x] Subject: "We received your roaster application"
- [x] Content: confirmation, review timeline, contact info

### 1.2 Roaster approved template

- [x] Create `packages/email/templates/roaster-approved.tsx`
- [x] Props: `businessName: string`, `loginUrl: string`
- [x] Subject: "Your roaster application has been approved!"
- [x] Content: welcome, next steps (Stripe, products, shipping), CTA to roaster portal

### 1.3 Roaster rejected template

- [x] Create `packages/email/templates/roaster-rejected.tsx`
- [x] Props: `businessName: string`
- [x] Subject: "Update on your roaster application"
- [x] Content: polite rejection, encouragement, contact info

### 1.4 Org application received template

- [x] Create `packages/email/templates/org-application-received.tsx`
- [x] Props: `orgName: string`, `contactName: string`
- [x] Subject: "We received your organization application"
- [x] Content: confirmation, process overview, timeline

### 1.5 Preview verification

- [x] Run `pnpm dev` and open `http://localhost:3004` (React Email preview)
- [x] All 4 templates render correctly
- [x] Templates display well at mobile widths

**Reference:** [`docs/sprint-2/stories/US-08-06-application-notifications.md`](sprint-2/stories/US-08-06-application-notifications.md)

---

## Phase 2 — Slug Validation (US-02-06)

> **Why now:** Standalone utility; US-03-01 depends on it.

### 2.1 Slug validation utilities

- [x] Create `packages/types/src/slug-validation.ts`
- [x] Implement `isValidSlugFormat(slug: string): boolean` — regex: `^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$` (3-63 chars)
- [x] Implement `isReservedSlug(slug: string): boolean` — checks against `RESERVED_SLUGS`
- [x] Export from `packages/types/src/index.ts`

### 2.2 Slug validation API route

- [x] Create `apps/web/app/api/slugs/validate/route.ts`
- [x] `GET /api/slugs/validate?slug=my-org` — public endpoint
- [x] Validate format → check reserved list → check `Org.slug` → check `OrgApplication.desiredSlug` (non-rejected)
- [x] Returns `{ available: boolean, reason?: string }`
- [x] Reasons: `"reserved"`, `"taken"`, `"pending"`, `"invalid_format"`
- [x] Missing `slug` param returns 400
- [x] Rate limiting: 30 req/min per IP

### 2.3 Verification

- [x] Test: reserved slug → `{ available: false, reason: "reserved" }`
- [x] Test: valid new slug → `{ available: true }`
- [x] Test: invalid format (uppercase, special chars) → `{ available: false, reason: "invalid_format" }`

**Reference:** [`docs/sprint-2/stories/US-02-06-slug-blocklist-validation.md`](sprint-2/stories/US-02-06-slug-blocklist-validation.md)

---

## Phase 3 — Roaster Application Form (US-02-01)

> **First in the main EP-02 dependency chain.**

### 3.1 Zod validation schema

- [ ] Create `apps/web/app/[locale]/roasters/apply/_lib/schema.ts`
- [ ] Schema covers all 5 steps: contact (email, phone, name), business (name, website, description), location (city, state), coffee info, terms
- [ ] Email format validation
- [ ] Required fields enforced
- [ ] `termsVersion` must be a non-empty string

### 3.2 Server action

- [ ] Create `apps/web/app/[locale]/roasters/apply/_actions/submit-application.ts`
- [ ] Parses and validates full form with Zod
- [ ] Rate limiting: 3 submissions per IP per hour (Upstash)
- [ ] Creates `RoasterApplication` with `status = PENDING_REVIEW`, `termsAgreedAt = now()`
- [ ] Handles duplicate email rejection (unique constraint)
- [ ] Calls `sendEmail()` with `roaster-application-received` template
- [ ] Does NOT log PII — only logs application ID
- [ ] Returns `{ success: true, applicationId }` or `{ error, code }`

### 3.3 Multi-step form UI

- [ ] Create `apps/web/app/[locale]/roasters/apply/_components/roaster-apply-form.tsx` (client component)
- [ ] 5-step navigation with forward/back, progress indicator
- [ ] Create step components (contact, business, location, coffee, terms)
- [ ] Per-step validation before allowing advancement
- [ ] Terms checkbox required on final step
- [ ] Success/confirmation view after submission
- [ ] Mobile-responsive, 44x44px touch targets

### 3.4 Page integration

- [ ] Update `apps/web/app/[locale]/roasters/apply/page.tsx` — remove scaffold, render form
- [ ] Server component shell

### 3.5 Verification

- [ ] Submit valid application → `RoasterApplication` created in DB with `status = PENDING_REVIEW`
- [ ] Duplicate email → rejected
- [ ] Rate limit → 429 after 3 submissions
- [ ] `EmailLog` entry created for `roaster-application-received`

**Reference:** [`docs/sprint-2/stories/US-02-01-roaster-application-form.md`](sprint-2/stories/US-02-01-roaster-application-form.md)
**Diagram:** [`docs/05-approval-chain.mermaid`](05-approval-chain.mermaid) — RA1, RA2

---

## Phase 4 — Admin Approval Queue (US-02-02)

> **Depends on:** Applications existing from Phase 3.

### 4.1 Application list page

- [ ] Update `apps/admin/app/approvals/roasters/page.tsx` — remove scaffold, add server component that queries `RoasterApplication`
- [ ] Default filter: `status = PENDING_REVIEW`
- [ ] Tabs or dropdown for `APPROVED`, `REJECTED` views
- [ ] Each row: business name, email, city/state, submission date, status badge

### 4.2 Application detail

- [ ] Create detail view (inline expansion or `apps/admin/app/approvals/roasters/[id]/page.tsx`)
- [ ] Shows all submitted fields from the application

### 4.3 Approve server action

- [ ] Create `apps/admin/app/approvals/roasters/_actions/approve-application.ts`
- [ ] Validates: application exists, status is `PENDING_REVIEW`
- [ ] `database.$transaction()`:
  - Update `RoasterApplication.status` → `APPROVED`
  - Create `Roaster` record: `status = ONBOARDING`, `applicationId`, `email` from application
  - Create `User` record: `role = ROASTER_ADMIN`, `roasterId`, `email` from application
- [ ] Call `sendEmail()` with `roaster-approved` template
- [ ] Revalidate page path

### 4.4 Reject server action

- [ ] Create `apps/admin/app/approvals/roasters/_actions/reject-application.ts`
- [ ] Update `RoasterApplication.status` → `REJECTED`
- [ ] Call `sendEmail()` with `roaster-rejected` template
- [ ] Revalidate page path

### 4.5 UI components

- [ ] Application list component with table or card layout
- [ ] Status badges (PENDING_REVIEW = yellow, APPROVED = green, REJECTED = red)
- [ ] Confirmation dialog before approve/reject
- [ ] Guard: non-PENDING_REVIEW applications hide approve/reject buttons

### 4.6 Verification

- [ ] Create a test `RoasterApplication` (via Phase 3 form or direct DB insert)
- [ ] Approve → `Roaster` + `User` records created, `EmailLog` entry for `roaster-approved`
- [ ] Reject → status updated, `EmailLog` entry for `roaster-rejected`
- [ ] Already-processed application → approve/reject buttons hidden
- [ ] HTTP Basic Auth protects the page (existing middleware)

**Reference:** [`docs/sprint-2/stories/US-02-02-admin-approval-queue.md`](sprint-2/stories/US-02-02-admin-approval-queue.md)
**Diagram:** [`docs/05-approval-chain.mermaid`](05-approval-chain.mermaid) — RA3, RA4, RA5, RA6

---

## Phase 5 — Stripe Connect Onboarding (US-02-03)

> **Depends on:** Approved roaster with `Roaster` record from Phase 4.

### 5.1 Onboarding page

- [ ] Update `apps/roaster/app/(authenticated)/onboarding/page.tsx` — remove scaffold
- [ ] Server component: authenticates via `auth()`, loads `User` → `Roaster`
- [ ] Passes Connect status to child components

### 5.2 Connect status component

- [ ] Create `apps/roaster/app/(authenticated)/onboarding/_components/connect-status.tsx` (client)
- [ ] Displays: `stripeOnboarding` status, `chargesEnabled`, `payoutsEnabled`
- [ ] Visual indicators for each status: NOT_STARTED, PENDING, IN_PROGRESS, COMPLETE
- [ ] Handles `?stripe_return=1` (refresh status from DB)
- [ ] Handles `?stripe_refresh=1` (auto-re-initiate)

### 5.3 Start onboarding button

- [ ] Create `apps/roaster/app/(authenticated)/onboarding/_components/start-onboarding-button.tsx` (client)
- [ ] Calls `POST /api/stripe/connect` via `fetch()`
- [ ] Loading state while waiting
- [ ] Redirects browser to returned Stripe URL
- [ ] Label: "Start onboarding" (NOT_STARTED) or "Continue onboarding" (IN_PROGRESS)

### 5.4 Success state

- [ ] When `stripeOnboarding = COMPLETE` + `chargesEnabled` + `payoutsEnabled`: show success + links to products/dashboard

### 5.5 Verification

- [ ] Sign in as approved roaster → see onboarding page with current status
- [ ] Click "Start onboarding" → redirected to Stripe Express
- [ ] Return from Stripe → page shows updated status
- [ ] Expired link (`?stripe_refresh=1`) → re-initiates flow
- [ ] After `account.updated` webhook fires → status reflects COMPLETE (via page refresh)
- [ ] All data scoped to authenticated roaster (tenant isolation)

**Reference:** [`docs/sprint-2/stories/US-02-03-stripe-connect-onboarding.md`](sprint-2/stories/US-02-03-stripe-connect-onboarding.md)
**Diagram:** [`docs/05-approval-chain.mermaid`](05-approval-chain.mermaid) — RA6, RA7, RA8

---

## Phase 6 — Product & Variant CRUD (US-02-04)

> **Depends on:** Roaster with active Stripe from Phase 5.

### 6.1 Validation schemas

- [ ] Create `apps/roaster/app/(authenticated)/products/_lib/schema.ts`
- [ ] Product: name (required), description, origin, roastLevel (enum), status (enum), imageUrl
- [ ] Variant: sizeOz (positive int), grind (enum), wholesalePrice (positive int cents), retailPrice (positive int cents, > wholesalePrice), isAvailable

### 6.2 Product server actions

- [ ] Create `apps/roaster/app/(authenticated)/products/_actions/product-actions.ts`
- [ ] `createProduct`: validate, set `roasterId = session.roasterId`, insert
- [ ] `updateProduct`: validate, verify `roasterId` ownership, update
- [ ] `deleteProduct`: verify ownership, set `deletedAt = now()` (soft delete)
- [ ] All queries: `WHERE roasterId = session.roasterId AND deletedAt IS NULL`

### 6.3 Variant server actions

- [ ] Create `apps/roaster/app/(authenticated)/products/_actions/variant-actions.ts`
- [ ] `createVariant`: validate (incl. retailPrice > wholesalePrice), verify product ownership, insert
- [ ] `updateVariant`: validate, verify ownership chain, update
- [ ] `deleteVariant`: verify ownership, soft delete
- [ ] All queries filter `deletedAt IS NULL`

### 6.4 Product list page

- [ ] Update `apps/roaster/app/(authenticated)/products/page.tsx` — remove scaffold
- [ ] Server component querying products with tenant + soft delete filters
- [ ] Shows: name, roast level, status badge, variant count, image thumbnail
- [ ] "New product" button linking to create form

### 6.5 Product create/edit pages

- [ ] Create `apps/roaster/app/(authenticated)/products/new/page.tsx`
- [ ] Create `apps/roaster/app/(authenticated)/products/[id]/edit/page.tsx`
- [ ] Create `_components/product-form.tsx` (client component)
- [ ] Roast level enum select, status enum select, image URL input
- [ ] Price inputs display in dollar format, convert to cents on submit

### 6.6 Product detail page with variants

- [ ] Create `apps/roaster/app/(authenticated)/products/[id]/page.tsx`
- [ ] Shows product details + variant list
- [ ] "Add variant" button
- [ ] Create `_components/variant-form.tsx` (client component) — size, grind select, prices, availability
- [ ] Create `_components/variant-list.tsx` — table with edit/delete actions

### 6.7 Price validation

- [ ] Client-side: warn if retail < wholesale; block submit
- [ ] Server-side: enforce `retailPrice > wholesalePrice` and both positive

### 6.8 Verification

- [ ] Create product → appears in list, stored in DB with `roasterId`
- [ ] Add variant → prices stored as cents, retailPrice > wholesalePrice enforced
- [ ] Edit product/variant → changes persisted
- [ ] Soft delete → `deletedAt` set, item hidden from list, row still in DB
- [ ] Tenant isolation → cannot see other roasters' products
- [ ] Money → prices displayed as dollars, stored as cents

**Reference:** [`docs/sprint-2/stories/US-02-04-product-variant-creation.md`](sprint-2/stories/US-02-04-product-variant-creation.md)
**Diagram:** [`docs/06-database-schema.mermaid`](06-database-schema.mermaid) — Product, ProductVariant
**Rules:** [`docs/AGENTS.md`](AGENTS.md) — money-as-cents, soft deletes, tenant isolation

---

## Phase 7 — Shipping Rate Configuration (US-02-05)

> **Depends on:** Product system from Phase 6.

### 7.1 Validation schema

- [ ] Create `apps/roaster/app/(authenticated)/settings/shipping/_lib/schema.ts`
- [ ] Fields: label (required), carrier (required), flatRate (positive int cents), isDefault (boolean)

### 7.2 Server actions

- [ ] Create `apps/roaster/app/(authenticated)/settings/shipping/_actions/shipping-actions.ts`
- [ ] `createRate`: validate, scope to session roaster, manage default flag, insert
- [ ] `updateRate`: validate, verify ownership, manage default flag, update
- [ ] `deleteRate`: verify ownership, delete (hard delete OK for shipping rates)
- [ ] Default management: when setting `isDefault = true`, unset all other defaults for that roaster in same transaction

### 7.3 Shipping settings page

- [ ] Update `apps/roaster/app/(authenticated)/settings/shipping/page.tsx` — remove scaffold
- [ ] Server component querying rates for authenticated roaster
- [ ] Rate list: label, carrier, flat rate (dollar display), default badge
- [ ] "Add rate" button
- [ ] Edit and delete actions on each rate

### 7.4 Rate form component

- [ ] Create `_components/rate-form.tsx` (client component)
- [ ] Dollar input → cents conversion on submit
- [ ] Default toggle

### 7.5 Verification

- [ ] Create rate → stored in DB with `roasterId`, `flatRate` as cents
- [ ] Set as default → previous default unset
- [ ] Delete rate → removed from DB
- [ ] Tenant isolation → only see own rates
- [ ] No rates → prompt to add one

**Reference:** [`docs/sprint-2/stories/US-02-05-shipping-rate-config.md`](sprint-2/stories/US-02-05-shipping-rate-config.md)
**Diagram:** [`docs/06-database-schema.mermaid`](06-database-schema.mermaid) — RoasterShippingRate

---

## Phase 8 — Org Application Form (US-03-01)

> **Depends on:** Slug validation from Phase 2, email templates from Phase 1.

### 8.1 Zod validation schema

- [ ] Create `apps/web/app/[locale]/orgs/apply/_lib/schema.ts`
- [ ] Covers: org info (name, contact, email, phone), description, slug, roaster selection + org pct, terms
- [ ] `desiredOrgPct` constrained by platform settings bounds
- [ ] Slug format validation (reuse `isValidSlugFormat` from `packages/types`)

### 8.2 Server action

- [ ] Create `apps/web/app/[locale]/orgs/apply/_actions/submit-application.ts`
- [ ] Validate with Zod
- [ ] Re-validate slug availability (race condition guard)
- [ ] Validate `desiredOrgPct` against `PlatformSettings` bounds
- [ ] `database.$transaction()`: create `OrgApplication` (status = `PENDING_PLATFORM_REVIEW`) + `RoasterOrgRequest` records (with priority)
- [ ] Call `sendEmail()` with `org-application-received`
- [ ] Rate limiting: 3 per IP per hour

### 8.3 Page server component

- [ ] Update `apps/web/app/[locale]/orgs/apply/page.tsx` — remove scaffold
- [ ] Load active roasters: `database.roaster.findMany({ where: { status: 'ACTIVE' } })`
- [ ] Load platform settings: `database.platformSettings.findUnique({ where: { id: 'singleton' } })`
- [ ] Pass to form as props

### 8.4 Multi-step form UI

- [ ] Create `_components/org-apply-form.tsx` (client component) — 5-step navigation
- [ ] Create step components (org info, description, storefront, roaster/split, terms)
- [ ] Create `_components/slug-input.tsx` — debounced (300ms+) fetch to `/api/slugs/validate`
- [ ] Create `_components/roaster-selector.tsx` — select primary + optional backup roaster
- [ ] Create `_components/org-pct-slider.tsx` — slider/input within platform bounds with default value
- [ ] Terms checkbox on final step

### 8.5 Verification

- [ ] Submit valid application → `OrgApplication` + `RoasterOrgRequest` records in DB
- [ ] Slug validation inline → shows available/taken/reserved in real time
- [ ] `desiredOrgPct` within bounds → accepted; outside → rejected
- [ ] At least one roaster selected → required
- [ ] Duplicate slug/email → rejected
- [ ] Rate limit → 429 after 3 submissions
- [ ] `EmailLog` entry created

**Reference:** [`docs/sprint-2/stories/US-03-01-org-application-form.md`](sprint-2/stories/US-03-01-org-application-form.md)
**Diagram:** [`docs/05-approval-chain.mermaid`](05-approval-chain.mermaid) — OA1, OA2

---

## Cross-cutting concerns

### Document synchronization

After completing each phase, verify alignment with these documents:

| Document | Action |
|----------|--------|
| [`docs/SPRINT_2_PROGRESS.md`](SPRINT_2_PROGRESS.md) | Update status for the completed story |
| [`docs/01-project-structure.mermaid`](01-project-structure.mermaid) | Add any new routes or files created |
| [`docs/SCAFFOLD_PROGRESS.md`](SCAFFOLD_PROGRESS.md) | Update "Portals" row status from `Partial` if relevant |
| [`docs/AGENTS.md`](AGENTS.md) | No changes expected unless new patterns are introduced |
| [`docs/CONVENTIONS.md`](CONVENTIONS.md) | Add any new conventions discovered during implementation |

### AGENTS.md rules checklist (apply to every story)

- [ ] Money values stored as `Int` cents — never floats
- [ ] Tenant isolation: roaster queries scoped by `session.roasterId`
- [ ] Soft deletes: `Product`/`ProductVariant` queries filter `deletedAt IS NULL`
- [ ] Email: `sendEmail()` from `@joe-perks/email` — never import Resend directly
- [ ] Stripe: `@joe-perks/stripe` — never import Stripe SDK in apps
- [ ] Logging: no PII logged — only IDs and event types
- [ ] Webhook idempotency: check `StripeEvent` before processing (existing code)

### Testing commands

```bash
pnpm dev                    # Start all apps
pnpm typecheck              # Type-check all packages
pnpm check                  # Lint + format (Ultracite)
pnpm build                  # Build all apps (CI equivalent)

# Stripe local testing
stripe listen --forward-to localhost:3000/api/webhooks/stripe
stripe trigger account.updated

# Email preview
# http://localhost:3004 (React Email preview app)
```

---

## Quick reference — Story-to-file mapping

| Story | Phase | Key files |
|-------|-------|-----------|
| US-08-06 | 1 | `packages/email/templates/roaster-application-received.tsx`, `roaster-approved.tsx`, `roaster-rejected.tsx`, `org-application-received.tsx` |
| US-02-06 | 2 | `packages/types/src/slug-validation.ts`, `apps/web/app/api/slugs/validate/route.ts` |
| US-02-01 | 3 | `apps/web/app/[locale]/roasters/apply/` (page, _actions, _components, _lib) |
| US-02-02 | 4 | `apps/admin/app/approvals/roasters/` (page, _actions, _components, [id]) |
| US-02-03 | 5 | `apps/roaster/app/(authenticated)/onboarding/` (page, _components) |
| US-02-04 | 6 | `apps/roaster/app/(authenticated)/products/` (page, new, [id], _actions, _components, _lib) |
| US-02-05 | 7 | `apps/roaster/app/(authenticated)/settings/shipping/` (page, _actions, _components, _lib) |
| US-03-01 | 8 | `apps/web/app/[locale]/orgs/apply/` (page, _actions, _components, _lib) |

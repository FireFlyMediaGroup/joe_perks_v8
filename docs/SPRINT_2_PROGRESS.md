# Joe Perks — Sprint 2 Progress Tracker

**Tracker version:** 0.13
**Baseline document:** [`docs/SPRINT_2_CHECKLIST.md`](SPRINT_2_CHECKLIST.md) (v1.0)
**Story documents:** [`docs/sprint-2/stories/`](sprint-2/stories/)
**Sprint overview:** [`docs/sprint-2/README.md`](sprint-2/README.md)
**Purpose:** Track what is actually complete in this repository for Sprint 2 (roaster onboarding, admin approval, Stripe Connect, products, shipping, org application) compared with the sprint checklist.

---

## How to use this file

- Treat `docs/SPRINT_2_CHECKLIST.md` as the **implementation plan**.
- Treat this file as the **current-state tracker**.
- Update this file whenever Sprint 2 work lands so the git diff shows exactly what changed between reviews.
- Each story has its own document in `docs/sprint-2/stories/` — update the story status there too.

### Status legend

| Status | Meaning |
|--------|---------|
| `Done` | Implemented and verified in the repo. |
| `Partial` | Started but incomplete — some files or ACs remain. |
| `Todo` | Not yet started. |

---

## Revision log

| Review version | Date | Summary |
|----------------|------|---------|
| 0.1 | 2026-03-29 | Initial tracker created. All stories at `Todo`. Sprint 2 documentation suite complete. |
| 0.2 | 2026-03-29 | US-08-06 complete: four application lifecycle templates in `packages/email/templates/`, exports in `@joe-perks/email` `package.json`. |
| 0.3 | 2026-03-29 | US-02-06 complete: `isValidSlugFormat` + `isReservedSlug` in `packages/types/src/slug-validation.ts`; `GET /api/slugs/validate` route in `apps/web` with format/reserved/DB checks + Upstash 30 req/min rate limiting. |
| 0.4 | 2026-03-29 | US-02-01 complete: 5-step roaster application form at `apps/web/app/[locale]/roasters/apply/` with Zod validation, react-hook-form, `submitRoasterApplication` server action, `limitRoasterApplication()` (3 req/hr), `sendEmail()` wiring. Schema migration added `contactName`, `phone`, `website`, `description`, `city`, `state`, `coffeeInfo` to `RoasterApplication`. |
| 0.5 | 2026-03-29 | US-02-02 complete: admin queue at `apps/admin/app/approvals/roasters/` (list + `[id]` detail), `approve`/`reject` server actions with `sendEmail()` + `revalidatePath`, `apps/admin/load-root-env.ts` + `@joe-perks/db` / `@joe-perks/email` deps. Clerk `upsertUserFromClerkWebhook` merges pre-created users by email when `externalAuthId` uses `clerk_pending:` prefix (`generatePendingClerkExternalAuthId`). |
| 0.6 | 2026-03-29 | US-02-02 follow-up: list pagination — `?page=` (1-based), 20 rows per page (`ROASTER_QUEUE_PAGE_SIZE`), `count` + `skip`/`take`, page clamped to valid range; `_lib/queue-url.ts` builds filter/pagination hrefs. `docs/AGENTS.md` clarifies `ADMIN_EMAIL` (Basic Auth) vs `ROASTER_APP_ORIGIN` (roaster portal URL for approval emails). |
| 0.7 | 2026-03-29 | US-02-03 complete: roaster onboarding page at `apps/roaster/app/(authenticated)/onboarding/` — server `page.tsx` loads `Roaster` Connect fields; `connect-status.tsx` + `start-onboarding-button.tsx`; `_lib/fetch-stripe-connect-url.ts` + `_hooks/use-stripe-refresh-redirect.ts` for `?stripe_return=1` / `?stripe_refresh=1`. Prisma `StripeOnboardingStatus` uses `PENDING` (not `IN_PROGRESS`). |
| 0.8 | 2026-03-30 | US-02-03 follow-up: `handleAccountUpdated` in `apps/web/app/api/webhooks/stripe/route.ts` now promotes `Roaster.status` from `ONBOARDING` → `ACTIVE` when `stripeOnboarding = COMPLETE` and both `chargesEnabled` + `payoutsEnabled` are true (per RA8 in `05-approval-chain.mermaid`). Guarded: never overrides `SUSPENDED`. |
| 0.9 | 2026-03-30 | US-02-04 complete: roaster product + variant CRUD at `apps/roaster/app/(authenticated)/products/` (`page.tsx`, `new/`, `[id]/`, `[id]/edit/`, `_actions/`, `_components/`, `_lib/`). Prisma migration `20260330180000_add_product_display_fields` adds optional `description`, `origin`, `imageUrl` on `Product`. Soft-delete product cascades to variants in one transaction. |
| 0.10 | 2026-03-30 | US-02-04 follow-up: UploadThing on roaster (`UPLOADTHING_TOKEN`, `app/api/uploadthing/`, `lib/uploadthing.ts`, `product-image-field.tsx`, `styles.css` imports `uploadthing/tw/v4`). Portal sidebar replaces next-forge demo (`components/sidebar.tsx`) with Dashboard / Payments / Products / Shipping / Payouts / Webhooks + Account (Clerk `useUser` + `UserButton`). `NextSSRPlugin` in `(authenticated)/layout.tsx`. |
| 0.11 | 2026-03-30 | US-02-04 review: PASS (no must-fix issues). Smoke tests 13/13 at `packages/db/scripts/smoke-products.ts`. Post-review: `docs/AGENTS.md` — added `requireRoasterId()` to tenant isolation. `docs/CONVENTIONS.md` — added server action pattern, portal route structure (`_actions/`/`_components/`/`_lib/`), dollar-to-cents form helpers, fixed missing `roaster-rejected.tsx` in template listing. |
| 0.12 | 2026-03-30 | US-02-05 complete: roaster shipping rates at `apps/roaster/app/(authenticated)/settings/shipping/` (`page.tsx`, `_actions/shipping-actions.ts`, `_lib/schema.ts`, `rate-form.tsx`, `rate-list.tsx`, `rate-delete-button.tsx`). Default-rate management in transactions; `$transaction` promotes default when needed; cannot delete last rate. Products list + product form (ACTIVE + zero rates) non-blocking alerts. |
| 0.13 | 2026-03-31 | US-03-01 complete: org application form at `apps/web/app/[locale]/orgs/apply/` (5-step form, server action, Zod schema, rate limiting, `sendEmail()`, debounced slug validation, roaster card selector, pct slider). Migration `20260330210000_add_org_application_fields` adds `orgName`, `contactName`, `phone`, `description`, `termsAgreedAt`, `termsVersion` to `OrgApplication`. `limitOrgApplication()` added to `packages/stripe`. Smoke tests: `smoke-shipping.ts` (12/12) + `smoke-org-apply.ts` (17/17). |

---

## Snapshot summary

| Area | Status | Notes |
|------|--------|-------|
| Email templates (US-08-06) | `Done` | Four templates + subject constants; `sendEmail()` wiring deferred to US-02-01 / US-02-02 / US-03-01 |
| Slug validation (US-02-06) | `Done` | `isValidSlugFormat` + `isReservedSlug` in `packages/types`; `GET /api/slugs/validate` route with format/reserved/DB/rate-limit checks |
| Roaster apply form (US-02-01) | `Done` | 5-step multi-step form with Zod validation, react-hook-form, server action, rate limiting, and `sendEmail()` wiring |
| Admin approval queue (US-02-02) | `Done` | List + detail at `apps/admin/app/approvals/roasters/`; approve/reject actions; `clerk_pending:` user rows merged on Clerk sign-in |
| Stripe Connect onboarding (US-02-03) | `Done` | Onboarding UI: `page.tsx` + `_components/connect-status.tsx`, `start-onboarding-button.tsx`, `_lib/fetch-stripe-connect-url.ts`, `_hooks/use-stripe-refresh-redirect.ts`; manual Stripe verification still recommended |
| Product & variant CRUD (US-02-04) | `Done` | List, new, detail, edit; Zod + server actions; tenant + soft delete; migration for `Product` display fields. **Reviewed:** PASS, 13/13 smoke tests. |
| Shipping rate config (US-02-05) | `Done` | CRUD + default handling; `RoasterShippingRate` + tenant scoping; product alerts |
| Org apply form (US-03-01) | `Done` | 5-step form, server action, Zod schema, debounced slug validation, roaster card selector, pct slider, `sendEmail()`. Migration adds org contact fields. |

---

## Progress matrix

### Phase 1 — Email Templates (US-08-06)

| Item | Status | Evidence / current state | Next step |
|------|--------|--------------------------|-----------|
| `roaster-application-received` template | `Done` | `packages/email/templates/roaster-application-received.tsx`; `ROASTER_APPLICATION_RECEIVED_SUBJECT`; `sendEmail()` usage documented in file | Wire in US-02-01 |
| `roaster-approved` template | `Done` | `packages/email/templates/roaster-approved.tsx`; CTA button; `ROASTER_APPROVED_SUBJECT` | Wired in US-02-02 approve action |
| `roaster-rejected` template | `Done` | `packages/email/templates/roaster-rejected.tsx`; `ROASTER_REJECTED_SUBJECT` | Wired in US-02-02 reject action |
| `org-application-received` template | `Done` | `packages/email/templates/org-application-received.tsx`; `ORG_APPLICATION_RECEIVED_SUBJECT` | Wire in US-03-01 |
| Preview verification | `Done` | `pnpm --filter email build` succeeded (templates included in preview build) | Optional: run `pnpm --filter email dev` and open `http://localhost:3004` |

### Phase 2 — Slug Validation (US-02-06)

| Item | Status | Evidence / current state | Next step |
|------|--------|--------------------------|-----------|
| Slug validation utilities | `Done` | `packages/types/src/slug-validation.ts`: `isValidSlugFormat()` (regex `^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$`, 3-63 chars) + `isReservedSlug()`. Exported from `packages/types/src/index.ts`. | Consumed by US-03-01 form + server action |
| Slug validation API route | `Done` | `apps/web/app/api/slugs/validate/route.ts`: `GET ?slug=` → format check → reserved check → `Org.slug` uniqueness → `OrgApplication.desiredSlug` (non-rejected) → `{ available, reason? }` | Consumed by US-03-01 slug input component (debounced) |
| Rate limiting | `Done` | `limitSlugValidation()` in `@joe-perks/stripe` (30 req/min per IP, prefix `jp:slug-validate`); gracefully skipped when env vars absent | None |

### Phase 3 — Roaster Application Form (US-02-01)

| Item | Status | Evidence / current state | Next step |
|------|--------|--------------------------|-----------|
| Zod validation schema | `Done` | `_lib/schema.ts`: `contactSchema`, `businessSchema`, `locationSchema`, `coffeeSchema`, `termsSchema` + merged `applicationSchema`. `US_STATES` enum, `CURRENT_TERMS_VERSION = "1.0"`. | Consumed by server action and form |
| Server action | `Done` | `_actions/submit-application.ts`: validates with Zod, rate-limits via `limitRoasterApplication()`, creates `RoasterApplication` (status = `PENDING_REVIEW`), calls `sendEmail()` with `roaster-application-received` template. Handles duplicate email (P2002). Logs only `application_id`. | None |
| Multi-step form UI | `Done` | `_components/roaster-apply-form.tsx` + `step-contact.tsx`, `step-business.tsx`, `step-location.tsx`, `step-coffee.tsx`, `step-terms.tsx`. react-hook-form + zodResolver. Progress bar, forward/back nav, per-step validation, 44px touch targets, success view. | None |
| Rate limiting | `Done` | `limitRoasterApplication()` in `@joe-perks/stripe` (3 req/hr per IP, prefix `jp:roaster-apply`); gracefully skipped without Upstash env vars | None |
| sendEmail integration | `Done` | `sendEmail()` called with `roaster-application-received` template on successful submission; failure is caught and logged (does not block success response) | None |
| Schema migration | `Done` | Migration `20260329214613_add_roaster_application_fields` added `contactName`, `phone?`, `website?`, `description?`, `city`, `state`, `coffeeInfo?` to `RoasterApplication` | None |

### Phase 4 — Admin Approval Queue (US-02-02)

| Item | Status | Evidence / current state | Next step |
|------|--------|--------------------------|-----------|
| Application list page | `Done` | `apps/admin/app/approvals/roasters/page.tsx` — Prisma `count` + `findMany` with `skip`/`take`, status filter via `?status=`, pagination via `?page=` (20 per page, `ROASTER_QUEUE_PAGE_SIZE`), default `PENDING_REVIEW` | None |
| Application detail view | `Done` | `apps/admin/app/approvals/roasters/[id]/page.tsx` — all `RoasterApplication` fields | None |
| Approve server action | `Done` | `_actions/approve-application.ts` — `$transaction` updates app, creates `Roaster` + `User` (`generatePendingClerkExternalAuthId`), then `sendEmail` + `revalidatePath` | None |
| Reject server action | `Done` | `_actions/reject-application.ts` — `$transaction` updates status, then `sendEmail` + `revalidatePath` | None |
| Confirmation dialogs | `Done` | `_components/approve-reject-buttons.tsx` (client) — `<dialog>` confirm for approve/reject | None |
| Clerk merge | `Done` | `packages/db/clerk-user-sync.ts` — if `User` exists by email with `clerk_pending:*` id, update `externalAuthId` to Clerk user id | None |

### Phase 5 — Stripe Connect Onboarding (US-02-03)

| Item | Status | Evidence / current state | Next step |
|------|--------|--------------------------|-----------|
| Onboarding page | `Done` | `page.tsx` — `auth()` + `User.roasterId` → `Roaster` Connect fields; errors if no profile/roaster | None |
| Connect status component | `Done` | `connect-status.tsx` — badges for `NOT_STARTED` / `PENDING` / `COMPLETE` / `RESTRICTED`, charges/payouts flags, success card with `/products` + `/dashboard` | None |
| Start onboarding button | `Done` | `start-onboarding-button.tsx` + `fetchStripeConnectUrl()` | None |
| Return/refresh handling | `Done` | `stripe_return` banner; `useStripeRefreshRedirect` for `stripe_refresh` → POST + redirect | Manual E2E with Stripe test mode |
| Webhook ACTIVE promotion | `Done` | `handleAccountUpdated` promotes `Roaster.status` `ONBOARDING` → `ACTIVE` when `COMPLETE` + both flags true; guarded against `SUSPENDED` | None |
| Smoke tests | `Done` | `packages/db/scripts/smoke-onboarding.ts` — 7 tests (DB state, API auth, webhook, tenant isolation) + `seed-smoke-roaster.ts` for test data | None |

### Phase 6 — Product & Variant CRUD (US-02-04)

| Item | Status | Evidence / current state | Next step |
|------|--------|--------------------------|-----------|
| Validation schemas | `Done` | `_lib/schema.ts` — product + variant Zod schemas; `_lib/money.ts`, `_lib/format.ts` | None |
| Product server actions | `Done` | `_actions/product-actions.ts` — create, update, soft-delete; `requireRoasterId()` | Reviewed: PASS |
| Variant server actions | `Done` | `_actions/variant-actions.ts` — create, update, soft-delete; SKU P2002 handling | Reviewed: PASS |
| Product list page | `Done` | `products/page.tsx` + `product-list.tsx` | None |
| Product create/edit pages | `Done` | `new/page.tsx`, `[id]/edit/page.tsx`, `product-form.tsx` | None |
| Product detail + variant list | `Done` | `[id]/page.tsx`, `variant-list.tsx`, `variant-form.tsx`, delete buttons | None |
| DB migration | `Done` | `20260330180000_add_product_display_fields` — `description`, `origin`, `imageUrl` on `Product` | Smoke test confirms applied |

### Phase 7 — Shipping Rate Configuration (US-02-05)

| Item | Status | Evidence / current state | Next step |
|------|--------|--------------------------|-----------|
| Validation schema | `Done` | `_lib/schema.ts` — `shippingRateFieldsSchema` (label, carrier, `flatRateCents` positive int, `isDefault`) | None |
| Server actions | `Done` | `shipping-actions.ts` — `createRate`, `updateRate`, `deleteRate`; `parseDollarsToCents` from products `_lib/money`; `requireRoasterId()` | None |
| Shipping settings page | `Done` | `page.tsx` — `findMany` by `roasterId`; `RateList` | None |
| Rate form component | `Done` | `rate-form.tsx`, `rate-list.tsx`, `rate-delete-button.tsx` | None |
| Product warnings | `Done` | `products/page.tsx` alert when zero rates; `ProductForm` alert when `ACTIVE` + zero rates | None |

### Phase 8 — Org Application Form (US-03-01)

| Item | Status | Evidence / current state | Next step |
|------|--------|--------------------------|-----------|
| Zod validation schema | `Done` | `apps/web/app/[locale]/orgs/apply/_lib/schema.ts` — per-step + full `orgApplicationSchema`; `CURRENT_ORG_TERMS_VERSION`. | None |
| Server action | `Done` | `_actions/submit-application.ts` — `submitOrgApplication()`; `$transaction` creates `OrgApplication` + `RoasterOrgRequest`(s); re-validates slug; checks pct bounds vs `PlatformSettings`; `limitOrgApplication()`; `sendEmail()`. | None |
| Page server component | `Done` | `page.tsx` — loads active roasters (with `application.businessName` include) + `platformSettings` singleton; passes to `OrgApplyForm`. | None |
| Multi-step form UI | `Done` | `org-apply-form.tsx` — 5 steps; step validation; progress bar; success state; nav buttons with loading. | None |
| Slug input (StepStorefront) | `Done` | `step-storefront.tsx` — debounced 350ms fetch to `/api/slugs/validate`; abort on new input; icons for checking/available/taken. | None |
| Roaster selector (StepRoaster) | `Done` | `step-roaster.tsx` — card-based primary + optional backup; `RoasterCard` component. | None |
| Pct slider (StepRoaster) | `Done` | Radix `Slider` in `step-roaster.tsx`; min/max from `PlatformSettings`; live $ example per $20 bag. | None |
| DB migration | `Done` | `20260330210000_add_org_application_fields` — adds `orgName`, `contactName`, `phone`, `description`, `termsAgreedAt`, `termsVersion` to `OrgApplication`. Second auto-migration drops temporary defaults. | None |

---

## Known infrastructure notes

These items from the Sprint 1 scaffold affect Sprint 2 implementation:

1. **Root `.env` loading** — `apps/web` and `apps/admin` both have `load-root-env.ts` (imported in `next.config.ts`). If `apps/roaster` or `apps/org` need root `.env` values (e.g. `DATABASE_URL`), add a similar loader.
2. **Clerk user sync** — When a roaster signs up via Clerk, the webhook at `apps/roaster/app/api/webhooks/clerk/route.ts` upserts a `User` record. US-02-02 pre-creates the `User` with `clerk_pending:{uuid}`; `upsertUserFromClerkWebhook` links the real Clerk id when the email matches the pending row.
3. **Roaster sidebar** — `apps/roaster/app/(authenticated)/components/sidebar.tsx` uses portal nav (Dashboard, Payments, Products, Shipping, etc.); see US-02-04 follow-up.
4. **Middleware API exclusion** — `apps/web/proxy.ts` matcher already excludes `api` paths. New API routes under `apps/web/app/api/` will work without middleware changes.
5. **Next.js 16 middleware → proxy migration** — `middleware.ts` files deleted from `apps/web`, `apps/org`, `apps/roaster` (Next.js 16 conflicts when both `middleware.ts` and `proxy.ts` exist). `apps/admin` retains `middleware.ts` (no `proxy.ts`). Middleware logic lives in `proxy.ts` for web/roaster/org.
6. **Rate limiting imports** — Do not import `@upstash/ratelimit` or `@upstash/redis` directly in apps. Use the limiters from `@joe-perks/stripe` (e.g. `limitCheckout`, `limitSlugValidation`). The Upstash packages are dependencies of `packages/stripe`, not of the apps.

---

## Document sync checklist

After each story completes:

- [x] Update this file's revision log and status columns (US-08-06, US-02-06, US-02-03, US-02-04, US-02-05, US-03-01)
- [x] Update the story's own status in `docs/sprint-2/stories/US-XX-XX-*.md` (US-08-06, US-02-06, US-02-03, US-02-04, US-02-05, US-03-01)
- [x] Update [`docs/sprint-2/README.md`](sprint-2/README.md) story table if anything changed (US-08-06, US-02-06, US-02-03, US-02-04, US-02-05, US-03-01)
- [x] Update [`docs/SCAFFOLD_PROGRESS.md`](SCAFFOLD_PROGRESS.md) snapshot summary (US-08-06 — email row, US-02-06 — types row, US-02-03 — Stripe/auth rows, US-02-04 — products/portals rows, US-02-05 — shipping, US-03-01 — org apply form)
- [x] Verify new files/routes align with [`docs/01-project-structure.mermaid`](01-project-structure.mermaid) — update diagram if new routes were added (US-02-04 — `R_PROD`, `R_UT` nodes added; US-02-05 — `R_SHIP` detail)
- [x] Verify data flows align with [`docs/05-approval-chain.mermaid`](05-approval-chain.mermaid) (US-02-03 onboarding UI)
- [x] Verify schema usage aligns with [`docs/06-database-schema.mermaid`](06-database-schema.mermaid) (US-02-03 uses `Roaster.stripeOnboarding`, `chargesEnabled`, `payoutsEnabled`, `status` — all present in schema)
- [x] If new patterns were introduced, update [`docs/CONVENTIONS.md`](CONVENTIONS.md) — US-02-04: added server action pattern, portal route structure, dollar-to-cents helpers, fixed template listing

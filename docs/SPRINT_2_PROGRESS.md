# Joe Perks — Sprint 2 Progress Tracker

**Tracker version:** 0.3
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

---

## Snapshot summary

| Area | Status | Notes |
|------|--------|-------|
| Email templates (US-08-06) | `Done` | Four templates + subject constants; `sendEmail()` wiring deferred to US-02-01 / US-02-02 / US-03-01 |
| Slug validation (US-02-06) | `Done` | `isValidSlugFormat` + `isReservedSlug` in `packages/types`; `GET /api/slugs/validate` route with format/reserved/DB/rate-limit checks |
| Roaster apply form (US-02-01) | `Todo` | Scaffold placeholder at `apps/web/app/[locale]/roasters/apply/page.tsx` |
| Admin approval queue (US-02-02) | `Todo` | Scaffold placeholder at `apps/admin/app/approvals/roasters/page.tsx`; HTTP Basic Auth already active |
| Stripe Connect onboarding (US-02-03) | `Todo` | `POST /api/stripe/connect` route works; `account.updated` webhook works; onboarding page is scaffold |
| Product & variant CRUD (US-02-04) | `Todo` | Schema models exist; scaffold placeholder at products page |
| Shipping rate config (US-02-05) | `Todo` | Schema model exists; scaffold placeholder at shipping settings page |
| Org apply form (US-03-01) | `Todo` | Scaffold placeholder at `apps/web/app/[locale]/orgs/apply/page.tsx` |

---

## Progress matrix

### Phase 1 — Email Templates (US-08-06)

| Item | Status | Evidence / current state | Next step |
|------|--------|--------------------------|-----------|
| `roaster-application-received` template | `Done` | `packages/email/templates/roaster-application-received.tsx`; `ROASTER_APPLICATION_RECEIVED_SUBJECT`; `sendEmail()` usage documented in file | Wire in US-02-01 |
| `roaster-approved` template | `Done` | `packages/email/templates/roaster-approved.tsx`; CTA button; `ROASTER_APPROVED_SUBJECT` | Wire in US-02-02 approve |
| `roaster-rejected` template | `Done` | `packages/email/templates/roaster-rejected.tsx`; `ROASTER_REJECTED_SUBJECT` | Wire in US-02-02 reject |
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
| Zod validation schema | `Todo` | Not created. | Create `_lib/schema.ts` |
| Server action | `Todo` | Not created. | Create `_actions/submit-application.ts` |
| Multi-step form UI | `Todo` | Scaffold placeholder exists. | Create form components, replace scaffold |
| Rate limiting | `Todo` | Upstash available. | Add application submission limiter |
| sendEmail integration | `Todo` | `sendEmail()` available; template needed from Phase 1. | Wire call after DB insert |

### Phase 4 — Admin Approval Queue (US-02-02)

| Item | Status | Evidence / current state | Next step |
|------|--------|--------------------------|-----------|
| Application list page | `Todo` | Scaffold placeholder exists. HTTP Basic Auth active via `apps/admin/middleware.ts`. | Replace scaffold with server component + Prisma queries |
| Application detail view | `Todo` | Not created. | Build inline or [id] page |
| Approve server action | `Todo` | Not created. | Create action with $transaction |
| Reject server action | `Todo` | Not created. | Create action |
| Confirmation dialogs | `Todo` | Not created. | Add client component wrappers |

### Phase 5 — Stripe Connect Onboarding (US-02-03)

| Item | Status | Evidence / current state | Next step |
|------|--------|--------------------------|-----------|
| Onboarding page | `Todo` | Scaffold exists. `POST /api/stripe/connect` is fully implemented. | Replace scaffold with real page |
| Connect status component | `Todo` | Status enums (`StripeOnboardingStatus`) defined in schema. | Create status display component |
| Start onboarding button | `Todo` | API route returns `{ url }`. | Create button component that calls route + redirects |
| Return/refresh handling | `Todo` | Route already sets `?stripe_return=1` and `?stripe_refresh=1` URLs. | Handle search params on page load |

### Phase 6 — Product & Variant CRUD (US-02-04)

| Item | Status | Evidence / current state | Next step |
|------|--------|--------------------------|-----------|
| Validation schemas | `Todo` | `Product` and `ProductVariant` models in Prisma schema. | Create Zod schemas |
| Product server actions | `Todo` | Not created. | Create CRUD actions with tenant scoping + soft delete |
| Variant server actions | `Todo` | Not created. | Create CRUD actions with price validation |
| Product list page | `Todo` | Scaffold placeholder. | Replace with server component |
| Product create/edit pages | `Todo` | Not created. | Build form pages |
| Product detail + variant list | `Todo` | Not created. | Build detail page |

### Phase 7 — Shipping Rate Configuration (US-02-05)

| Item | Status | Evidence / current state | Next step |
|------|--------|--------------------------|-----------|
| Validation schema | `Todo` | `RoasterShippingRate` model in Prisma schema. | Create Zod schema |
| Server actions | `Todo` | Not created. | Create CRUD actions with default management |
| Shipping settings page | `Todo` | Scaffold placeholder. | Replace with real page |
| Rate form component | `Todo` | Not created. | Create form with dollar-to-cents conversion |

### Phase 8 — Org Application Form (US-03-01)

| Item | Status | Evidence / current state | Next step |
|------|--------|--------------------------|-----------|
| Zod validation schema | `Todo` | `OrgApplication` and `RoasterOrgRequest` models in schema. | Create schema |
| Server action | `Todo` | Not created. | Create with $transaction for app + requests |
| Page server component | `Todo` | Scaffold placeholder. | Load active roasters + platform settings |
| Multi-step form UI | `Todo` | Scaffold placeholder. | Create form with slug validation, roaster selector, pct slider |
| Slug input component | `Todo` | Validation API from Phase 2 needed. | Create with debounced fetch |

---

## Known infrastructure notes

These items from the Sprint 1 scaffold affect Sprint 2 implementation:

1. **Root `.env` loading** — Only `apps/web` has `load-root-env.ts`. If `apps/roaster` or `apps/admin` need root `.env` values (e.g. `DATABASE_URL`), add a similar loader imported in their `next.config.ts`.
2. **Clerk user sync** — When a roaster signs up via Clerk, the webhook at `apps/roaster/app/api/webhooks/clerk/route.ts` upserts a `User` record. US-02-02 pre-creates the `User` record on approval; verify the Clerk webhook handles the "user already exists, update `externalAuthId`" case.
3. **Roaster sidebar** — `apps/roaster/app/(authenticated)/components/sidebar.tsx` is still next-forge demo nav. Consider updating to real links (dashboard, onboarding, products, shipping) as part of Sprint 2 or as a follow-up.
4. **Middleware API exclusion** — `apps/web/proxy.ts` matcher already excludes `api` paths. New API routes under `apps/web/app/api/` will work without middleware changes.
5. **Next.js 16 middleware → proxy migration** — `middleware.ts` files deleted from `apps/web`, `apps/org`, `apps/roaster` (Next.js 16 conflicts when both `middleware.ts` and `proxy.ts` exist). `apps/admin` retains `middleware.ts` (no `proxy.ts`). Middleware logic lives in `proxy.ts` for web/roaster/org.
6. **Rate limiting imports** — Do not import `@upstash/ratelimit` or `@upstash/redis` directly in apps. Use the limiters from `@joe-perks/stripe` (e.g. `limitCheckout`, `limitSlugValidation`). The Upstash packages are dependencies of `packages/stripe`, not of the apps.

---

## Document sync checklist

After each story completes:

- [x] Update this file's revision log and status columns (US-08-06, US-02-06)
- [x] Update the story's own status in `docs/sprint-2/stories/US-XX-XX-*.md` (US-08-06, US-02-06)
- [x] Update [`docs/sprint-2/README.md`](sprint-2/README.md) story table if anything changed (US-08-06, US-02-06)
- [x] Update [`docs/SCAFFOLD_PROGRESS.md`](SCAFFOLD_PROGRESS.md) snapshot summary (US-08-06 — email row, US-02-06 — types row)
- [ ] Verify new files/routes align with [`docs/01-project-structure.mermaid`](01-project-structure.mermaid) — update diagram if new routes were added
- [ ] Verify data flows align with [`docs/05-approval-chain.mermaid`](05-approval-chain.mermaid)
- [ ] Verify schema usage aligns with [`docs/06-database-schema.mermaid`](06-database-schema.mermaid)
- [ ] If new patterns were introduced, update [`docs/CONVENTIONS.md`](CONVENTIONS.md)

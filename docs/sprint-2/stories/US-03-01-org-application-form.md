# US-03-01 — Org Application Form (5 Steps) on Main Site

**Story ID:** US-03-01 | **Epic:** EP-03 (Org Onboarding)
**Points:** 8 | **Priority:** High
**Status:** `Todo`
**Owner:** Frontend / Full-stack
**Dependencies:** US-01-02 (DB Foundation), US-01-04 (Email Pipeline), US-02-06 (Slug Validation)
**Depends on this:** None within Sprint 2 (admin org approval is Sprint 3+)

---

## Goal

Replace the placeholder at `apps/web/app/[locale]/orgs/apply/page.tsx` with a real 5-step multi-step application form. Orgs apply to run fundraising campaigns by selecting a preferred roaster, choosing a storefront slug, setting a desired fundraiser percentage, and agreeing to terms. On submission, the system creates an `OrgApplication` and `RoasterOrgRequest` records.

---

## Diagram references

- **Approval chain:** [`docs/05-approval-chain.mermaid`](../../05-approval-chain.mermaid) — nodes **OA1** (Org submits 5-step application, selects preferred roasters) and **OA2** (OrgApplication created, status = PENDING_PLATFORM_REVIEW, RoasterOrgRequest records created)
- **Database ERD:** [`docs/06-database-schema.mermaid`](../../06-database-schema.mermaid) — `OrgApplication`, `RoasterOrgRequest`, `Org` models
- **Project structure:** [`docs/01-project-structure.mermaid`](../../01-project-structure.mermaid) — `[locale]/orgs/apply/` route

---

## Current repo evidence

- `apps/web/app/[locale]/orgs/apply/page.tsx` exists as scaffold placeholder
- `OrgApplication` model in schema: `id`, `status` (`OrgApplicationStatus`), `email`, `orgName`, `contactName`, `phone`, `description`, `desiredSlug`, `desiredOrgPct`, `termsAgreedAt`, `termsVersion`
- `OrgApplicationStatus` enum: `PENDING_PLATFORM_REVIEW`, `PENDING_ROASTER_APPROVAL`, `APPROVED`, `REJECTED`
- `RoasterOrgRequest` model: `id`, `applicationId`, `roasterId`, `status` (`RoasterOrgRequestStatus`), `priority`
- `RoasterOrgRequestStatus` enum: `PENDING`, `APPROVED`, `DECLINED`
- Unique constraint on `RoasterOrgRequest`: `@@unique([applicationId, roasterId])`
- `Roaster` model with `status` field — only `ACTIVE` roasters should be selectable
- Slug validation API available from US-02-06 at `GET /api/slugs/validate?slug=...`
- `RESERVED_SLUGS` in `packages/types/src/slugs.ts`
- `PlatformSettings` singleton has `orgPctMin` (0.05), `orgPctMax` (0.25), `orgPctDefault` (0.15)

---

## AGENTS.md rules that apply

- **Money as cents / percentages:** `desiredOrgPct` is a `Float` representing a percentage (0.05 = 5%, 0.25 = 25%). Validate it falls within `PlatformSettings.orgPctMin` and `orgPctMax`.
- **Logging/PII:** Never log applicant email, phone, or contact name. Log only application ID.
- **Email:** Use `sendEmail()` from `@joe-perks/email`. Template: `org-application-received` (US-08-06).

**CONVENTIONS.md patterns:**
- Server components for the page shell; client component for the multi-step form
- Server action for form submission with validation
- Database queries use generated Prisma client types

---

## In scope

- 5-step multi-step form with client-side step navigation and validation
- Server action to persist `OrgApplication` + `RoasterOrgRequest` records in a transaction
- Real-time slug validation via US-02-06 endpoint (debounced as user types)
- Roaster selection from a list of `ACTIVE` roasters (with primary/backup priority)
- Fundraiser percentage selection within platform bounds (`orgPctMin` to `orgPctMax`)
- Terms agreement capture
- Rate limiting on submission
- Confirmation screen on success
- Call `sendEmail()` with `org-application-received` template

### Form steps (suggested)

| Step | Fields | Notes |
|------|--------|-------|
| 1 — Organization | `orgName`, `contactName`, `email`, `phone` | Basic org info |
| 2 — Description | `description`, org type (school, nonprofit, sports team, etc.) | Helps admin evaluate |
| 3 — Storefront | `desiredSlug` (with live validation), storefront preview | Validated via `/api/slugs/validate` |
| 4 — Roaster & Split | Select preferred roaster(s) from ACTIVE list, set `desiredOrgPct` (slider or input within bounds) | Creates `RoasterOrgRequest` records with priority |
| 5 — Terms | Terms checkbox, `termsVersion` display | Must check to submit |

---

## Out of scope

- Platform admin review of org applications (Sprint 3 — separate approval queue)
- Roaster review of org requests via magic link (Sprint 3)
- Stripe Connect for orgs (Sprint 3)
- Campaign creation (Sprint 3+)
- Org portal functionality beyond the application

---

## Primary files to create or modify

| Action | File | Purpose |
|--------|------|---------|
| Modify | `apps/web/app/[locale]/orgs/apply/page.tsx` | Server component — renders the form, loads active roasters list |
| Create | `apps/web/app/[locale]/orgs/apply/_components/org-apply-form.tsx` | Client component — 5-step form with state management |
| Create | `apps/web/app/[locale]/orgs/apply/_components/step-*.tsx` | Individual step components |
| Create | `apps/web/app/[locale]/orgs/apply/_components/slug-input.tsx` | Client component — slug input with debounced validation |
| Create | `apps/web/app/[locale]/orgs/apply/_components/roaster-selector.tsx` | Client component — select roaster(s) with priority |
| Create | `apps/web/app/[locale]/orgs/apply/_components/org-pct-slider.tsx` | Client component — percentage selector within platform bounds |
| Create | `apps/web/app/[locale]/orgs/apply/_actions/submit-application.ts` | Server action — validates, creates OrgApplication + RoasterOrgRequest records |
| Create | `apps/web/app/[locale]/orgs/apply/_lib/schema.ts` | Zod validation schema |

---

## Acceptance criteria

- [ ] The form at `/orgs/apply` renders a 5-step multi-step form
- [ ] Users can navigate forward and backward between steps
- [ ] Each step validates its fields before allowing advancement
- [ ] The slug input validates in real-time against `/api/slugs/validate` (debounced 300ms+)
- [ ] Slug validation shows: available (green check), taken/reserved (red X with reason), loading state
- [ ] The roaster selection step shows only `ACTIVE` roasters (queried from DB)
- [ ] At least one roaster must be selected; optionally a backup roaster with `priority = 2`
- [ ] The fundraiser percentage (`desiredOrgPct`) is constrained between `PlatformSettings.orgPctMin` and `orgPctMax`
- [ ] The default percentage value is `PlatformSettings.orgPctDefault`
- [ ] The final step requires a terms-of-service checkbox
- [ ] On submission, an `OrgApplication` is created with `status = PENDING_PLATFORM_REVIEW`
- [ ] `RoasterOrgRequest` records are created for each selected roaster with correct `priority`
- [ ] Both records are created in a single database transaction
- [ ] `sendEmail()` is called with template `org-application-received`
- [ ] Rate limiting prevents more than 3 submissions per IP per hour
- [ ] Duplicate `desiredSlug` submissions are rejected (unique constraint)
- [ ] Duplicate `email` submissions are rejected
- [ ] A confirmation screen appears after successful submission
- [ ] No PII is logged — only the application ID
- [ ] The form is mobile-responsive with 44x44px minimum touch targets
- [ ] The scaffold placeholder text is removed

---

## Suggested implementation steps

1. Define Zod schemas in `_lib/schema.ts` for the full org application form.
2. Build the server action in `_actions/submit-application.ts`:
   - Validate all fields with Zod
   - Re-validate slug availability (race condition guard — slug could be taken between check and submit)
   - Validate `desiredOrgPct` against `PlatformSettings` bounds
   - Use `database.$transaction()` to create `OrgApplication` + `RoasterOrgRequest` records
   - Call `sendEmail()` with confirmation template
   - Apply rate limiting
3. Create the `page.tsx` server component that loads:
   - Active roasters list (for the selector): `database.roaster.findMany({ where: { status: 'ACTIVE' } })`
   - Platform settings (for org pct bounds): `database.platformSettings.findUnique({ where: { id: 'singleton' } })`
4. Build the multi-step form client component with step state.
5. Build the slug input component with debounced fetch to `/api/slugs/validate`.
6. Build the roaster selector component (card-based selection with primary/backup).
7. Build the org-pct slider/input with min/max/default from platform settings.
8. Add step components for each form step.
9. Test: full submission flow, slug validation (reserved, taken, valid), roaster selection, percentage bounds, duplicate prevention.

---

## Handoff notes

- The org application now enters the platform admin approval queue (Sprint 3). After platform approval, the application status moves to `PENDING_ROASTER_APPROVAL` and a magic link is sent to the selected roaster for review. This flow is documented in `docs/05-approval-chain.mermaid` nodes OA3-OA10.
- The `RoasterOrgRequest.priority` field (1 = primary, 2 = backup) determines which roaster is contacted first. If the primary declines, the system contacts the backup.
- The `desiredSlug` becomes `Org.slug` when the org is ultimately approved and created.

---

## Revision log

| Version | Date | Notes |
|---------|------|-------|
| 0.1 | 2026-03-29 | Initial story created for Sprint 2 planning. |

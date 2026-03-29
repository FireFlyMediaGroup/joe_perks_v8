# US-02-01 — Roaster Application Form (5 Steps)

**Story ID:** US-02-01 | **Epic:** EP-02 (Roaster Onboarding)
**Points:** 8 | **Priority:** High
**Status:** `Todo`
**Owner:** Frontend / Full-stack
**Dependencies:** US-01-02 (DB Foundation), US-01-04 (Email Pipeline)
**Depends on this:** US-02-02 (Admin Approval Queue)

---

## Goal

Replace the placeholder at `apps/web/app/[locale]/roasters/apply/page.tsx` with a real 5-step multi-step application form that creates a `RoasterApplication` in the database, captures terms agreement, and sends a confirmation email to the applicant.

---

## Diagram references

- **Approval chain:** [`docs/05-approval-chain.mermaid`](../../05-approval-chain.mermaid) — nodes **RA1** (Roaster submits 5-step application) and **RA2** (RoasterApplication created, status = PENDING_REVIEW, terms_agreed_at set)
- **Database ERD:** [`docs/06-database-schema.mermaid`](../../06-database-schema.mermaid) — `RoasterApplication` model
- **Project structure:** [`docs/01-project-structure.mermaid`](../../01-project-structure.mermaid) — `[locale]/roasters/apply/` route

---

## Current repo evidence

- `apps/web/app/[locale]/roasters/apply/page.tsx` exists as a scaffold placeholder (heading + "replace with onboarding flow" text)
- `RoasterApplication` model exists in `packages/db/prisma/schema.prisma` with fields: `id`, `status` (`ApplicationStatus`), `email`, `businessName`, `termsAgreedAt`, `termsVersion`, `phone`, `website`, `description`, `city`, `state`
- `ApplicationStatus` enum: `PENDING_REVIEW`, `APPROVED`, `REJECTED`
- `sendEmail()` available from `@joe-perks/email`
- Rate limiting via `@joe-perks/stripe` (Upstash-based)

---

## AGENTS.md rules that apply

- **Logging/PII:** Never log applicant email or personal details. Log only application ID on creation.
- **Money:** Not directly relevant to this story (no pricing fields).
- **Email:** Use `sendEmail()` from `@joe-perks/email` — never import Resend directly. Template: `roaster-application-received` (see US-08-06).

**CONVENTIONS.md patterns:**
- Server components for the page shell; client component for the multi-step form (needs state for step navigation)
- API route or server action pattern for form submission
- Error responses: `{ error: string, code: string }` with appropriate HTTP status

---

## In scope

- 5-step multi-step form with client-side step navigation and validation
- Server action or API route to persist `RoasterApplication` to database
- Terms of service agreement capture (`termsAgreedAt`, `termsVersion`)
- Rate limiting on form submission (prevent spam applications)
- Confirmation screen on successful submission
- Call `sendEmail()` with `roaster-application-received` template on success (template created in US-08-06; if not yet available, wire the call with a TODO comment)
- Form field validation (email format, required fields, etc.)
- Mobile-responsive form layout

### Form steps (suggested)

| Step | Fields | Notes |
|------|--------|-------|
| 1 — Contact | `email`, `phone`, contact name | Email becomes `RoasterApplication.email` |
| 2 — Business | `businessName`, `website`, `description` | Business details |
| 3 — Location | `city`, `state` | Roastery location |
| 4 — Coffee | Roast specialties, production capacity (informational, stored in description or JSON) | Helps admin evaluate |
| 5 — Terms | Terms checkbox, `termsVersion` display | Must check to submit; sets `termsAgreedAt` |

---

## Out of scope

- Admin approval flow (US-02-02)
- Stripe Connect setup (US-02-03)
- Creating the `Roaster` record (happens on admin approval)
- Image/logo upload during application
- Email template implementation (US-08-06 — but wire the `sendEmail` call)

---

## Primary files to create or modify

| Action | File | Purpose |
|--------|------|---------|
| Modify | `apps/web/app/[locale]/roasters/apply/page.tsx` | Server component shell — renders the form |
| Create | `apps/web/app/[locale]/roasters/apply/_components/roaster-apply-form.tsx` | Client component — 5-step form with state management |
| Create | `apps/web/app/[locale]/roasters/apply/_components/step-*.tsx` | Individual step components (one per step) |
| Create | `apps/web/app/[locale]/roasters/apply/_actions/submit-application.ts` | Server action — validates, rate-limits, creates DB record, sends email |
| Create | `apps/web/app/[locale]/roasters/apply/_lib/schema.ts` | Zod validation schema for the application form |

---

## Acceptance criteria

- [ ] The form at `/roasters/apply` renders a 5-step multi-step form (not a single long form)
- [ ] Users can navigate forward and backward between steps
- [ ] Each step validates its fields before allowing the user to proceed
- [ ] The final step requires a terms-of-service checkbox before submission
- [ ] On submission, a `RoasterApplication` is created with `status = PENDING_REVIEW` and `termsAgreedAt = now()`
- [ ] The `termsVersion` field stores a version string (e.g. `"1.0"`)
- [ ] Duplicate email submissions are rejected (database `email` unique constraint on `RoasterApplication`)
- [ ] Rate limiting prevents more than 3 submissions per IP per hour
- [ ] `sendEmail()` is called with template `roaster-application-received` on successful submission
- [ ] A confirmation/thank-you screen appears after successful submission
- [ ] The form is mobile-responsive with minimum 44x44px touch targets
- [ ] No PII (email, phone, name) is logged — only the application ID
- [ ] The form placeholder text is removed from the page

---

## Suggested implementation steps

1. Define a Zod schema in `_lib/schema.ts` covering all form fields across the 5 steps.
2. Create individual step components (`step-contact.tsx`, `step-business.tsx`, etc.) that each receive and update form state.
3. Build the `roaster-apply-form.tsx` client component with step state management (current step index, form data, step validation).
4. Create the server action in `_actions/submit-application.ts`:
   - Parse and validate the full form with Zod
   - Apply rate limiting using Upstash (import from `@joe-perks/stripe` or create a dedicated `applicationLimiter`)
   - Create the `RoasterApplication` record in the database
   - Call `sendEmail()` with the confirmation template
   - Return success or error
5. Update `page.tsx` to import and render the form component.
6. Add a success/confirmation view that shows after submission.
7. Test: submit with valid data, verify DB record, verify duplicate rejection, verify rate limiting.

---

## Handoff notes

- US-02-02 (Admin Approval Queue) will query `RoasterApplication` records created by this form. The `status` field filtering and the application data shape are the contract between these stories.
- US-08-06 (Notifications) creates the `roaster-application-received` email template. If US-08-06 is not complete when this story ships, stub the `sendEmail()` call with a TODO.
- The form's terms version string (`termsVersion`) should match whatever is displayed at `/terms/roasters` — coordinate with the legal placeholder pages from Sprint 1.

---

## Revision log

| Version | Date | Notes |
|---------|------|-------|
| 0.1 | 2026-03-29 | Initial story created for Sprint 2 planning. |

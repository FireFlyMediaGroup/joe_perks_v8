# US-02-02 — Admin Approval Queue for Roaster Applications

**Story ID:** US-02-02 | **Epic:** EP-02 (Roaster Onboarding)
**Points:** 5 | **Priority:** High
**Status:** `Todo`
**Owner:** Full-stack
**Dependencies:** US-02-01 (Roaster Application Form), US-01-03 (Admin Auth)
**Depends on this:** US-02-03 (Stripe Connect Onboarding)

---

## Goal

Replace the placeholder at `apps/admin/app/approvals/roasters/page.tsx` with a real approval queue that lists pending `RoasterApplication` records, allows the admin to approve or reject each application, and on approval creates the `Roaster` and `User` records needed for the roaster to begin onboarding.

---

## Diagram references

- **Approval chain:** [`docs/05-approval-chain.mermaid`](../../05-approval-chain.mermaid) — nodes **RA3** (Admin reviews in queue), **RA4** (Admin decision), **RA5** (Rejected + email), **RA6** (Roaster record created, Stripe Express account created, onboarding email sent)
- **Database ERD:** [`docs/06-database-schema.mermaid`](../../06-database-schema.mermaid) — `RoasterApplication`, `Roaster`, `User`
- **Project structure:** [`docs/01-project-structure.mermaid`](../../01-project-structure.mermaid) — `approvals/roasters/` route in `apps/admin`

---

## Current repo evidence

- `apps/admin/app/approvals/roasters/page.tsx` exists as scaffold text only
- `apps/admin/middleware.ts` implements HTTP Basic Auth — admin routes are already protected
- `RoasterApplication` model has `status` field (`ApplicationStatus`: `PENDING_REVIEW`, `APPROVED`, `REJECTED`)
- `Roaster` model has `applicationId` FK, `status` (`RoasterStatus`: `ONBOARDING`, `ACTIVE`, `SUSPENDED`), `stripeAccountId`, `stripeOnboarding`
- `User` model has `externalAuthId`, `role` (`UserRole`), `roasterId`
- `sendEmail()` is available from `@joe-perks/email`
- Clerk is configured for the roaster app (can create invites or send onboarding emails)

---

## AGENTS.md rules that apply

- **Tenant isolation:** Admin queries may scope globally — this is intentional.
- **Email:** Use `sendEmail()` — never import Resend directly. Templates: `roaster-approved` and `roaster-rejected` (US-08-06).
- **Logging:** Do not log applicant PII. Log only application ID, action taken.

**CONVENTIONS.md patterns:**
- Server components for the list page; server actions for approve/reject mutations
- Error responses follow `{ error: string, code: string }` pattern
- Database queries use generated Prisma client types — do not manually type DB rows

---

## In scope

- List view of `RoasterApplication` records with status filtering (default: `PENDING_REVIEW`)
- Application detail view showing all submitted fields
- **Approve action** that:
  1. Updates `RoasterApplication.status` to `APPROVED`
  2. Creates a `Roaster` record (status = `ONBOARDING`, linked via `applicationId`)
  3. Creates a `User` record (role = `ROASTER_ADMIN`, linked via `roasterId`, email from application)
  4. Sends `roaster-approved` email (or `welcome` email with role = `roaster`) via `sendEmail()`
- **Reject action** that:
  1. Updates `RoasterApplication.status` to `REJECTED`
  2. Sends `roaster-rejected` email via `sendEmail()`
- Both actions wrapped in a database transaction
- Confirmation dialogs before approve/reject
- Pagination or scroll-based loading for the queue

---

## Out of scope

- Stripe Express account creation (happens in US-02-03 when roaster logs in)
- Clerk user invitation (the roaster will sign up via Clerk independently; the `User` record is pre-created so the Clerk webhook sync can link it)
- Org application approval (separate queue, Sprint 3+)
- Admin dashboard metrics or analytics

---

## Primary files to create or modify

| Action | File | Purpose |
|--------|------|---------|
| Modify | `apps/admin/app/approvals/roasters/page.tsx` | Server component — fetches and displays application queue |
| Create | `apps/admin/app/approvals/roasters/_components/application-list.tsx` | List/table of applications with status badges |
| Create | `apps/admin/app/approvals/roasters/_components/application-detail.tsx` | Expanded view of a single application |
| Create | `apps/admin/app/approvals/roasters/_actions/approve-application.ts` | Server action — approve flow (transaction: update app, create roaster, create user, send email) |
| Create | `apps/admin/app/approvals/roasters/_actions/reject-application.ts` | Server action — reject flow (update status, send email) |
| Create | `apps/admin/app/approvals/roasters/[id]/page.tsx` | Optional: dedicated detail page for a single application |

---

## Acceptance criteria

- [ ] The admin queue at `/approvals/roasters` displays `RoasterApplication` records
- [ ] Default view filters to `PENDING_REVIEW` status; tabs or dropdown to view `APPROVED` and `REJECTED`
- [ ] Each application row shows: business name, email, city/state, submission date, status badge
- [ ] Clicking an application shows the full detail (all submitted fields)
- [ ] The approve button creates a `Roaster` record with `status = ONBOARDING` and `applicationId` linked
- [ ] The approve action creates a `User` record with `role = ROASTER_ADMIN` and `roasterId` linked
- [ ] The approve action updates `RoasterApplication.status` to `APPROVED`
- [ ] The reject button updates `RoasterApplication.status` to `REJECTED`
- [ ] Approve sends the `roaster-approved` email; reject sends the `roaster-rejected` email
- [ ] Both approve and reject run inside a database transaction
- [ ] A confirmation dialog appears before approve or reject
- [ ] Already-processed applications (non-`PENDING_REVIEW`) cannot be approved or rejected again
- [ ] The queue is protected by HTTP Basic Auth (existing middleware — verify it works)

---

## Suggested implementation steps

1. Create the server component page that queries `RoasterApplication` with status filtering.
2. Build the application list component with a table or card layout showing key fields and status badges.
3. Create the detail view (inline expandable or separate `/[id]` page).
4. Implement the `approve-application` server action:
   - Validate the application exists and is `PENDING_REVIEW`
   - Use `database.$transaction()` to atomically: update application status, create Roaster, create User
   - Generate a secure temporary external auth ID placeholder for the User (will be replaced by Clerk webhook on first sign-in)
   - Call `sendEmail()` with the approval template
   - Revalidate the page path
5. Implement the `reject-application` server action (simpler: update status, send email).
6. Add confirmation dialogs (can be a simple client component wrapping the action buttons).
7. Test: approve an application, verify Roaster + User records created; reject another, verify status update; verify emails sent (or `EmailLog` entries created).

---

## Handoff notes

- US-02-03 depends on the `Roaster` record existing with a valid `id` and `email`. The roaster must be able to sign in via Clerk at `apps/roaster` and have their `User.roasterId` link the session to the roaster profile.
- The `User.externalAuthId` created here is a placeholder. When the roaster signs up via Clerk, the Clerk webhook (`apps/roaster/app/api/webhooks/clerk/route.ts`) should match by email and update the `externalAuthId`. Verify this flow works or document the gap.
- The `Roaster.stripeAccountId` is left null at this point — US-02-03 populates it.

---

## Revision log

| Version | Date | Notes |
|---------|------|-------|
| 0.1 | 2026-03-29 | Initial story created for Sprint 2 planning. |

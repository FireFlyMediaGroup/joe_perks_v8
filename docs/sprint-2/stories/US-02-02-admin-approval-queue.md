# US-02-02 — Admin Approval Queue for Roaster Applications

**Story ID:** US-02-02 | **Epic:** EP-02 (Roaster Onboarding)
**Points:** 5 | **Priority:** High
**Status:** `Done`
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

- `apps/admin/app/approvals/roasters/page.tsx` — server component: paginated list with `?status=` filter + `?page=`
- `apps/admin/app/approvals/roasters/[id]/page.tsx` — detail view showing all application fields + approve/reject buttons
- `apps/admin/app/approvals/roasters/_actions/approve-application.ts` — `$transaction` (update app → create Roaster → create User), then `sendEmail` (`roaster-approved`)
- `apps/admin/app/approvals/roasters/_actions/reject-application.ts` — `$transaction` (update status), then `sendEmail` (`roaster-rejected`)
- `apps/admin/app/approvals/roasters/_components/roaster-application-queue.tsx` — table + status pills + pagination nav
- `apps/admin/app/approvals/roasters/_components/approve-reject-buttons.tsx` — client component with `<dialog>` confirmation
- `apps/admin/app/approvals/roasters/_lib/queue-url.ts` — `ROASTER_QUEUE_PAGE_SIZE`, `buildRoasterQueueHref`, `parseQueuePage`
- `apps/admin/app/approvals/roasters/_lib/roaster-portal-sign-in-url.ts` — `getRoasterPortalSignInUrl()` (uses `ROASTER_APP_ORIGIN`)
- `apps/admin/middleware.ts` implements HTTP Basic Auth (username: `joe@joeperks.com`) — admin routes are already protected
- `packages/db/clerk-user-sync.ts` — `generatePendingClerkExternalAuthId()` for pre-created User rows; `upsertUserFromClerkWebhook()` merges by email on first Clerk sign-in

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

## Primary files created or modified

| Action | File | Purpose |
|--------|------|---------|
| Modified | `apps/admin/app/approvals/roasters/page.tsx` | Server component — paginated queue with `?status=` + `?page=` |
| Created | `apps/admin/app/approvals/roasters/[id]/page.tsx` | Dedicated detail page for a single application |
| Created | `apps/admin/app/approvals/roasters/_actions/approve-application.ts` | Server action — approve flow (`$transaction`: update app, create Roaster + User, send email) |
| Created | `apps/admin/app/approvals/roasters/_actions/reject-application.ts` | Server action — reject flow (`$transaction`: update status, send email) |
| Created | `apps/admin/app/approvals/roasters/_components/roaster-application-queue.tsx` | Table of applications with status badges + pagination nav |
| Created | `apps/admin/app/approvals/roasters/_components/approve-reject-buttons.tsx` | Client component — `<dialog>` confirmation before approve/reject |
| Created | `apps/admin/app/approvals/roasters/_lib/queue-url.ts` | `ROASTER_QUEUE_PAGE_SIZE`, `buildRoasterQueueHref`, `parseQueuePage` |
| Created | `apps/admin/app/approvals/roasters/_lib/roaster-portal-sign-in-url.ts` | `getRoasterPortalSignInUrl()` using `ROASTER_APP_ORIGIN` |
| Modified | `apps/admin/load-root-env.ts` + `next.config.ts` | Root `.env` loading for `DATABASE_URL`, Resend keys |
| Modified | `apps/admin/package.json` | Added `@joe-perks/db`, `@joe-perks/email`, `dotenv` |
| Modified | `packages/db/clerk-user-sync.ts` | `generatePendingClerkExternalAuthId`, merge-by-email for `clerk_pending:` rows |
| Modified | `packages/db/index.ts` | Export `generatePendingClerkExternalAuthId` |

---

## Acceptance criteria

- [x] The admin queue at `/approvals/roasters` displays `RoasterApplication` records
- [x] Default view filters to `PENDING_REVIEW` status; tabs or dropdown to view `APPROVED` and `REJECTED`
- [x] Each application row shows: business name, email, city/state, submission date, status badge
- [x] Clicking an application shows the full detail (all submitted fields)
- [x] The approve button creates a `Roaster` record with `status = ONBOARDING` and `applicationId` linked
- [x] The approve action creates a `User` record with `role = ROASTER_ADMIN` and `roasterId` linked
- [x] The approve action updates `RoasterApplication.status` to `APPROVED`
- [x] The reject button updates `RoasterApplication.status` to `REJECTED`
- [x] Approve sends the `roaster-approved` email; reject sends the `roaster-rejected` email
- [x] Both approve and reject run inside a database transaction (DB writes only; `sendEmail()` runs after commit)
- [x] A confirmation dialog appears before approve or reject
- [x] Already-processed applications (non-`PENDING_REVIEW`) cannot be approved or rejected again
- [x] The queue is protected by HTTP Basic Auth (existing middleware — verify it works)

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
- The `User.externalAuthId` created here is a placeholder (`clerk_pending:{uuid}` via `generatePendingClerkExternalAuthId()`). When the roaster signs up via Clerk, `upsertUserFromClerkWebhook` in `packages/db/clerk-user-sync.ts` matches by email and replaces `externalAuthId` with the Clerk user id.
- The `Roaster.stripeAccountId` is left null at this point — US-02-03 populates it.

---

## Revision log

| Version | Date | Notes |
|---------|------|-------|
| 0.1 | 2026-03-29 | Initial story created for Sprint 2 planning. |
| 0.2 | 2026-03-29 | Implemented: admin queue, detail page, approve/reject actions, Clerk pending-id merge in `clerk-user-sync.ts`. |
| 0.3 | 2026-03-29 | List pagination (`?page=`, 20/page), `_lib/queue-url.ts`; AGENTS clarifies `ADMIN_EMAIL` vs `ROASTER_APP_ORIGIN`. |

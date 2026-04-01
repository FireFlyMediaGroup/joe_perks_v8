# US-03-02 -- Admin Org Approval Queue with Routing to Roaster Review

**Story ID:** US-03-02 | **Epic:** EP-03 (Org Onboarding)
**Points:** 5 | **Priority:** High
**Status:** `Done`
**Owner:** Full-stack
**Dependencies:** US-03-01 (Org Application Form), US-02-02 (Admin Roaster Approval Queue)
**Depends on this:** US-03-03 (Roaster Magic Link Org Review)

---

## Goal

Build the platform admin approval queue for org applications at `admin.joeperks.com/approvals/orgs`. When the platform admin approves an org application, the system transitions the application to `PENDING_ROASTER_APPROVAL`, creates a `MagicLink` with purpose `ROASTER_REVIEW`, and sends an email to the primary roaster with a link to review the org. This mirrors the roaster approval queue (US-02-02) but adds the roaster routing step per the approval chain diagram.

---

## Diagram references

- **Approval chain:** [`docs/05-approval-chain.mermaid`](../../05-approval-chain.mermaid) -- nodes **OA3** (Platform admin reviews at `admin.joeperks.com/approvals/orgs`), **OA4** (Platform decision), **OA5** (Org rejected, rejection email sent), **OA6** (status = PENDING_ROASTER_APPROVAL, MagicLink created ROASTER_REVIEW, roaster gets approval email)
- **Database ERD:** [`docs/06-database-schema.mermaid`](../../06-database-schema.mermaid) -- `OrgApplication`, `RoasterOrgRequest`, `MagicLink`, `Org` models
- **Project structure:** [`docs/01-project-structure.mermaid`](../../01-project-structure.mermaid) -- admin app routes

---

## Current repo evidence

- `apps/admin/app/approvals/orgs/` -- **implemented**: list with status filters + pagination, `[id]/` detail, approve/reject server actions, `MagicLink` + emails
- `apps/admin/app/approvals/roasters/` is **fully implemented** (US-02-02) -- pattern reference for list, detail, actions, components
- `OrgApplication` model in schema: `status` (`OrgApplicationStatus`: `PENDING_PLATFORM_REVIEW`, `PENDING_ROASTER_APPROVAL`, `APPROVED`, `REJECTED`), `orgName`, `contactName`, `email`, `desiredSlug`, `desiredOrgPct`, `termsAgreedAt`, `termsVersion`
- `RoasterOrgRequest` model: `applicationId`, `roasterId`, `status` (`RoasterOrgRequestStatus`: `PENDING`, `APPROVED`, `DECLINED`), `priority` (1 = primary, 2 = backup)
- `MagicLink` model: `token` (unique), `purpose` (`MagicLinkPurpose`: includes `ROASTER_REVIEW`), `actorId`, `actorType`, `payload` (Json), `expiresAt`, `usedAt`
- `apps/admin` uses HTTP Basic Auth middleware (existing)
- `apps/admin/load-root-env.ts` loads root `.env` for `DATABASE_URL`, `RESEND_TOKEN`, etc.
- `sendEmail()` from `@joe-perks/email` -- dedup via `EmailLog`
- Admin pagination pattern exists in `apps/admin/app/approvals/roasters/_lib/queue-url.ts`

---

## AGENTS.md rules that apply

- **Magic links:** Tokens generated with `crypto.randomBytes(32).toString('hex')`. Set `expiresAt` to 72 hours from now. `purpose = ROASTER_REVIEW`. Store `applicationId` and `roasterId` in `payload` JSON.
- **Email:** Use `sendEmail()` from `@joe-perks/email`. Never import Resend directly.
- **Logging/PII:** Never log applicant email, phone, or contact name. Log only application ID and magic link ID.

**CONVENTIONS.md patterns:**
- Admin queries may scope globally (no tenant isolation required for admin)
- Server component for page shell; server actions for mutations
- Confirmation dialog before approve/reject
- Revalidate path after mutations

---

## In scope

- Org application list page with status filtering and pagination
- Org application detail page showing all submitted fields and roaster selections
- Platform approve action: transitions to `PENDING_ROASTER_APPROVAL`, creates `MagicLink`, sends roaster review email
- Platform reject action: transitions to `REJECTED`, sends rejection email to org
- Two new email templates: `org-roaster-review` (to roaster), `org-rejected` (to org)
- Status badges for all `OrgApplicationStatus` values
- Confirmation dialogs before approve/reject

---

## Out of scope

- Roaster review of the org (US-03-03 -- separate magic link page)
- Org Stripe Connect onboarding (US-03-04)
- Campaign creation (US-03-04)
- Editing or re-reviewing already-processed applications

---

## Primary files to create or modify

| Action | File | Purpose |
|--------|------|---------|
| Modify | `apps/admin/app/approvals/orgs/page.tsx` | Server component -- list org applications with filters + pagination |
| Create | `apps/admin/app/approvals/orgs/[id]/page.tsx` | Server component -- application detail view |
| Create | `apps/admin/app/approvals/orgs/_actions/approve-application.ts` | Server action -- approve + MagicLink + roaster email |
| Create | `apps/admin/app/approvals/orgs/_actions/reject-application.ts` | Server action -- reject + org email |
| Create | `apps/admin/app/approvals/orgs/_components/org-queue.tsx` | Application list table component |
| Create | `apps/admin/app/approvals/orgs/_components/org-detail.tsx` | Application detail display |
| Create | `apps/admin/app/approvals/orgs/_components/approve-reject-buttons.tsx` | Client component -- buttons with confirmation dialogs |
| Create | `apps/admin/app/approvals/orgs/_lib/queue-url.ts` | Pagination and filter URL helpers |
| Create | `packages/email/templates/org-roaster-review.tsx` | Email to roaster: review org via magic link |
| Create | `packages/email/templates/org-rejected.tsx` | Email to org: platform rejection |

---

## Acceptance criteria

- [x] The admin queue at `/approvals/orgs` shows org applications with default filter `PENDING_PLATFORM_REVIEW`
- [x] Status tabs/dropdown allows filtering by `PENDING_ROASTER_APPROVAL`, `APPROVED`, `REJECTED`
- [x] Each row shows: org name, contact name, desired slug, desired org %, submission date, status badge
- [x] Clicking a row opens the detail view with all submitted fields
- [x] Detail view shows selected roaster(s) with priority (primary/backup) and request status
- [x] Approve button requires confirmation dialog
- [x] On approve: `OrgApplication.status` transitions to `PENDING_ROASTER_APPROVAL`
- [x] On approve: `MagicLink` created with `purpose = ROASTER_REVIEW`, `expiresAt = now + 72h`, `actorId = primary roasterId`
- [x] On approve: roaster receives email with magic link to `roasters.joeperks.com/org-requests/[token]` (via `ROASTER_APP_ORIGIN`)
- [x] Reject button requires confirmation dialog
- [x] On reject: `OrgApplication.status` transitions to `REJECTED`
- [x] On reject: org receives rejection email
- [x] Non-`PENDING_PLATFORM_REVIEW` applications hide approve/reject buttons
- [x] Pagination works with 20 rows per page
- [x] HTTP Basic Auth protects the page (existing middleware)
- [x] No PII logged -- only application ID and magic link id (row `id`)
- [x] `EmailLog` entries created for all sent emails (dedup)

---

## Suggested implementation steps

1. Create email templates first (`org-roaster-review.tsx`, `org-rejected.tsx`) -- other steps call these.
2. Build `_lib/queue-url.ts` for pagination and filter URL helpers (mirror roaster queue pattern).
3. Build the list page (`page.tsx`) as a server component:
   - Query `OrgApplication` with status filter, pagination
   - Include `roasterRequests` relation with `roaster` for display
   - Pass to `OrgQueue` component
4. Build the detail page (`[id]/page.tsx`):
   - Query single `OrgApplication` with all relations
   - Display fields, roaster selections with priorities
5. Build the approve server action:
   - Validate application exists and status is `PENDING_PLATFORM_REVIEW`
   - Find primary `RoasterOrgRequest` (priority = 1)
   - `$transaction`: update application status, create `MagicLink` with token from `crypto.randomBytes(32).toString('hex')`
   - Call `sendEmail()` with `org-roaster-review` template, passing magic link URL
   - `revalidatePath('/approvals/orgs')`
6. Build the reject server action:
   - Validate application exists and status is `PENDING_PLATFORM_REVIEW`
   - Update status to `REJECTED`
   - Call `sendEmail()` with `org-rejected` template
   - `revalidatePath('/approvals/orgs')`
7. Build UI components: list table, status badges, approve/reject buttons with `<dialog>` confirms.
8. Test: approve flow (MagicLink created, email sent), reject flow, pagination, auth guard.

---

## Smoke tests (automated)

From repo root (requires `DATABASE_URL` in `packages/db/.env`; optional admin on port **3003** for HTTP check):

```bash
pnpm db:smoke:us-03-02
```

Script: [`packages/db/scripts/smoke-us-03-02-admin-org-queue.ts`](../../../packages/db/scripts/smoke-us-03-02-admin-org-queue.ts) — validates admin list query shape, `PlatformSettings`, `MagicLink` `ROASTER_REVIEW` row shape when present, integrity when `PENDING_ROASTER_APPROVAL` rows exist, primary roaster request when `PENDING_PLATFORM_REVIEW` rows exist, and `GET /approvals/orgs` on localhost (401/503/200).

---

## Handoff notes

- The `MagicLink` created here is consumed by US-03-03 (roaster reviews org at `roasters.joeperks.com/org-requests/[token]`). The token URL format must match what the roaster app expects.
- The `MagicLink.payload` should include `{ applicationId, roasterId, orgName }` so the roaster review page can load context without additional DB queries from the token alone.
- If the primary roaster declines (US-03-03), the backup roaster flow creates a new `MagicLink` -- that logic lives in US-03-03, not here.
- The roaster approval queue (`apps/admin/app/approvals/roasters/`) is the closest pattern reference for this implementation.

---

## Revision log

| Version | Date | Notes |
|---------|------|-------|
| 0.1 | 2026-03-30 | Initial story created for Sprint 3 planning. |
| 0.2 | 2026-03-31 | Implemented admin org queue, detail, actions, templates; status `Done`. |
| 0.3 | 2026-03-31 | Added `pnpm db:smoke:us-03-02` smoke script. |

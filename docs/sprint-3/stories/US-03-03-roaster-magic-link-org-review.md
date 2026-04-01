# US-03-03 -- Roaster Magic Link Approval/Decline of Org

**Story ID:** US-03-03 | **Epic:** EP-03 (Org Onboarding)
**Points:** 5 | **Priority:** High
**Status:** `Done`
**Owner:** Full-stack
**Dependencies:** US-03-02 (Admin Org Approval Queue), US-01-04 (Email Pipeline)
**Depends on this:** US-03-04 (Org Stripe Connect + Campaign)

---

## Goal

Build the roaster-facing magic link page at `roasters.joeperks.com/org-requests/[token]` where a roaster reviews an org application and approves or declines. This page requires NO authentication -- access is controlled by the magic link token. On approval, the system creates the `Org` and `User` records and sends the org an approval email with a link to the org portal. On decline, the system checks for a backup roaster and either routes to the backup or rejects the application.

---

## Diagram references

- **Approval chain:** [`docs/05-approval-chain.mermaid`](../../05-approval-chain.mermaid) -- nodes **OA7** (Roaster reviews org at `roasters.joeperks.com/org-requests/[token]`), **OA8** (Roaster decision), **OA9** (Roaster declines: backup roaster contacted or org offered alternatives), **OA10** (Roaster approves: status = APPROVED, Org record created)
- **Database ERD:** [`docs/06-database-schema.mermaid`](../../06-database-schema.mermaid) -- `MagicLink`, `RoasterOrgRequest`, `OrgApplication`, `Org`, `User` models
- **Project structure:** [`docs/01-project-structure.mermaid`](../../01-project-structure.mermaid) -- roaster app routes

---

## Current repo evidence

- No `apps/roaster/app/org-requests/` route exists -- this is net-new
- `MagicLink` model in schema: `token` (unique), `purpose` (`MagicLinkPurpose` includes `ROASTER_REVIEW`), `actorId`, `actorType`, `payload` (Json), `expiresAt`, `usedAt`
- `RoasterOrgRequest` model: `applicationId`, `roasterId`, `status` (`PENDING`, `APPROVED`, `DECLINED`), `priority`
- `OrgApplication` model: `status` (`OrgApplicationStatus`), `desiredSlug`, `desiredOrgPct`, `orgName`, `contactName`, `email`
- `Org` model: `applicationId`, `slug`, `status` (`OrgStatus`), `email`, `stripeAccountId` (optional)
- `User` model: `role` (`UserRole` includes `ORG_ADMIN`), `orgId`, `email`, `externalAuthId`
- Roaster app Clerk webhook at `apps/roaster/app/api/webhooks/clerk/route.ts` handles user sync
- `packages/db/clerk-user-sync.ts` has `generatePendingClerkExternalAuthId()` for pre-created users
- Magic link fulfillment page pattern exists at `apps/roaster/app/fulfill/[token]/` (if implemented) -- follow same unauthenticated access pattern
- `sendEmail()` from `@joe-perks/email` with `EmailLog` dedup

---

## AGENTS.md rules that apply

- **Magic links:** Tokens are single-use: set `usedAt = now()` immediately on first use before performing any action. Always verify: token exists, `expiresAt > now()`, `usedAt IS NULL`, correct `purpose`. Magic link pages are accessible WITHOUT authentication.
- **Email:** Use `sendEmail()` from `@joe-perks/email`. Never import Resend directly.
- **Logging/PII:** Never log org contact info. Log only application ID, magic link ID, request ID.
- **Clerk user sync:** Pre-create `User` with `externalAuthId = generatePendingClerkExternalAuthId()`. When org admin signs up via Clerk, the webhook merges by email.

**CONVENTIONS.md patterns:**
- Server component for the page (loads token, validates, fetches data)
- Client components for interactive approve/decline buttons
- No `auth()` call -- magic link pages are public
- Server actions for approve/decline mutations

---

## In scope

- Magic link page at `apps/roaster/app/org-requests/[token]/page.tsx` -- NO auth required
- Token validation (exists, not expired, not used, purpose = ROASTER_REVIEW)
- Display org application details for roaster review
- Approve action: create `Org` + `User`, update statuses, send org approval email
- Decline action: mark request declined, route to backup roaster or reject application
- Error states: expired token, already-used token, invalid token
- Two new email templates: `org-approved` (to org), `org-declined` (to org when all roasters decline)

---

## Out of scope

- Roaster authentication (magic link pages are public by design)
- Admin org approval queue (US-03-02)
- Org Stripe Connect onboarding (US-03-04)
- Campaign creation
- Editing the org application

---

## Primary files to create or modify

| Action | File | Purpose |
|--------|------|---------|
| Create | `apps/roaster/app/org-requests/[token]/page.tsx` | Server component -- validate token, load org details, render review UI |
| Create | `apps/roaster/app/org-requests/_actions/approve-org.ts` | Server action -- approve org, create Org + User records |
| Create | `apps/roaster/app/org-requests/_actions/decline-org.ts` | Server action -- decline, route to backup or reject |
| Create | `apps/roaster/app/org-requests/_components/org-review-details.tsx` | Display org application info for review |
| Create | `apps/roaster/app/org-requests/_components/review-actions.tsx` | Client component -- approve/decline buttons with confirms |
| Create | `apps/roaster/app/org-requests/_components/token-error.tsx` | Error states for expired/used/invalid tokens |
| Create | `packages/email/templates/org-approved.tsx` | Email to org: approved, login to org portal |
| Create | `packages/email/templates/org-declined.tsx` | Email to org: all roasters declined |

---

## Acceptance criteria

- [x] Page at `/org-requests/[token]` is accessible WITHOUT authentication
- [x] Valid token shows org application details: org name, description, desired slug, desired org %, contact info
- [x] Expired token (`expiresAt <= now()`) shows clear error message
- [x] Already-used token (`usedAt IS NOT NULL`) shows clear error message
- [x] Invalid/missing token shows error message
- [x] Wrong purpose token shows error message
- [x] Approve button requires confirmation dialog
- [x] On approve: `MagicLink.usedAt` set to `now()` BEFORE any other mutation
- [x] On approve: `RoasterOrgRequest.status` updated to `APPROVED`
- [x] On approve: `OrgApplication.status` updated to `APPROVED`
- [x] On approve: `Org` record created with `slug = desiredSlug`, `status = ONBOARDING`, `applicationId`, `email`
- [x] On approve: `User` record created with `role = ORG_ADMIN`, `orgId`, `email`, `externalAuthId = generatePendingClerkExternalAuthId()`
- [x] On approve: org receives email with link to `orgs.joeperks.com` (login CTA)
- [x] On approve: success confirmation shown on the page
- [x] Decline button requires confirmation dialog
- [x] On decline: `MagicLink.usedAt` set to `now()` BEFORE any other mutation
- [x] On decline: `RoasterOrgRequest.status` updated to `DECLINED`
- [x] On decline with backup roaster (priority = 2): new `MagicLink` created for backup, review email sent to backup roaster
- [x] On decline without backup: `OrgApplication.status` updated to `REJECTED`, org receives decline email
- [x] All mutations wrapped in `$transaction`
- [x] No PII logged -- only IDs

---

## Suggested implementation steps

1. Create email templates (`org-approved.tsx`, `org-declined.tsx`) -- approve/decline actions call these.
2. Build `page.tsx` as a server component:
   - Extract `[token]` from params
   - Query `MagicLink` by token where `purpose = ROASTER_REVIEW`
   - Validate: exists, `expiresAt > now()`, `usedAt IS NULL`
   - Load `RoasterOrgRequest` + `OrgApplication` from `MagicLink.payload` (contains `applicationId`, `roasterId`)
   - Pass data to child components
3. Build `org-review-details.tsx` -- display org info.
4. Build `review-actions.tsx` (client component) -- approve/decline buttons with `<dialog>` confirms.
5. Build approve action (`approve-org.ts`):
   - Re-validate token (race condition guard)
   - `$transaction`:
     - `MagicLink.usedAt = now()`
     - `RoasterOrgRequest.status = APPROVED`
     - `OrgApplication.status = APPROVED`
     - Create `Org` with `slug`, `status = ONBOARDING`, `email`, `applicationId`
     - Create `User` with `role = ORG_ADMIN`, `orgId`, `email`, `externalAuthId = generatePendingClerkExternalAuthId()`
   - `sendEmail()` with `org-approved` template
6. Build decline action (`decline-org.ts`):
   - Re-validate token
   - `$transaction`:
     - `MagicLink.usedAt = now()`
     - `RoasterOrgRequest.status = DECLINED`
     - Check for backup: query `RoasterOrgRequest` where `applicationId` and `priority = 2` and `status = PENDING`
     - If backup exists: create new `MagicLink` for backup roaster, send `org-roaster-review` email
     - If no backup: `OrgApplication.status = REJECTED`, send `org-declined` email to org
7. Build `token-error.tsx` for error states.
8. Test: approve flow, decline with backup, decline without backup, expired token, used token.

---

## Handoff notes

- On approve, the `Org` is created with `status = ONBOARDING`. US-03-04 picks up from here: the org admin signs in to `orgs.joeperks.com`, completes Stripe Connect, and creates a campaign.
- The `User` pre-creation with `clerk_pending:` ID follows the same pattern as roaster approval (US-02-02). The org app's Clerk webhook should merge the pending user when the org admin signs up.
- If `apps/org` does not yet have the `upsertUserFromClerkWebhook` logic that handles `clerk_pending:` merges, copy or share the pattern from `packages/db/clerk-user-sync.ts`.
- The backup roaster flow creates a new `MagicLink` reusing the same `org-roaster-review` email template from US-03-02.

---

## Revision log

| Version | Date | Notes |
|---------|------|-------|
| 0.1 | 2026-03-30 | Initial story created for Sprint 3 planning. |
| 0.2 | 2026-03-31 | Implemented in repo: roaster `org-requests/[token]`, approve/decline actions, templates, backup routing. |

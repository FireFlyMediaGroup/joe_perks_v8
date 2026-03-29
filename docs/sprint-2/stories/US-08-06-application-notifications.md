# US-08-06 — Application Received and Approval/Rejection Notifications

**Story ID:** US-08-06 | **Epic:** EP-08 (Notifications)
**Points:** 2 | **Priority:** High
**Status:** `Todo`
**Owner:** Frontend (email templates) / Full-stack (wiring)
**Dependencies:** US-01-04 (Email Pipeline)
**Depends on this:** Used by US-02-01, US-02-02, US-03-01

---

## Goal

Create the transactional email templates for the application lifecycle: confirmation emails when applications are received, and notification emails when applications are approved or rejected. Wire `sendEmail()` calls into the relevant application submission and admin approval actions.

---

## Diagram references

- **Approval chain:** [`docs/05-approval-chain.mermaid`](../../05-approval-chain.mermaid) — covers all email touchpoints in the onboarding flow:
  - **RA2:** Application received → roaster-application-received email
  - **RA5:** Rejected → roaster-rejected email
  - **RA6:** Approved → roaster-approved / welcome email + onboarding instructions
  - **OA2:** Org application received → org-application-received email

---

## Current repo evidence

- `packages/email/templates/` contains: `base-layout.tsx`, `welcome.tsx`, `order-confirmation.tsx`, `sla.tsx`, `contact.tsx`
- `welcome.tsx` already handles `role: "roaster" | "org"` with role-specific next steps — can serve as the approval email or a new template can be created
- `packages/email/send-email.ts` exports `sendEmail()` with `EmailLog` dedup on `(entityType, entityId, template)`
- `docs/CONVENTIONS.md` lists planned templates: `roaster-application-received`, `roaster-approved`, `org-application-received`, `org-approved` (not yet implemented)
- `BaseEmailLayout` component provides consistent email wrapper

---

## AGENTS.md rules that apply

- **Email:** Always use `sendEmail()` from `@joe-perks/email`. Never import Resend directly. `EmailLog` dedup on `(entityType, entityId, template)` prevents duplicate sends.
- **PII:** Email templates will contain the applicant's name and business name. This is expected for transactional email content. Do not log the rendered email body.

**CONVENTIONS.md patterns:**
- Email templates use React Email components (`@react-email/components`)
- Templates export a default component and `PreviewProps` for the React Email preview app
- Template names use kebab-case: `roaster-application-received`
- `sendEmail()` call pattern: `{ template, to, entityId, entityType, props }`

---

## In scope

### Templates to create

| Template | Trigger | Recipient | entityType | Props |
|----------|---------|-----------|------------|-------|
| `roaster-application-received` | Roaster submits apply form (US-02-01) | Applicant email | `roaster_application` | `businessName`, `email` |
| `roaster-approved` | Admin approves application (US-02-02) | Applicant email | `roaster_application` | `businessName`, `loginUrl` |
| `roaster-rejected` | Admin rejects application (US-02-02) | Applicant email | `roaster_application` | `businessName` |
| `org-application-received` | Org submits apply form (US-03-01) | Applicant email | `org_application` | `orgName`, `contactName` |

### Template content guidelines

**roaster-application-received:**
- Subject: "We received your roaster application"
- Body: Confirmation that the application is under review, expected timeline (2-3 business days), contact info for questions
- Tone: Warm, professional

**roaster-approved:**
- Subject: "Your roaster application has been approved!"
- Body: Welcome message, next steps (complete Stripe setup, add products, configure shipping), link to roaster portal login
- Consider reusing the existing `WelcomeEmail` template with `role: "roaster"` if the content aligns, or create a dedicated template

**roaster-rejected:**
- Subject: "Update on your roaster application"
- Body: Polite rejection with encouragement to reapply in the future, contact info for questions
- Tone: Respectful, not harsh

**org-application-received:**
- Subject: "We received your organization application"
- Body: Confirmation that the application is under review, expected process (platform review → roaster confirmation), contact info

### Wiring `sendEmail()` calls

- In US-02-01 server action: call after `RoasterApplication` is created
- In US-02-02 approve action: call after approval transaction completes
- In US-02-02 reject action: call after rejection
- In US-03-01 server action: call after `OrgApplication` is created

If the corresponding stories (US-02-01, US-02-02, US-03-01) are not yet implemented, document the expected `sendEmail()` call signature in each template file as a code comment.

---

## Out of scope

- Org approval/rejection emails (Sprint 3 — when org admin approval queue is built)
- Roaster review request emails for org partnerships (Sprint 3 — magic link flow)
- Order-related emails (already exist or are separate stories)
- Email template styling/design system beyond `BaseEmailLayout`

---

## Primary files to create or modify

| Action | File | Purpose |
|--------|------|---------|
| Create | `packages/email/templates/roaster-application-received.tsx` | Email template — application confirmation |
| Create | `packages/email/templates/roaster-approved.tsx` | Email template — approval notification |
| Create | `packages/email/templates/roaster-rejected.tsx` | Email template — rejection notification |
| Create | `packages/email/templates/org-application-received.tsx` | Email template — org application confirmation |
| Modify | `packages/email/index.ts` | Export new templates if needed for the preview app |

---

## Acceptance criteria

- [ ] `roaster-application-received` template renders correctly with `businessName` and `email` props
- [ ] `roaster-approved` template renders correctly with `businessName` and `loginUrl` props
- [ ] `roaster-rejected` template renders correctly with `businessName` prop
- [ ] `org-application-received` template renders correctly with `orgName` and `contactName` props
- [ ] All templates extend `BaseEmailLayout` for consistent styling
- [ ] All templates export `PreviewProps` for the React Email preview app (`apps/email`)
- [ ] All templates have appropriate subject lines
- [ ] Templates render well on mobile email clients (test via React Email preview)
- [ ] The `sendEmail()` call pattern is documented in each template file for consumers
- [ ] No PII is logged when sending — `sendEmail()` handles logging the `EmailLog` record only

---

## Suggested implementation steps

1. Study the existing `welcome.tsx` template for the pattern: imports, `BaseEmailLayout` wrapper, props interface, `PreviewProps`.
2. Create `roaster-application-received.tsx`:
   - Props: `businessName: string`, `email: string`
   - Use `BaseEmailLayout` with preview text
   - Include: subject line, confirmation body, timeline, contact info
3. Create `roaster-approved.tsx`:
   - Props: `businessName: string`, `loginUrl: string`
   - Include: approval message, next steps list, CTA button to roaster portal
   - Consider whether this replaces or supplements the existing `WelcomeEmail`
4. Create `roaster-rejected.tsx`:
   - Props: `businessName: string`
   - Include: polite rejection message, encouragement, contact info
5. Create `org-application-received.tsx`:
   - Props: `orgName: string`, `contactName: string`
   - Include: confirmation, process overview, timeline, contact info
6. Verify all templates render in `apps/email` (React Email preview at `http://localhost:3004`).
7. Document the `sendEmail()` call signature as a comment in each template for consumers (US-02-01, US-02-02, US-03-01).

---

## Handoff notes

- US-02-01 (Roaster Apply) calls `sendEmail({ template: 'roaster-application-received', ... })` after creating the application record.
- US-02-02 (Admin Approval) calls `sendEmail({ template: 'roaster-approved', ... })` on approve and `sendEmail({ template: 'roaster-rejected', ... })` on reject.
- US-03-01 (Org Apply) calls `sendEmail({ template: 'org-application-received', ... })` after creating the application record.
- The `entityType` for dedup should be `roaster_application` for roaster emails and `org_application` for org emails. The `entityId` is the application record ID.
- Future sprints will add: `org-approved`, `org-rejected`, `roaster-review-request` (magic link to review org partnership).

---

## Revision log

| Version | Date | Notes |
|---------|------|-------|
| 0.1 | 2026-03-29 | Initial story created for Sprint 2 planning. |

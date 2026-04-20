# Story 04 — Transactional Email Pipeline

**Story version:** 0.3  
**Status:** `Done`  
**Owner:** Backend / platform  
**Depends on:** `story-01-db-foundation.md`, `story-03-checkout-webhooks.md`

---

## Goal

Replace the transactional email stub with a real Joe Perks email pipeline that uses Resend and database-backed deduplication.

---

## Current repo evidence

The email pipeline is implemented and smoke-tested:

- `packages/email/send-email.ts` — `sendEmail()` sends via Resend with `EmailLog` dedupe on `(entityType, entityId, template)`.
- `packages/email/send.ts` — server-only re-export of `sendEmail()` and `SendEmailInput`.
- `packages/email/index.ts` — re-exports `sendEmail`, `SendEmailInput`, and the raw `resend` client for edge cases.
- `packages/email/keys.ts` — validates `RESEND_TOKEN` (`re_`-prefixed) and `RESEND_FROM` (email format); empty strings treated as unset.
- `packages/email/scripts/smoke-email.ts` — smoke test (DB-only dedupe or full Resend+dedupe).
- `apps/web/app/[locale]/contact/actions/contact.tsx` — contact form uses `@joe-perks/email/send`.
- `packages/db/prisma/schema.prisma` — `EmailLog` model with `@@unique([entityType, entityId, template])`.

---

## Checklist alignment

- `docs/SCAFFOLD_CHECKLIST.md` — Resend setup, local env setup, production readiness email checks
- `docs/SCAFFOLD_PROGRESS.md` — email scaffold row
- `docs/AGENTS.md` — `sendEmail()` ownership and `EmailLog` dedupe expectations

---

## In scope

- Implement `sendEmail()` using Resend
- Introduce `EmailLog`-backed dedupe if the schema supports it
- Establish the package-level send path apps must use
- Preserve the boundary: apps should not call Resend directly

---

## Out of scope

- Writing every final production email template
- Full marketing email flows
- Notification center UI

---

## Primary files changed

- `packages/email/send-email.ts` — core `sendEmail()` implementation (Resend + `EmailLog` dedupe)
- `packages/email/send.ts` — server-only facade re-exporting `sendEmail`
- `packages/email/index.ts` — barrel re-exports (`resend`, `sendEmail`, `SendEmailInput`)
- `packages/email/keys.ts` — `RESEND_TOKEN` / `RESEND_FROM` validation
- `packages/email/package.json` — added `@joe-perks/db` dependency, `smoke` script
- `packages/email/scripts/smoke-email.ts` — Story 04 smoke test
- `apps/web/app/[locale]/contact/actions/contact.tsx` — migrated to `@joe-perks/email/send`
- `packages/db/prisma/schema.prisma` — `EmailLog` model (already existed from Story 01)

---

## Acceptance criteria

- `sendEmail()` sends through Resend when configured
- Email dedupe behavior exists for transactional sends where the schema supports it
- Existing app code can call `@joe-perks/email/send` instead of using vendor SDKs directly
- Failure paths are explicit and safe
- `docs/SCAFFOLD_PROGRESS.md` reflects the new email status

---

## Suggested implementation steps

1. Confirm schema support for email logging and dedupe.
2. Implement package-level send wrapper.
3. Migrate any direct send paths in app code toward the shared helper.
4. Validate local development with `RESEND_TOKEN` / `RESEND_FROM`.

---

## Handoff notes for the next story

Story 05 should use this email path for scheduled reminders and escalations instead of creating job-local send logic.

---

## Revision log

| Version | Date | Notes |
|---|---|---|
| `0.1` | 2026-03-22 | Initial story created. |
| `0.2` | 2026-03-28 | Implemented: `sendEmail()` + `EmailLog` dedupe; contact form migrated; docs updated. |
| `0.3` | 2026-03-28 | Post-implementation review: updated repo evidence and primary files sections to reflect completed state; all docs verified current. |

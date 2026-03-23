# Story 04 — Transactional Email Pipeline

**Story version:** 0.1  
**Status:** `Todo`  
**Owner:** Backend / platform  
**Depends on:** `story-01-db-foundation.md`, `story-03-checkout-webhooks.md`

---

## Goal

Replace the transactional email stub with a real Joe Perks email pipeline that uses Resend and database-backed deduplication.

---

## Current repo evidence

The email package exists, but sending is still intentionally blocked:

- `packages/email/send.ts`
- `packages/email/templates/contact.tsx`

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

## Primary files to change

- `packages/email/send.ts`
- `packages/email/index.ts`
- any DB interactions required for `EmailLog`
- template files used by real flows

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

# Story 06 — Auth and Admin Protection

**Story version:** 0.1  
**Status:** `Todo`  
**Owner:** Full-stack / platform  
**Depends on:** `story-01-db-foundation.md`, `story-00-manual-foundation.md`

---

## Goal

Move the roaster, org, and admin surfaces beyond placeholder scaffolds by implementing the minimum viable access-control model described in the platform docs.

---

## Current repo evidence

The apps and shared auth package exist, but the checklist and progress tracker still treat auth/admin as incomplete:

- `apps/roaster`
- `apps/org`
- `apps/admin`
- `packages/auth`

---

## Checklist alignment

- `docs/SCAFFOLD_CHECKLIST.md` — Clerk sections, admin env sections, preview smoke tests, production readiness checks
- `docs/SCAFFOLD_PROGRESS.md` — Auth / admin security rows
- `docs/AGENTS.md` — tenant scoping, auth model, admin MVP notes

---

## In scope

- Finish Clerk integration for `apps/roaster`
- Finish Clerk integration for `apps/org`
- Add webhook/user-sync path if required by the chosen auth flow
- Add MVP admin protection for `apps/admin`
- Enforce tenant-scoped data access patterns where routes / queries are introduced

---

## Out of scope

- Full onboarding and approval UX for every role
- Production polish of every dashboard page

---

## Primary files to change

- `apps/roaster/**`
- `apps/org/**`
- `apps/admin/**`
- `packages/auth/**`
- any webhook routes or DB sync logic required by the auth model

---

## Acceptance criteria

- `apps/roaster` sign-in flow works with the roaster Clerk app
- `apps/org` sign-in flow works with the org Clerk app
- Admin access is protected according to the MVP plan
- New DB queries in protected surfaces use tenant scoping from verified session context
- `docs/SCAFFOLD_PROGRESS.md` reflects the improved auth/admin status

---

## Suggested implementation steps

1. Finish env and provider wiring for roaster auth.
2. Repeat for org auth, keeping the apps logically separate.
3. Add user sync / webhook path if required.
4. Add admin access control and smoke-test each protected surface.

---

## Handoff notes for the next story

Story 07 should assume auth, payments, jobs, and email are sufficiently real to support deployment and verification.

---

## Revision log

| Version | Date | Notes |
|---|---|---|
| `0.1` | 2026-03-22 | Initial story created. |

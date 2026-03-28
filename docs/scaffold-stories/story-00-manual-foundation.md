# Story 00 — Manual Foundation

**Story version:** 0.1  
**Status:** `In Progress`  
**Owner:** Ops / founder / tech lead  
**Depends on:** none

---

## Goal

Complete the external setup that the codebase expects, so the engineering stories can proceed without guessing about credentials, environments, or deployment targets.

---

## Checklist alignment

- `docs/SCAFFOLD_CHECKLIST.md` — Phases 1, 2, 3, 4.1, 4.2, and the secrets portions of Phase 6
- `docs/SCAFFOLD_PROGRESS.md` — Manual items under legal, DNS, third-party accounts, branch protection, and Vercel setup

---

## Why this story exists

The repo is scaffolded, but many later stories depend on real external systems:

- Neon DB URLs
- Stripe keys and webhook secrets
- Clerk app keys
- Resend domain and token
- Inngest, Upstash, Sentry, PostHog, UploadThing
- GitHub Actions secrets
- Vercel projects and environment variables

Without those decisions made and recorded, later implementation work becomes guesswork.

---

## In scope

- Legal / business prerequisites needed for Stripe and production operations
- Domain ownership and intended subdomain plan
- All third-party account creation from the scaffold checklist
- GitHub repo hygiene outside code:
  - branch protection
  - `develop` branch creation
  - Actions secrets
- Vercel project creation and environment variable planning

---

## Out of scope

- Implementing Prisma schema, Stripe code, email code, jobs, or auth flows
- Product logic inside apps/packages

---

## Deliverables

1. A completed pass through the manual items in `docs/SCAFFOLD_CHECKLIST.md`
2. Real secrets stored in the correct systems, not in git
3. A confirmed list of env values available to the dev team
4. `develop` branch created and branch protection configured

---

## Acceptance criteria

- `joeperks.com` ownership and the planned `roasters`, `orgs`, and `admin` subdomains are confirmed
- Accounts exist for Neon, Stripe, Clerk, Resend, Inngest, Upstash, Sentry, PostHog, and UploadThing
- GitHub Actions secrets include at least:
  - `DATABASE_URL_DEV`
  - `BASEHUB_TOKEN` if CMS is required in CI
- Vercel project plan exists for:
  - `web`
  - `roaster`
  - `org`
  - `admin`
- `develop` exists remotely and branch protection is configured for `main` and `develop`
- `docs/SCAFFOLD_PROGRESS.md` is updated to reflect which manual items are complete

---

## Handoff notes for the next story

Story 01 should not start until the team knows which development database to target and where its connection string will live.

---

## Revision log

| Version | Date | Notes |
|---|---|---|
| `0.1` | 2026-03-22 | Initial story created. |
| `0.2` | 2026-03-23 | Accounts created and local env files populated for: Neon (dev branch), Clerk (roaster + org), Inngest, Upstash, Sentry (4 projects), PostHog, UploadThing, admin auth. Deferred: Stripe (waiting on login), Resend (waiting on domain). GitHub branch protection and Vercel setup still pending. |

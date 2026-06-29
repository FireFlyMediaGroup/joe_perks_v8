# Production portal auth troubleshooting

**Created:** 2026-06-28  
**Scope:** Sign-in and onboarding failures on production Joe Perks portals (`roasters.joeperks.com`, `orgs.joeperks.com`, `admin.joeperks.com`).

## Purpose

Track and resolve production authentication issues **one at a time**. Each issue has its own document with symptoms, likely causes, investigation steps, resolution options, and verification criteria. Written for an AI coding agent or engineer working sequentially.

## Recommended work order

| Order | Issue | Doc | Severity for smoke lane |
|---|---|---|---|
| **1** | Roaster Google sign-in fails at Clerk UI | [01-roaster-sign-in-google-oauth.md](./01-roaster-sign-in-google-oauth.md) | Blocks roaster Connect |
| **2** | Org signed in but “No organization is linked” | [02-org-stripe-connect-no-organization-linked.md](./02-org-stripe-connect-no-organization-linked.md) | Blocks org Connect |
| **3** | Admin sign-in redirect loop | [03-admin-sign-in-redirect-loop.md](./03-admin-sign-in-redirect-loop.md) | Blocks admin approvals |

Issue **2** and **3** share a root theme: **three separate Clerk production instances** (roaster, org, admin) each issue their own `user_…` id, while the database has **one `User` row per email** with a **single** `externalAuthId`. See [shared context](#shared-context) below.

## Shared context

### Architecture (must read before fixing any issue)

- ADR: [`docs/adr/0007-three-clerk-instances-per-portal.md`](../adr/0007-three-clerk-instances-per-portal.md)
- Cutover / DNS / live keys: [`docs/runbooks/sandbox-to-production-cutover.md`](../runbooks/sandbox-to-production-cutover.md)
- Vercel env matrix: [`docs/VERCEL_PRODUCTION_PREVIEW_SETUP.md`](../VERCEL_PRODUCTION_PREVIEW_SETUP.md)

Each portal app:

| Portal | App | Production URL | Clerk webhook |
|---|---|---|---|
| Roaster | `apps/roaster` | `https://roasters.joeperks.com` | `POST /api/webhooks/clerk` |
| Org | `apps/org` | `https://orgs.joeperks.com` | `POST /api/webhooks/clerk` |
| Admin | `apps/admin` | `https://admin.joeperks.com` | optional |

DB user linkage:

- Portals resolve the signed-in user via `User.externalAuthId = Clerk session userId` (see `packages/db/clerk-user-sync.ts`).
- Pre-seeded users use `clerk_pending:…` until the **matching portal’s** Clerk webhook merges by email on first sign-in.
- **`User.email` is unique** — one row cannot hold three different Clerk user ids for the same email across three instances.

### Prod DB snapshot (2026-06-28 investigation)

Relevant `User` rows on Neon main:

| Email | Role | `externalAuthId` | `roasterId` | `orgId` | Notes |
|---|---|---|---|---|---|
| `chris@chrisodomphoto.com` | `ROASTER_ADMIN` | `user_3CeEgL…` | set | null | Roaster row looks linked |
| `wearefireflymedia@gmail.com` | `PLATFORM_ADMIN` | `user_3DEsIVm…` | null | **null** | Promoted admin; **no org link** |
| `joe@joeperks.com` | `PLATFORM_ADMIN` | `user_3DEs6j…` | null | null | Separate admin account |

Org `e2e-test-org` exists (`wearefireflymedia@gmail.com` as org email) but **zero** `User` rows with `orgId` pointing at that org.

### Local env templates vs Vercel (check during every issue)

Repo templates under `.vercel/env/*.production.env` may lag live Vercel. As of 2026-06-28:

- **Roaster** template: `NEXT_PUBLIC_CLERK_*` / `CLERK_SECRET_KEY` commented out (may still be set in Vercel dashboard).
- **Org** template: Clerk keys commented out (user can sign in → keys likely exist on Vercel).
- **Admin** template: **`pk_test_` / `sk_test_`** keys present — cutover doc flags this as incorrect for production.

Always verify **live** values in the Vercel project settings, not only the repo template files.

## Status tracker

| ID | Title | Status | Owner | Resolved |
|---|---|---|---|---|
| 01 | Roaster Google OAuth error | ✅ Resolved 2026-06-29 | | **Cause: invalid Google OAuth Client Secret in Clerk** (`oauth_token_exchange_error`/`invalid_client`). Fixed by re-entering correct secret; Google sign-in verified end-to-end (`/dashboard` loads). Dangling identity cleaned up. Only `/` 404 redeploy remains. |
| 02 | Org “No organization is linked” | Open | | |
| 03 | Admin redirect loop | Open | | |

Update this table as each issue is resolved.

## Related runbooks

- Smoke lane (blocked until auth works): [`docs/runbooks/prod-smoke-lane.md`](../runbooks/prod-smoke-lane.md)
- Production bootstrap: [`docs/runbooks/v1-production-bootstrap-checklist.md`](../runbooks/v1-production-bootstrap-checklist.md)

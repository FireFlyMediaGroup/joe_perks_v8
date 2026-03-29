# Joe Perks — Scaffold checklist & status (summary)

Living document. **Full narrative checklist (accounts, Vercel, CI secrets, ports, commands):** **`docs/SCAFFOLD_CHECKLIST.md`** (v1.1+). This file is a compact phase table for quick scanning. Primary setup guide: **`SCAFFOLD.md`**.

## Legend

| Mark | Meaning |
|------|--------|
| **Done** | Implemented in this repo (or satisfied for local dev). |
| **Partial** | Started or diverges from `SCAFFOLD.md` (see notes). |
| **Todo** | Not done yet. |
| **Manual** | You / the team do this outside the codebase (legal, dashboards, DNS, etc.). |

---

## Phase 0 — next-forge base & Joe Perks structure

| Item | Status | Notes |
|------|--------|--------|
| Turborepo monorepo | **Done** | next-forge v6.0.2 base. |
| Next.js 16 on core apps | **Done** | `web`, `roaster` use Next 16.x. |
| Remove `apps/api` | **Done** | API routes live on `apps/web`. |
| Remove `apps/storybook` | **Done** | — |
| Remove Mintlify `apps/docs` | **Done** | Use root `docs/` for reference docs. |
| Rename `apps/app` → `apps/roaster` | **Done** | Package name `roaster`, port **3001**. |
| `apps/web` marketing / storefront | **Done** | Port **3000**. |
| Add `apps/org` | **Done** | Port **3002**; vanilla CNA — Clerk not wired yet. |
| Add `apps/admin` | **Done** | Port **3003**; vanilla CNA — basic auth not wired yet. |
| `packages/database` → `packages/db`, `@joe-perks/db` | **Done** | Imports updated for roaster + tooling paths. |
| Add `@joe-perks/stripe` | **Done** | `packages/stripe` — client, splits, Connect, payouts/refunds helpers. |
| Add `@joe-perks/types` (stubs) | **Done** | `packages/types`. |
| Inngest jobs on `apps/web` | **Done** | `app/api/inngest/route.ts` — `serve()` + `sla-check` / `payout-release` / `cart-cleanup` (`apps/web/lib/inngest/`). |
| Upstash on stripe package | **Done** | `@upstash/redis`, `@upstash/ratelimit` in `packages/stripe`; checkout limiter wired. |
| Bun as *root* package manager | **Partial** | Root uses **pnpm@10.31.0**; apps use `bun --bun` where configured. Migrate to Bun-only if desired. |
| Root `docs/` with mermaid + `.docx` | **Todo** | Folder exists; add `01-…08` diagrams + PRD/schema/epics docs per `SCAFFOLD.md`. |
| Joe Perks **26-model** Prisma schema | **Done** | `packages/db/prisma/schema.prisma`; migrate + seed per `docs/AGENTS.md`. |
| UploadThing TODO stubs (no wiring) | **Todo** | Optional explicit stubs in roaster/org per doc; account in Phase 3. |
| `packages/ui` Zustand cart | **Todo** | Sprint 3 per epic doc. |
| Magic link system in `packages/db` | **Todo** | Sprint 2 per epic doc. |

---

## Phase 1 — Business & legal

| Item | Status | Notes |
|------|--------|--------|
| LLC / EIN / bank / terms / privacy | **Manual** | Blocker before live Stripe Connect. |

---

## Phase 2 — Domain & DNS

| Item | Status | Notes |
|------|--------|--------|
| Register domain, plan subdomains | **Manual** | Records in Phase 6 per `SCAFFOLD.md`. |

---

## Phase 3 — Third-party accounts & keys

| Item | Status | Notes |
|------|--------|--------|
| Neon (dev + prod branches, pooling) | **Manual** | Store URLs in password manager; `DATABASE_URL` in env. |
| Stripe (Connect, keys, webhook list) | **Manual** | Test vs live separation for Preview vs Production. |
| Clerk **two apps** (roasters vs orgs) | **Manual** | Callback URLs per `SCAFFOLD.md`; wire into `roaster` + `org` apps in code. |
| Resend + DNS | **Manual** | SPF/DKIM/DMARC early. |
| Inngest, Upstash, Sentry×4, PostHog, UploadThing | **Manual** | PostHog: disable autocapture + session recording. |

---

## Phase 4 — GitHub repository

| Item | Status | Notes |
|------|--------|--------|
| Private repo + team access | **Manual** | — |
| Branch protection (`main`, `develop`) | **Manual** | — |
| PR template (Joe Perks) | **Done** | `.github/pull_request_template.md`. |
| CI workflow | **Partial** | `.github/workflows/ci.yml` uses **pnpm** + `pnpm check` + `pnpm turbo build` (not Bun as in `SCAFFOLD.md`). Secrets: **`DATABASE_URL_DEV`**, **`BASEHUB_TOKEN`**. |
| `DATABASE_URL_DEV` (and `BASEHUB_TOKEN`) in Actions | **Todo** | Add in repo **Settings → Secrets**. |

---

## Phase 5 — Local dev & scaffold (repo slice)

| Item | Status | Notes |
|------|--------|--------|
| Bun installed (for `bunx`, app scripts) | **Done** | e.g. `~/.bun/bin`; ensure `PATH` in your shell. |
| `pnpm install` at root | **Done** | Primary install path today. |
| `.env` / `.env.local` files | **Partial** | Examples exist; fill from Phase 3. Root + per-app vars per `SCAFFOLD.md`. |
| `git init` + `develop` default | **Todo** | Run locally if not done (`git init -b develop`). |
| Prisma migrate + seed after 26-model schema | **Todo** | After schema replacement. |
| Stripe CLI → `localhost:3000/api/webhooks/stripe` | **Manual** | When implementing webhooks. |
| `pnpm dev` / `turbo dev` all apps | **Partial** | Ports 3000–3003 set for web/roaster/org/admin; other apps (email, studio) still in graph. |
| Root **`AGENTS.md`** | **Todo** | Required per `SCAFFOLD.md`. |
| Root **`CONVENTIONS.md`** | **Todo** | Required per `SCAFFOLD.md`. |
| Org app: second Clerk + sign-in routes | **Todo** | Align with `orgs.joeperks.com` / localhost:3002 callbacks. |
| Admin app: HTTP Basic Auth + env | **Todo** | Per `SCAFFOLD.md` Phase 5.9. |
| `pnpm turbo typecheck` green | **Partial** | Needs **`BASEHUB_TOKEN`** (and related) for `@repo/cms` build in graph; some packages may still need upstream fixes. |

---

## Phase 6 — Vercel & deploy

| Item | Status | Notes |
|------|--------|--------|
| Vercel team + 4 projects + env matrix | **Manual** | Build commands in `SCAFFOLD.md`. |
| Custom domains + SSL | **Manual** | — |
| Stripe / Inngest / Clerk webhooks (prod + preview) | **Manual** | — |

---

## Phase 7 — First deploy verification

| Item | Status | Notes |
|------|--------|--------|
| Push `develop`, green builds | **Todo** | After repo + secrets. |
| Smoke tests (URLs in `SCAFFOLD.md`) | **Todo** | — |
| Sentry + Stripe webhook checks | **Todo** | — |

---

## Phase 8 — Branching workflow

| Item | Status | Notes |
|------|--------|--------|
| Policy: feature branches off `develop` | **Manual** | Document in `CONVENTIONS.md` / `AGENTS.md`. |

---

## Phase 9 — Production readiness gate

| Item | Status | Notes |
|------|--------|--------|
| Full legal + security + E2E + infra checklist | **Manual** | Before live money. |

---

## Quick “still needed” summary (engineering)

1. **Auth:** Wire **Clerk** roaster/org apps; **admin** Basic Auth or stronger — see Story 06.  
2. **Docs:** Continue populating **`docs/`** (mermaid diagrams, Word exports or links) as needed.  
3. **Repo hygiene:** Root **`docs/AGENTS.md`** and **`docs/CONVENTIONS.md`**; **`git`** remote + **`develop`**; GitHub **secrets** for CI.  
4. **Optional alignment:** CI + installs on **Bun** only (to match `SCAFFOLD.md` literally), or keep **pnpm** as canonical (current repo).  
5. **Later sprints:** UploadThing routes, Zustand cart UI, magic-link flows beyond schema — per epics.

---

*Last reviewed against repo: March 2026 — see `docs/SCAFFOLD_CHECKLIST.md` (v1.4+) for the full checklist; DB, Stripe, email, and Inngest baseline jobs are implemented in code.*

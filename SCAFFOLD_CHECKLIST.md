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
| Add `@joe-perks/stripe` (stubs) | **Done** | `packages/stripe` — real implementation Sprint 1+. |
| Add `@joe-perks/types` (stubs) | **Done** | `packages/types`. |
| Inngest stub on `apps/web` | **Done** | `app/api/inngest/route.ts` + `inngest` dependency. |
| Upstash on stripe package | **Done** | `@upstash/redis`, `@upstash/ratelimit` in `packages/stripe`; limiter still stubbed. |
| Bun as *root* package manager | **Partial** | Root uses **pnpm@10.31.0**; apps use `bun --bun` where configured. Migrate to Bun-only if desired. |
| Root `docs/` with mermaid + `.docx` | **Todo** | Folder exists; add `01-…08` diagrams + PRD/schema/epics docs per `SCAFFOLD.md`. |
| Replace Prisma with **26-model** Joe Perks schema | **Todo** | Still default **single `Page` model**; replace from `joe_perks_db_schema`, then migrate + seed. |
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

1. **Database:** Drop in Joe Perks **26-model** `schema.prisma`, migrate, seed (`PlatformSettings`, `OrderSequence`, etc.).  
2. **Docs:** Populate **`docs/`** (mermaid + Word exports or links).  
3. **Auth:** Wire **Clerk org app** into **`apps/org`**; optional **basic auth** for **`apps/admin`**.  
4. **Repo hygiene:** Root **`AGENTS.md`** and **`CONVENTIONS.md`**; **`git`** remote + **`develop`**; GitHub **secrets** for CI.  
5. **Optional alignment:** CI + installs on **Bun** only (to match `SCAFFOLD.md` literally), or update `SCAFFOLD.md` to describe **pnpm** as canonical.  
6. **Later sprints:** UploadThing routes, Zustand cart, magic links, `@joe-perks/stripe` implementation — per epics, not Phase 5 scaffold.

---

*Last reviewed against repo: March 2026 — see `docs/SCAFFOLD_CHECKLIST.md` for checklist aligned with current `pnpm dev`, CI, and Prisma stub state.*

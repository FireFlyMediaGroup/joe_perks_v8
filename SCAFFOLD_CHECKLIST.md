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
| Full legal + security + E2E + infra checklist | **Manual** | Before live money. Executed via **`docs/runbooks/v1-launch-runbook.md`**. |
| Pre-mortem completed and reviewed | **Done** | See **`docs/pre-mortems/2026-04-19-v1-launch.md`**. Mitigations for launch-blocking Tigers tracked in Phase 10 below. |

---

## Phase 10 — Pre-mortem mitigation gate

All items derived from the 2026-04-19 pre-mortem (**`docs/pre-mortems/2026-04-19-v1-launch.md`**). Each launch-blocking Tiger (LB-1…LB-7) must be **Done** before the first real-money production deploy. Fast-follow Tigers (FF-1…FF-6) must have a **named owner and week-1-or-2 commitment** before launch. Track Tigers (T-1…T-3) must have **monitoring + trigger conditions** defined.

### Launch-blocking (gate for go-live)

| ID | Item | Status | Owner | Notes |
|----|------|--------|-------|-------|
| **LB-1** | Legal entity finalized (LLC / EIN / bank); Stripe Connect live-mode keys in Vercel `production` env; one pilot roaster onboarded end-to-end in live mode | **Manual** | Chris | Blocks all of Phase 6/7 going to production. |
| **LB-2** | Clerk (orgs app) wired in `apps/org`; tenant-isolation integration test committed and green (`Org A cannot read Org B`) | **Todo** | Eng lead | Gate `pnpm turbo build` on the test. Related to Phase 5 "Org app" row above. |
| **LB-3** | `apps/admin` protected by real auth — HTTP Basic Auth (bcrypt + constant-time compare) *or* Clerk admin-role claim | **Todo** | Eng lead | Vercel deployment protection added as belt-and-braces. |
| **LB-4** | Roaster ToS, Org ToS, Buyer ToS, Privacy Policy, DPA reviewed by counsel and **replaced** in `apps/web/app/[locale]/privacy-policy/page.tsx` and `apps/web/app/[locale]/terms/roasters/page.tsx` (placeholders are marked "PENDING LEGAL REVIEW") | **Manual** | Chris + counsel | Include explicit 48h fulfillment SLA, 30-day payout hold, dispute/refund/suspension, binding arbitration. |
| **LB-5** | Full dress-rehearsal deploy to **preview** green: DNS records, env vars, Stripe/Clerk/Inngest webhooks, scripted smoke test. Then repeat on **production**. | **Todo** | Eng lead | Script lives in `docs/runbooks/v1-launch-runbook.md`. |
| **LB-6** | `prisma migrate deploy` wired into release pipeline (Vercel build step or GH Action); Neon snapshot before each production migration; rollback procedure documented | **Todo** | Eng lead | Rollback doc lives in `docs/runbooks/v1-launch-runbook.md`. |
| **LB-7** | Money-path E2E test committed and running on every PR — scenarios in `docs/testing/money-path-e2e-scenarios.md` | **Todo** | Eng lead | Covers checkout → webhook → split transfer → payout, including edge cases. |

### Fast-follow (owned + scheduled before launch, shipped weeks 1–3)

| ID | Item | Status | Owner | Week |
|----|------|--------|-------|------|
| **FF-1** | Rate limit `/api/order-lookup`, `/api/order-status`, `/api/webhooks/stripe`; add replay-window check on `event.id` | **Todo** | Eng | W1 |
| **FF-2** | Email-magic-link buyer accounts; bind order-lookup to `(orderNumber + email)` or authed session | **Todo** | Eng | W1–2 |
| **FF-3** | Contract test: every `OrderEvent` type maps to a registered email template that fires | **Todo** | Eng | W1 |
| **FF-4** | Read-only `/admin/audit` page; two-person approval (or reason field) for refunds > $100 and roaster suspensions | **Todo** | Eng | W2 |
| **FF-5** | Public status page; three incident-comms templates (degraded / outage / payments down); on-call rotation defined | **Todo** | Ops | W1 |
| **FF-6** | Centralize order-state transitions behind `Order.transitionTo()`; reject invalid transitions; migrate existing writers | **Todo** | Eng | W2–3 |

### Track (monitor with trigger conditions)

| ID | Item | Status | Owner | Trigger |
|----|------|--------|-------|---------|
| **T-1** | Magic-link token expiry enforced on use (currently schema-only) | **Todo** | Eng | Any token used > 24h post-issuance → incident |
| **T-2** | Auto-suspension for repeated Stripe disputes | **Todo** | Eng | ≥ 2 disputes per roaster in 30d → manual review |
| **T-3** | i18n content coverage vs non-en-US traffic | **Manual** | Chris | Non-en-US locale > 5% weekly → deprioritize or hide |

### Elephants (unspoken risks — surface in next team review)

| ID | Elephant | Resolution path |
|----|----------|-----------------|
| **E-1** | No signed pilot roasters/orgs yet | Execute `docs/gtm/pilot-outreach.md` — target 3 roasters + 3 orgs signed before go-live |
| **E-2** | Org portal behind roaster portal; "concierge" covers gap | Decide: self-serve v1 vs. concierge v0. Document decision. |
| **E-3** | Built from PRD, not from discovery | Run 5 discovery calls (3 roasters, 2 orgs) before locking v1 scope |
| **E-4** | Team size/capacity unstated | Document real team shape; shrink LB/FF list to match |
| **E-5** | Inngest jobs untested under load | Synthetic-load test SLA + payout jobs at 500 and 5,000 orders |

---

## Quick “still needed” summary (engineering)

1. **Auth:** Wire **Clerk** roaster/org apps; **admin** Basic Auth or stronger — see Story 06.  
2. **Docs:** Continue populating **`docs/`** (mermaid diagrams, Word exports or links) as needed.  
3. **Repo hygiene:** Root **`docs/AGENTS.md`** and **`docs/CONVENTIONS.md`**; **`git`** remote + **`develop`**; GitHub **secrets** for CI.  
4. **Optional alignment:** CI + installs on **Bun** only (to match `SCAFFOLD.md` literally), or keep **pnpm** as canonical (current repo).  
5. **Later sprints:** UploadThing routes, Zustand cart UI, magic-link flows beyond schema — per epics.

---

*Last reviewed against repo: **April 2026** — see `docs/SCAFFOLD_CHECKLIST.md` (v1.4+) for the full narrative checklist; DB, Stripe, email, and Inngest baseline jobs are implemented in code. Phase 10 added from pre-mortem (`docs/pre-mortems/2026-04-19-v1-launch.md`). Launch execution handled by `docs/runbooks/v1-launch-runbook.md`.*

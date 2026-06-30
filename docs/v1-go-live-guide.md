# Joe Perks v1 — Go-Live Step-by-Step Guide

**Purpose**: Single checklist for getting from today's production cutover state to a fully live soft launch.  
**Last updated**: 2026-06-30  
**Owner**: Chris (business) + Eng lead (execution)

This guide is the **action layer** on top of the full operational runbook. Use it day-to-day; drill into linked docs for scripts, evidence, and rollback detail.

**Related docs**

| Doc                                                                                                      | Use when                                                                             |
| -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| [`runbooks/v1-launch-runbook.md`](./runbooks/v1-launch-runbook.md)                                       | Full phased runbook (A → B → C), abort criteria, rollback — links back to this guide |
| [`runbooks/v1-production-bootstrap-checklist.md`](./runbooks/v1-production-bootstrap-checklist.md)       | Creating first real prod roasters/orgs/campaigns                                     |
| [`runbooks/v1-production-beta-tester-worksheet.md`](./runbooks/v1-production-beta-tester-worksheet.md)   | Per-pilot live test worksheet                                                        |
| [`testing/v1-launch-money-path-e2e-execution.md`](./testing/v1-launch-money-path-e2e-execution.md)       | Sandbox evidence + rotation gate                                                     |
| [`testing/2026-06-07-connect-v2-migration-smoke.md`](./testing/2026-06-07-connect-v2-migration-smoke.md) | Connect V2 sandbox smoke evidence                                                    |
| [`pre-mortems/2026-04-19-v1-launch.md`](./pre-mortems/2026-04-19-v1-launch.md)                           | Why each launch-blocking Tiger exists                                                |
| [`SCAFFOLD_CHECKLIST.md`](../SCAFFOLD_CHECKLIST.md)                                                      | Phase 10 tracker (LB-1…LB-7)                                                         |

---

## Progress tracker

**This section is the living record.** When something completes, update its row: set **Status** to `Done`, fill **Completed** (ISO date), **By**, and **Notes**. Optional screenshots go in [`runbooks/launch-day-evidence/`](./runbooks/launch-day-evidence/).

### Snapshot

| Field                    | Value                                                                                      |
| ------------------------ | ------------------------------------------------------------------------------------------ |
| **Last progress update** | 2026-06-30                                                                                 |
| **Runbook phase**        | **B.2 complete** (internal smoke lane); **B.3** not started                                |
| **Steps done**           | 21 done · 3 in progress · 25 not started (49 total in master log)                          |
| **Current focus**        | Block **A** hygiene (snapshot ID, rollback card) + Block **B** real pilot bootstrap        |
| **Next gate**            | Block **D** (Go/No-Go + soft launch) after Block **B** pilot records + open Block **E** gaps |

```text
Phase A (Prepare)     █████████████░  ~90%  — cutover mostly done; snapshot ID + legal/obs open
Phase B.2 (Cutover)   ████████████░░  ~85%  — internal smoke lane ✅ (JP-00012); pilot bootstrap ❌
Phase B.3 (Go-live)   ░░░░░░░░░░░░░░   0%   — not started (Block D)
Phase C (Watch)       ░░░░░░░░░░░░░░   —     — starts after first non-smoke pilot order
```

**Block C (steps 9–15) is Done** for the internal smoke lane (JP-00012, 2026-06-29). Do not announce soft launch (B.3) until Block **B** real pilot bootstrap + Block **D** are complete.

### Master log

| ID       | Step                                                                                 | Block | Status             | Completed  | By  | Notes                                                                                                        |
| -------- | ------------------------------------------------------------------------------------ | ----- | ------------------ | ---------- | --- | ------------------------------------------------------------------------------------------------------------ |
| **P-01** | Vercel production deploy healthy (`323b179`, `joe-perks-web`)                        | Pre   | Done               | 2026-06-27 | Eng | `https://joeperks.com/` HTTP 200                                                                             |
| **P-02** | Stripe webhook endpoint live + signature verification                                | Pre   | Done               | 2026-06-27 | Eng | Unsigned + bad sig → HTTP 400                                                                                |
| **P-03** | Dual webhook secrets deployed (`STRIPE_WEBHOOK_SECRET` + `_THIN`)                    | Pre   | Done               | 2026-06-27 | Eng | Deploy `323b179`; handler live                                                                               |
| **P-04** | Clerk production (admin, roaster, org)                                               | Pre   | Done               | 2026-06-27 | Eng | Switched dev → prod                                                                                          |
| **P-05** | Stripe live platform keys (all 4 Vercel projects)                                    | Pre   | Done               | 2026-06-27 | Eng | web, roaster, org, admin                                                                                     |
| **P-06** | Stripe webhooks registered (snapshot + thin, production)                             | Pre   | Done               | 2026-06-27 | Eng | Payments/charges/disputes + Connect V2 thin                                                                  |
| **P-07** | Sandbox money-path stack green                                                       | Pre   | Done               | 2026-06-07 | Eng | See [`testing/v1-launch-money-path-e2e-execution.md`](./testing/v1-launch-money-path-e2e-execution.md)       |
| **P-08** | Connect V2 sandbox smoke (onboarding + thin replay)                                  | Pre   | Done               | 2026-06-07 | Eng | See [`testing/2026-06-07-connect-v2-migration-smoke.md`](./testing/2026-06-07-connect-v2-migration-smoke.md) |
| **P-09** | Money-path code guards (invariants, kill-switch, refund handler, logging, PII scrub) | Pre   | Done               | 2026-06-05 | Eng | Runbook A.3 / A.4 resolution pass                                                                            |
| **P-10** | Production migrate workflow (GitHub Action)                                          | Pre   | Done               | 2026-06-06 | Eng | `.github/workflows/migrate-prod.yml`                                                                         |
| **P-11** | MP-01 + core EC scenarios in CI e2e harness                                          | Pre   | Done               | 2026-06-06 | Eng | `.github/workflows/e2e.yml`                                                                                  |
| **1**    | Neon production snapshot; record snapshot ID                                         | A     | Not started        |            |     | ID: `__________________` — Console: **Backup & restore** → **Create snapshot** on `main`; see [`runbooks/neon-production-snapshot.md`](./runbooks/neon-production-snapshot.md) |
| **2**    | Migrate (production) GitHub Action; schema current                                   | A     | Done               | 2026-06-29 | Eng | Schema current for smoke lane; `pnpm migrate:deploy:prod` + `pnpm db:smoke:prod` passed per [`prod-smoke-lane.md`](./runbooks/prod-smoke-lane.md) prerequisites |
| **3**    | Foundational seed (`pnpm db:seed:prod`)                                              | A     | Done               | 2026-06-29 | Eng | `PlatformSettings` + `OrderSequence` confirmed (`JP-00012` order number issued) |
| **4**    | Rollback card (Vercel redeploy + Neon restore owners)                                | A     | Not started        |            |     | Prev deployment ID: `________`                                                                               |
| **5**    | DNS TTL 300s on production domains                                                   | A     | Not started        |            |     |                                                                                                              |
| **6**    | Name pilot roster (≥1 roaster + 1 org)                                               | B     | Not started        |            |     | Target 3+3 for full soft launch; internal smoke lane does not substitute |
| **7**    | Create production bootstrap records                                                  | B     | In progress        | 2026-06-29 | Eng | **Smoke lane only** (`internal-smoke-lane` via `pnpm db:seed:smoke-lane:prod`); real pilot entities pending |
| **8**    | Fill beta tester worksheet(s)                                                        | B     | Not started        |            |     | One per pilot                                                                                                |
| **9**    | Pilot roaster: live Connect onboarding                                               | C     | Done               | 2026-06-29 | Eng | `chris@chrisodomphoto.com` → live `acct_…`; roaster portal sign-in fixed — [`production-auth-troubleshooting/01-roaster-sign-in-google-oauth.md`](./production-auth-troubleshooting/01-roaster-sign-in-google-oauth.md) |
| **10**   | Thin webhook updates roaster DB row                                                  | C     | Done               | 2026-06-29 | Eng | `chargesEnabled` + `payoutsEnabled` true; verified via `pnpm smoke-lane:verify` (portal thin-event replay not separately recorded) |
| **11**   | Org Connect onboarding (if org receives transfers)                                   | C     | Done               | 2026-06-29 | Eng | Live org `acct_…` in smoke-lane seed; org **portal** Connect UI still open — [`production-auth-troubleshooting/02-org-stripe-connect-no-organization-linked.md`](./production-auth-troubleshooting/02-org-stripe-connect-no-organization-linked.md) |
| **12**   | Admin approvals (roaster + campaign live on storefront)                              | C     | Done               | 2026-06-29 | Eng | Smoke lane seed sets ACTIVE roaster/org/campaign (admin UI bypassed for internal tenant) |
| **13**   | $5 live smoke checkout                                                               | C     | Done               | 2026-06-29 | Eng | Order **JP-00012** → `CONFIRMED`; `pnpm test:e2e:browserbase:live-smoke` commit `5da6a1d` |
| **14**   | Immediate refund of smoke order                                                      | C     | Done               | 2026-06-29 | Eng | JP-00012 → `REFUNDED` via auto-refund + `charge.refunded` webhook |
| **15**   | Fulfillment spot-check (magic link → shipped)                                        | C     | Done               | 2026-06-29 | Eng | JP-00012 magic link → `SHIPPED`; evidence [`runbooks/launch-day-evidence/2026-06-29-smoke-lane-jp-00012.md`](./runbooks/launch-day-evidence/2026-06-29-smoke-lane-jp-00012.md) |
| **16**   | Go/No-Go meeting + sign-off                                                          | D     | Not started        |            |     | Runbook template                                                                                             |
| **17**   | Soft launch announced to pilot orgs                                                  | D     | Not started        |            |     |                                                                                                              |
| **18**   | On-call declared (72h)                                                               | D     | Not started        |            |     | Primary Eng; secondary Chris                                                                                 |
| **19**   | Dashboards open (Sentry, Stripe, Inngest, PostHog)                                   | D     | Not started        |            |     | + BetterStack when live                                                                                      |
| **20**   | First real (non-smoke) order watched end-to-end                                      | D     | Not started        |            |     |                                                                                                              |
| **E-01** | LLC / EIN / business bank account                                                    | E     | Not started        |            |     | LB-1                                                                                                         |
| **E-02** | Stripe Connect platform agreement (live)                                             | E     | Not started        |            |     |                                                                                                              |
| **E-03** | Counsel-reviewed ToS + Privacy (no `PENDING LEGAL REVIEW`)                           | E     | Not started        |            |     | LB-4                                                                                                         |
| **E-04** | Vendor DPAs signed                                                                   | E     | Not started        |            |     | Stripe, Clerk, Resend, Neon, Inngest, Upstash, Sentry, PostHog                                               |
| **E-05** | 3 roasters + 3 orgs signed as pilots                                                 | E     | Not started        |            |     | E-1                                                                                                          |
| **E-06** | Clerk prod flows verified E2E (not just keys)                                        | E     | In progress        | 2026-06-29 | Eng | Roaster ✅ (2026-06-29); org portal pending (issue 02); admin redirect loop open (issue 03) — [`production-auth-troubleshooting/README.md`](./production-auth-troubleshooting/README.md) |
| **E-07** | `org-tenant-isolation.test.ts` green in CI                                           | E     | Done               | 2026-06-06 | Eng | Gated via `pnpm turbo test` in `.github/workflows/ci.yml` (LB-2) |
| **E-08** | Admin auth + Vercel deployment protection                                            | E     | Not started        |            |     | LB-3                                                                                                         |
| **E-09** | Full dress rehearsal on preview (B.1 script)                                         | E     | Not started        |            |     | LB-5                                                                                                         |
| **E-10** | Production dress rehearsal after Block C smoke                                       | E     | In progress        | 2026-06-29 | Eng | Browserbase live money path ✅ (JP-00012); full runbook B.1 script (payout/dispute steps) not yet run (LB-5) |
| **E-11** | BetterStack / uptime monitors (5 domains)                                            | E     | Not started        |            |     | FF-5                                                                                                         |
| **E-12** | Public status page                                                                   | E     | Not started        |            |     | `status.joeperks.com`                                                                                        |
| **E-13** | On-call rotation documented                                                          | E     | Not started        |            |     | FF-5                                                                                                         |
| **E-14** | Sentry PII scrubbing verified (seeded error)                                         | E     | Not started        |            |     | Runbook A.4                                                                                                  |
| **E-15** | Observability go-live review complete                                                | E     | Not started        |            |     | Gap analysis checklist                                                                                       |
| **E-16** | DNS — all five domains → Vercel                                                      | E     | In progress        | 2026-06-27 | Eng | `joeperks.com` confirmed; others TBD                                                                         |
| **E-17** | Resend prod domain (SPF/DKIM/DMARC + deliverability test)                            | E     | Not started        |            |     |                                                                                                              |
| **E-18** | Inngest prod synced; jobs visible                                                    | E     | Not started        |            |     | `/api/inngest` on web                                                                                        |

**Status values:** `Done` · `In progress` · `Not started` · `N/A` · `Blocked`

### Changelog (optional)

Short narrative for major milestones — newest first.

| Date       | Milestone                                                                                              |
| ---------- | ------------------------------------------------------------------------------------------------------ |
| 2026-06-30 | Progress tracker synced: Block **C** Done (JP-00012); Block **A** steps 2–3 Done; evidence file added |
| 2026-06-29 | Production live money path green: checkout → CONFIRMED → fulfill → SHIPPED → REFUNDED (JP-00012); roaster auth fixed |
| 2026-06-28 | Smoke lane runbook + prod auth troubleshooting docs; org bootstrap scripts for issue 02 |
| 2026-06-27 | Production cutover: deploy `323b179`, Clerk + Stripe live, dual webhook secrets, endpoint verification |
| 2026-06-07 | Connect V2 migration sandbox-smoked; thin-event DB sync proven locally                                 |
| 2026-06-06 | Prod migrate GH Action + e2e harness (MP-01) landed                                                    |
| 2026-06-05 | Launch runbook code-verification pass (invariants, PII scrub, refund handler, payment logging)         |

---

## Part 1 — Already completed (reference)

These map to **P-01…P-11** in the progress tracker. Re-open a row if a regression is found.

### Production deploy & domains

- **P-01** Vercel production deploy healthy — build `323b179` on `joe-perks-web`; `https://joeperks.com/` returns HTTP 200.
- **P-02** Stripe webhook endpoint live — `POST /api/webhooks/stripe` returns HTTP 400 for unsigned and bad-signature requests.
- **P-03** Dual webhook signing secrets deployed — snapshot + thin handlers on deployed build.

### Auth & payments infrastructure

- **P-04** Clerk production — live on admin, roaster, and org apps.
- **P-05** Stripe platform keys — live keys on all four Vercel projects.
- **P-06** Stripe webhooks registered (production) — snapshot + thin destinations.

### Engineering readiness (pre-cutover)

- **P-07** Sandbox money-path stack green.
- **P-08** Connect V2 sandbox smoke (hosted onboarding + thin replay).
- **P-09** Money-path code guards (invariants, kill-switch, refund handler, logging, PII scrub).
- **P-10** Production migration workflow (GitHub Action).
- **P-11** MP-01 + core EC scenarios in CI e2e harness.

### Internal smoke lane (Block C — 2026-06-29)

- **Steps 9–15** Production live money path verified on isolated tenant `internal-smoke-lane`.
- **Order JP-00012:** checkout → `CONFIRMED` → fulfillment magic link → `SHIPPED` → auto-refund → `REFUNDED`.
- **Evidence:** commit `5da6a1d`; [`runbooks/launch-day-evidence/2026-06-29-smoke-lane-jp-00012.md`](./runbooks/launch-day-evidence/2026-06-29-smoke-lane-jp-00012.md); runbook [`runbooks/prod-smoke-lane.md`](./runbooks/prod-smoke-lane.md).

---

## Part 2 — Remaining before fully live

Work **top to bottom**. Do not skip a step because a later step feels more exciting.

### Block A — Cutover hygiene (do once, before live money)

These are runbook **B.2** items that should be recorded even though the app is already deployed.

| Step  | Action                                                                                                                         | Owner       | Progress ID |
| ----- | ------------------------------------------------------------------------------------------------------------------------------ | ----------- | ----------- |
| **1** | **Neon snapshot** — Neon Console → `main` → **Backup & restore** → **Create snapshot**; record ID in master log **Notes** ([`runbooks/neon-production-snapshot.md`](./runbooks/neon-production-snapshot.md)) | Eng         | **1**       |
| **2** | **Migrations** — trigger **Migrate (production)** GitHub Action (type `DEPLOY`); confirm `_prisma_migrations` matches repo     | Eng         | **2**       |
| **3** | **Foundational seed** — run `pnpm db:seed:prod` if `PlatformSettings` + `OrderSequence` not confirmed                          | Eng         | **3**       |
| **4** | **Rollback card** — confirm who can re-promote previous Vercel deployment + restore Neon snapshot; note previous deployment ID | Eng + Chris | **4**       |
| **5** | **DNS TTL** — set TTL to 300s on production domains (rollback window)                                                          | Eng         | **5**       |

Reference: runbook §B.2, [`runbooks/v1-production-bootstrap-checklist.md`](./runbooks/v1-production-bootstrap-checklist.md) §Required inputs.

---

### Block B — Production data bootstrap (required before checkout)

Do **not** run local E2E seed scripts against production. Bootstrap deliberately per the bootstrap checklist.

| Step  | Action                                                                                                                                                   | Owner       | Progress ID |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ----------- |
| **6** | **Name pilot roster** — at least one roaster + one org for zeroth live test (ideally 3+3 for soft launch per runbook A.1)                                | Chris       | **6**       |
| **7** | **Create production records** — real roaster, org, users (Clerk → DB sync), products, shipping rates, campaign; admin approvals as needed                | Eng + Chris | **7**       |
| **8** | **Fill beta worksheet** — one copy per pilot from [`runbooks/v1-production-beta-tester-worksheet.md`](./runbooks/v1-production-beta-tester-worksheet.md) | Chris       | **8**       |

Exit criteria from bootstrap checklist: schema current, singletons exist, first beta entities exist, env matches that data.

---

### Block C — Live Connect + money path proof (critical path)

This closes **LB-1** (live Connect E2E) and the runbook's production dress-rehearsal money steps.

| Step   | Action                                                                                                                                                                           | How to verify                                                                                      | Progress ID |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ----------- |
| **9**  | **Pilot roaster: live Connect onboarding** — sign in at `https://roasters.joeperks.com`, complete hosted Express flow; expect fresh live `acct_…`                                | Stripe Dashboard shows completed onboarding; not a test/sandbox account                            | **9**       |
| **10** | **Thin webhook updates DB** — after onboarding, confirm `Roaster` row: `chargesEnabled`, `payoutsEnabled`, `stripeOnboarding = COMPLETE` (or expected restricted state mid-flow) | Stripe Dashboard → Webhooks → thin destination deliveries 2xx; optional: query prod DB             | **10**      |
| **11** | **Org Connect (if org receives transfers)** — repeat steps 9–10 for org portal at `https://orgs.joeperks.com` if campaign requires org payout                                    | Same as roaster                                                                                    | **11**      |
| **12** | **Admin approvals** — roaster + campaign `ACTIVE`/approved for storefront                                                                                                        | Storefront loads without shipping/checkout guards blocking                                         | **12**      |
| **13** | **$5 live smoke checkout** — smoke lane `https://joeperks.com/en/internal-smoke-lane` ([`runbooks/prod-smoke-lane.md`](./runbooks/prod-smoke-lane.md)) or agreed pilot campaign | Stripe Dashboard: `payment_intent.succeeded`; prod DB: `Order` CONFIRMED; buyer confirmation email | **13**      |
| **14** | **Immediate refund** — refund the smoke order (admin or Stripe Dashboard)                                                                                                        | `charge.refunded` → order `REFUNDED`; no pending payout on that order                              | **14**      |
| **15** | **Fulfillment spot-check** — roaster fulfillment magic link email → mark shipped (validates Resend + magic link on prod)                                                         | Email received; order status advances                                                              | **15**      |

**Abort (stop and fix before continuing)** if any of these occur during steps 9–14 (runbook B.4):

- Webhook signature failures from real Stripe deliveries (not your intentional unsigned curl tests)
- `assertSplitInvariants()` fires
- Checkout succeeds but order stays `PENDING` > 5 minutes
- Buyer PII appears unscrubbed in Sentry

Reference: runbook B.1 steps 1–7 and 13; Connect evidence pattern in [`testing/2026-06-07-connect-v2-migration-smoke.md`](./testing/2026-06-07-connect-v2-migration-smoke.md).

---

### Block D — Go-live announcement (Phase B.3)

Only after **Block C** is fully checked.

| Step   | Action                                                                                                  | Owner       | Progress ID |
| ------ | ------------------------------------------------------------------------------------------------------- | ----------- | ----------- |
| **16** | **Go/No-Go meeting** — 30 min; walk Phase 10 rows; record sign-off (runbook template)                   | Chris + Eng | **16**      |
| **17** | **Soft launch** — announce to pilot orgs; provide campaign setup instructions (concierge if needed)     | Chris       | **17**      |
| **18** | **On-call** — primary Eng, secondary Chris for first 72 hours                                           | Both        | **18**      |
| **19** | **Dashboards open** — Sentry, Stripe, Inngest, PostHog (+ BetterStack when live) in one browser profile | Eng         | **19**      |
| **20** | **First real order** — all hands watch full path: checkout → webhook → fulfill → emails                 | All         | **20**      |

---

### Block E — Launch-blocking gaps (parallel / before scaling beyond pilots)

These do not all block the **zeroth** $5 smoke, but they **do** block calling v1 "fully live" at scale. Track alongside Blocks A–D.

#### Legal & business (runbook A.1 — LB-4, E-1)

Track in master log: **E-01** … **E-05**

#### Auth verification (LB-2, LB-3)

Track in master log: **E-06** … **E-08**

#### Dress rehearsal (LB-5)

Track in master log: **E-09** … **E-10**

#### Observability (runbook A.4 — FF-5)

Track in master log: **E-11** … **E-15**

#### Email & DNS (runbook A.6)

Track in master log: **E-16** … **E-18**

---

## Part 3 — Recommended order from here

**Block C (internal smoke lane) is Done.** Minimal path to **soft launch with real pilots**:

1. Steps **1 + 4** (Neon snapshot ID + rollback card) — before any further prod writes.
2. Step **5** (DNS TTL 300s) — same session as snapshot if possible.
3. Steps **6–8** (name pilots, bootstrap real roaster/org/campaign, beta worksheets).
4. Close **E-06** org portal + **E-08** admin auth (required for non-seeded pilot approvals).
5. Steps **16–20** (Go/No-Go, soft launch announcement, on-call, dashboards, first real pilot order).

Legal (Block E) and observability can run in parallel but should not be deferred past the first **non-internal** pilot order.

---

## Part 4 — Launch-blocking Tiger status

Quick map to [`SCAFFOLD_CHECKLIST.md`](../SCAFFOLD_CHECKLIST.md) Phase 10:

| Tiger    | Summary                                        | Status (2026-06-30)                                                                 |
| -------- | ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| **LB-1** | Legal entity + live Stripe + pilot Connect E2E | **Partial** — live keys ✅; smoke-lane Connect E2E ✅; LLC/EIN/bank ❌; real pilots ❌ |
| **LB-2** | Org Clerk + tenant isolation                   | **Partial** — CI isolation test ✅; org portal E2E ❌ (issue 02)                     |
| **LB-3** | Admin auth + deployment protection             | **Partial** — Clerk prod ✅; admin redirect loop ❌; Vercel protection unconfirmed   |
| **LB-4** | Counsel-reviewed legal copy                    | **Open**                                                                            |
| **LB-5** | Preview + prod dress rehearsal                 | **Partial** — Browserbase prod money path ✅ (JP-00012); full B.1 script ❌          |
| **LB-6** | Migrate pipeline + snapshot discipline         | **Partial** — schema current ✅; snapshot ID not recorded ❌                         |
| **LB-7** | Money-path E2E in CI                           | **Partial** — sandbox/MP-01 ✅; live prod path ✅ (JP-00012); not in CI (manual/Browserbase) |

**Fully live** = all LB-* **Done** + Block C + Block D complete.  
**Soft launch (pilots only)** = Block C ✅ (internal smoke) + Block **B** real pilots + Block D steps 16–20 + conscious acceptance of open LB-4 / observability / pilot count.

---

## Part 5 — Rollback reminder (one screen)

If something breaks during Blocks C or D:

1. **Stripe incident** — set `FEATURE_CHECKOUT_ENABLED=false` on `joe-perks-web` production (503 on new checkouts).
2. **Bad deploy, schema unchanged** — re-promote previous Vercel deployment (< 2 min).
3. **Bad deploy + breaking migration** — revert deploy, then Neon snapshot restore (last resort).

Full tree: runbook §Rollback procedure.

---

*When this guide and the runbook disagree, fix the runbook first — then update this doc. **Progress tracker** is the dated source of truth for launch execution; `SCAFFOLD_CHECKLIST.md` Phase 10 tracks Tiger mitigations.*

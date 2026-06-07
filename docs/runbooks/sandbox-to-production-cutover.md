# Sandbox → Production Cutover Matrix

**Status**: Living doc until v1 ships. Freeze and snapshot on go-live day.
**Owner**: Eng lead (technical rows) + Chris (business/Stripe/legal/DNS/email rows).
**Last updated**: 2026-06-07

## What this doc is (and is not)

This is the **service-by-service credential & instance cutover reference** — the single
place that says, for each external service: what the test/sandbox artifact is, what the
live/prod artifact is, where the live value goes, the webhook/domain step, and how to
verify it is truly live.

It is **not** the launch process. For sequencing, abort criteria, rollback, first-data
bootstrap, and per-tester scripts, use the playbooks:

- [`./v1-launch-runbook.md`](./v1-launch-runbook.md) — overall launch sequence, abort criteria, rollback
- [`./v1-production-bootstrap-checklist.md`](./v1-production-bootstrap-checklist.md) — first real data (roasters/orgs/users/products/campaigns)
- [`./v1-production-beta-tester-worksheet.md`](./v1-production-beta-tester-worksheet.md) — per live beta tester
- [`../VERCEL_DEPLOYMENT_GAP_CHECKLIST.md`](../VERCEL_DEPLOYMENT_GAP_CHECKLIST.md) — env-var **presence** tracking per Vercel project
- [`./observability-setup.md`](./observability-setup.md) — BetterStack monitors, heartbeats, status page, on-call (its own implementation step)

## Environment model

There is **no separate long-lived "sandbox" environment**. The split is:

| Vercel env | Credentials | Used for |
|---|---|---|
| `preview` | **test-mode** keys (`sk_test`, `pk_test`, Stripe test webhook, Clerk dev instance, etc.) | dress rehearsals, PR previews |
| `production` | **live** keys | the real beta |

"Switch sandbox → prod" therefore means: populate Vercel **production** env vars with live
credentials per the rows below, register **live-mode** webhooks, and cut over DNS/domains.
**Preview stays on test mode** — do not promote test values to production, and do not put
live values in preview or local `.env`.

Env vars are validated per package by `@t3-oss/env-nextjs` `keys.ts` files; an empty string
masks a real value (see [`../AGENTS.md`](../AGENTS.md) → "Empty-string overrides").

## Service tiers

- **Tier 1 — Live cutover**: must get real production credentials. Sections below.
- **Tier 3 — Must stay UNSET**: dormant Next-Forge scaffolding. Guardrail table at the end.

---

## 0. Prerequisite gates (block the cutover)

| Gate | Owner | Status | Notes |
|---|---|---|---|
| **Stripe platform live-mode activation** (business details, bank account, Connect platform profile, statement descriptor, branding, payout schedule) | Chris | ⛔ **TODO** | Gates *everything* Stripe. Configured separately from test mode. See runbook §A.1. |
| Legal copy / ToS / DPAs | Chris + counsel | see runbook §A.1 | Grep repo for `PENDING LEGAL REVIEW` → must be zero. |
| DNS records added at GoDaddy (table §1) | Chris | TODO | Gates Vercel domains, Clerk ×3, Resend, status page. Do **first**. |
| Production Neon snapshot taken before any prod write | Eng | TODO | Record snapshot ID in runbook §B.2. |

---

## 1. Consolidated DNS records (GoDaddy = authority)

GoDaddy stays the DNS authority (do **not** delegate nameservers to Vercel — it would move
the Google Workspace MX and risk breaking `joe@joeperks.com`). All records below are
**additive**; the existing Workspace MX records are left untouched.

Add every record in one trip, then wait for verification:

| Host | Type | Value | For |
|---|---|---|---|
| `joeperks.com` | A | `76.76.21.21` | Vercel web |
| `www` | A / CNAME | per Vercel | Vercel web |
| `roasters` | A | `76.76.21.21` | Vercel roaster |
| `orgs` | A | `76.76.21.21` | Vercel org |
| `admin` | A | `76.76.21.21` | Vercel admin |
| `clerk.roasters`, `accounts.roasters` (+ DKIM) | CNAME | per Clerk **roaster** prod instance | Clerk roaster |
| `clerk.orgs`, `accounts.orgs` (+ DKIM) | CNAME | per Clerk **org** prod instance | Clerk org |
| `clerk.admin`, `accounts.admin` (+ DKIM) | CNAME | per Clerk **admin** prod instance | Clerk admin |
| Resend DKIM selectors | CNAME/TXT | per Resend dashboard | Email DKIM |
| `joeperks.com` SPF | TXT | **single merged** record incl. Google **and** Resend (`v=spf1 include:_spf.google.com include:<resend> ~all`) | Email SPF |
| `_dmarc` | TXT | `v=DMARC1; p=none; rua=mailto:joe@joeperks.com` (tighten to quarantine/reject later) | Email DMARC |
| `status` | CNAME | per BetterStack status page | Status page |
| (preserve) MX | MX | existing Google Workspace | **Do not modify** |

> Only **one** SPF TXT record may exist per domain — merge Google + Resend includes into it,
> do not add a second.

---

## 2. Stripe (+ Connect)  — Owner: Chris (platform) / Eng (keys, webhook)

**Architecture note**: checkout is dynamic `paymentIntents.create` with amounts from the DB
(`CampaignItem` snapshots) — there is **no Stripe Catalog (Products/Prices) to recreate in
live**. Payouts are `transfers.create` to **both** `Roaster.stripeAccountId` and
`Org.stripeAccountId` (`apps/web/lib/inngest/run-payout-release.ts`).

| Item | Test/sandbox | Live/prod |
|---|---|---|
| Secret key | `sk_test_…` | `STRIPE_SECRET_KEY=sk_live_…` |
| Publishable key | `pk_test_…` | `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_…` |
| Webhook | test endpoint `whsec_…` | **new live endpoint** → `STRIPE_WEBHOOK_SECRET=whsec_…` |
| Connect accounts | `acct_…` (test) | **fresh live onboarding** — test accounts do not exist in live |

**Switchover steps**
1. Complete platform live-mode activation (Gate §0) — owner Chris.
2. Set `STRIPE_SECRET_KEY` / `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (live) in Vercel **production**
   for `joe-perks-web`, `-roaster`, `-org`, `-admin` per the gap checklist.
3. Create the **live** webhook endpoint at `https://joeperks.com/api/webhooks/stripe`,
   subscribe the events in runbook §A.7 (`payment_intent.succeeded`, `charge.refunded`,
   `charge.dispute.*`, `account.updated`, `transfer.paid`, `transfer.failed`), reveal its
   signing secret, set `STRIPE_WEBHOOK_SECRET` (live) — then redeploy.
4. **Connect onboarding is concierge** (see bootstrap §5–6): you create each pilot's Connect
   account + hosted onboarding link and walk them through it, but **KYC is theirs** — the
   roaster/org submits their own identity + bank details in Stripe's hosted flow. Store the
   resulting live `acct_…` with `chargesEnabled`/`payoutsEnabled = true`. **Never reuse a
   test `acct_`.**

**Verify**: `stripe trigger payment_intent.succeeded --api-key sk_live_…` (or the real $5
smoke order) → live endpoint returns 200, `Order` + `OrderEvent` created, transfer visible.

## 3. Clerk — three production instances  — Owner: Eng

Three **separate** Clerk applications, one per portal. A Clerk production instance is a
**brand-new instance** (users, JWT templates, webhooks, OAuth, settings do **not** carry over
from dev) and **requires DNS** (CNAMEs + DKIM, §1). See [ADR-0007](../adr/0007-three-clerk-instances-per-portal.md).

| Instance | Apps | Prod env (Vercel project) |
|---|---|---|
| **Roaster** | `joe-perks-roaster` | `pk_live`, `sk_live`, `CLERK_WEBHOOK_SECRET`, sign-in/up + after URLs |
| **Org** | `joe-perks-org` | `pk_live`, `sk_live`, `CLERK_WEBHOOK_SECRET`, sign-in/up + after URLs |
| **Admin** | `joe-perks-admin` | `pk_live`, `sk_live`, sign-in + after URL (webhook only if admin webhooks enabled) |

**Switchover steps** (per instance)
1. Create the production instance in Clerk; add its DNS records at GoDaddy (§1); wait for verification + certs.
2. Recreate JWT/session settings, OAuth providers, and the `user.created`/`user.updated` webhook → `roasters.joeperks.com`/`orgs.joeperks.com` (admin if enabled).
3. Put `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (`pk_live`), `CLERK_SECRET_KEY` (`sk_live`), `CLERK_WEBHOOK_SECRET`, and the sign-in/up URLs into the matching Vercel **production** project.

**Verify**: sign in on each prod portal; Clerk webhook delivery succeeds; a new prod
`User.externalAuthId` matches the real Clerk prod user ID. Cutover sanity check: the three
publishable keys differ (confirms three distinct apps).

> 🛑 **Known fix-before-sync**: `.vercel/env/admin.production.env` currently contains
> **`pk_test`/`sk_test`** Clerk keys (test mode). Replace them with the **admin live instance**
> `pk_live`/`sk_live` before running `pnpm vercel:env:sync --env production --apply`, or the
> production admin app will boot against a dev Clerk instance.

## 4. Resend (email) — Owner: Chris (domain/Workspace) / Eng (key)

✅ **DONE (2026-06-07): migrated off the borrowed Locuvi key + domain to a dedicated Joe Perks
Resend account.** The Locuvi credential is no longer present in root `.env` or
`.vercel/.env.preview.local`. Remaining follow-up: revoke the old Locuvi `re_…` key in the
**Locuvi** Resend account, and run an external Gmail/Outlook/Yahoo deliverability check.

| Item | Test/sandbox (old) | Live/prod (now) |
|---|---|---|
| API key | Locuvi `re_…` (decommissioned) | **Joe Perks** `RESEND_TOKEN=re_…` ✅ |
| Sender | Locuvi verified domain | `RESEND_FROM=orders@joeperks.com` ✅ |

**Switchover steps** (completed)
1. ✅ Created the Joe Perks Resend account; verified **root `joeperks.com`**. Resend DKIM CNAMEs
   + merged SPF + `_dmarc` added at GoDaddy per §1. *(Alternative for max reputation isolation:
   verify a `send.joeperks.com` subdomain instead — From becomes `@send.joeperks.com`.)*
2. ✅ **From** = `Joe Perks <orders@joeperks.com>`; **Reply-To** = `support@joeperks.com`.
3. ✅ Google Workspace **aliases** on the single `joe@` seat: `support@`, `hello@`, `noreply@`,
   `orders@` → all route to `joe@joeperks.com`. No extra seat needed.
4. ✅ Set `RESEND_TOKEN` + `RESEND_FROM` in Vercel **production** for `web`, `roaster`, `admin`.

**Verify**: ✅ `pnpm --filter @joe-perks/email smoke` passed (`resend_plus_db`); internal send to
`orders@joeperks.com` received (dedupe confirmed — 1 of 2 delivered). ✅ External deliverability
check (2026-06-07) — landed in inbox, DKIM/SPF/DMARC pass, and Reply-To (`support@joeperks.com`)
routes to the `joe@` seat. ⬜ Revoke the old Locuvi key in the Locuvi account.

## 5. Neon (database) — Owner: Eng

| Item | Dev | Prod |
|---|---|---|
| Branch | `dev` | `main` |
| Connection | dev `DATABASE_URL` | prod `DATABASE_URL` via `packages/db/.env.production` (selected by `PRISMA_DATABASE_PROFILE=production`) |

**Switchover steps**: snapshot prod first (Gate §0); `pnpm migrate:deploy:prod`;
`pnpm db:seed:prod` (singletons only — `PlatformSettings`, `OrderSequence`); `pnpm db:smoke:prod`.
Set production `DATABASE_URL` (Neon `main`, pooled URL) in all four Vercel projects.
**Verify**: `_prisma_migrations` matches the committed migration set; `db:smoke:prod` passes.

> Do **not** run local E2E seed helpers against production — see bootstrap "Core rule".

## 6. Inngest — Owner: Eng

| Item | Dev | Prod |
|---|---|---|
| Signing key | dev | `INNGEST_SIGNING_KEY` (prod) |
| Event key | dev | `INNGEST_EVENT_KEY` (prod) |

**Switchover steps**: create/select the Inngest **production** environment; set both keys in
`joe-perks-web` production; sync the app URL (`https://joeperks.com/api/inngest`).
**Verify**: `sla-check`, `payout-release`, `cart-cleanup` visible in the prod Inngest
dashboard. *(Heartbeat monitoring of these three jobs is wired in [`./observability-setup.md`](./observability-setup.md).)*

## 7. Upstash Redis (rate limiting) — Owner: Eng

Provision a **separate production database** (rate-limit counters must not share dev state).
Set `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` (prod) in `joe-perks-web` production.
**Verify**: checkout/onboarding rate limits enforce in prod; no shared counters with dev.

## 8. Sentry — Owner: Eng

Keep the **same 4 projects** (one per app) — isolate by the **`environment` tag**
(`production`, set automatically from `VERCEL_ENV`), **not** new prod projects. DSN is
per-project across all envs.
Set `NEXT_PUBLIC_SENTRY_DSN` (per app) + `SENTRY_AUTH_TOKEN` (sourcemap upload) +
`SENTRY_ORG`/`SENTRY_PROJECT` in production.
**Verify**: a seeded prod error appears tagged `environment:production`; buyer PII scrubbed.

## 9. PostHog (analytics) — Owner: Eng

Create a **separate production project** (keeps beta funnels clean of dev noise — free-tier
safe; PostHog's free allotment is event-volume-based org-wide, beta volume is negligible).
Set `NEXT_PUBLIC_POSTHOG_KEY` (`phc_…`, prod project) + `NEXT_PUBLIC_POSTHOG_HOST` in
`joe-perks-web` production.
**Verify**: a prod conversion event lands in the prod project only.
*Future: when on paid, optionally migrate to PostHog "Environments" within one project.*

## 10. Arcjet (bot/abuse protection) — Owner: Eng

Same `ARCJET_KEY` may span envs, but ensure rules run in **LIVE/block mode in production**
(DRY_RUN/log-only in preview). Set `ARCJET_KEY` (`ajkey_…`) in production.
**Verify**: a blocked request is actually rejected in prod, not just logged.

## 11. UploadThing (product images / org logos) — Owner: Eng

Provision a **separate production app** (asset isolation). Set `UPLOADTHING_TOKEN` in
`joe-perks-roaster` production (9 app files depend on it).
**Verify**: a product image uploads and renders from the prod app on a prod storefront.

## 12. Application secrets — Owner: Eng

| Secret | Prod handling |
|---|---|
| `SESSION_SECRET` | **New strong random value, prod-only, kept stable.** Rotating it later invalidates all buyer magic-link sessions. |
| `FLAGS_SECRET` | New prod value (feature-flag signing). |

## 13. BetterStack — env rows only (setup lives in its own doc)

Full setup — monitors, **cron heartbeats** (highest leverage), status page, mounting the
`<Status>` pill, logs + webhook-failure alert, on-call — is a **separate implementation
step**: [`./observability-setup.md`](./observability-setup.md). Free-tier-constrained.

| Env var | Meaning |
|---|---|
| `BETTERSTACK_API_KEY` | **Uptime API token** (read; powers the `<Status>` pill) |
| Logs source token | for `@logtail/next` — **confirm exact var name against the installed `@logtail/next` version** during the observability step |
| `BETTERSTACK_URL` | public status page URL (`https://status.joeperks.com`) |

## 14. Featurebase (user feedback / bugs / feature requests) — Owner: Eng

Beta tooling for user bug reports, feature requests, **help center**, and changelog — targeting
**all surfaces** (storefront + portals). One Featurebase org spans environments (it is not a
test→live key swap), but the prod apps still need the org + optional identity secret set.
Integration mirrors BetterStack: `@repo/feedback` (`packages/feedback`) with `keys.ts` + an
env-gated `<FeedbackWidget>`. 🔭 **Not fully specced — go-live-strategy item to revisit**: see
[`../feedback/`](../feedback/README.md) (hub), [`../feedback/setup.md`](../feedback/setup.md)
(checklist), [`../feedback/full-implementation-plan.md`](../feedback/full-implementation-plan.md) (stub).

| Env var | Scope | Meaning |
|---|---|---|
| `NEXT_PUBLIC_FEATUREBASE_ORG` | client | Featurebase org subdomain (drives the widget) |
| `FEATUREBASE_SSO_SECRET` | server | signs identity hash for seamless user identification (optional) |
| `FEATUREBASE_API_KEY` | server | REST API key for server-side post creation (optional) |

Added to the sync allowlist for `roaster`, `org`, `admin`. **Verify**: widget appears in the
chosen portal(s) and a submitted post is attributed to the signed-in user.

---

## Tier 3 — Must stay UNSET in production (guardrail)

These are dormant Next-Forge scaffolding with **zero app usage**. Confirm production has **no
value** set for any of them, and that no borrowed/leftover key is sitting in production. *(The
Locuvi Resend key — the original offender — was removed on 2026-06-07; see §4. Still revoke it
in the Locuvi account.)*

| Service | Env var(s) | Note |
|---|---|---|
| Liveblocks | `LIVEBLOCKS_SECRET` | cosmetic live-cursors on a demo page; self-gates off when unset. Post-beta: delete the demo render + `@repo/collaboration`. |
| Knock | `KNOCK_SECRET_API_KEY`, `NEXT_PUBLIC_KNOCK_*` | unused |
| BaseHub (CMS) | `BASEHUB_TOKEN` | unused |
| OpenAI | `OPENAI_API_KEY` | unused |
| Svix | `SVIX_TOKEN` | unused (Clerk handles its own webhooks) |
| Vercel Blob | `BLOB_READ_WRITE_TOKEN` | unused (UploadThing is the v1 store) |
| Google Analytics | `NEXT_PUBLIC_GA_MEASUREMENT_ID` | unused (PostHog is v1 analytics) |

---

## Recommended order

DNS is the long pole; do it first. Otherwise follow runbook **Phase B** for the full
sequence and abort criteria.

1. Gate §0 (Stripe platform activation, legal, DNS records, prod snapshot).
2. Wait for DNS verification (Vercel domains + Clerk ×3 + Resend + status).
3. Stripe keys + live webhook → §2. Clerk ×3 → §3. Resend → §4.
4. Neon prod migrate/seed/smoke → §5. Inngest/Upstash/Sentry/PostHog/Arcjet/UploadThing → §6–11.
5. App secrets → §12.
6. Concierge live Connect onboarding for pilots (bootstrap §5–6).
7. Smallest live smoke transaction + immediate refund (bootstrap §9).
8. BetterStack observability step → [`./observability-setup.md`](./observability-setup.md).

## Appendix — Per-Vercel-project production env upload

The production env upload is **file-based**, not raw `vercel env add`. Each project has a
template at `.vercel/env/<project>.production.env`; `pnpm vercel:env:sync` upserts it to Vercel,
filtered by a per-project `ALLOWED_KEYS` allowlist in `scripts/vercel-sync-envs.mjs` (a key not
in the allowlist is rejected — the allowlist is the source of truth for what each project may
hold). The four Vercel projects are `joe-perks-web`, `-roaster`, `-org`, `-admin`.

**Which keys go in which project** is the "(Vercel project)" note in each service section above
(§2–§14). Each `*.production.env` should contain that project's Tier-1 keys filled with **live**
values, and nothing from the Tier-3 guardrail table.

**State of the committed templates** (`.vercel/env/` is gitignored — never committed):
- `DATABASE_URL` already points at the prod Neon branch (`ep-bold-field-a4vzldxd`), distinct
  from dev (`ep-dark-tree-a49szqgx`) — isolation OK.
- 🛑 `admin.production.env` has **test-mode Clerk keys** — replace with live (see §3).
- `roaster`/`org` Clerk keys are still unfilled `# …=` placeholders — fill with live values.
- Stripe/Resend/Inngest/Upstash/PostHog/UploadThing/`SESSION_SECRET`/`FLAGS_SECRET`/BetterStack
  values are unfilled — fill before sync.

**Commands**

```bash
# Dry-run (prints what would change, no writes):
pnpm vercel:env:sync --env production

# Apply all four projects:
pnpm vercel:env:sync --env production --apply

# Apply selected projects only:
pnpm vercel:env:sync --env production --project web --project admin --apply
```

> Preview keeps test-mode values — run the same commands with `--env preview` only when
> intentionally updating preview. Never copy live values into preview or local `.env`.

## Sign-off (production credential cutover)

- Eng lead: ______________________ Date: _______
- Chris (business/Stripe/DNS/email): ______________________ Date: _______

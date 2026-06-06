# Observability Setup — BetterStack

**Status**: Implementation step. Sequenced **after** the credential cutover (needs live
domains resolving). Free-tier-constrained for beta.
**Owner**: Eng lead.
**Last updated**: 2026-06-05

## Goal

Full operational visibility across all instances on the **BetterStack free tier** during the
beta: uptime monitoring, cron-job health, a public status page, centralized logs with one
critical alert, and email/push on-call. This consolidates on-call onto BetterStack and
**closes the PagerDuty TBD** in [`./v1-launch-runbook.md`](./v1-launch-runbook.md) §A.4.

## Related

- [`./sandbox-to-production-cutover.md`](./sandbox-to-production-cutover.md) §13 — the BetterStack **env-var** rows
- [`./v1-launch-runbook.md`](./v1-launch-runbook.md) §A.4 (observability) + §B.4 (abort: webhook signature failures > 0 in 10 min)
- [`../observability/launch-observability-gap-analysis.md`](../observability/launch-observability-gap-analysis.md) — findings, recommendations, and go-live review checklist for the broader workload/control-plane/recovery-loop layer

## What already exists in the repo

- **Logs**: `packages/observability/log.ts` ships structured logs via `@logtail/next` in
  production (`log = NODE_ENV==='production' ? logtail : console`); `withLogtail` is wired in
  `packages/observability/next-config.ts`.
- **Status pill**: `packages/observability/status/index.tsx` is a finished `<Status>` server
  component (reads BetterStack Uptime `/api/v2/monitors`, renders a colored health dot
  linking to the status page) — **built but rendered nowhere yet**.
- **Env keys**: `BETTERSTACK_API_KEY` + `BETTERSTACK_URL` validated in `observability/keys.ts`.

## Two distinct credentials

The scaffolding conflates these — they are different BetterStack products:

1. `BETTERSTACK_API_KEY` → **Uptime API token** (Bearer; read by the `<Status>` pill).
2. **Logs source token** → for `@logtail/next`. **Confirm the exact env-var name against the
   installed `@logtail/next` version** before wiring (do not assume).
3. `BETTERSTACK_URL` → public status-page URL (`https://status.joeperks.com`).

## Free-tier budget (verify current limits — they move)

- **~10 monitors total.** Spend deliberately. Priority order if the cap is below 10:
  1. **3 cron heartbeats** (sla-check, payout-release, cart-cleanup) — *non-negotiable*; a
     silent `payout-release` failure means roasters don't get paid and nobody notices.
  2. 4 portal/storefront domains (`joeperks.com`, `roasters.`, `orgs.`, `admin.`)
  3. Stripe webhook route, Inngest serve route
  4. `www` (drop first)
- **Checks** coarser on free (~3 min) — fine for beta.
- **On-call** = email + push only on free (SMS/phone burn paid credits).
- **Logs** = low volume + short retention (~3 days) — enough for the webhook alert; lean on
  Sentry for deeper error history.
- **1 status page** — exactly what we need.

## Implementation checklist

### A. Uptime monitors
- [ ] HTTP monitors for `joeperks.com`, `roasters.joeperks.com`, `orgs.joeperks.com`, `admin.joeperks.com` (+ `www` if budget allows)
- [ ] Monitor for the Stripe webhook route (expects 4xx on unsigned GET, not 5xx)
- [ ] Monitor for the Inngest serve route (`/api/inngest`)

### B. Cron heartbeats (highest leverage)
- [ ] Create a BetterStack heartbeat for each Inngest job: `sla-check` (hourly), `payout-release` (daily), `cart-cleanup` (daily)
- [ ] Wire each job to ping its heartbeat URL on **successful** completion (`apps/web/lib/inngest/functions.ts` / `run-payout-release.ts`)
- [ ] Set the expected period + grace so a missed run alerts

### C. Status page
- [ ] Create the public status page; components grouped: **Storefront / Roaster portal / Org portal / Admin / Payments / Email / Background jobs**
- [ ] Add `status` CNAME at GoDaddy (cutover §1); set `BETTERSTACK_URL=https://status.joeperks.com`
- [ ] (Optional, deferred) status-page subscribers — for beta, concierge-notify the 3+3 pilots manually instead

### D. Mount the `<Status>` pill
- [ ] Render `<Status>` from `@repo/observability/status` in the app footer(s), storefront first
- [ ] Set `BETTERSTACK_API_KEY` (Uptime token) in production so it reads real monitors

### E. Logs + the one critical alert
- [ ] Set the Logs source token (confirmed var name) in production
- [ ] Confirm logs carry `orderNumber`, `roasterId`, `orgId` context on payment/webhook lines (runbook §A.4)
- [ ] Create a **log alert: webhook signature failures > 0 in a 10-minute window** → powers runbook abort criterion §B.4

### F. On-call (free tier)
- [ ] Define an on-call schedule (primary = Eng lead, secondary = Chris per runbook §B.3)
- [ ] Escalation via **email + push** (no SMS/phone on free)
- [ ] Route monitor + heartbeat + the webhook log alert into it

## Verify
- [ ] `<Status>` pill shows "All systems normal" on a prod page
- [ ] Killing one monitor target flips the pill + fires an email/push alert
- [ ] A deliberately missed heartbeat alerts within its grace period
- [ ] Status page resolves at `status.joeperks.com`
- [ ] The launch owner reviews the go-live checklist in [`../observability/launch-observability-gap-analysis.md`](../observability/launch-observability-gap-analysis.md) and confirms the current dashboards can answer the checkout, webhook, job, SLA, deployment-profile, and rollback-decision questions.

## Upgrade-to-paid triggers (post-beta)
- SMS/phone escalation needed → paid on-call
- > ~10 monitors or sub-minute checks needed
- Log retention > 3 days needed

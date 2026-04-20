# Joe Perks v1 Launch Runbook

**Status**: Living doc until v1 ships. Freeze and snapshot on go-live day.
**Owner**: Eng lead (primary) + Chris (business decisions)
**Last updated**: 2026-04-19

**Related**
- [`../pre-mortems/2026-04-19-v1-launch.md`](../pre-mortems/2026-04-19-v1-launch.md) — risk analysis that produced this runbook
- [`../../SCAFFOLD_CHECKLIST.md`](../../SCAFFOLD_CHECKLIST.md) — execution tracker (Phase 10 is the gate for this runbook)
- [`../testing/money-path-e2e-scenarios.md`](../testing/money-path-e2e-scenarios.md) — E2E test coverage
- [`./2026-04-database-schema-reconciliation.md`](./2026-04-database-schema-reconciliation.md) — DB drift findings from launch-readiness debugging
- [`../VERCEL_DEPLOYMENT_GAP_CHECKLIST.md`](../VERCEL_DEPLOYMENT_GAP_CHECKLIST.md) — original Vercel-specific gaps
- [`../VERCEL_PRODUCTION_PREVIEW_SETUP.md`](../VERCEL_PRODUCTION_PREVIEW_SETUP.md) — Vercel project setup

---

## How to use this runbook

Work top-to-bottom. Every row either has a box you check or a named decision. Do not skip rows; if a row doesn't apply, write *N/A — reason* next to it.

Three phases:
1. **T-14 days: Prepare** — legal, auth, infra, tests all green on preview.
2. **T-0: Dress rehearsal + go-live** — production deploy + smoke test + first real order.
3. **T+1 to T+7: Watch** — on-call, metrics, fast-follow shipping.

Abort criteria at the end of each phase.

---

## Phase A — T-14 to T-3 days — Prepare

### A.1 Legal & business (blocks go-live, not deploy)
- [ ] LLC formed; EIN issued.
- [ ] Business bank account opened and funded enough to absorb a week of Stripe fees.
- [ ] Stripe Connect platform agreement signed; live-mode keys issued.
- [ ] ToS (roaster, org, buyer), Privacy Policy, DPA reviewed by marketplace/payments counsel.
- [ ] Placeholder copy in `apps/web/app/[locale]/privacy-policy/page.tsx` and `apps/web/app/[locale]/terms/roasters/page.tsx` replaced with counsel-reviewed copy. Grep the repo for the string "PENDING LEGAL REVIEW" → zero hits.
- [ ] DPAs signed with: Stripe, Clerk, Resend, Neon, Inngest, Upstash, Sentry, PostHog.
- [ ] At least **3 roasters** and **3 orgs** signed as pilots (LOIs or contracts). See [`../gtm/pilot-outreach.md`](../gtm/pilot-outreach.md).

### A.2 Auth & tenancy (engineering)
- [ ] Clerk wired in `apps/org`; sign-in/sign-up routes live.
- [ ] Integration test `org-tenant-isolation.test.ts`: Org A tries to read Org B's campaign, order, payout, roaster contacts — every read returns 403/empty. Committed + gated in CI.
- [ ] `apps/admin` protected by real auth (Clerk admin role claim *or* HTTP Basic Auth with bcrypt + constant-time compare). No env-var truthy checks.
- [ ] Vercel deployment protection enabled on `joe-perks-admin` preview + production.
- [ ] `requireOrgId()` and `requireRoasterId()` helpers audited — each throws on missing session; no fall-through.

### A.3 Money path (engineering)
- [ ] E2E scenarios MP-01 through EC-24 implemented per [`../testing/money-path-e2e-scenarios.md`](../testing/money-path-e2e-scenarios.md).
- [ ] `.github/workflows/e2e.yml` runs on every PR and nightly on `main`; green for 3 consecutive runs before go-live.
- [ ] Invariant helper `assertSplitInvariants()` added to `packages/stripe/src/splits.ts`; unit-tested.
- [ ] Stripe test-mode PaymentIntent → webhook → `Order` → payout transfer path runs end-to-end on preview.

### A.4 Observability & ops
- [ ] Sentry (4 projects: web, roaster, org, admin) receiving events from preview. PII scrubbing verified on a seeded error.
- [ ] BetterStack (or equivalent) uptime checks on all 5 domains at 1-min interval.
- [ ] Public status page live (`status.joeperks.com` recommended subdomain).
- [ ] PagerDuty / on-call schedule defined. If N=1, document explicit "out of office" coverage plan.
- [ ] Three incident-comms templates committed in `docs/runbooks/` — `degraded.md`, `outage.md`, `payments-down.md`.
- [ ] `@repo/observability` logs include `orderNumber`, `roasterId`, `orgId` context on every payment/webhook log line.

### A.5 Data & deploy pipeline
- [ ] `prisma migrate deploy` wired into release flow (Vercel build step, or a GH Action that runs `pnpm migrate:deploy:prod` *before* promoting a Vercel deployment).
- [ ] Neon production snapshot retention ≥ 7 days; restore tested at least once on a staging branch.
- [ ] Rollback procedure section below tested end-to-end on preview.

**April 2026 schema note**
- Production Neon was verified against the current repo and matched committed Prisma state: `packages/db/prisma/schema.prisma` plus the checked-in migrations under `packages/db/prisma/migrations`.
- The older dev Neon branch had two additional applied migrations in `_prisma_migrations` that were **not** present in the current checkout: `20260405134350_buyer_account_foundation` and `20260406032052_sprint8_fulfillment_schema_event_alignment` (historical commits `03943f3` and `472749d`).
- Result: dev may have extra columns, enum values, and seed data that do not reflect the current source of truth. For launch, deploy, and frontend E2E, treat the current repo schema + committed migrations as canonical unless those missing migrations are intentionally restored to the repo first.
- Before seeding, restoring, or copying data between Neon branches, compare `_prisma_migrations` on both sides. Do not assume the more-populated branch is the correct schema.

### A.6 DNS & env vars
- [ ] Preview env vars complete per [`../VERCEL_DEPLOYMENT_GAP_CHECKLIST.md`](../VERCEL_DEPLOYMENT_GAP_CHECKLIST.md).
- [ ] Production env vars complete (live Stripe keys, Clerk prod keys, prod Resend domain, prod Inngest signing key, prod Upstash, Sentry auth token, etc.).
- [ ] DNS A / CNAME records for `joeperks.com`, `www.joeperks.com`, `roasters.joeperks.com`, `orgs.joeperks.com`, `admin.joeperks.com` pointed at Vercel. Verified in Vercel dashboard.
- [ ] Email: SPF, DKIM, DMARC records for Resend sending domain. Deliverability tested to Gmail, Outlook, Yahoo.

### A.7 Webhooks
- [ ] Stripe webhooks registered for **preview** and **production**: `payment_intent.succeeded`, `charge.refunded`, `charge.dispute.*`, `account.updated` (for Connect), `transfer.paid`, `transfer.failed`.
- [ ] Clerk webhooks registered for **roaster** and **org** apps (preview + prod): `user.created`, `user.updated`, `session.*` as needed.
- [ ] Inngest app synced with production env; jobs visible in dashboard.
- [ ] Stripe CLI smoke test: `stripe trigger payment_intent.succeeded --api-key sk_test_...` → preview webhook returns 200, `OrderEvent` created.

### A.8 Abort criteria for Phase A
If any of these are true at T-3, **do not proceed** to dress rehearsal:
- Any LB-* Tiger from the pre-mortem is not **Done**.
- `pnpm test:e2e` has flaked in the last 48h.
- No signed pilot roaster available for a live-mode onboarding test.
- Legal copy still contains "PENDING LEGAL REVIEW".

---

## Phase B — T-2 to T-0 — Dress rehearsal + go-live

### B.1 Full dress rehearsal on **preview** (T-2, morning)
Script — run top to bottom as one person. Take screenshots; file in `docs/runbooks/launch-day-evidence/`.

1. [ ] Sign up a net-new roaster via `roasters.preview.joeperks.com`. Complete Stripe Connect (test-mode) onboarding.
2. [ ] Admin approves roaster in `admin.preview.joeperks.com`.
3. [ ] Roaster creates a product; uploads image (or confirms UploadThing is out-of-scope for v1).
4. [ ] Sign up a net-new org via `orgs.preview.joeperks.com`. Create a campaign with `orgPct = 0.15`.
5. [ ] Admin approves campaign.
6. [ ] Navigate to the campaign storefront on `preview.joeperks.com/<org>/<camp>`. Add to cart. Checkout with card `4242…`.
7. [ ] Verify Stripe webhook fires (Sentry trace + Stripe dashboard event log). `Order` row created.
8. [ ] Roaster receives fulfillment magic link email (check Resend test inbox). Click → fulfillment page renders.
9. [ ] Enter tracking; mark shipped.
10. [ ] Buyer receives "Shipped" email with tracking link.
11. [ ] Flip clock forward (Inngest test harness or manually advance `deliveredAt`) to simulate delivery + 30d payout.
12. [ ] Payout release job fires; Stripe transfer visible in dashboard.
13. [ ] Refund test: issue a refund from admin; confirm order status flips, no payout on that order.
14. [ ] Dispute test: trigger `charge.dispute.created` via Stripe CLI; admin gets notified; roaster balance handled.

If any step fails → **stop, fix, restart the script from step 1.**

### B.2 Production cutover (T-1, afternoon)
- [ ] Code freeze on `main`. Tag `v1.0.0-rc.1`.
- [ ] Run `prisma migrate deploy` against production Neon branch. Verify `_prisma_migrations` up to latest.
- [ ] Take a Neon snapshot. Note snapshot ID here: `__________________`.
- [ ] Flip DNS TTL to 300s (in case of rollback).
- [ ] Deploy tagged build to Vercel production for all 4 apps. Monitor build logs.
- [ ] Run the Phase B.1 dress-rehearsal script again on **production** domains but with a **test-card-in-live-mode** if possible, or the smallest real charge ($5) against Chris's own card with a designated pilot roaster who has agreed to be the zeroth customer.
- [ ] Immediately refund the $5 test charge. Verify refund flows through.

### B.3 Go-live (T-0)
- [ ] Chris announces soft-launch to the 3 pilot orgs. Provide campaign setup instructions if concierge.
- [ ] On-call for first 72 hours: primary = Eng lead, secondary = Chris.
- [ ] Watch Sentry, BetterStack, Stripe dashboard, Inngest dashboard, PostHog in a single open browser profile.
- [ ] First real order: all hands on — watch the full money path live.
- [ ] Confirm first payout releases at t+30d on calendar.

### B.4 Abort criteria for Phase B
If any of these happen during dress rehearsal or cutover, **abort the launch** and restart after fix:
- Any invariant in `assertSplitInvariants()` fires.
- Webhook signature failures > 0 in a 10-minute window.
- Stripe transfer to roaster fails or is delayed > 10 min.
- Any admin action occurs without a corresponding `AdminActionLog` row.
- Buyer PII appears unscrubbed in any Sentry event.

---

## Phase C — T+1 to T+30 — Watch

### C.1 Daily check (first 7 days)
- [ ] Orders placed / orders fulfilled / SLA breaches — daily report.
- [ ] Any webhook retry count > 1 — investigate.
- [ ] Any `OrderEvent` type without a paired sent email — FF-3 regression.
- [ ] Sentry error budget: < 5 new error types per day.
- [ ] Stripe balance reconciliation — platform receipts match `platformAmount` sum from `OrderEvent`.

### C.2 Fast-follow ship schedule
Each has a named owner in [`../../SCAFFOLD_CHECKLIST.md`](../../SCAFFOLD_CHECKLIST.md) Phase 10. Week numbers are from T-0.

- **W1**: FF-1 (rate limits), FF-3 (email contract), FF-5 (status page + comms templates).
- **W1–2**: FF-2 (buyer accounts).
- **W2**: FF-4 (admin audit UI).
- **W2–3**: FF-6 (centralized order state transitions).

### C.3 Track-Tiger monitoring
- **T-1 (magic-link expiry)**: alert if any `MagicLink.consumedAt - MagicLink.createdAt > 24h`.
- **T-2 (dispute threshold)**: alert if any roaster hits 2 disputes in 30d.
- **T-3 (i18n)**: weekly traffic by locale; alert if non-en-US > 5%.

### C.4 T+30 retrospective
Run the `pm-execution:retro` skill with real data. Attach to `docs/retros/2026-05-19-v1-retro.md`.

---

## Rollback procedure

Keep this section one page. If the runbook has too many pages, rollback will fail.

### Decision tree
- **Bad deploy, schema unchanged**: Re-promote previous Vercel deployment. < 2 min.
- **Bad deploy, schema changed**:
  1. Re-promote previous Vercel deployment (app rolls back).
  2. If migrations are backwards-compatible (additive columns, no drops): leave DB alone.
  3. If migrations are breaking: `pnpm prisma migrate resolve --rolled-back <migration_name>` against prod DB, then re-run `prisma migrate deploy` for the last-good migration set. Last resort: restore from pre-deploy Neon snapshot (from Phase B.2). Data loss window = time since snapshot.
- **Stripe-side problem (webhook broken, Connect disabled)**: freeze new checkouts by flipping a feature flag (`FEATURE_CHECKOUT_ENABLED=false` in Vercel env) — `apps/web/app/api/checkout/create-intent/route.ts` must honor this flag. Buyers see a maintenance page.
- **Dataloss suspected**: stop writes, call Neon support, snapshot current state, compare to last known-good snapshot.

### After any rollback
- [ ] Write an incident note in `docs/runbooks/incidents/YYYY-MM-DD-<slug>.md`.
- [ ] Update pre-mortem risk list if a new class of failure surfaced.
- [ ] Determine whether the rollback invalidates any pilot roaster/org's trust; reach out personally.

---

## Go / No-Go meeting template

**When**: T-1 afternoon, 30 minutes.
**Attendees**: Chris, Eng lead. Counsel on call if legal-blocking items are still open.
**Format**:

1. **Status walk** (10 min): every Phase 10 row read aloud; "Done / Not Done / N/A". No ambiguity allowed.
2. **Abort checks** (5 min): Phase A.8 + Phase B.4 criteria re-read.
3. **Decision** (5 min): Go, Delay, or Scope-down (one of the phased alternatives in pre-mortem §"If the list is too long").
4. **If Go**: sign-off names recorded below. If Delay: new go-live date + list of blockers.
5. **If Scope-down**: decide which alternative (roaster-only, single-org, extended preview), and update the pre-mortem + checklist.

**Sign-off** (v1 go-live):
- Chris: ______________________ Date: _______
- Eng lead: ______________________ Date: _______

---

## Appendix: contact list

- **Counsel**: TBD (fill before A.1)
- **Stripe support**: dashboard → Help → Contact. Live mode requires business details on file.
- **Neon support**: account dashboard; paid plan recommended before go-live for faster response.
- **Clerk**: dashboard → Help.
- **Resend**: dashboard; domain verification support.
- **Inngest**: dashboard; runtime diagnostics available.

---

*This runbook is the operational counterpart to the pre-mortem. The pre-mortem tells you **why**; this tells you **how**. If any step is ambiguous, fix this doc, not your memory.*

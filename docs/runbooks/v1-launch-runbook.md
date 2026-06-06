# Joe Perks v1 Launch Runbook

**Status**: Living doc until v1 ships. Freeze and snapshot on go-live day.
**Owner**: Eng lead (primary) + Chris (business decisions)
**Last updated**: 2026-06-05 (code-verification pass — see ⚠️ notes)

> ⚠️ **2026-06-05 code-verification pass.** Rows were checked against the actual codebase; inline notes mark reality (`⚠️ Code:` = gap, `✅ Code:` = landed in this pass).
>
> **Resolved this pass** (the three abort-criteria mechanisms that were missing): `assertSplitInvariants()` implemented + unit-tested (A.3); Sentry `beforeSend` PII scrubbing implemented + unit-tested across all 4 apps (A.4); `FEATURE_CHECKOUT_ENABLED` checkout kill-switch now honored (Rollback). The PII row still needs a seeded-preview-error verification to fully close.
>
> **Also resolved:** `charge.refunded` webhook handler added (A.7), closing the refund-reconciliation gap; the originally-listed `transfer.paid`/`transfer.failed` turned out not to be real Stripe events (taxonomy corrected in A.7 — transfer failures are already handled synchronously in the payout job).
>
> **Also resolved (2026-06-05, second pass):** `org-tenant-isolation.test.ts` added and CI now gates tests (`pnpm turbo test` in `ci.yml`, which previously ran none) — campaign + roaster-partnership isolation covered; order/payout read isolation still pending a test-DB harness.
>
> **Also resolved (2026-06-05, third pass):** three incident-comms templates written (A.4); `web`'s existing unit tests wired into CI (A.3) — `turbo test` now also covers web (24 tests); structured payment logger (`@repo/observability/payment-log`) built + adopted in the payout-release job (A.4).
>
> **Still open** (flagged but not yet coded): order/payout cross-tenant **read** test needs a seeded test DB (A.2); browser `e2e.yml` + money-path scenario coverage (A.3); `migrate:deploy:prod` not wired into release (A.5); migrate the remaining webhook/checkout log lines onto `createPaymentLog` (A.4).

**Related**
- [`../pre-mortems/2026-04-19-v1-launch.md`](../pre-mortems/2026-04-19-v1-launch.md) — risk analysis that produced this runbook
- [`../../SCAFFOLD_CHECKLIST.md`](../../SCAFFOLD_CHECKLIST.md) — execution tracker (Phase 10 is the gate for this runbook)
- [`../testing/money-path-e2e-scenarios.md`](../testing/money-path-e2e-scenarios.md) — E2E test coverage
- [`../testing/v1-launch-money-path-e2e-execution.md`](../testing/v1-launch-money-path-e2e-execution.md) — current sandbox results, runnable commands, and pre-production rotation checklist
- [`./v1-production-bootstrap-checklist.md`](./v1-production-bootstrap-checklist.md) — production-safe first-data bootstrap process for true beta
- [`./v1-production-beta-tester-worksheet.md`](./v1-production-beta-tester-worksheet.md) — fillable worksheet for each live production beta tester
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
- [ ] Integration test `org-tenant-isolation.test.ts`: Org A tries to read Org B's campaign, order, payout, roaster contacts — every read returns 403/empty. Committed + gated in CI. ⚠️ Code (2026-06-05): **partially done.** Test added (`apps/org/app/(authenticated)/__tests__/org-tenant-isolation.test.ts`) and now **gated in CI** (`pnpm turbo test` added to `ci.yml` — previously CI ran no tests). It proves an org cannot activate/modify another org's **campaign** (orgId-scoped `where` filters the cross-org row out, positive control confirms own-org access) and that **roaster-partnership** access is scoped to the acting org's application. **Still open:** order/payout **reads** are inlined in React Server Components (dashboard/earnings) and follow the same `where: { campaign: { orgId } }` pattern but aren't yet covered by a seeded cross-tenant DB test — needs the test-DB harness (shares the e2e A.3 follow-up).
- [ ] `apps/admin` protected by real auth (Clerk admin role claim *or* HTTP Basic Auth with bcrypt + constant-time compare). No env-var truthy checks.
- [ ] Vercel deployment protection enabled on `joe-perks-admin` preview + production.
- [ ] `requireOrgId()` and `requireRoasterId()` helpers audited — each returns a typed failure (`{ ok: false, error }`) on missing/invalid session; no silent fall-through; **every caller must gate on `.ok` before using the id**. ⚠️ Code: helpers return a discriminated union (they do *not* throw — earlier wording was wrong); observed callers redirect on `!ok`. Audit = confirm *all* callers gate, since a missed `.ok` check fails open.

### A.3 Money path (engineering)
- [ ] **Today’s commands** (until `pnpm test:e2e` ships): [`../testing/v1-launch-money-path-e2e-execution.md`](../testing/v1-launch-money-path-e2e-execution.md) — `pnpm test`, `pnpm e2e:sprint3`, Stripe listen + webhook secret.
- [x] **Sandbox-local executable suite completed on 2026-04-20**: `pnpm test`, `pnpm e2e:stripe-listen`, `pnpm e2e:stripe-trigger`, `pnpm e2e:sprint3`, and `pnpm test:e2e:frontend` all passed in the sandbox/test-key environment. See the execution log in [`../testing/v1-launch-money-path-e2e-execution.md`](../testing/v1-launch-money-path-e2e-execution.md).
- [ ] E2E scenarios MP-01 through EC-24 implemented per [`../testing/money-path-e2e-scenarios.md`](../testing/money-path-e2e-scenarios.md). ⚠️ Code: only **2 of 27** scenarios exist today (`tests/e2e/frontend/storefront.spec.ts` — storefront render + reach-payment-step). The money-path settlement scenarios are not yet written.
- [ ] `.github/workflows/e2e.yml` runs on every PR and nightly on `main`; green for 3 consecutive runs before go-live. ⚠️ Code: `e2e.yml` (browser/money-path) still does not exist. As of 2026-06-05 `ci.yml` now runs `pnpm turbo test` (unit/integration across stripe, observability, roaster, admin, org, **and web** — web's 8 test files / 24 tests are now wired). The remaining gap is the **browser** money-path e2e job (needs a test-DB harness + Stripe test secrets in CI).
- [x] Invariant helper `assertSplitInvariants()` added to `packages/stripe/src/splits.ts`; unit-tested. ✅ Code (2026-06-05): implemented (invariants 1–6, throws `SplitInvariantError`), called inside `calculateSplits()` as defense-in-depth, and unit-tested (`splits.test.ts`, 18 passing). The B.4 abort criterion now has a real mechanism behind it.
- [ ] Stripe test-mode PaymentIntent → webhook → `Order` → payout transfer path runs end-to-end on preview.

### A.4 Observability & ops
- [ ] Sentry (4 projects: web, roaster, org, admin) receiving events from preview. PII scrubbing verified on a seeded error. ⚠️ Code (2026-06-05): PII scrubbing is now **implemented** — `packages/observability/scrub.ts` (`beforeSend: scrubEvent` + `sendDefaultPii: false`) is wired into `server.ts`, `client.ts`, and `edge.ts`, and unit-tested (`scrub.test.ts`, 6 passing). Strips user identity, sensitive headers/cookies/body, captured stack-frame locals, breadcrumbs, and inline emails. **Still required to close this row:** seed a real error on preview and confirm scrubbing end-to-end (the "verified on a seeded error" half).
- [ ] BetterStack (or equivalent) uptime checks on all 5 domains at 1-min interval.
- [ ] Public status page live (`status.joeperks.com` recommended subdomain).
- [ ] On-call schedule defined. **Plan: consolidate on-call onto BetterStack (email/push on free tier) — closes this PagerDuty TBD.** See [`./observability-setup.md`](./observability-setup.md). If N=1, document explicit "out of office" coverage plan.
- [x] Three incident-comms templates committed in `docs/runbooks/` — `degraded.md`, `outage.md`, `payments-down.md`. ✅ Code (2026-06-05): all three written — decision checklist, public status-page copy, pilot/buyer/roaster notes, internal note, and resolve checklist each. `payments-down.md` leads with the checkout freeze and ties into the B.4 abort criteria.
- [ ] `@repo/observability` logs include `orderNumber`, `roasterId`, `orgId` context on every payment/webhook log line. ⚠️ Code (2026-06-05): **helper built + first adoption done.** `@repo/observability/payment-log` (`createPaymentLog`) emits the four canonical keys (`order_id`, `order_number`, `roaster_id`, `org_id` — null when unknown) on every line; unit-tested. Adopted across the **payout-release job** (`run-payout-release.ts`). **Still open:** migrate the remaining call sites to it — the Stripe **webhook route** handlers and the checkout **create-intent** failure log still use raw `console.*` (mechanical follow-up, behavior-only).
- [ ] 🔭 **Observability (BetterStack)** — go-live-strategy item: monitors, **cron heartbeats**, status page, `<Status>` pill, webhook-failure alert. Scaffolded; full setup in [`./observability-setup.md`](./observability-setup.md).
- [ ] 🔭 **Feedback / help center (Featurebase)** — go-live-strategy item, not fully specced. `@repo/feedback` is scaffolded + env-wired; mount the widget everywhere (storefront + portals) and stand up boards/help center per [`../feedback/README.md`](../feedback/README.md). Add Featurebase to the §A.1 vendor DPA list when enabled.

### A.5 Data & deploy pipeline
- [ ] `prisma migrate deploy` wired into release flow (Vercel build step, or a GH Action that runs `pnpm migrate:deploy:prod` *before* promoting a Vercel deployment). ⚠️ Code: the `migrate:deploy:prod` script exists in root `package.json`, but it is **not** wired into `ci.yml` or any Vercel build step — today it is a manual pre-promote step. Either automate it or assign a named owner who runs it by hand and confirms `_prisma_migrations` before promotion.
- [ ] Neon production snapshot retention ≥ 7 days; restore tested at least once on a staging branch.
- [ ] Rollback procedure section below tested end-to-end on preview.

**April 2026 schema note**
- Production Neon was verified against the current repo and matched committed Prisma state: `packages/db/prisma/schema.prisma` plus the checked-in migrations under `packages/db/prisma/migrations`.
- The older dev Neon branch had additional applied migrations in `_prisma_migrations`. ⚠️ 2026-06-05 update: `20260405134350_buyer_account_foundation` is now **present** in the current checkout under `packages/db/prisma/migrations`; only `20260406032052_sprint8_fulfillment_schema_event_alignment` (historical commit `472749d`) remains **absent**. Treat just that one as the outstanding drift item.
- Result: dev may have extra columns, enum values, and seed data that do not reflect the current source of truth. For launch, deploy, and frontend E2E, treat the current repo schema + committed migrations as canonical unless those missing migrations are intentionally restored to the repo first.
- Before seeding, restoring, or copying data between Neon branches, compare `_prisma_migrations` on both sides. Do not assume the more-populated branch is the correct schema.

### A.6 DNS & env vars
- [ ] Preview env vars complete per [`../VERCEL_DEPLOYMENT_GAP_CHECKLIST.md`](../VERCEL_DEPLOYMENT_GAP_CHECKLIST.md).
- [ ] Production env vars complete (live Stripe keys, Clerk prod keys, prod Resend domain, prod Inngest signing key, prod Upstash, Sentry auth token, etc.).
- [ ] DNS A / CNAME records for `joeperks.com`, `www.joeperks.com`, `roasters.joeperks.com`, `orgs.joeperks.com`, `admin.joeperks.com` pointed at Vercel. Verified in Vercel dashboard.
- [ ] Email: SPF, DKIM, DMARC records for Resend sending domain. Deliverability tested to Gmail, Outlook, Yahoo.

### A.6b Sandbox -> production secret rotation checklist

Do **not** rotate Stripe / Clerk / Resend / Inngest / Upstash / Sentry values to production until every item below is complete. This is the gate before a **true frontend beta** with real users and production values.

- [ ] Sandbox evidence captured: current PASS results from [`../testing/v1-launch-money-path-e2e-execution.md`](../testing/v1-launch-money-path-e2e-execution.md) reviewed and still representative of the branch to be promoted.
- [ ] Preview dress rehearsal (Phase B.1) passes with **sandbox/test-mode** integrations on Vercel preview, including signed webhook delivery and buyer-facing checkout.
- [ ] Production data bootstrap plan approved: first real roasters, orgs, users, products, shipping rates, and campaigns are defined. Use [`./v1-production-bootstrap-checklist.md`](./v1-production-bootstrap-checklist.md). **Do not** use local E2E fixture seeds in production.
- [ ] Production Neon snapshot taken and latest committed migrations applied successfully.
- [ ] Production env values staged in password manager / secure notes and copied into Vercel **production** only (not local `.env`, not preview unless intentionally mirrored).
- [ ] Live Stripe endpoints created and their **production** webhook secrets captured; `STRIPE_WEBHOOK_SECRET` updated after endpoint creation.
- [ ] Live Clerk production apps/redirects/webhooks verified for `web`, `roaster`, and `org`.
- [ ] Resend production sending domain verified and tested; sender address updated away from any temporary sandbox/project values.
- [ ] Rollback owner and rollback path confirmed: previous Vercel deployment, Neon snapshot ID, and who can execute each step.
- [ ] Pilot beta script agreed: smallest-possible live smoke transaction, immediate refund path, named pilot roaster/org, and support/on-call coverage.
- [ ] Pilot worksheet ready for each tester: use [`./v1-production-beta-tester-worksheet.md`](./v1-production-beta-tester-worksheet.md).

### A.7 Webhooks
- [ ] Stripe webhooks registered for **preview** and **production**: `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`, `charge.dispute.created`, `charge.dispute.closed`, `account.updated` (for Connect). ✅ Code (2026-06-05): `charge.refunded` handler added (`apps/web/.../webhooks/stripe/route.ts`) — flips order to `REFUNDED`, stops pending payout (leaves an already-transferred payout intact and alerts for clawback), logs `REFUND_COMPLETED`; idempotent with the SLA auto-refund job. The other five events were already handled.
  - ⚠️ **Taxonomy correction:** `transfer.paid` and `transfer.failed` (in the original list) are **not events in the current Stripe API** — TypeScript rejects them as event types, so they can never be registered or handled. Roaster/org **transfer creation failures are already handled synchronously** in the payout-release job (`payoutStatus=FAILED` + `PAYOUT_FAILED` event), and dispute-driven clawbacks go through `reverseTransferIfPossible`. If post-hoc transfer-failure visibility is wanted later, the real modern signals are `transfer.reversed` (platform side) and `payout.failed` on the **connected account's** Connect webhook — both deferred to avoid double-handling the dispute reversal path.
- [ ] Clerk webhooks registered for **roaster** and **org** apps (preview + prod): `user.created`, `user.updated`, `session.*` as needed.
- [ ] Inngest app synced with production env; jobs visible in dashboard.
- [ ] Stripe CLI smoke test: `stripe trigger payment_intent.succeeded --api-key sk_test_...` → preview webhook returns 200, `OrderEvent` created.
- [ ] **Local dev**: forwarding + signing secret sync for `web` is documented in [`../testing/v1-launch-money-path-e2e-execution.md`](../testing/v1-launch-money-path-e2e-execution.md) (Stripe listen, `STRIPE_WEBHOOK_SECRET`, `pnpm e2e:stripe-listen` / `pnpm e2e:sprint3`).

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
- [ ] Re-read **Phase A.6b** and confirm every secret-rotation / production-bootstrap item is checked before touching Vercel production envs.
- [ ] Run `prisma migrate deploy` against production Neon branch. Verify `_prisma_migrations` up to latest.
- [ ] Take a Neon snapshot. Note snapshot ID here: `__________________`.
- [ ] Flip DNS TTL to 300s (in case of rollback).
- [ ] Create/bootstrap the first production data set (real roaster/org/user/product/campaign records) using [`./v1-production-bootstrap-checklist.md`](./v1-production-bootstrap-checklist.md). Do **not** run local E2E seed helpers against production.
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
- Any invariant in `assertSplitInvariants()` fires. ✅ Mechanism now exists (see A.3) — this criterion is live.
- Webhook signature failures > 0 in a 10-minute window.
- Stripe transfer to roaster fails or is delayed > 10 min. ✅ Synchronous transfer failures are caught in the payout-release job (`payoutStatus=FAILED` + `PAYOUT_FAILED` event); see the A.7 taxonomy correction (`transfer.failed` is not a real Stripe event). Post-hoc `transfer.reversed`/connected-account `payout.failed` visibility is a deferred follow-up.
- Any admin action occurs without a corresponding `AdminActionLog` row.
- Buyer PII appears unscrubbed in any Sentry event. ✅ PII scrubbing now implemented (see A.4); this criterion is meaningful rather than guaranteed-to-trip. Still confirm with a seeded preview error before relying on it.

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
- **W2–3**: FF-7 (observability — BetterStack monitors/heartbeats/status page, [`./observability-setup.md`](./observability-setup.md)).
- **W3+**: FF-8 (feedback + help center — Featurebase, full spec + rollout, [`../feedback/README.md`](../feedback/README.md)).

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
- **Stripe-side problem (webhook broken, Connect disabled)**: freeze new checkouts by flipping a feature flag (`FEATURE_CHECKOUT_ENABLED=false` in Vercel env) — `apps/web/app/api/checkout/create-intent/route.ts` honors this flag. Buyers get a 503 "temporarily unavailable". ✅ Code (2026-06-05): the route now returns 503 early when `FEATURE_CHECKOUT_ENABLED=false`; default (unset) = enabled, so normal operation never depends on the var. Key added to the `web` allowlist in `scripts/vercel-sync-envs.mjs`. (Buyers currently see a JSON 503, not a styled maintenance page — the API-level freeze works; a friendly storefront page is a nice-to-have follow-up.)
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

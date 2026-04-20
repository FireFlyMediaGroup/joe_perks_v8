# Joe Perks -- Sprint 4 Progress Tracker

**Tracker version:** 1.1
**Baseline document:** [`docs/SPRINT_4_CHECKLIST.md`](SPRINT_4_CHECKLIST.md) (v1.2)
**Story documents:** [`docs/sprint-4/stories/`](sprint-4/stories/)
**Sprint overview:** [`docs/sprint-4/README.md`](sprint-4/README.md)
**Purpose:** Track what is actually complete in this repository for Sprint 4 (order fulfillment, payouts, order event log, transactional emails) compared with the sprint checklist.

---

## How to use this file

- Treat `docs/SPRINT_4_CHECKLIST.md` as the **implementation plan**.
- Treat this file as the **current-state tracker**.
- Update this file whenever Sprint 4 follow-up work lands so the git diff shows exactly what changed between reviews.
- Each story has its own document in `docs/sprint-4/stories/` — story files are marked **`Done`** with acceptance criteria checked off.

### Status legend

| Status | Meaning |
|--------|---------|
| `Done` | Implemented and verified in the repo. |
| `Partial` | Started but incomplete -- some files or ACs remain. |
| `Todo` | Not yet started. |

---

## Revision log

| Review version | Date | Summary |
|----------------|------|---------|
| 0.1 | 2026-04-01 | Initial tracker. All stories at `Todo`. |
| 1.0 | 2026-04-01 | **Sprint 4 complete:** all 9 stories `Done`. Implementation includes `logOrderEvent`, webhook fulfillment magic links + email, roaster fulfill page, admin delivery confirmation, payout job + RoasterDebt + `PAYOUT_*` events, new email templates, SLA copy pass, `GET /api/orders/[id]/events`, migration `20260401120223_add_payout_order_event_types`. |
| 1.1 | 2026-04-01 | **Implementation review follow-up complete:** webhook confirmation is concurrency-safe, fulfillment links use DB-enforced dedupe via `MagicLink.dedupeKey`, payouts with debt >= roaster payout fail for manual resolution, `DELIVERED` events record admin actor ID, roaster fulfill page shows order date, admin exposes a `Refunded` tab, SLA admin copy uses configured hours, payout smoke script can run the live job, and admin Basic Auth is normalized through `@joe-perks/types`. |

---

## Snapshot summary

| Area | Status | Notes |
|------|--------|-------|
| Order event log helper + API (US-06-03) | `Done` | `packages/db/log-event.ts`; `GET /api/orders/[id]/events` (HTTP Basic); `handlePaymentIntentFailed` + `run-sla-check` standalone events use `logOrderEvent`; transactional creates commented in webhook + checkout + SLA auto-refund |
| Webhook fulfillment magic link (US-05-01) | `Done` | `createFulfillmentMagicLink` + `sendRoasterFulfillmentEmail` after buyer email; DB-enforced dedupe key + concurrency-safe confirmation side effects; `ROASTER_APP_ORIGIN` for URL |
| Fulfillment email template (US-08-02) | `Done` | `packages/email/templates/magic-link-fulfillment.tsx`; exports in `packages/email/package.json` |
| SLA email verification (US-08-05) | `Done` | `sla.tsx` copy improvements; admin alert tier labels use active settings hours; `run-sla-check` uses `logOrderEvent` for non-transactional tiers; preview verification is manual (`pnpm --filter email dev`) |
| Roaster fulfillment page (US-05-02) | `Done` | `fulfill/[token]/` with validate-token, details, order date, tracking form, `submit-tracking` transaction |
| Shipped email template (US-08-03) | `Done` | `packages/email/templates/order-shipped.tsx` |
| Delivery confirmation (US-05-03) | `Done` | `apps/admin/app/orders/` list + detail + `confirm-delivery` + `EventTimeline`; list capped at **200** rows (no `?page=`); tabs: Shipped (default), Confirmed, Delivered, Refunded, **All**; `DELIVERED` event stores admin actor ID |
| Delivered email template (US-08-04) | `Done` | `packages/email/templates/order-delivered.tsx` |
| Payout job verification (US-06-01) | `Done` | `run-payout-release.ts`: RoasterDebt deduction, debt-heavy orders fail for manual resolution, `PAYOUT_TRANSFERRED` / `PAYOUT_FAILED`, `Campaign.totalRaised` comment; `pnpm db:smoke:us-06-01` with optional `RUN_PAYOUT_RELEASE=1` |

---

## Phase 1 -- Order Event Log Helper + API (US-06-03)

| Item | Status | Evidence / current state | Next step |
|------|--------|--------------------------|-----------|
| `packages/db/log-event.ts` | `Done` | `logOrderEvent()` with try/catch | — |
| `packages/db/index.ts` export | `Done` | Exports `logOrderEvent` | — |
| Events query API | `Done` | `apps/web/app/api/orders/[id]/events/route.ts`; `apps/web/lib/admin-basic-auth.ts` | Set `ADMIN_EMAIL` / `ADMIN_PASSWORD` in env available to `apps/web` for Basic auth |
| Refactor existing callers | `Done` | `run-sla-check.tsx` standalone → `logOrderEvent`; transactional creates + comments in webhook, checkout, SLA refund | — |

---

## Phase 2 -- Webhook Fulfillment Magic Link (US-05-01)

| Item | Status | Evidence / current state | Next step |
|------|--------|--------------------------|-----------|
| MagicLink creation | `Done` | `apps/web/app/api/webhooks/stripe/route.ts` — `createFulfillmentMagicLink` with `dedupeKey` upsert | — |
| Fulfillment email send | `Done` | `sendRoasterFulfillmentEmail` | — |
| Idempotency guard | `Done` | `PENDING -> CONFIRMED` status-guarded transaction + duplicate-safe `StripeEvent` insert + DB-backed `MagicLink.dedupeKey` | — |

---

## Phase 3 -- Fulfillment Email Template (US-08-02)

| Item | Status | Evidence / current state | Next step |
|------|--------|--------------------------|-----------|
| `magic-link-fulfillment.tsx` | `Done` | Template + `PreviewProps` | Optional: verify in React Email preview |
| Preview verification | `Partial` | Not run in CI | Run `pnpm --filter email dev` locally |

---

## Phase 4 -- SLA Email Verification (US-08-05)

| Item | Status | Evidence / current state | Next step |
|------|--------|--------------------------|-----------|
| Template rendering | `Partial` | Templates exist; copy updated | Manual preview recommended |
| sendEmail wiring | `Done` | `run-sla-check.tsx` — entity + template strings per story | — |
| Threshold logic | `Done` | `PlatformSettings` + `fulfillBy` math | — |
| Auto-refund flow | `Done` | `refundCharge` + transaction + `REFUND_COMPLETED` | — |

---

## Phase 5 -- Roaster Fulfillment Page (US-05-02)

| Item | Status | Evidence / current state | Next step |
|------|--------|--------------------------|-----------|
| Token validation helper | `Done` | `_lib/validate-token.ts` | — |
| Page server component | `Done` | `page.tsx` + `FULFILLMENT_VIEWED` | — |
| Order details display | `Done` | `fulfillment-details.tsx` includes order date, payout breakdown, org context | — |
| Tracking form | `Done` | `tracking-form.tsx` | — |
| Submit tracking action | `Done` | `_actions/submit-tracking.ts` | — |

---

## Phase 6 -- Shipped Email Template (US-08-03)

| Item | Status | Evidence / current state | Next step |
|------|--------|--------------------------|-----------|
| `order-shipped.tsx` | `Done` | Template + carrier tracking URLs | Optional: React Email preview |

---

## Phase 7 -- Delivery Confirmation (US-05-03)

| Item | Status | Evidence / current state | Next step |
|------|--------|--------------------------|-----------|
| Admin order list page | `Done` | `orders/page.tsx`; filters including explicit `Refunded`; **max 200** rows | Add `?page=` if needed at scale |
| Admin order detail page | `Done` | `orders/[id]/page.tsx` | — |
| Confirm delivery action | `Done` | `confirm-delivery.ts`; Prisma `DELIVERED` event type + stable admin actor ID | — |
| Order detail components | `Done` | `order-list`, `order-detail`, `event-timeline` | — |

---

## Phase 8 -- Delivered Email Template (US-08-04)

| Item | Status | Evidence / current state | Next step |
|------|--------|--------------------------|-----------|
| `order-delivered.tsx` | `Done` | Impact copy + `PreviewProps` | Optional: React Email preview |

---

## Phase 9 -- Payout Job Verification (US-06-01)

| Item | Status | Evidence / current state | Next step |
|------|--------|--------------------------|-----------|
| Transfer logic verification | `Done` | `transfer_group = order.id`; net roaster after debt | — |
| OrderEvent logging | `Done` | `PAYOUT_TRANSFERRED` / `PAYOUT_FAILED` (requires enum migration) | — |
| RoasterDebt deduction | `Done` | Unsettled debts; settle on successful roaster transfer; debt-heavy orders fail for manual resolution | — |
| Campaign.totalRaised handling | `Done` | Comment in webhook + payout job — increment stays at **confirmation** (MVP) | Revisit if product moves accrual to payout time |
| Smoke test | `Done` | `packages/db/scripts/smoke-us-06-01-payout.ts`; root `pnpm db:smoke:us-06-01`; optional `RUN_PAYOUT_RELEASE=1` live run | — |

---

## Known infrastructure notes

1. **ROASTER_APP_ORIGIN:** Set where **`apps/web`** loads env (often **root `.env`**) so webhook-built fulfill URLs resolve to the roaster app (default in code `http://localhost:3001`).
2. **Admin auth:** Admin UI remains HTTP Basic (`apps/admin`). **`GET /api/orders/[id]/events`** on **`apps/web`** uses the same **`ADMIN_EMAIL` / `ADMIN_PASSWORD`** pair — configure them in an env file visible to `apps/web` if you call that API.
3. **Inngest local dev:** `npx inngest-cli@latest dev` or dashboard for SLA / payout jobs.
4. **Stripe test mode:** Connect + transfers for payout testing.

---

## Document sync checklist

- [x] Sprint 4 README updated (`docs/sprint-4/README.md`) — current progress + `logOrderEvent` wording
- [x] Sprint 4 story documents — status **`Done`**, AC checkboxes marked
- [x] Sprint 4 checklist — phases checked (`docs/SPRINT_4_CHECKLIST.md`); Phase 7 list/pagination wording aligned with MVP
- [x] Sprint 4 progress tracker (this file)
- [x] [`docs/AGENTS.md`](AGENTS.md) — `logOrderEvent()` bullet under database rules
- [x] [`docs/01-project-structure.mermaid`](01-project-structure.mermaid) — fulfill subpages, admin orders, orders events API, `log-event.ts`, shared admin Basic Auth helper, email templates
- [x] [`docs/06-database-schema.mermaid`](06-database-schema.mermaid) — `MagicLink.dedupeKey` and fundraiser accrual note aligned with current code
- [x] [`docs/CONVENTIONS.md`](CONVENTIONS.md) — `logOrderEvent` example uses `SHIPPED`; added transactional vs helper note + roaster fulfill + admin delivery pointers

**Last full sync:** 2026-04-01 — Sprint 4 stories 9/9 **`Done`** plus implementation review follow-up; tracker v1.1.

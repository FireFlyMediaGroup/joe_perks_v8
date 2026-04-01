# Joe Perks -- Sprint 4 Progress Tracker

**Tracker version:** 0.1
**Baseline document:** [`docs/SPRINT_4_CHECKLIST.md`](SPRINT_4_CHECKLIST.md) (v1.0)
**Story documents:** [`docs/sprint-4/stories/`](sprint-4/stories/)
**Sprint overview:** [`docs/sprint-4/README.md`](sprint-4/README.md)
**Purpose:** Track what is actually complete in this repository for Sprint 4 (order fulfillment, payouts, order event log, transactional emails) compared with the sprint checklist.

---

## How to use this file

- Treat `docs/SPRINT_4_CHECKLIST.md` as the **implementation plan**.
- Treat this file as the **current-state tracker**.
- Update this file whenever Sprint 4 work lands so the git diff shows exactly what changed between reviews.
- Each story has its own document in `docs/sprint-4/stories/` -- update the story status there too.

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
| 0.1 | 2026-04-01 | Initial tracker created. All stories at `Todo`. Sprint 4 documentation suite complete. |

---

## Snapshot summary

| Area | Status | Notes |
|------|--------|-------|
| Order event log helper + API (US-06-03) | `Todo` | `logOrderEvent()` documented but not implemented; no events query API |
| Webhook fulfillment magic link (US-05-01) | `Todo` | Webhook confirms orders but does not create MagicLink or send fulfillment email |
| Fulfillment email template (US-08-02) | `Todo` | No `magic-link-fulfillment.tsx` in `packages/email/templates/` |
| SLA email verification (US-08-05) | `Todo` | Templates and job exist; need verification pass |
| Roaster fulfillment page (US-05-02) | `Todo` | Stub at `apps/roaster/app/fulfill/[token]/page.tsx` |
| Shipped email template (US-08-03) | `Todo` | No `order-shipped.tsx` in `packages/email/templates/` |
| Delivery confirmation (US-05-03) | `Todo` | No admin order pages; no delivery flow |
| Delivered email template (US-08-04) | `Todo` | No `order-delivered.tsx` in `packages/email/templates/` |
| Payout job verification (US-06-01) | `Todo` | Job exists; missing OrderEvent logging and RoasterDebt deduction |

---

## Phase 1 -- Order Event Log Helper + API (US-06-03)

| Item | Status | Evidence / current state | Next step |
|------|--------|--------------------------|-----------|
| `packages/db/log-event.ts` | `Todo` | File does not exist | Create helper with try/catch pattern |
| `packages/db/index.ts` export | `Todo` | No `logOrderEvent` export | Add export |
| Events query API | `Todo` | No `/api/orders/[id]/events` route | Create GET endpoint with admin auth |
| Refactor existing callers | `Todo` | `run-sla-check.tsx` uses direct `database.orderEvent.create` | Replace standalone calls with `logOrderEvent()` |

---

## Phase 2 -- Webhook Fulfillment Magic Link (US-05-01)

| Item | Status | Evidence / current state | Next step |
|------|--------|--------------------------|-----------|
| MagicLink creation | `Todo` | Webhook does not create `ORDER_FULFILLMENT` magic link | Add `createFulfillmentMagicLink()` helper |
| Fulfillment email send | `Todo` | No `sendRoasterFulfillmentEmail` in webhook | Add helper + wire after buyer email |
| Idempotency guard | `Todo` | No existing MagicLink check | Add check for existing magic link per order |

---

## Phase 3 -- Fulfillment Email Template (US-08-02)

| Item | Status | Evidence / current state | Next step |
|------|--------|--------------------------|-----------|
| `magic-link-fulfillment.tsx` | `Todo` | File does not exist | Create template with items list + CTA |
| Preview verification | `Todo` | N/A | Test in React Email preview |

---

## Phase 4 -- SLA Email Verification (US-08-05)

| Item | Status | Evidence / current state | Next step |
|------|--------|--------------------------|-----------|
| Template rendering | `Todo` | `sla.tsx` has 4 components | Verify in React Email preview |
| sendEmail wiring | `Todo` | `run-sla-check.tsx` calls `sendEmail()` | Verify dedup params |
| Threshold logic | `Todo` | Reads from `PlatformSettings` | Verify calculations |
| Auto-refund flow | `Todo` | `refundCharge()` call exists | Verify end-to-end |

---

## Phase 5 -- Roaster Fulfillment Page (US-05-02)

| Item | Status | Evidence / current state | Next step |
|------|--------|--------------------------|-----------|
| Token validation helper | `Todo` | No `_lib/validate-token.ts` | Create validation helper |
| Page server component | `Todo` | Stub page with TODO message | Replace with full implementation |
| Order details display | `Todo` | No `_components/fulfillment-details.tsx` | Create component |
| Tracking form | `Todo` | No `_components/tracking-form.tsx` | Create client component |
| Submit tracking action | `Todo` | No `_actions/submit-tracking.ts` | Create server action |

---

## Phase 6 -- Shipped Email Template (US-08-03)

| Item | Status | Evidence / current state | Next step |
|------|--------|--------------------------|-----------|
| `order-shipped.tsx` | `Todo` | File does not exist | Create template |
| Preview verification | `Todo` | N/A | Test in React Email preview |

---

## Phase 7 -- Delivery Confirmation (US-05-03)

| Item | Status | Evidence / current state | Next step |
|------|--------|--------------------------|-----------|
| Admin order list page | `Todo` | No `apps/admin/app/orders/` directory | Create page with filters |
| Admin order detail page | `Todo` | No order detail page | Create with event timeline |
| Confirm delivery action | `Todo` | No delivery confirmation flow | Create server action |
| Order detail components | `Todo` | No order-related admin components | Create list + detail + timeline components |

---

## Phase 8 -- Delivered Email Template (US-08-04)

| Item | Status | Evidence / current state | Next step |
|------|--------|--------------------------|-----------|
| `order-delivered.tsx` | `Todo` | File does not exist | Create template with impact section |
| Preview verification | `Todo` | N/A | Test in React Email preview |

---

## Phase 9 -- Payout Job Verification (US-06-01)

| Item | Status | Evidence / current state | Next step |
|------|--------|--------------------------|-----------|
| Transfer logic verification | `Todo` | `run-payout-release.ts` exists with transfer calls | Verify `transfer_group` |
| OrderEvent logging | `Todo` | No `PAYOUT_TRANSFERRED` event created | Add `logOrderEvent()` calls |
| RoasterDebt deduction | `Todo` | No debt deduction logic | Add debt query + net amount calculation |
| Campaign.totalRaised handling | `Todo` | Incremented at confirmation time | Verify and document decision |
| Smoke test | `Todo` | No smoke script | Create `smoke-us-06-01-payout.ts` |

---

## Known infrastructure notes

1. **ROASTER_APP_ORIGIN:** The webhook handler in `apps/web` needs access to `ROASTER_APP_ORIGIN` for building fulfill URLs. This env var is typically in `apps/roaster/.env.local`. It should be set in root `.env` or `apps/web/.env.local` for the webhook to read it.
2. **Admin auth:** The admin app uses HTTP Basic Auth (MVP). Order management pages need the same auth pattern as the existing approval pages.
3. **Inngest local dev:** For testing payout and SLA jobs locally, use `npx inngest-cli@latest dev` or trigger functions manually via the Inngest dev UI.
4. **Stripe test mode:** Payout job testing requires Stripe test mode with Connected accounts. Use `stripe listen` for webhook forwarding.

---

## Document sync checklist

- [x] Sprint 4 README created (`docs/sprint-4/README.md`)
- [x] Sprint 4 story documents created (9 files in `docs/sprint-4/stories/`)
- [x] Sprint 4 checklist created (`docs/SPRINT_4_CHECKLIST.md`)
- [x] Sprint 4 progress tracker created (`docs/SPRINT_4_PROGRESS.md`)
- [ ] `docs/AGENTS.md` updated with Sprint 4 changes (after implementation)
- [ ] `docs/CONVENTIONS.md` updated with Sprint 4 patterns (after implementation)
- [ ] `docs/01-project-structure.mermaid` updated with new routes (after implementation)
- [ ] Story statuses updated to `Done` (after implementation)
- [ ] Sprint 4 README "Current progress" line updated (after implementation)

**Last full sync:** 2026-04-01 -- Initial Sprint 4 documentation suite created. All stories at `Todo`. Sprint 3 fully complete (9/9 Done).

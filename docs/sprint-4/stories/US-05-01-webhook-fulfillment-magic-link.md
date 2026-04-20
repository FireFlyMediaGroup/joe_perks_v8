# US-05-01 -- payment_intent.succeeded Webhook Creates Order and Sends Fulfillment Magic Link

**Story ID:** US-05-01 | **Epic:** EP-05 (Order Fulfillment)
**Points:** 8 | **Priority:** High
**Status:** `Done`
**Owner:** Full-stack
**Dependencies:** US-01-05 (Stripe Checkout API), US-04-03 (Three-Step Checkout), US-01-04 (Email Pipeline)
**Depends on this:** US-05-02 (Roaster Fulfillment Page), US-08-02 (Fulfillment Email), US-08-05 (SLA Emails)

---

## Goal

Extend the existing `payment_intent.succeeded` webhook handler at `apps/web/app/api/webhooks/stripe/route.ts` to create a `MagicLink` with `purpose = ORDER_FULFILLMENT` and send a fulfillment notification email to the roaster. The webhook already confirms the order (PENDING -> CONFIRMED), sets payout fields, creates an OrderEvent, and sends the buyer confirmation email. This story adds the roaster-side fulfillment initiation per Phase 2 of `docs/04-order-lifecycle.mermaid`: create the magic link, then send `magic_link_fulfillment` email to the roaster with the fulfill URL.

---

## Diagram references

- **Order lifecycle:** [`docs/04-order-lifecycle.mermaid`](../../04-order-lifecycle.mermaid) -- Phase 2 (Order Creation webhook): `Create MagicLink (purpose=ORDER_FULFILLMENT, 72h TTL)` and `sendEmail(magic_link_fulfillment -> roaster)`
- **Order state machine:** [`docs/08-order-state-machine.mermaid`](../../08-order-state-machine.mermaid) -- PENDING -> CONFIRMED transition: `payment_intent.succeeded webhook, order_number generated, magic link sent to roaster`
- **Database ERD:** [`docs/06-database-schema.mermaid`](../../06-database-schema.mermaid) -- `Order`, `MagicLink`, `Roaster`, `EmailLog`

---

## Current repo evidence

- **`apps/web/app/api/webhooks/stripe/route.ts`** -- `handlePaymentIntentSucceeded()` now uses a status-guarded transaction so only one concurrent request can commit the `PENDING -> CONFIRMED` transition, `PAYMENT_SUCCEEDED` event, and `campaign.totalRaised` increment.
- **Fulfillment link creation** -- `createFulfillmentMagicLink()` now uses a deterministic `MagicLink.dedupeKey` and Prisma `upsert()` so only one `ORDER_FULFILLMENT` link can exist per order at the database level.
- **Webhook post-processing** -- Buyer confirmation email, fulfillment magic-link creation, and roaster fulfillment email run after the confirmation transaction; duplicate `StripeEvent` insert races are ignored safely.
- **`MagicLink` model** -- Prisma schema includes `token`, `dedupeKey`, `actorId`, `actorType`, `payload`, `expiresAt`, and `usedAt`.

---

## AGENTS.md rules that apply

- **Magic links:** Tokens generated with `crypto.randomBytes(32).toString('hex')` (256 bits). Single-use via `usedAt`. Verify: token exists, `expiresAt > now()`, `usedAt IS NULL`, correct `purpose`. TTL is 72h per the lifecycle diagram.
- **sendEmail():** Use `sendEmail()` from `@joe-perks/email`. Never import Resend directly. `EmailLog` dedup on `(entityType, entityId, template)`.
- **Webhook idempotency:** `StripeEvent` check is in place, but the business transition must also be safe under concurrent delivery. The `sendEmail()` call adds a second dedup layer, and fulfillment links are deduped with a deterministic DB-backed key.
- **Logging/PII:** Never log buyer or roaster email. Only log `order_id`, `magic_link_id`.

**CONVENTIONS.md patterns:**
- Webhook handler: verify signature -> check idempotency -> business logic -> record StripeEvent
- Email call pattern: `sendEmail({ template, subject, to, entityType, entityId, react })`

---

## In scope

- Create `MagicLink` record inside the `handlePaymentIntentSucceeded` flow with:
  - `token`: `crypto.randomBytes(32).toString('hex')`
  - `purpose`: `ORDER_FULFILLMENT`
  - `actorId`: `order.roasterId`
  - `actorType`: `ROASTER`
  - `payload`: `{ order_id: orderId }`
  - `expiresAt`: `now() + 72h`
- Send fulfillment notification email to roaster via `sendEmail()` with:
  - `template`: `magic_link_fulfillment`
  - `entityType`: `order`
  - `entityId`: `order.id`
  - `to`: roaster email
  - React component from `@joe-perks/email/templates/magic-link-fulfillment` (created in US-08-02)
  - Props: `orderNumber`, `fulfillUrl` (roaster portal fulfill path with token), `items[]`, `totalInCents`
- Build the fulfill URL using `ROASTER_APP_ORIGIN` env var (default `http://localhost:3001`) + `/fulfill/{token}`
- Idempotency: skip magic link creation if one already exists for this order (prevents duplicates on webhook retry)
- Load roaster email from the order relation for the `sendEmail()` call

---

## Out of scope

- The fulfillment page UI itself (US-05-02)
- The email template implementation (US-08-02 -- but wire the `sendEmail()` call; if template not yet available, import will fail at runtime only when Resend is configured)
- Shipped/delivered transitions (US-05-02, US-05-03)
- Admin notification of new orders
- Multi-roaster fulfillment (single roaster per order in MVP)

---

## Primary files to create or modify

| Action | File | Purpose |
|--------|------|---------|
| Modify | `apps/web/app/api/webhooks/stripe/route.ts` | Add `createFulfillmentMagicLink()` and `sendRoasterFulfillmentEmail()` to `handlePaymentIntentSucceeded` |

---

## Acceptance criteria

- [x] After `payment_intent.succeeded` fires and order is CONFIRMED, a `MagicLink` record is created with `purpose = ORDER_FULFILLMENT` and 72h TTL
- [x] The `MagicLink.token` is 64 hex characters (32 bytes)
- [x] The `MagicLink.actorId` is set to the order's `roasterId`
- [x] The `MagicLink.payload` contains `{ order_id: orderId }`
- [x] `sendEmail()` is called with `template = 'magic_link_fulfillment'`, `entityType = 'order'`, `entityId = order.id`
- [x] The fulfillment email is sent to the roaster's email address
- [x] The email contains a URL pointing to `{ROASTER_APP_ORIGIN}/fulfill/{token}`
- [x] Duplicate webhook events do not create duplicate magic links (idempotency check)
- [x] `EmailLog` prevents duplicate fulfillment emails on webhook retry
- [x] Email failure does not fail the webhook response (try/catch around `sendEmail`)
- [x] No PII is logged -- only `order_id` and `magic_link_id` on success/failure paths
- [x] The `MagicLink` creation is outside the main `$transaction` (non-critical path -- order confirmation must succeed even if magic link creation fails)

---

## Suggested implementation steps

1. Add `crypto` import at the top of the webhook route file.
2. Create a helper function `createFulfillmentMagicLink(orderId: string, roasterId: string)`:
   - Check for existing `MagicLink` with `purpose = ORDER_FULFILLMENT` and matching `payload` containing the order ID
   - If none exists, create one with `crypto.randomBytes(32).toString('hex')`, 72h `expiresAt`, `actorType: 'ROASTER'`
   - Return the created or existing magic link
3. Create a helper function `sendRoasterFulfillmentEmail(orderId: string)`:
   - Load order with items, roaster, campaign.org relations
   - Build the fulfill URL: `process.env.ROASTER_APP_ORIGIN ?? 'http://localhost:3001'` + `/fulfill/${magicLink.token}`
   - Call `sendEmail()` with the `MagicLinkFulfillmentEmail` component and props
   - Wrap in try/catch -- log only `order_id` on failure
4. In `handlePaymentIntentSucceeded`, after `sendBuyerOrderConfirmationEmail(orderId)`:
   - Call `createFulfillmentMagicLink(orderId, roasterId)`
   - Call `sendRoasterFulfillmentEmail(orderId)`
5. Load `roasterId` from the order -- add it to the initial `select` query or load it from the transaction result.
6. Test: complete a checkout, verify `MagicLink` row created, verify email sent (when Resend configured), retry webhook and verify no duplicate.

---

## Handoff notes

- The `ROASTER_APP_ORIGIN` env var is already defined in `apps/roaster/.env.local` (default `http://localhost:3001`). For the webhook running in `apps/web`, this value needs to be accessible -- either set in root `.env` or pass as `process.env.ROASTER_APP_ORIGIN`.
- The roaster email comes from `Roaster.email` -- this is the application email, set when the roaster was approved. If the roaster has changed their email in Clerk, this may diverge. For MVP, use `Roaster.email`.
- US-08-02 creates the `MagicLinkFulfillmentEmail` template. If implementing US-05-01 first, stub the import or implement both stories together.
- The magic link URL structure (`/fulfill/[token]`) matches the existing stub route in `apps/roaster`.

---

## Revision log

| Version | Date | Notes |
|---------|------|-------|
| 0.1 | 2026-04-01 | Initial story created for Sprint 4 planning. |
| 0.2 | 2026-04-01 | Implemented on `main`; status `Done`. |
| 0.3 | 2026-04-01 | Review follow-up: confirmation flow is concurrency-safe and fulfillment links use `MagicLink.dedupeKey` for DB-enforced dedupe. |

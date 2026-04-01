# US-08-01 -- Order Confirmation Email to Buyer

**Story ID:** US-08-01 | **Epic:** EP-08 (Notifications)
**Points:** 3 | **Priority:** High
**Status:** `Done`
**Owner:** Full-stack
**Dependencies:** US-01-04 (Email Pipeline), US-05-01 (Order Creation)
**Depends on this:** None

---

## Goal

Wire the existing `order-confirmation` email template into the `payment_intent.succeeded` webhook handler so that buyers automatically receive an order confirmation email after a successful payment. The template already exists at `packages/email/templates/order-confirmation.tsx` -- this story verifies it meets requirements and wires it into the webhook flow using `sendEmail()` with `EmailLog` dedup.

---

## Diagram references

- **Order lifecycle:** [`docs/04-order-lifecycle.mermaid`](../../04-order-lifecycle.mermaid) -- Phase 2 (Order Creation webhook): `sendEmail(order_confirmation -> buyer)` is explicitly called out in the sequence diagram
- **Database ERD:** [`docs/06-database-schema.mermaid`](../../06-database-schema.mermaid) -- `Order`, `OrderItem`, `Buyer`, `EmailLog` models

---

## Current repo evidence

- `packages/email/templates/order-confirmation.tsx` **exists** with:
  - Props: `buyerName`, `items[]` (name, quantity, priceInCents), `orderNumber`, `orgName`, `shippingInCents`, `totalInCents`
  - Renders: "Order Confirmed" header, items list, subtotal, shipping, total, "You will receive a shipping confirmation" footer
  - `PreviewProps` with sample data
  - Uses `BaseEmailLayout`
- `packages/email/send.ts` exports `sendEmail()` -- dedup via `EmailLog` on `(entityType, entityId, template)`
- `apps/web/app/api/webhooks/stripe/route.ts` handles `payment_intent.succeeded`:
  - Updates `Order.status` to `CONFIRMED`, sets payout fields, increments campaign **`totalRaised`**
  - Creates **`OrderEvent`** with **`PAYMENT_SUCCEEDED`**
  - Calls **`sendBuyerOrderConfirmationEmail(orderId)`** → **`sendEmail()`** with React **`OrderConfirmationEmail`**, template **`order_confirmation`**, **`entityType`/`entityId`** for **`EmailLog`** dedupe
  - **Order number** and **Buyer** are created at **`create-intent`** (not in this handler)
- `Order` model has: `orderNumber`, `grossAmount`, `productSubtotal`, `shippingAmount`, `stripePiId`
- `OrderItem` model has: `productName`, `variantDesc`, `quantity`, `unitPrice`, `lineTotal`
- `Campaign` model has: `orgId` -> `Org` with `orgName` (from `OrgApplication`)

---

## AGENTS.md rules that apply

- **Email:** Use `sendEmail()` from `@joe-perks/email`. Never import Resend directly. `EmailLog` dedup on `(entityType, entityId, template)`. If Resend fails after `EmailLog` row is created, the row is deleted so callers can retry.
- **Webhook idempotency:** The webhook handler already checks `StripeEvent` for idempotency. The `sendEmail()` call adds a second layer of dedup via `EmailLog`.
- **Logging/PII:** Never log buyer email or name. Only log order ID and event type.
- **Money as cents:** Email template already uses cents -- verify `priceInCents`, `shippingInCents`, `totalInCents` match the `Order` and `OrderItem` fields.

**CONVENTIONS.md patterns:**
- Email template kebab-case naming: `order-confirmation`
- `sendEmail()` call pattern with `entityType`, `entityId`, `template`, `to`, `props`

---

## In scope

- Verify `order-confirmation.tsx` template renders correctly with production-shaped data
- Wire `sendEmail()` into the `payment_intent.succeeded` webhook handler
- Map `Order` + `OrderItem` + `Campaign.org` data to template props
- Ensure `EmailLog` dedup prevents duplicate sends on webhook retry
- Verify the template renders well at mobile email widths

---

## Out of scope

- Shipping confirmation email (future -- when order shipped)
- Delivery confirmation email (future -- when order delivered)
- Roaster fulfillment / magic-link emails beyond this buyer confirmation (future or separate handlers)
- Buyer account creation
- Unsubscribe mechanism

---

## Primary files to create or modify

| Action | File | Purpose |
|--------|------|---------|
| Done | `packages/email/templates/order-confirmation.tsx` | Template props match `sendBuyerOrderConfirmationEmail` mapping |
| Done | `apps/web/app/api/webhooks/stripe/route.ts` | `sendBuyerOrderConfirmationEmail` after successful payment transaction |

---

## Acceptance criteria

- [x] After `payment_intent.succeeded` webhook fires, the buyer receives an order confirmation email (when Resend is configured)
- [x] Email contains the correct order number (e.g. "JP-00042")
- [x] Email lists all order items with product names, quantities, and prices
- [x] Email shows subtotal, shipping amount, and total formatted as dollars
- [x] Email mentions the org name (body copy references **`orgName`**)
- [x] `sendEmail()` is called with `entityType = 'order'`, `entityId = order.id`, `template = 'order_confirmation'`
- [x] `EmailLog` row is created, preventing duplicate sends on webhook retry
- [x] Duplicate webhook events do not trigger duplicate emails (`StripeEvent` + `EmailLog`)
- [x] Email renders correctly in React Email preview at `http://localhost:3004`
- [x] No buyer PII is logged in the webhook handler (only `order_id` on email failure path)

---

## Suggested implementation steps

1. Review `packages/email/templates/order-confirmation.tsx`:
   - Verify `PreviewProps` render correctly in email preview (`pnpm --filter email dev`)
   - Confirm template props align with `Order` and `OrderItem` data:
     - `buyerName` -- from `Buyer.name` or `buyerName` from checkout
     - `items[]` -- from `OrderItem` records: `{ name: productName, quantity, priceInCents: unitPrice }`
     - `orderNumber` -- from `Order.orderNumber`
     - `orgName` -- from `Campaign.org` relation (need to load in webhook)
     - `shippingInCents` -- from `Order.shippingAmount`
     - `totalInCents` -- from `Order.grossAmount`
   - Update template if any props are misaligned
2. Modify `apps/web/app/api/webhooks/stripe/route.ts`:
   - In the `payment_intent.succeeded` handler, after order confirmation + buyer upsert:
   - Load the order with items + campaign + org to get all email props
   - Call `sendEmail()`:
     ```typescript
     import { OrderConfirmationEmail } from '@joe-perks/email/templates/order-confirmation'
     import { createElement } from 'react'

     await sendEmail({
       template: 'order_confirmation',
       subject: `Order ${order.orderNumber} confirmed`,
       to: buyer.email,
       entityType: 'order',
       entityId: order.id,
       react: createElement(OrderConfirmationEmail, {
         buyerName: buyer.name ?? 'Customer',
         orderNumber: order.orderNumber,
         orgName: campaign.org.orgName ?? campaign.org.slug,
         items: orderItems.map(i => ({
           name: i.productName,
           quantity: i.quantity,
           priceInCents: i.unitPrice,
         })),
         shippingInCents: order.shippingAmount,
         totalInCents: order.grossAmount,
       }),
     })
     ```
   - Wrap in try/catch -- email failure should not fail the webhook response
   - Log only `order_id` on success/failure
3. Test: complete a checkout, verify email received, check `EmailLog` row, retry webhook and verify no duplicate.

---

## Handoff notes

- The email template uses `BaseEmailLayout` which includes the Joe Perks branding. Ensure the layout renders correctly with order data.
- The `sendEmail()` call should be one of the last steps in the webhook handler -- after the order is confirmed and buyer is upserted. If `sendEmail()` fails, the order is still confirmed.
- The `orgName` may come from different places depending on how the Org was created. Check `Org.email` or trace back to `OrgApplication.orgName` via `Org.applicationId`. The `Campaign` include chain should provide this.
- Future email stories (shipped, delivered, SLA) will follow the same `sendEmail()` pattern in their respective handlers/jobs.

---

## Revision log

| Version | Date | Notes |
|---------|------|-------|
| 0.1 | 2026-03-30 | Initial story created for Sprint 3 planning. |
| 0.2 | 2026-04-01 | Marked Done; webhook evidence aligned with `sendBuyerOrderConfirmationEmail`. |

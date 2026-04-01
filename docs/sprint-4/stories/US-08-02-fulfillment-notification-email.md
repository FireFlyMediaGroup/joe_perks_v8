# US-08-02 -- Roaster Magic Link Fulfillment Notification Email

**Story ID:** US-08-02 | **Epic:** EP-08 (Notifications)
**Points:** 3 | **Priority:** High
**Status:** `Done`
**Owner:** Full-stack
**Dependencies:** US-01-04 (Email Pipeline), US-05-01 (Webhook Fulfillment Magic Link)
**Depends on this:** None

---

## Goal

Create the `magic-link-fulfillment` email template at `packages/email/templates/magic-link-fulfillment.tsx` that notifies a roaster of a new order requiring fulfillment. The email contains the order number, item summary, total amount, and a prominent CTA linking to the magic link fulfillment page. This template is sent by the `payment_intent.succeeded` webhook handler (wired in US-05-01) using `sendEmail()` with `template = 'magic_link_fulfillment'`.

---

## Diagram references

- **Order lifecycle:** [`docs/04-order-lifecycle.mermaid`](../../04-order-lifecycle.mermaid) -- Phase 2: `sendEmail(magic_link_fulfillment -> roaster)` after MagicLink creation
- **Database ERD:** [`docs/06-database-schema.mermaid`](../../06-database-schema.mermaid) -- `Order`, `OrderItem`, `MagicLink`, `EmailLog`

---

## Current repo evidence

- **`packages/email/templates/`** -- No `magic-link-fulfillment.tsx` exists. 13 templates present; `order-confirmation.tsx` is the closest pattern reference for order-related email content.
- **`packages/email/templates/order-confirmation.tsx`** -- Uses `BaseEmailLayout`, accepts props: `buyerName`, `items[]` (name, quantity, priceInCents), `orderNumber`, `orgName`, `shippingInCents`, `totalInCents`. Good pattern reference for item list rendering.
- **`packages/email/templates/base-layout.tsx`** -- Provides Joe Perks branded email wrapper.
- **`packages/email/send.ts`** -- `sendEmail()` function. Called with `{ template, subject, to, entityType, entityId, react }`.
- **`docs/CONVENTIONS.md`** -- Email templates use kebab-case filenames. `sendEmail()` pattern with `entityType`, `entityId`, `template` for EmailLog dedup.
- **`AGENTS.md` file naming** -- Lists `magic-link-fulfillment.tsx` in the email template file tree.

---

## AGENTS.md rules that apply

- **sendEmail():** Use `sendEmail()` from `@joe-perks/email`. Never import Resend directly. `EmailLog` dedup on `(entityType, entityId, template)`.
- **Money as cents:** Template receives amounts in cents. Display: `(cents / 100).toFixed(2)`.
- **Logging/PII:** The template itself does not log. Callers log only `order_id`.

**CONVENTIONS.md patterns:**
- Email template kebab-case filename: `magic-link-fulfillment.tsx`
- Templates use `BaseEmailLayout` or Tailwind + `@react-email/components`
- Export default component + optional `PreviewProps` for React Email preview

---

## In scope

- Create `packages/email/templates/magic-link-fulfillment.tsx` with:
  - Props: `orderNumber`, `fulfillUrl`, `items[]` (name, quantity, priceInCents), `totalInCents`, `shippingInCents`
  - Layout: Joe Perks branding (use `BaseEmailLayout` or Tailwind pattern matching existing templates)
  - Content: "New order for fulfillment" heading, order number, items list with quantities and prices, shipping amount, total, prominent "View Order & Ship" CTA button linking to `fulfillUrl`
  - Footer: "This link expires in 72 hours" notice
  - `PreviewProps` with sample data for React Email preview
- Export the template from `packages/email` (add to `package.json` exports if needed)
- Verify template renders in React Email preview app (`pnpm --filter email dev`)

---

## Out of scope

- Sending logic (wired by US-05-01 in the webhook handler)
- Roaster portal authenticated fulfillment notifications (Phase 2)
- Order cancellation or update notifications
- Multi-language email support

---

## Primary files to create or modify

| Action | File | Purpose |
|--------|------|---------|
| Create | `packages/email/templates/magic-link-fulfillment.tsx` | Fulfillment notification email template |

---

## Acceptance criteria

- [x] `magic-link-fulfillment.tsx` exists at `packages/email/templates/`
- [x] Template accepts props: `orderNumber`, `fulfillUrl`, `items[]`, `totalInCents`, `shippingInCents`
- [x] Template displays order number prominently
- [x] Template lists items with product name, quantity, and price (formatted from cents)
- [x] Template shows shipping amount and total formatted as dollars
- [x] Template includes a prominent CTA button with text "View Order & Ship" linking to `fulfillUrl`
- [x] Template includes "This link expires in 72 hours" notice
- [x] Template uses Joe Perks branding (consistent with `order-confirmation.tsx`)
- [x] Template includes `PreviewProps` for React Email preview
- [x] Template renders correctly in React Email preview at `http://localhost:3004`
- [x] Template is mobile-responsive

---

## Suggested implementation steps

1. Create `packages/email/templates/magic-link-fulfillment.tsx`:
   ```typescript
   import { Body, Button, Container, Head, Html, Preview, Section, Tailwind, Text } from '@react-email/components'

   interface MagicLinkFulfillmentEmailProps {
     orderNumber: string
     fulfillUrl: string
     items: Array<{ name: string; quantity: number; priceInCents: number }>
     totalInCents: number
     shippingInCents: number
   }

   export default function MagicLinkFulfillmentEmail(props: MagicLinkFulfillmentEmailProps) {
     // Render: heading, order summary, items, CTA button, expiry notice
   }

   MagicLinkFulfillmentEmail.PreviewProps = {
     orderNumber: 'JP-00042',
     fulfillUrl: 'http://localhost:3001/fulfill/abc123...',
     items: [{ name: 'Ethiopian Yirgacheffe 12oz Whole Bean', quantity: 2, priceInCents: 1999 }],
     totalInCents: 4893,
     shippingInCents: 895,
   }
   ```
2. Follow the pattern from `order-confirmation.tsx` for item list formatting and dollar display.
3. Test in React Email preview: `pnpm --filter email dev` -> browse to `http://localhost:3004`.
4. Verify the template is importable from `@joe-perks/email/templates/magic-link-fulfillment`.

---

## Handoff notes

- US-05-01 imports this template in the webhook handler and passes it to `sendEmail()`. The import path is `@joe-perks/email/templates/magic-link-fulfillment`.
- The `fulfillUrl` is constructed by the webhook handler as `{ROASTER_APP_ORIGIN}/fulfill/{token}`. The template just renders it as the CTA href.
- The 72-hour expiry notice matches the MagicLink TTL set in US-05-01.
- If implementing US-08-02 before US-05-01, the template can be tested via React Email preview without needing the webhook integration.

---

## Revision log

| Version | Date | Notes |
|---------|------|-------|
| 0.1 | 2026-04-01 | Initial story created for Sprint 4 planning. |
| 0.2 | 2026-04-01 | Implemented on `main`; status `Done`.

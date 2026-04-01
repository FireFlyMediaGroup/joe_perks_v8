# US-08-03 -- Shipped Notification Email to Buyer with Tracking

**Story ID:** US-08-03 | **Epic:** EP-08 (Notifications)
**Points:** 3 | **Priority:** High
**Status:** `Todo`
**Owner:** Full-stack
**Dependencies:** US-01-04 (Email Pipeline), US-05-02 (Roaster Fulfillment Page)
**Depends on this:** None

---

## Goal

Create the `order-shipped` email template at `packages/email/templates/order-shipped.tsx` that notifies a buyer when their order has been shipped. The email contains the order number, tracking number, carrier name, and a brief "your order is on its way" message. This template is sent by the fulfillment page server action (US-05-02) when the roaster submits tracking info and the order transitions to `SHIPPED`.

---

## Diagram references

- **Order lifecycle:** [`docs/04-order-lifecycle.mermaid`](../../04-order-lifecycle.mermaid) -- Phase 3: `sendEmail(order_shipped + tracking -> buyer)` after roaster enters tracking
- **Database ERD:** [`docs/06-database-schema.mermaid`](../../06-database-schema.mermaid) -- `Order` (trackingNumber, carrier, shippedAt), `Buyer`, `EmailLog`

---

## Current repo evidence

- **`packages/email/templates/`** -- No `order-shipped.tsx` exists. `CONVENTIONS.md` file naming section lists `order-shipped.tsx` as an expected template.
- **`packages/email/templates/order-confirmation.tsx`** -- Pattern reference for buyer-facing order emails. Uses `BaseEmailLayout`.
- **`sendEmail()` pattern** -- US-05-02 will call `sendEmail({ template: 'order_shipped', entityType: 'order', entityId: order.id, to: buyer.email, ... })`.

---

## AGENTS.md rules that apply

- **sendEmail():** Use `sendEmail()` from `@joe-perks/email`. `EmailLog` dedup on `(entityType, entityId, template)`.
- **Money as cents:** Not directly relevant -- this email focuses on tracking, not amounts.
- **Logging/PII:** Template renders buyer name and tracking. Callers log only `order_id`.

**CONVENTIONS.md patterns:**
- Email template kebab-case filename: `order-shipped.tsx`
- Export default + `PreviewProps`

---

## In scope

- Create `packages/email/templates/order-shipped.tsx` with:
  - Props: `buyerName`, `orderNumber`, `trackingNumber`, `carrier`, `orgName`
  - Content: "Your order has shipped!" heading, order number, tracking number, carrier, "Thank you for supporting {orgName}" message
  - Optional: tracking URL generation for common carriers (USPS, UPS, FedEx)
  - `PreviewProps` with sample data
- Verify template renders in React Email preview

---

## Out of scope

- Sending logic (wired by US-05-02 fulfillment action)
- Real-time tracking integration
- Delivery confirmation email (US-08-04)
- Multi-carrier tracking URL API

---

## Primary files to create or modify

| Action | File | Purpose |
|--------|------|---------|
| Create | `packages/email/templates/order-shipped.tsx` | Shipped notification email template |

---

## Acceptance criteria

- [ ] `order-shipped.tsx` exists at `packages/email/templates/`
- [ ] Template accepts props: `buyerName`, `orderNumber`, `trackingNumber`, `carrier`, `orgName`
- [ ] Template displays "Your order has shipped!" or similar heading
- [ ] Template shows order number, tracking number, and carrier name
- [ ] Template includes fundraiser context: "Thank you for supporting {orgName}"
- [ ] Template uses Joe Perks branding (consistent with existing buyer emails)
- [ ] Template includes `PreviewProps` for React Email preview
- [ ] Template renders correctly in React Email preview at `http://localhost:3004`
- [ ] Template is mobile-responsive

---

## Suggested implementation steps

1. Create `packages/email/templates/order-shipped.tsx`:
   ```typescript
   interface OrderShippedEmailProps {
     buyerName: string
     orderNumber: string
     trackingNumber: string
     carrier: string
     orgName: string
   }

   export default function OrderShippedEmail(props: OrderShippedEmailProps) {
     // Heading, order number, tracking info, org fundraiser message
   }
   ```
2. Follow the branding pattern from `order-confirmation.tsx`.
3. Optionally generate tracking URLs for known carriers:
   - USPS: `https://tools.usps.com/go/TrackConfirmAction?tLabels={tracking}`
   - UPS: `https://www.ups.com/track?tracknum={tracking}`
   - FedEx: `https://www.fedex.com/fedextrack/?trknbr={tracking}`
4. Test in React Email preview.

---

## Handoff notes

- US-05-02 `submit-tracking` server action sends this email after marking the order as SHIPPED. The action has access to `buyer.email`, `buyer.name`, `order.orderNumber`, `trackingNumber`, `carrier`, and the campaign org name.
- The `CONVENTIONS.md` email patterns section already lists `order-shipped.tsx` in the expected file tree.
- Tracking URL generation is a nice-to-have for MVP -- a simple text display of the tracking number and carrier is sufficient.

---

## Revision log

| Version | Date | Notes |
|---------|------|-------|
| 0.1 | 2026-04-01 | Initial story created for Sprint 4 planning. |

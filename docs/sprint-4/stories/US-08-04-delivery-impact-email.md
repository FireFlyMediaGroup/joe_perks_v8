# US-08-04 -- Delivery Confirmation + Impact Email to Buyer

**Story ID:** US-08-04 | **Epic:** EP-08 (Notifications)
**Points:** 3 | **Priority:** High
**Status:** `Todo`
**Owner:** Full-stack
**Dependencies:** US-01-04 (Email Pipeline), US-05-03 (Delivery Confirmation)
**Depends on this:** None

---

## Goal

Create the `order-delivered` email template at `packages/email/templates/order-delivered.tsx` that notifies a buyer when their order has been delivered and highlights the fundraiser impact of their purchase. The email contains the order number, delivery confirmation, the org name, the org contribution amount from the order, and a "thank you for making a difference" message. This template is sent by the delivery confirmation action (US-05-03) when an admin confirms delivery and the order transitions to `DELIVERED`.

---

## Diagram references

- **Order lifecycle:** [`docs/04-order-lifecycle.mermaid`](../../04-order-lifecycle.mermaid) -- Phase 4: `sendEmail(order_delivered + impact message -> buyer)` after delivery confirmation
- **Database ERD:** [`docs/06-database-schema.mermaid`](../../06-database-schema.mermaid) -- `Order` (orgAmount, deliveredAt), `Buyer`, `Campaign`, `Org`, `EmailLog`

---

## Current repo evidence

- **`packages/email/templates/`** -- No `order-delivered.tsx` exists. `CONVENTIONS.md` file naming section lists `order-delivered.tsx` as an expected template.
- **`packages/email/templates/order-confirmation.tsx`** -- Pattern reference. Receives `orgName` for fundraiser context.
- **`Order` model** -- Has `orgAmount` (cents, frozen at charge time), `orgPctSnapshot`, `deliveredAt`. Campaign -> Org chain provides org name and total raised.

---

## AGENTS.md rules that apply

- **sendEmail():** Use `sendEmail()` from `@joe-perks/email`. `EmailLog` dedup on `(entityType, entityId, template)`.
- **Money as cents:** `orgAmount` is in cents. Display: `(cents / 100).toFixed(2)`.
- **Logging/PII:** Callers log only `order_id`.

**CONVENTIONS.md patterns:**
- Email template kebab-case filename: `order-delivered.tsx`
- Export default + `PreviewProps`

---

## In scope

- Create `packages/email/templates/order-delivered.tsx` with:
  - Props: `buyerName`, `orderNumber`, `orgName`, `orgAmountInCents`, `orgPctSnapshot`
  - Content: "Your order has been delivered!" heading, order number, delivery confirmation, fundraiser impact section showing the org contribution ("${amount} went to {orgName}"), thank you message
  - `PreviewProps` with sample data
- Verify template renders in React Email preview

---

## Out of scope

- Sending logic (wired by US-05-03 delivery confirmation action)
- Review/feedback request (Phase 2)
- Reorder CTA (Phase 2)
- Campaign progress display (total raised toward goal)

---

## Primary files to create or modify

| Action | File | Purpose |
|--------|------|---------|
| Create | `packages/email/templates/order-delivered.tsx` | Delivery + impact notification email template |

---

## Acceptance criteria

- [ ] `order-delivered.tsx` exists at `packages/email/templates/`
- [ ] Template accepts props: `buyerName`, `orderNumber`, `orgName`, `orgAmountInCents`, `orgPctSnapshot`
- [ ] Template displays "Your order has been delivered!" heading
- [ ] Template shows order number
- [ ] Template includes fundraiser impact: "Your purchase contributed ${amount} to {orgName}"
- [ ] Dollar amount formatted correctly from cents: `(orgAmountInCents / 100).toFixed(2)`
- [ ] Template includes a warm thank-you message
- [ ] Template uses Joe Perks branding (consistent with buyer emails)
- [ ] Template includes `PreviewProps` for React Email preview
- [ ] Template renders correctly in React Email preview at `http://localhost:3004`
- [ ] Template is mobile-responsive

---

## Suggested implementation steps

1. Create `packages/email/templates/order-delivered.tsx`:
   ```typescript
   interface OrderDeliveredEmailProps {
     buyerName: string
     orderNumber: string
     orgName: string
     orgAmountInCents: number
     orgPctSnapshot: number
   }

   export default function OrderDeliveredEmail(props: OrderDeliveredEmailProps) {
     const orgDollars = (props.orgAmountInCents / 100).toFixed(2)
     // Heading, order number, impact section, thank you message
   }
   ```
2. Impact section example copy: "Thanks to your order, ${orgDollars} ({orgPct}%) will go directly to {orgName}. Every cup makes a difference!"
3. Follow the branding pattern from existing buyer emails.
4. Test in React Email preview.

---

## Handoff notes

- US-05-03 `confirm-delivery` action sends this email after marking the order as DELIVERED. The action has access to `buyer.email`, `buyer.name`, `order.orderNumber`, `order.orgAmount`, `order.orgPctSnapshot`, and `campaign.org` for the org name.
- The `orgAmount` is frozen on the Order row at charge time -- always use this value, never recalculate.
- The impact message is a key differentiator for Joe Perks. The email should feel warm and community-focused, reinforcing the fundraiser mission.
- Future enhancement: include campaign progress (e.g., "Your school has raised $X of $Y goal!") -- this requires `Campaign.totalRaised` and `Campaign.goalCents`, available but out of scope for this story.

---

## Revision log

| Version | Date | Notes |
|---------|------|-------|
| 0.1 | 2026-04-01 | Initial story created for Sprint 4 planning. |

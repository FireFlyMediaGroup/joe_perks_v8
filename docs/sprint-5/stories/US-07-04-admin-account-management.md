# US-07-04 -- Admin Can Manage Roaster and Org Accounts: Suspend, Reactivate

**Story ID:** US-07-04 | **Epic:** EP-07 (Admin Dashboard)
**Points:** 3 | **Priority:** Low
**Status:** `Todo`
**Owner:** Full-stack
**Dependencies:** US-07-01
**Depends on this:** None

---

## Goal

Give platform admins a lifecycle-management surface for roaster and org accounts so bad actors can be suspended, later reactivated safely, and kept out of new order flow without deleting their historical data. The UX should help both sides evaluate reactivation well: admins get risk context before restoring access, and suspended roasters/orgs get a clear remediation path instead of a dead end.

---

## Diagram references

- **Approval chain:** [`docs/05-approval-chain.mermaid`](../../05-approval-chain.mermaid) -- org/roaster onboarding context
- **Database ERD:** [`docs/06-database-schema.mermaid`](../../06-database-schema.mermaid) -- `Roaster`, `Org`, `RoasterDebt`, related account data
- **Order lifecycle:** [`docs/04-order-lifecycle.mermaid`](../../04-order-lifecycle.mermaid) -- existing orders should continue to completion

---

## Current repo evidence

- `Roaster.status` and `Org.status` already include `SUSPENDED`.
- `apps/web/app/api/webhooks/stripe/route.ts` already avoids auto-promoting suspended roasters during `account.updated`.
- Admin approval flows exist for applications, but there are no admin routes for general account lifecycle management after approval.
- No storefront guard currently blocks new orders based on roaster suspension state.
- `apps/roaster/app/(authenticated)/dashboard/page.tsx` and `apps/org/app/(authenticated)/dashboard/page.tsx` already exist and are natural homes for suspended-state guidance and reactivation-request UX.

---

## In scope

- Admin roaster/org list/detail surfaces for lifecycle management
- Suspend and reactivate actions
- Required reason or audit note capture
- Runtime behavior that blocks new orders from suspended roasters
- Suspended-state portal UX for roasters/orgs
- Reactivation request-and-review flow

---

## Out of scope

- Deleting historical entities
- Cancelling already-confirmed orders during suspension
- Full support/compliance case management workflows

---

## Primary files to create or modify

| Action | File | Purpose |
|--------|------|---------|
| Create | `apps/admin/app/roasters/` and `apps/admin/app/orgs/` | Admin lifecycle list/detail surfaces |
| Create | related `_actions/` under those routes | Suspend/reactivate actions |
| Modify | `apps/roaster/app/(authenticated)/dashboard/page.tsx` and `apps/org/app/(authenticated)/dashboard/page.tsx` | Suspended-state messaging and reactivation-request UX |
| Modify | storefront/order-eligibility query paths in `apps/web` | Prevent new orders for suspended roasters |

---

## Acceptance criteria

- [ ] Admin can open roaster and org detail pages and see lifecycle-relevant profile information
- [ ] Suspend action captures a required reason or note and sets status to `SUSPENDED`
- [ ] Suspended roasters/orgs see a clear blocked-state banner or page in their portal with reason category, what is blocked, what remains available, and what to do next
- [ ] Suspended roasters/orgs can submit a `Request Reactivation` note with remediation details
- [ ] Admin reactivation UI shows readiness context before enabling reactivation: open disputes, unsettled debt, Stripe readiness, and open undelivered orders
- [ ] Reactivate action restores the account to the correct active state with an explicit admin confirmation step
- [ ] Suspended roasters cannot receive new storefront orders
- [ ] Suspended orgs cannot present an active public fundraising storefront until reactivated
- [ ] Existing confirmed orders remain unaffected and continue through fulfillment/payout

---

## Normalized implementation decisions

- Replace the source-story `ApplicationEvent` concept with `AdminActionLog` for suspension, reactivation, and reactivation-request audit history.
- Reactivation is **not** a blind toggle. It is a request-and-review flow:
  - Suspended roaster/org sees a blocked-state banner/page with remediation guidance.
  - They can submit a reactivation request note.
  - Admin detail view shows readiness signals and recent history before reactivation.
- Admin can still override and reactivate with blockers present, but the UI must show an explicit warning/confirmation when doing so.
- Reactivation target state should be:
  - `ACTIVE` if the account still satisfies onboarding/payment prerequisites
  - otherwise remain non-active until those prerequisites are restored
- For roasters, suspension blocks new storefront orders and new campaign availability.
- For orgs, suspension blocks new campaign/admin actions and storefront availability for that org's public fundraising page.
- Send notification emails on suspension and on successful reactivation approval using `sendEmail()`.

---

## Suggested implementation steps

1. Add admin list/detail pages for roasters and orgs.
2. Add suspend/reactivate actions with required reason capture and `AdminActionLog`.
3. Add suspended-state portal UI plus `Request Reactivation` note submission.
4. Add admin readiness panel for reactivation decisions.
5. Add runtime guards so suspended accounts cannot create new business activity.
6. Verify Stripe webhook promotion logic still respects suspension.

---

## Handoff notes

- Reuse existing approval/detail UI patterns from `apps/admin/app/approvals/` where helpful, but keep lifecycle management separate from application review.
- Account suspension should be enforced in buyer-facing order paths, not just hidden in admin.
- Best-practice UX here is transparency: a suspended actor should know why access is limited and how to get back to good standing, while admin should see risk signals before reactivation.

---

## Revision log

| Version | Date | Notes |
|---------|------|-------|
| 0.1 | 2026-04-01 | Initial Sprint 5 story created from source planning doc and current repo review. |
| 0.2 | 2026-04-01 | Normalized to a request/review reactivation workflow with suspended-portal UX, admin readiness checks, and `AdminActionLog` replacing the source-story `ApplicationEvent` concept. |

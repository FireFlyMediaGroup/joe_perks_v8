# US-07-04 -- Admin Can Manage Roaster and Org Accounts: Suspend, Reactivate

**Story ID:** US-07-04 | **Epic:** EP-07 (Admin Dashboard)
**Points:** 3 | **Priority:** Low
**Status:** `Done`
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

- `apps/admin/app/roasters/` and `apps/admin/app/orgs/` now provide list/detail lifecycle surfaces with readiness context, recent admin activity, and suspend/reactivate controls.
- `apps/admin/app/_actions/account-lifecycle.ts` now records suspension/reactivation via `AdminActionLog`, requires audit notes where appropriate, and sends lifecycle notification emails.
- `apps/roaster/app/(authenticated)/layout.tsx` / `apps/org/app/(authenticated)/layout.tsx` now show suspension banners; both dashboards render blocked-state guidance plus `Request Reactivation` forms.
- `apps/roaster/app/(authenticated)/products/_actions/*` and shipping actions reject suspended roasters, while `apps/org/app/(authenticated)/campaign/_actions/campaign-actions.ts` rejects suspended org campaign activity.
- `apps/web/app/[locale]/[slug]/_lib/queries.ts` now excludes suspended-roaster storefronts earlier, `apps/web/app/api/checkout/create-intent/route.ts` rejects inactive org/roaster checkout attempts, and the Stripe webhook still avoids re-promoting suspended roasters during `account.updated`.
- `apps/web/app/api/webhooks/stripe/route.ts` now also sends the suspension email when dispute-threshold auto-suspension fires.

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

- [x] Admin can open roaster and org detail pages and see lifecycle-relevant profile information
- [x] Suspend action captures a required reason or note and sets status to `SUSPENDED`
- [x] Suspended roasters/orgs see a clear blocked-state banner or page in their portal with reason category, what is blocked, what remains available, and what to do next
- [x] Suspended roasters/orgs can submit a `Request Reactivation` note with remediation details
- [x] Admin reactivation UI shows readiness context before enabling reactivation: open disputes, unsettled debt, Stripe readiness, and open undelivered orders
- [x] Reactivate action restores the account to the correct active state with an explicit admin confirmation step
- [x] Suspended roasters cannot receive new storefront orders
- [x] Suspended orgs cannot present an active public fundraising storefront until reactivated
- [x] Existing confirmed orders remain unaffected and continue through fulfillment/payout

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
| 0.3 | 2026-04-01 | Package A landed: shared admin audit/actor helpers now exist in the repo and this story status is now `Partial`. |
| 1.0 | 2026-04-01 | Story implemented: admin `roasters/` + `orgs/` lifecycle routes, suspend/reactivate actions with readiness checks + emails, suspended portal UX with reactivation requests, stricter storefront/runtime guards, and auto-suspension email coverage all landed. |

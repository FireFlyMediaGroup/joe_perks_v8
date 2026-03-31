# Joe Perks -- Sprint 3 Progress Tracker

**Tracker version:** 0.1
**Baseline document:** [`docs/SPRINT_3_CHECKLIST.md`](SPRINT_3_CHECKLIST.md) (v1.0)
**Story documents:** [`docs/sprint-3/stories/`](sprint-3/stories/)
**Sprint overview:** [`docs/sprint-3/README.md`](sprint-3/README.md)
**Purpose:** Track what is actually complete in this repository for Sprint 3 (org approval chain, buyer storefront, cart, checkout, order confirmation, email, shipping guard) compared with the sprint checklist.

---

## How to use this file

- Treat `docs/SPRINT_3_CHECKLIST.md` as the **implementation plan**.
- Treat this file as the **current-state tracker**.
- Update this file whenever Sprint 3 work lands so the git diff shows exactly what changed between reviews.
- Each story has its own document in `docs/sprint-3/stories/` -- update the story status there too.

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
| 0.1 | 2026-03-30 | Initial tracker created. All stories at `Todo`. Sprint 3 documentation suite complete. |

---

## Snapshot summary

| Area | Status | Notes |
|------|--------|-------|
| Admin org approval queue (US-03-02) | `Todo` | `apps/admin/app/approvals/orgs/page.tsx` is a scaffold stub |
| Roaster magic link org review (US-03-03) | `Todo` | No `org-requests/[token]` route exists in `apps/roaster` |
| Org Stripe Connect + campaign (US-03-04) | `Todo` | `apps/org/app/onboarding/page.tsx` and `campaign/page.tsx` are stubs |
| Public org storefront (US-04-01) | `Todo` | `apps/web/app/[locale]/[slug]/page.tsx` is a scaffold stub |
| Zustand cart (US-04-02) | `Todo` | `packages/ui/src/store/cart.ts` has minimal store (addLine + clear only) |
| Three-step checkout (US-04-03) | `Todo` | `apps/web/app/[locale]/[slug]/checkout/page.tsx` is a scaffold; `create-intent` API exists |
| Order confirmation page (US-04-04) | `Todo` | `apps/web/app/[locale]/[slug]/order/[pi_id]/page.tsx` is a scaffold; `order-status` API exists |
| Order confirmation email (US-08-01) | `Todo` | `packages/email/templates/order-confirmation.tsx` template exists; not wired into webhook |
| Shipping rate guard (US-04-05) | `Todo` | No shipping availability guard exists on storefront or checkout |

---

## Progress matrix

### Phase 1 -- Admin Org Approval Queue (US-03-02)

| Item | Status | Evidence / current state | Next step |
|------|--------|--------------------------|-----------|
| Application list page | `Todo` | `apps/admin/app/approvals/orgs/page.tsx` -- scaffold stub ("Queue scaffold.") | Remove scaffold, build list with filters + pagination |
| Application detail view | `Todo` | No `[id]/page.tsx` exists | Create detail page |
| Approve server action | `Todo` | No `_actions/` directory under `approvals/orgs/` | Create action with MagicLink + email |
| Reject server action | `Todo` | -- | Create action with status update + email |
| Email templates | `Todo` | `org-roaster-review.tsx` and `org-rejected.tsx` do not exist | Create templates |
| UI components | `Todo` | -- | Build list, badges, dialogs |

### Phase 2 -- Roaster Magic Link Org Review (US-03-03)

| Item | Status | Evidence / current state | Next step |
|------|--------|--------------------------|-----------|
| Magic link page | `Todo` | No `apps/roaster/app/org-requests/` route exists | Create `[token]/page.tsx` |
| Approve server action | `Todo` | -- | Create with Org + User creation |
| Decline server action | `Todo` | -- | Create with backup roaster escalation |
| Email templates | `Todo` | `org-approved.tsx` and `org-declined.tsx` do not exist | Create templates |
| UI components | `Todo` | -- | Build org details display, approve/decline |

### Phase 3 -- Org Stripe Connect + Campaign (US-03-04)

| Item | Status | Evidence / current state | Next step |
|------|--------|--------------------------|-----------|
| Org Stripe Connect page | `Todo` | `apps/org/app/onboarding/page.tsx` -- stub ("Stripe Connect Express scaffold.") | Remove scaffold, build Connect UI |
| Org Connect API route | `Todo` | No `apps/org/app/api/stripe/connect/` route exists | Create route mirroring roaster |
| Webhook org promotion | `Todo` | `account.updated` handler only handles roasters | Add org account handling |
| Campaign page | `Todo` | `apps/org/app/campaign/page.tsx` -- stub ("Create and edit campaign scaffold.") | Remove scaffold, build campaign CRUD |
| Campaign server actions | `Todo` | -- | Create CRUD actions |
| Campaign form UI | `Todo` | -- | Build product selector, form |

### Phase 4 -- Public Org Storefront (US-04-01)

| Item | Status | Evidence / current state | Next step |
|------|--------|--------------------------|-----------|
| Storefront page | `Todo` | `apps/web/app/[locale]/[slug]/page.tsx` -- scaffold with reserved-slug guard | Remove scaffold, build storefront |
| Storefront layout | `Todo` | No `_components/` under `[slug]/` | Create layout component |
| Product grid | `Todo` | -- | Create grid + card components |
| Campaign header | `Todo` | -- | Create header with org branding |

### Phase 5 -- Order Confirmation Email (US-08-01)

| Item | Status | Evidence / current state | Next step |
|------|--------|--------------------------|-----------|
| Email template | `Todo` | `packages/email/templates/order-confirmation.tsx` exists with correct shape | Verify/update props |
| Webhook wiring | `Todo` | `payment_intent.succeeded` handler does not call `sendEmail()` | Wire sendEmail in webhook |

### Phase 6 -- Zustand Cart (US-04-02)

| Item | Status | Evidence / current state | Next step |
|------|--------|--------------------------|-----------|
| Cart store expansion | `Todo` | `packages/ui/src/store/cart.ts` -- addLine + clear only | Add removeLine, updateQuantity, getters |
| Cart line metadata | `Todo` | `CartLine` has `campaignItemId` + `quantity` only | Add display fields |
| Add-to-cart button | `Todo` | -- | Create component |
| Cart drawer | `Todo` | -- | Create drawer/sheet component |
| Cart line item | `Todo` | -- | Create line item component |

### Phase 7 -- Three-Step Checkout (US-04-03)

| Item | Status | Evidence / current state | Next step |
|------|--------|--------------------------|-----------|
| Checkout page | `Todo` | `checkout/page.tsx` -- scaffold ("3-step flow scaffold.") | Remove scaffold, build checkout |
| Checkout form | `Todo` | -- | Create 3-step form component |
| Step 1: Cart review | `Todo` | -- | Build review step |
| Step 2: Shipping | `Todo` | -- | Build shipping form + rate selector |
| Step 3: Payment | `Todo` | -- | Build Stripe Elements integration |
| Stripe Elements deps | `Todo` | `@stripe/react-stripe-js` not in `apps/web` deps | Add dependencies |

### Phase 8 -- Order Confirmation Page (US-04-04)

| Item | Status | Evidence / current state | Next step |
|------|--------|--------------------------|-----------|
| Confirmation page | `Todo` | `order/[pi_id]/page.tsx` -- scaffold (shows slug + PI id) | Remove scaffold, build confirmation |
| Status poller | `Todo` | -- | Create polling component |
| Order summary | `Todo` | -- | Create summary display |

### Phase 9 -- Shipping Rate Guard (US-04-05)

| Item | Status | Evidence / current state | Next step |
|------|--------|--------------------------|-----------|
| Storefront guard | `Todo` | No guard exists | Add shipping availability check |
| Checkout guard | `Todo` | API validates shipping rate but no UI guard | Add checkout-level guard |

---

## Known infrastructure notes

These items from previous sprints affect Sprint 3 implementation:

1. **Root `.env` loading** -- `apps/web` and `apps/admin` have `load-root-env.ts`. If `apps/org` needs root `.env` values (e.g. `DATABASE_URL`, `STRIPE_SECRET_KEY`), add a similar loader.
2. **Clerk user sync** -- `apps/org` has a Clerk webhook at `apps/org/app/api/webhooks/clerk/route.ts`. US-03-03 pre-creates the `User` with `clerk_pending:{uuid}`; the webhook should link the real Clerk ID on org admin sign-up (same pattern as roaster in US-02-02).
3. **Middleware API exclusion** -- `apps/web/proxy.ts` matcher already excludes `api` paths. New API routes under `apps/web/app/api/` work without changes.
4. **`requireRoasterId()` pattern** -- Sprint 3 org portal work should create a `requireOrgId()` equivalent for tenant isolation in org portal server actions.
5. **Checkout API** -- `POST /api/checkout/create-intent` is fully implemented. It validates campaign items, roaster status, shipping rate, calculates splits, creates PaymentIntent + Order. The checkout UI calls this existing endpoint.
6. **Order status API** -- `GET /api/order-status?pi=[pi_id]` is implemented. The confirmation page polls this endpoint.

---

## Document sync checklist

After each story completes:

- [ ] Update this file's revision log and status columns
- [ ] Update the story's own status in `docs/sprint-3/stories/US-XX-XX-*.md`
- [ ] Update [`docs/sprint-3/README.md`](sprint-3/README.md) story table if anything changed
- [ ] Update [`docs/SCAFFOLD_PROGRESS.md`](SCAFFOLD_PROGRESS.md) snapshot summary
- [ ] Verify new files/routes align with [`docs/01-project-structure.mermaid`](01-project-structure.mermaid) -- update diagram if new routes were added
- [ ] Verify data flows align with [`docs/05-approval-chain.mermaid`](05-approval-chain.mermaid) (EP-03 stories)
- [ ] Verify checkout flow aligns with [`docs/04-order-lifecycle.mermaid`](04-order-lifecycle.mermaid) (EP-04 stories)
- [ ] Verify schema usage aligns with [`docs/06-database-schema.mermaid`](06-database-schema.mermaid)
- [ ] If new patterns were introduced, update [`docs/CONVENTIONS.md`](CONVENTIONS.md)

# Joe Perks -- Sprint 3 Progress Tracker

**Tracker version:** 0.6
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
| 0.2 | 2026-03-31 | US-03-02 complete: admin org queue, detail, approve/reject, email templates, `MagicLink` on approve. |
| 0.3 | 2026-03-31 | US-03-03 complete: `apps/roaster/app/org-requests/[token]`, approve/decline actions, `org-approved` + `org-declined` templates, backup roaster routing. |
| 0.4 | 2026-03-31 | US-03-04 complete: org Stripe Connect (`api/stripe/connect`, `(authenticated)/onboarding`), `Org.chargesEnabled`/`payoutsEnabled`, webhook org promotion, campaign draft/activate (`(authenticated)/campaign`). |
| 0.5 | 2026-03-31 | US-04-01 complete: buyer storefront at `[locale]/[slug]/` — `getStorefrontData`, `StorefrontLayout`, `CampaignHeader`, `ProductGrid`, `ProductCard`; reserved-slug guard; `CampaignItem.retailPrice` display. |
| 0.6 | 2026-04-01 | US-04-02 complete: Zustand cart (`removeLine`, `updateQuantity`, `getLineCount`, `getTotalQuantity`, `getSubtotalCents`, campaign context); `add-to-cart-button`, `cart-drawer`, `cart-line-item`, `cart-trigger`, `storefront-cart-sync`; `CampaignHeader` actions slot; `apps/web` depends on `@joe-perks/ui`. Cart estimate: `splitPreviewDefaults` from `getStorefrontData`, `calculateSplits` via `@joe-perks/stripe/splits` in client. Smoke scripts + `packages/stripe` `./splits` export aligned. |

---

## Snapshot summary

| Area | Status | Notes |
|------|--------|-------|
| Admin org approval queue (US-03-02) | `Done` | List + `[id]` detail, `_actions/approve-application.ts` + `reject-application.ts`, `org-roaster-review` + `org-rejected` templates |
| Roaster magic link org review (US-03-03) | `Done` | `apps/roaster/app/org-requests/[token]/page.tsx`, `_actions/approve-org.ts`, `_actions/decline-org.ts`, `org-approved.tsx`, `org-declined.tsx` |
| Org Stripe Connect + campaign (US-03-04) | `Done` | `(authenticated)/onboarding`, `api/stripe/connect`, `(authenticated)/campaign` + `_actions`, webhook org `account.updated` |
| Public org storefront (US-04-01) | `Done` | `page.tsx` + `_lib/queries.ts` (`getStorefrontData`, `splitPreviewDefaults` for cart estimate), `_components/storefront-layout`, `campaign-header`, `product-grid`, `product-card` |
| Zustand cart (US-04-02) | `Done` | `packages/ui/src/store/cart.ts`; `_components/add-to-cart-button`, `cart-drawer`, `cart-line-item`, `cart-trigger`, `storefront-cart-sync`; `calculateSplits` from `@joe-perks/stripe/splits` in `cart-drawer` |
| Three-step checkout (US-04-03) | `Todo` | `apps/web/app/[locale]/[slug]/checkout/page.tsx` is a scaffold; `create-intent` API exists |
| Order confirmation page (US-04-04) | `Todo` | `apps/web/app/[locale]/[slug]/order/[pi_id]/page.tsx` is a scaffold; `order-status` API exists |
| Order confirmation email (US-08-01) | `Todo` | `packages/email/templates/order-confirmation.tsx` template exists; not wired into webhook |
| Shipping rate guard (US-04-05) | `Todo` | No shipping availability guard exists on storefront or checkout |

---

## Progress matrix

### Phase 1 -- Admin Org Approval Queue (US-03-02)

| Item | Status | Evidence / current state | Next step |
|------|--------|--------------------------|-----------|
| Application list page | `Done` | `apps/admin/app/approvals/orgs/page.tsx` + `org-queue.tsx` with filters + pagination | — |
| Application detail view | `Done` | `apps/admin/app/approvals/orgs/[id]/page.tsx` + `org-detail.tsx` | — |
| Approve server action | `Done` | `_actions/approve-application.ts` — `MagicLink` + `sendEmail` | — |
| Reject server action | `Done` | `_actions/reject-application.ts` | — |
| Email templates | `Done` | `packages/email/templates/org-roaster-review.tsx`, `org-rejected.tsx` | — |
| UI components | `Done` | `org-queue`, `org-detail`, `approve-reject-buttons` | — |

### Phase 2 -- Roaster Magic Link Org Review (US-03-03)

| Item | Status | Evidence / current state | Next step |
|------|--------|--------------------------|-----------|
| Magic link page | `Done` | `apps/roaster/app/org-requests/[token]/page.tsx` + `token-error.tsx` | — |
| Approve server action | `Done` | `_actions/approve-org.ts` — `Org` + `User`, `sendEmail` `org-approved` | — |
| Decline server action | `Done` | `_actions/decline-org.ts` — backup `MagicLink` + `org-roaster-review`, or `REJECTED` + `org-declined` | — |
| Email templates | `Done` | `packages/email/templates/org-approved.tsx`, `org-declined.tsx` | — |
| UI components | `Done` | `org-review-details.tsx`, `review-actions.tsx` | — |

### Phase 3 -- Org Stripe Connect + Campaign (US-03-04)

| Item | Status | Evidence / current state | Next step |
|------|--------|--------------------------|-----------|
| Org Stripe Connect page | `Done` | `apps/org/app/(authenticated)/onboarding/page.tsx` + `connect-status`, `start-onboarding-button` | — |
| Org Connect API route | `Done` | `apps/org/app/api/stripe/connect/route.ts` | — |
| Webhook org promotion | `Done` | `apps/web/.../webhooks/stripe/route.ts` — org `chargesEnabled`/`payoutsEnabled`, ONBOARDING→ACTIVE | — |
| Campaign page | `Done` | `apps/org/app/(authenticated)/campaign/page.tsx` + `campaign-form`, `product-selector` | — |
| Campaign server actions | `Done` | `_actions/campaign-actions.ts` — `saveCampaignDraft`, `activateCampaign` | — |
| Campaign form UI | `Done` | Product selector, name/goal, activate guards | — |

### Phase 4 -- Public Org Storefront (US-04-01)

| Item | Status | Evidence / current state | Next step |
|------|--------|--------------------------|-----------|
| Storefront page | `Done` | `page.tsx` — `getStorefrontData`, `notFound()` guards, `generateMetadata` | — |
| Storefront layout | `Done` | `_components/storefront-layout.tsx` | — |
| Product grid | `Done` | `_components/product-grid.tsx`, `product-card.tsx` | — |
| Campaign header | `Done` | `_components/campaign-header.tsx` — optional `actions` slot (cart, US-04-02) | — |
| Storefront query | `Done` | `_lib/queries.ts` — `splitPreviewDefaults` (PlatformSettings + default roaster shipping) for US-04-02 cart estimate | — |

### Phase 5 -- Order Confirmation Email (US-08-01)

| Item | Status | Evidence / current state | Next step |
|------|--------|--------------------------|-----------|
| Email template | `Todo` | `packages/email/templates/order-confirmation.tsx` exists with correct shape | Verify/update props |
| Webhook wiring | `Todo` | `payment_intent.succeeded` handler does not call `sendEmail()` | Wire sendEmail in webhook |

### Phase 6 -- Zustand Cart (US-04-02)

| Item | Status | Evidence / current state | Next step |
|------|--------|--------------------------|-----------|
| Cart store expansion | `Done` | `packages/ui/src/store/cart.ts` — `addLine(ctx)`, `removeLine`, `updateQuantity`, `clear`, `getLineCount`, `getTotalQuantity`, `getSubtotalCents`, campaign switch on `addLine` | — |
| Cart line metadata | `Done` | `CartLine` includes `productName`, `variantDesc`, `retailPrice`, `imageUrl?` | — |
| Add-to-cart button | `Done` | `_components/add-to-cart-button.tsx` | — |
| Cart drawer | `Done` | `_components/cart-drawer.tsx` — Sheet right / bottom mobile; estimate rows (coffee, shipping, org, total) via `calculateSplits` from `@joe-perks/stripe/splits` | — |
| Cart line item | `Done` | `_components/cart-line-item.tsx` | — |
| Cart trigger + sync | `Done` | `_components/cart-trigger.tsx`; `storefront-cart-sync.tsx` clears cart on org slug change | — |

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

1. **Root `.env` loading** -- `apps/web`, `apps/admin`, and **`apps/org`** use `load-root-env.ts` (imported from `next.config.ts`) so `DATABASE_URL` and Stripe keys from the monorepo root `.env` are available for Prisma and Connect routes in dev.
2. **Clerk user sync** -- `apps/org` has a Clerk webhook at `apps/org/app/api/webhooks/clerk/route.ts`. US-03-03 pre-creates the `User` with `clerk_pending:{uuid}`; the webhook should link the real Clerk ID on org admin sign-up (same pattern as roaster in US-02-02).
3. **Middleware API exclusion** -- `apps/web/proxy.ts` matcher already excludes `api` paths. New API routes under `apps/web/app/api/` work without changes.
4. **`requireOrgId()`** -- Implemented at `apps/org/app/(authenticated)/_lib/require-org.ts` for org portal server actions (mirrors `requireRoasterId()`).
5. **Checkout API** -- `POST /api/checkout/create-intent` is fully implemented. It validates campaign items, roaster status, shipping rate, calculates splits, creates PaymentIntent + Order. The checkout UI calls this existing endpoint.
6. **Order status API** -- `GET /api/order-status?pi=[pi_id]` is implemented. The confirmation page polls this endpoint.
7. **Sprint 3 DB smoke** -- `pnpm db:smoke:sprint-3` (`packages/db/scripts/smoke-sprint-3.ts`) checks EP-03 migration, Org/Campaign invariants, and optional HTTP probes on ports 3001–3003. HTTP probes **skip** (not fail) when a local app returns **5xx** so misconfigured dev servers do not block DB validation.
8. **US-04-01 storefront smoke** -- `pnpm db:smoke:us-04-01` mirrors `getStorefrontData` including `splitPreviewDefaults`; reserved/missing slug HTTP checks **skip** on connection refused or **5xx** from `web` on port 3000.

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

**Last full sync (US-04-02, 2026-04-01):** progress + story + README current progress + story-to-file mapping + `SCAFFOLD_PROGRESS` revision `1.19` + snapshot row; `01-project-structure.mermaid` storefront + `packages/stripe` splits export; `SPRINT_3_CHECKLIST` Phase 6 complete + 6.8 split estimate; `CONVENTIONS.md` + `AGENTS.md` client `calculateSplits` import; smoke scripts (`us-04-01`, `sprint-3`) HTTP skip behavior. OA13 / order-lifecycle / ERD unchanged.

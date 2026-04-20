# Storefront, Cart & Checkout — E2E Test Plan

> **Sprint 6** | Last updated: 2026-04-01

This checklist covers the full buyer journey from storefront landing through payment confirmation. Tests are organized by page/component and ordered in the sequence a buyer would encounter them.

---

## Prerequisites

| Item | Detail |
|------|--------|
| Seeded org | An org with `status = ACTIVE` and a known slug (e.g. `test-org-slug`) |
| Active campaign | Campaign with `status = ACTIVE`, at least 2 items (1 featured), and a `goalCents` value |
| Roaster shipping | At least 1 `RoasterShippingRate` for the campaign roaster (required for checkout) |
| Stripe test keys | `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` and `STRIPE_SECRET_KEY` set in env |
| Platform settings | `PlatformSettings` singleton exists with fee percentages |
| Dev server | `pnpm dev` running (`apps/web` on port 3000) |

---

## 1. Storefront Landing (`/{slug}`)

### 1.1 Page Load & Layout

| # | Test | Expected Result | Status |
|---|------|-----------------|--------|
| 1.1.1 | Navigate to `/{slug}` for an active org | Page loads without errors, title = `{orgName} — {campaignName}` | ☐ |
| 1.1.2 | Nav bar displays org name | Org name visible in top-left with coffee icon | ☐ |
| 1.1.3 | Nav bar links to Joe Perks home | "Joe Perks" link in top-right navigates to `/` | ☐ |
| 1.1.4 | Footer renders | Footer shows Joe Perks branding, tagline, Terms & Privacy links | ☐ |
| 1.1.5 | Page uses brand background | Background is cream (`--jp-bg-page` / `#FDF9F4`) | ☐ |

### 1.2 Campaign Header

| # | Test | Expected Result | Status |
|---|------|-----------------|--------|
| 1.2.1 | Org name label | Displays in DM Mono, uppercase, muted color | ☐ |
| 1.2.2 | Campaign name heading | Renders in Playfair Display, large responsive font | ☐ |
| 1.2.3 | Fundraiser percentage | Shows `{X}% of every purchase supports {orgName}` with terracotta accent | ☐ |
| 1.2.4 | Progress bar (when goal set) | Shows raised/goal amounts, progress bar fills proportionally | ☐ |
| 1.2.5 | Progress bar (no goal) | Progress bar section hidden when `goalCents` is null | ☐ |
| 1.2.6 | Cart trigger button | Shopping bag button visible in header actions area | ☐ |

### 1.3 Product Grid & Cards

| # | Test | Expected Result | Status |
|---|------|-----------------|--------|
| 1.3.1 | Featured section | Featured items appear under "Featured" heading | ☐ |
| 1.3.2 | All coffee section | Non-featured items appear under "All coffee" heading | ☐ |
| 1.3.3 | Product card content | Each card shows: image (or placeholder), roast level chip, product name, variant (size · grind), price | ☐ |
| 1.3.4 | Featured badge | Featured cards display a star + "Featured" pill in terracotta | ☐ |
| 1.3.5 | Featured card styling | Featured cards have terracotta border and subtle ring | ☐ |
| 1.3.6 | Hover effect | Cards lift (`translateY(-4px)`) and gain shadow on hover | ☐ |
| 1.3.7 | Image zoom on hover | Product image scales slightly on card hover | ☐ |
| 1.3.8 | Empty state | When campaign has 0 items, shows "No products" message | ☐ |
| 1.3.9 | Price formatting | Prices display as `$XX.XX` with currency formatting | ☐ |

### 1.4 Add to Cart

| # | Test | Expected Result | Status |
|---|------|-----------------|--------|
| 1.4.1 | Add to cart button | "Add to cart" button with shopping bag icon on each card | ☐ |
| 1.4.2 | Click adds item | Clicking adds 1 unit to cart; button briefly shows green "Added" with check icon | ☐ |
| 1.4.3 | Repeat add | Adding same item again shows "Add another (N in cart)" | ☐ |
| 1.4.4 | Cart badge updates | Cart trigger badge count increments after add | ☐ |
| 1.4.5 | Disabled when no shipping | Button shows "Unavailable" and is disabled when `purchasesEnabled = false` | ☐ |

---

## 2. Shipping Guard

| # | Test | Expected Result | Status |
|---|------|-----------------|--------|
| 2.1 | Banner when no shipping rates | Orange warning banner appears at top: "This store is temporarily unavailable for purchases" | ☐ |
| 2.2 | No banner when shipping exists | No warning banner when roaster has shipping rates configured | ☐ |
| 2.3 | Checkout blocked redirect | Navigating to `/checkout` without shipping rates redirects back to `/{slug}?error=no-shipping` | ☐ |
| 2.4 | Blocked checkout message | When `?error=no-shipping`, shows message about checkout unavailability | ☐ |

---

## 3. Cart Drawer

| # | Test | Expected Result | Status |
|---|------|-----------------|--------|
| 3.1 | Open cart drawer | Clicking cart trigger opens sliding sheet (right on desktop, bottom on mobile) | ☐ |
| 3.2 | Empty cart state | Shows shopping bag icon, "Your cart is empty" message, and "Continue shopping" button | ☐ |
| 3.3 | Cart header | Shows org name (mono), "Your cart" title (Playfair), and campaign name card | ☐ |
| 3.4 | Line items | Each item shows: thumbnail, name + variant, unit price, quantity controls, remove button | ☐ |
| 3.5 | Quantity increment | Plus button increments quantity; max 99 | ☐ |
| 3.6 | Quantity decrement | Minus button decrements; removes item at 0 | ☐ |
| 3.7 | Remove item | "Remove" button removes the line entirely | ☐ |
| 3.8 | Item count label | "Items (N)" header updates with line count | ☐ |
| 3.9 | Coffee subtotal | Correctly sums `retailPrice × quantity` for all lines | ☐ |
| 3.10 | Shipping estimate | Shows estimated shipping cost or "At checkout" if no default rate | ☐ |
| 3.11 | Fundraiser estimate | Terracotta-tinted card shows estimated org amount with heart icon | ☐ |
| 3.12 | Fundraiser percentage | Shows `{X}% of coffee subtotal (before card fees)` | ☐ |
| 3.13 | Total display | Bold total at bottom with correct sum | ☐ |
| 3.14 | Clear cart | "Clear cart" button empties all items | ☐ |
| 3.15 | Checkout button | Terracotta "Checkout" button links to `/{slug}/checkout` | ☐ |
| 3.16 | Checkout disabled | When `purchasesEnabled = false`, checkout button is disabled with title text | ☐ |

---

## 4. Cart Persistence (localStorage)

| # | Test | Expected Result | Status |
|---|------|-----------------|--------|
| 4.1 | Survives navigation | Add items, navigate to home, return to storefront — cart preserved | ☐ |
| 4.2 | Survives page refresh | Hard refresh (`Cmd+R`) preserves cart contents | ☐ |
| 4.3 | Cross-org clear | Visiting a different org's storefront clears previous org's cart (`StorefrontCartSync`) | ☐ |
| 4.4 | Correct org binding | Cart stores `activeOrgSlug` and `activeCampaignId` | ☐ |

---

## 5. Checkout — Step 1: Cart Review (`/{slug}/checkout`)

| # | Test | Expected Result | Status |
|---|------|-----------------|--------|
| 5.1 | Page loads | Checkout page renders with cream background and step indicators | ☐ |
| 5.2 | Step indicator | Step 1 "Cart" is highlighted in terracotta; steps 2 & 3 are muted | ☐ |
| 5.3 | Org name and title | Org name in mono label, "Checkout" in Playfair | ☐ |
| 5.4 | Cart items | All cart items displayed with quantity controls | ☐ |
| 5.5 | Subtotal | Correct subtotal shown | ☐ |
| 5.6 | Continue button | "Continue to shipping" button advances to step 2 | ☐ |
| 5.7 | Back to store link | "Back to store" returns to `/{slug}` | ☐ |
| 5.8 | Empty cart redirect | If cart is empty, automatically redirects to `/{slug}` | ☐ |
| 5.9 | Mismatched campaign redirect | If cart was for a different campaign/slug, redirects | ☐ |

---

## 6. Checkout — Step 2: Shipping & Contact

| # | Test | Expected Result | Status |
|---|------|-----------------|--------|
| 6.1 | Step indicator | Step 2 highlighted; step 1 shows teal checkmark | ☐ |
| 6.2 | Form fields | Full name, email, street, city, state, ZIP fields render with correct autocomplete attributes | ☐ |
| 6.3 | Validation errors | Submitting empty form shows field-level error messages | ☐ |
| 6.4 | Email validation | Invalid email format shows error | ☐ |
| 6.5 | Shipping rate selection | Radio buttons for each available shipping rate (label, carrier, price) | ☐ |
| 6.6 | Default rate preselected | The default shipping rate is pre-selected | ☐ |
| 6.7 | Order summary | Side panel shows subtotal, shipping for selected rate, estimated total | ☐ |
| 6.8 | Total updates on rate change | Changing shipping rate updates estimated total | ☐ |
| 6.9 | Back button | "Back to cart" returns to step 1 | ☐ |
| 6.10 | Continue button | "Continue to payment" advances to step 3 | ☐ |

---

## 7. Checkout — Step 3: Payment

| # | Test | Expected Result | Status |
|---|------|-----------------|--------|
| 7.1 | Step indicator | Step 3 highlighted; steps 1 & 2 show teal checkmarks with connecting lines | ☐ |
| 7.2 | Order summary card | Shows all line items, subtotal, shipping, total, and buyer name/email | ☐ |
| 7.3 | Fundraiser callout | Heart icon + "A portion of your purchase supports {orgName}" | ☐ |
| 7.4 | Loading spinner | Shows "Securing your order…" with spinner while PaymentIntent is created | ☐ |
| 7.5 | Stripe PaymentElement | Stripe card input renders after intent is created | ☐ |
| 7.6 | Pay button amount | Button shows "Pay $XX.XX" with correct gross amount | ☐ |
| 7.7 | Successful payment (test card `4242...`) | Payment processes; redirects to order confirmation page | ☐ |
| 7.8 | Declined card (test card `4000 0000 0000 0002`) | Error message appears below payment form | ☐ |
| 7.9 | Rate limiting (429) | After too many attempts, shows rate limit message | ☐ |
| 7.10 | Back button | "Back to shipping" returns to step 2 preserving entered data | ☐ |
| 7.11 | Return to store link | "Return to store" navigates back to `/{slug}` | ☐ |
| 7.12 | Network error handling | Disconnecting network shows "Network error" message | ☐ |

---

## 8. Order Confirmation (`/{slug}/order/{pi_id}`)

| # | Test | Expected Result | Status |
|---|------|-----------------|--------|
| 8.1 | Redirect after payment | After successful payment, redirected to `/order/{pi_id}` | ☐ |
| 8.2 | Pending state polling | If order is still `PENDING`, shows `OrderStatusPoller` component | ☐ |
| 8.3 | Confirmed order summary | Displays order number, line items, subtotal, shipping, total, and org contribution | ☐ |
| 8.4 | Org name displayed | Shows the organization name | ☐ |
| 8.5 | Invalid PI ID | Shows "Order not found" message for non-existent `pi_id` | ☐ |
| 8.6 | Slug mismatch | Returns 404 if `pi_id` order belongs to a different org slug | ☐ |

---

## 9. Edge Cases & Error States

| # | Test | Expected Result | Status |
|---|------|-----------------|--------|
| 9.1 | Non-existent slug | `/{random-slug}` returns 404 | ☐ |
| 9.2 | Reserved slug | `/{reserved-slug}` (e.g. `admin`, `api`) returns 404 | ☐ |
| 9.3 | Inactive org | Org with `status ≠ ACTIVE` returns 404 (storefront not found) | ☐ |
| 9.4 | No active campaign | Active org with no active campaign returns 404 | ☐ |
| 9.5 | Inactive product filtered | Products with `status ≠ ACTIVE` or `deletedAt` set are not shown | ☐ |
| 9.6 | Unavailable variant filtered | Variants with `isAvailable = false` or `deletedAt` set are not shown | ☐ |
| 9.7 | Inactive roaster filtered | Products from roasters with `status ≠ ACTIVE` are not shown | ☐ |

---

## 10. Responsive & Accessibility

| # | Test | Expected Result | Status |
|---|------|-----------------|--------|
| 10.1 | Mobile layout (< 640px) | Product grid stacks to 1 column; cart opens as bottom sheet | ☐ |
| 10.2 | Tablet layout (640–1024px) | Product grid shows 2 columns | ☐ |
| 10.3 | Desktop layout (> 1024px) | Product grid shows 3 columns; cart opens as right drawer | ☐ |
| 10.4 | Touch targets | All interactive elements meet 44×44px minimum (`min-h-11`) | ☐ |
| 10.5 | Cart badge ARIA | Cart trigger has descriptive `aria-label` with item count | ☐ |
| 10.6 | Progress bar ARIA | Progress bar has `role="progressbar"` with `aria-valuemin`, `aria-valuemax`, `aria-valuenow` | ☐ |
| 10.7 | Error alerts | Error messages use `role="alert"` | ☐ |
| 10.8 | Form labels | All form inputs have associated `<Label>` elements | ☐ |
| 10.9 | Keyboard navigation | Tab order follows visual layout; Enter/Space activate buttons | ☐ |

---

## 11. Org Portal — Storefront Preview (`/storefront`)

| # | Test | Expected Result | Status |
|---|------|-----------------|--------|
| 11.1 | Page loads | Storefront preview page renders in org portal sidebar layout | ☐ |
| 11.2 | Org name displayed | Shows org name in header | ☐ |
| 11.3 | Shareable link | Public storefront URL displayed in code block | ☐ |
| 11.4 | Copy button | "Copy" button copies URL to clipboard; briefly shows "Copied" | ☐ |
| 11.5 | Status badge | Live orgs show green "Live" badge | ☐ |
| 11.6 | Active campaign info | Shows campaign name and product count | ☐ |
| 11.7 | No campaign warning | Amber warning when no active campaign, with link to campaign page | ☐ |
| 11.8 | Metric cards | When active campaign exists: Orders count, Fundraiser total ($), Products count | ☐ |
| 11.9 | Goal progress | Products card shows goal progress bar when campaign has a goal | ☐ |
| 11.10 | Open storefront link | "Open storefront" button opens public URL in new tab | ☐ |
| 11.11 | Manage campaign link | "Manage campaign" navigates to `/campaign` | ☐ |

---

## Test Execution Notes

- **Stripe test cards**: Use `4242 4242 4242 4242` for success, `4000 0000 0000 0002` for decline. Any future date + any CVC.
- **Split calculations**: Verify the fundraiser estimate in the cart matches what `calculateSplits()` would return for the given subtotal and campaign `orgPct`.
- **Webhook flow**: After successful payment, the `payment_intent.succeeded` webhook confirms the order. Use Stripe CLI (`stripe listen --forward-to localhost:3000/api/webhooks/stripe`) for local testing.
- **Cart clearing**: The `StorefrontCartSync` component auto-clears the cart when the `orgSlug` changes — test by visiting two different org storefronts.

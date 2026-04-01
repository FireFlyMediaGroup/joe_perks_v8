# CONVENTIONS.md — Joe Perks Coding Conventions

Coding standards, patterns, and anti-patterns for the Joe Perks codebase.
AI coding agents must follow these when generating or modifying code.

---

## TypeScript

- Strict mode enabled in all apps and packages (`"strict": true` in tsconfig).
- No `any` types — use `unknown` and narrow, or define a proper interface.
- All API route handlers are typed with `Request` and return `Response`.
- Database query results are typed via generated Prisma client — do not manually type DB rows.
- Use `satisfies` over `as` for type assertions where possible.

---

## Next.js App Router patterns

### Server components (default)
```typescript
// app/[slug]/page.tsx — server component, no 'use client'
export default async function StorefrontPage({ params }: { params: { slug: string } }) {
  const campaign = await db.campaign.findFirst({ where: { org: { slug: params.slug } } })
  if (!campaign) notFound()
  return <StorefrontLayout>...</StorefrontLayout>
}
```

### Client components (only when needed)
```typescript
'use client'
// Only use for: interactive state, browser APIs, event handlers, useCart()
// Never fetch data in a client component — use server components + props
```

### API routes
```typescript
// app/api/checkout/create-intent/route.ts
export async function POST(req: Request) {
  // 1. Rate limit check
  // 2. Parse + validate body (never trust client)
  // 3. Re-validate prices from DB
  // 4. Business logic
  // 5. Return Response.json()
}
```

### Server actions (portal CRUD)

Portal apps (`apps/roaster`, `apps/org`) use Next.js server actions for mutations instead of API routes. Every action follows this shape:

```typescript
'use server'

import { database } from '@joe-perks/db'
import { revalidatePath } from 'next/cache'

import { requireRoasterId } from '../_lib/require-roaster'
import { productFormSchema } from '../_lib/schema'

export async function createProduct(input: ProductFormInput): Promise<ActionResult> {
  // 1. Authenticate + resolve tenant
  const session = await requireRoasterId()
  if (!session.ok) return { success: false, error: 'Not authorized.' }

  // 2. Validate with Zod
  const parsed = productFormSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }

  // 3. Mutate — always scope by session tenant ID, never from input
  const product = await database.product.create({
    data: { roasterId: session.roasterId, ...parsed.data },
  })

  // 4. Revalidate affected paths
  revalidatePath('/products')
  return { success: true, productId: product.id }
}
```

Key differences from API routes: no `Request`/`Response`, uses `revalidatePath` instead of returning JSON, returns a discriminated union result type.

**Org portal:** import `requireOrgId` from `apps/org/app/(authenticated)/_lib/require-org.ts` and scope mutations with `session.orgId` (same shape as `requireRoasterId`).

### Route structure in apps/web
```
app/
├── (marketing)/        # Route group — no layout effect
│   └── page.tsx        # joeperks.com/
├── [slug]/             # Dynamic — one per org
│   ├── page.tsx        # Storefront
│   └── checkout/
│       └── page.tsx
└── api/
    └── webhooks/
        └── stripe/
            └── route.ts
```

### Route structure in portal apps (roaster, org)

Portal route segments colocate actions, components, and lib under private folders:

```
app/(authenticated)/products/          # route segment
├── page.tsx                           # server component — list view
├── new/page.tsx                       # server component — create form shell
├── [id]/page.tsx                      # server component — detail view
├── [id]/edit/page.tsx                 # server component — edit form shell
├── _actions/                          # "use server" mutation functions
│   ├── product-actions.ts
│   └── variant-actions.ts
├── _components/                       # client + server components for this segment
│   ├── product-form.tsx               # "use client" — create/edit form
│   ├── product-list.tsx               # table/grid for list page
│   ├── variant-form.tsx               # "use client" — variant create/edit
│   └── variant-list.tsx               # variant table with edit/delete
└── _lib/                              # shared utilities scoped to this segment
    ├── schema.ts                      # Zod validation schemas
    ├── require-roaster.ts             # tenant auth helper (reusable)
    ├── money.ts                       # parseDollarsToCents, formatCentsAsDollars
    └── format.ts                      # enum display labels
```

Pages are always server components. Forms are always client components. Actions live in `_actions/` and are imported by client components via `"use server"`. Follow this layout for new portal features (e.g. shipping, payouts).

---

## Database query patterns

### Always scope by tenant
```typescript
// ✅ Correct — scoped to authenticated roaster
const orders = await db.order.findMany({
  where: {
    roaster_id: session.roasterId, // from Clerk session
    status: 'CONFIRMED',
  },
})

// ❌ Wrong — never trust request body for tenant ID
const orders = await db.order.findMany({
  where: { roaster_id: body.roasterId }, // attacker can set any ID
})
```

### Soft deletes
```typescript
// ✅ Correct — always filter deleted records
const products = await db.product.findMany({
  where: {
    roaster_id: session.roasterId,
    deleted_at: null, // required on every Product/ProductVariant query
  },
})

// ❌ Wrong — will return deleted products
const products = await db.product.findMany({
  where: { roaster_id: session.roasterId },
})
```

### CampaignItem prices (not ProductVariant prices)
```typescript
// ✅ Correct — use snapshotted campaign prices
const items = await db.campaignItem.findMany({
  where: { campaign_id: campaignId },
  select: { retail_price: true, wholesale_price: true, variant: true },
})

// ❌ Wrong — variant price may have changed since campaign was created
const variant = await db.productVariant.findUnique({ where: { id: variantId } })
const price = variant.retail_price // stale — use CampaignItem.retail_price
```

### OrderItem prices (not variant prices for historical display)
```typescript
// ✅ Correct — use snapshotted order item data
const item = await db.orderItem.findFirst({ where: { order_id: orderId } })
displayName = item.product_name   // snapshot
displayPrice = item.unit_price    // snapshot

// ❌ Wrong — product/variant may have changed
const variant = await db.productVariant.findUnique(...)
displayName = variant.product.name // may have changed since order was placed
```

---

## Money handling

```typescript
// ✅ Always store and pass cents (integers)
const retailCents = 1999 // $19.99
const shippingCents = 895 // $8.95

// ✅ Display formatting
const display = `$${(cents / 100).toFixed(2)}`

// ✅ Split calculation — always use the package function
import { calculateSplits } from '@joe-perks/stripe'
const splits = calculateSplits(productSubtotal, shippingAmount, orgPct, settings)
// splits.org_amount, splits.platform_amount, splits.roaster_amount — all cents

// ❌ Never do this
const orgAmount = totalPrice * 0.15 // float multiplication on money
const orgAmount = parseFloat((totalPrice * 0.15).toFixed(2)) // still wrong
```

### Dollar-to-cents form input round-trip

Portal forms display prices in dollars but store/transmit cents. Use `parseDollarsToCents` for input and `formatCentsAsDollars` for display (see `products/_lib/money.ts`):

```typescript
// ✅ Input: user types "19.99" → store 1999
function parseDollarsToCents(raw: string): { ok: true; cents: number } | { ok: false; error: string } {
  const n = Number.parseFloat(raw.replace(/^\$/, '').trim())
  if (Number.isNaN(n) || n <= 0) return { ok: false, error: 'Enter a valid price' }
  return { ok: true, cents: Math.round(n * 100) }
}

// ✅ Display: DB has 1999 → show "19.99"
function formatCentsAsDollars(cents: number): string {
  return (cents / 100).toFixed(2)
}

// ✅ Margin warning: alert when (retail − wholesale) / retail < 20%
function isLowMarginWarning(wholesaleCents: number, retailCents: number): boolean {
  if (retailCents <= 0) return false
  return (retailCents - wholesaleCents) / retailCents < 0.2
}
```

Reuse these helpers for any dollar input (variant prices, shipping rates, etc.) rather than reimplementing the conversion.

---

## Stripe patterns

```typescript
// ✅ Import from package — never import stripe directly in an app
import { stripe } from '@joe-perks/stripe'

// ✅ Webhook signature verification — always first, before any processing
export async function POST(req: Request) {
  const body = await req.text() // raw body required
  const sig = req.headers.get('stripe-signature')!
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return Response.json({ error: 'Invalid signature' }, { status: 400 })
  }
  // ... process event
}

// ✅ Always set transfer_group on transfers
await stripe.transfers.create({
  amount: splits.roaster_amount,
  currency: 'usd',
  destination: roaster.stripe_account_id,
  source_transaction: order.stripe_charge_id,
  transfer_group: order.id, // REQUIRED — enables reconciliation
  metadata: { order_id: order.id, type: 'roaster_payout' },
})
```

---

## Email patterns

```typescript
// ✅ Always use sendEmail() — never call Resend directly
import { sendEmail } from '@joe-perks/email'

await sendEmail({
  template: 'order_shipped',
  to: order.buyer_email,
  entityId: order.id,
  entityType: 'order',
  props: { orderNumber: order.order_number, trackingNumber: order.tracking_number },
})
// sendEmail() handles EmailLog dedup — safe to call multiple times

// ❌ Never do this
import { Resend } from 'resend'
const resend = new Resend(process.env.RESEND_API_KEY)
await resend.emails.send({ ... }) // bypasses EmailLog dedup
```

---

## Error handling

```typescript
// ✅ API routes return typed error responses
return Response.json(
  { error: 'Campaign not found', code: 'CAMPAIGN_NOT_FOUND' },
  { status: 404 }
)

// ✅ Background jobs (Inngest) — capture to Sentry, don't throw
try {
  await processOrder(order)
} catch (error) {
  Sentry.captureException(error, { extra: { order_id: order.id } })
  // Inngest will retry — don't re-throw for non-fatal errors
}

// ✅ Critical payment paths — throw to let Inngest retry
const transfer = await stripe.transfers.create(...)
// If stripe throws, let it propagate — Inngest will retry with backoff
```

---

## Logging

```typescript
// ✅ Structured logging — only safe fields
console.log('Order confirmed', {
  order_id: order.id,
  order_number: order.order_number,
  stripe_pi_id: order.stripe_pi_id,
  campaign_id: order.campaign_id,
})

// ❌ Never log these fields
console.log('Checkout', req.body)           // contains buyer address
console.log('Webhook event', event)          // contains card fingerprints
console.log('Buyer', { email, address })    // PII
```

---

## Order event logging

```typescript
// ✅ Always use the helper — never insert OrderEvent directly
import { logOrderEvent } from '@joe-perks/db'

await logOrderEvent(
  order.id,
  'ORDER_SHIPPED',
  'ROASTER',
  roaster.id,
  { tracking_number: trackingNumber, carrier },
  requestIp
)

// OrderEvent is APPEND-ONLY — never update or delete rows
// logOrderEvent() handles errors gracefully — won't throw on failure
```

---

## Component patterns (apps/web storefront)

**Data loading:** `getStorefrontData(slug)` in `apps/web/app/[locale]/[slug]/_lib/queries.ts` loads `Org` (ACTIVE), active `Campaign`, and `CampaignItem` rows with product/variant filters. It also returns **`splitPreviewDefaults`** (`PlatformSettings` + default roaster `RoasterShippingRate`) for the cart drawer estimate — reuse the same query for checkout (US-04-03) instead of duplicating.

**Split math in the browser:** Use `calculateSplits()` from **`@joe-perks/stripe/splits`**. Do **not** import the main `@joe-perks/stripe` package in client components — the barrel re-exports `server-only` modules (`client.ts`, `ratelimit.ts`, etc.) and will break `next build`.

```typescript
// ✅ Server component for data fetching
export default async function ProductGrid({ campaignId }: { campaignId: string }) {
  const items = await db.campaignItem.findMany({ where: { campaign_id: campaignId } })
  return <div>{items.map(item => <ProductCard key={item.id} item={item} />)}</div>
}

// ✅ Client component for cart interaction
'use client'
import { useCartStore } from '@joe-perks/ui'
import { calculateSplits } from '@joe-perks/stripe/splits'

export function CartDrawer({ splitPreviewDefaults }: { splitPreviewDefaults: SplitPreviewDefaults }) {
  const lines = useCartStore((s) => s.lines)
  // … compute subtotalCents from lines, then calculateSplits({ productSubtotalCents, shippingAmountCents, orgPct, … })
}

// ✅ Mobile-first: bottom sheet on mobile, side drawer on desktop (see `cart-drawer.tsx` + `useIsMobile`)
// Touch targets: min 44×44px on interactive controls
```

---

## Naming conventions

| Thing | Convention | Example |
|---|---|---|
| Database fields | snake_case | `roaster_id`, `org_pct_snapshot` |
| TypeScript variables | camelCase | `roasterId`, `orgPctSnapshot` |
| React components | PascalCase | `ProductCard`, `CartDrawer` |
| API routes | kebab-case directories | `create-intent/route.ts` |
| Inngest function IDs | kebab-case | `sla-check`, `payout-release`, `cart-cleanup` |
| Email templates | kebab-case | `order_confirmation`, `magic_link_fulfillment` |
| Prisma models | PascalCase | `RoasterApplication`, `OrderEvent` |
| Enums | SCREAMING_SNAKE_CASE | `PENDING_REVIEW`, `ROASTER_ADMIN` |

---

## File naming

```
packages/db/
├── prisma/schema.prisma # schema source of truth
├── index.ts            # export { database } — Prisma client
├── seed.ts             # PlatformSettings + OrderSequence seeding
├── order-number.ts     # generateOrderNumber()
└── log-event.ts        # logOrderEvent()

packages/stripe/
├── client.ts           # export { stripe } — singleton
├── splits.ts           # export { calculateSplits }
└── ratelimit.ts        # export { limitCheckout, limitRoasterApplication, limitOrgApplication, limitSlugValidation }

packages/email/        # npm: @joe-perks/email
├── send.ts             # export { sendEmail }
└── templates/
    ├── order-confirmation.tsx
    ├── order-shipped.tsx
    ├── order-delivered.tsx
    ├── magic-link-fulfillment.tsx
    ├── magic-link-org-approval.tsx
    ├── sla-reminder.tsx
    ├── sla-breach.tsx
    ├── roaster-application-received.tsx
    ├── roaster-approved.tsx
    ├── roaster-rejected.tsx
    ├── org-application-received.tsx
    └── org-approved.tsx
```

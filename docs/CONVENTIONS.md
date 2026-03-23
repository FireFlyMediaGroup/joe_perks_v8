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

```typescript
// ✅ Server component for data fetching
export default async function ProductGrid({ campaignId }: { campaignId: string }) {
  const items = await db.campaignItem.findMany({ where: { campaign_id: campaignId } })
  return <div>{items.map(item => <ProductCard key={item.id} item={item} />)}</div>
}

// ✅ Client component for cart interaction
'use client'
import { useCart } from '@joe-perks/ui'

export function AddToCartButton({ item }: { item: CampaignItem }) {
  const { addItem } = useCart()
  return <button onClick={() => addItem({ variant_id: item.variant_id, unit_price: item.retail_price, ... })}>
    Add to cart
  </button>
}

// ✅ Mobile-first: bottom sheet on mobile, side drawer on desktop
// Cart drawer: class="fixed bottom-0 md:right-0 md:top-0 md:bottom-auto"
// Touch targets: min-h-[44px] min-w-[44px] on all interactive elements
```

---

## Naming conventions

| Thing | Convention | Example |
|---|---|---|
| Database fields | snake_case | `roaster_id`, `org_pct_snapshot` |
| TypeScript variables | camelCase | `roasterId`, `orgPctSnapshot` |
| React components | PascalCase | `ProductCard`, `CartDrawer` |
| API routes | kebab-case directories | `create-intent/route.ts` |
| Inngest function IDs | kebab-case | `sla-check`, `payout-release` |
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
└── ratelimit.ts        # export { checkoutLimiter, onboardingLimiter }

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
    ├── org-application-received.tsx
    └── org-approved.tsx
```

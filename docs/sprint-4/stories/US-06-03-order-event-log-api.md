# US-06-03 -- Order Event Log Append-Only Writes and Query API

**Story ID:** US-06-03 | **Epic:** EP-06 (Payouts & Financials)
**Points:** 5 | **Priority:** High
**Status:** `Done`
**Owner:** Full-stack
**Dependencies:** US-01-02 (DB Foundation)
**Depends on this:** None (utility -- consumed by all Sprint 4 stories)

---

## Goal

Create the `logOrderEvent()` helper in `packages/db` (documented in `CONVENTIONS.md` but not yet implemented), export it from `@joe-perks/db`, and build an admin-facing API endpoint to query order events. The helper wraps `database.orderEvent.create` with standard fields and graceful error handling. The query API enables the admin order detail page (US-05-03) to display event timelines and supports future audit/debugging needs. Refactor existing direct `orderEvent.create` calls across the codebase to use the new helper.

---

## Diagram references

- **Database ERD:** [`docs/06-database-schema.mermaid`](../../06-database-schema.mermaid) -- `OrderEvent` model: `eventType`, `actorType`, `actorId`, `payload`, `ipAddress`, `createdAt` (immutable, append-only)
- **Order lifecycle:** [`docs/04-order-lifecycle.mermaid`](../../04-order-lifecycle.mermaid) -- OrderEvent created at multiple phases: Phase 2 (ORDER_CREATED), Phase 3 (FULFILLMENT_VIEWED, ORDER_SHIPPED), Phase 4 (ORDER_DELIVERED), Phase 5 (PAYOUT_TRANSFERRED)

---

## Current repo evidence

- **`packages/db/log-event.ts`** -- `logOrderEvent()` is implemented and exported from `@joe-perks/db`.
- **`apps/web/app/api/orders/[id]/events/route.ts`** -- `GET` endpoint returns chronological order events and requires admin Basic Auth.
- **Shared Basic Auth normalization** -- The events API now uses the same normalized credential parsing/verification behavior as `apps/admin` via `@joe-perks/types`.
- **Transactional callers** -- Checkout, webhook confirmation, and SLA auto-refund still use direct transactional `orderEvent.create` calls with inline comments explaining why.

---

## AGENTS.md rules that apply

- **OrderEvent:** Append-only -- never update or delete event rows. Only insert. `logOrderEvent()` handles errors gracefully (won't throw on failure).
- **Tenant isolation:** Admin queries may scope globally. The event query API should require admin auth.
- **Logging/PII:** Event payloads must not contain buyer email, address, or PII. Only IDs, tracking numbers, error codes.

**CONVENTIONS.md patterns:**
- `logOrderEvent()` documented signature: `(orderId, eventType, actorType, actorId?, payload?, ipAddress?)`
- Returns void, catches errors internally
- API routes: validate, business logic, `Response.json()`

---

## In scope

### logOrderEvent helper

- Create `packages/db/log-event.ts` with the `logOrderEvent()` function
- Signature matching CONVENTIONS.md:
  ```typescript
  export async function logOrderEvent(
    orderId: string,
    eventType: OrderEventType,
    actorType: ActorType,
    actorId?: string | null,
    payload?: Record<string, unknown> | null,
    ipAddress?: string | null,
  ): Promise<void>
  ```
- Wraps `database.orderEvent.create` with try/catch -- logs error but never throws
- Export from `packages/db/index.ts`

### Order events query API

- New route: `apps/web/app/api/orders/[id]/events/route.ts`
- `GET /api/orders/[id]/events` -- returns all events for an order, sorted by `createdAt` ascending
- Response shape: `{ events: Array<{ id, eventType, actorType, actorId, payload, ipAddress, createdAt }> }`
- Authentication: require admin auth header (same HTTP Basic pattern as admin app)
- Validate order exists before querying events

### Refactor existing callers

- Replace direct `database.orderEvent.create` calls with `logOrderEvent()` where appropriate
- Keep `$transaction` calls that include `orderEvent.create` as-is (they need the transactional guarantee) -- add a code comment noting the pattern
- Refactor standalone (non-transactional) `orderEvent.create` calls to use the helper

---

## Out of scope

- Event streaming or real-time updates (WebSocket)
- Buyer-facing event timeline
- Event filtering or search in the API
- Event aggregation or analytics
- Changing existing event types or payloads

---

## Primary files to create or modify

| Action | File | Purpose |
|--------|------|---------|
| Create | `packages/db/log-event.ts` | `logOrderEvent()` helper with graceful error handling |
| Modify | `packages/db/index.ts` | Export `logOrderEvent` |
| Create | `apps/web/app/api/orders/[id]/events/route.ts` | GET endpoint for order event query |
| Modify | `apps/web/lib/inngest/run-sla-check.tsx` | Refactor standalone `orderEvent.create` to use `logOrderEvent()` |

---

## Acceptance criteria

- [x] `logOrderEvent()` is exported from `@joe-perks/db`
- [x] `logOrderEvent()` creates an `OrderEvent` with the provided fields
- [x] `logOrderEvent()` never throws -- catches errors internally and logs them
- [x] `logOrderEvent()` accepts optional `actorId`, `payload`, and `ipAddress`
- [x] `GET /api/orders/[id]/events` returns all events for an order sorted by `createdAt` ascending
- [x] The events API requires admin authentication (HTTP Basic Auth)
- [x] The events API returns 404 if the order does not exist
- [x] Response includes `id`, `eventType`, `actorType`, `actorId`, `payload`, `ipAddress`, `createdAt` for each event
- [x] Standalone `orderEvent.create` calls in `run-sla-check.tsx` are refactored to use `logOrderEvent()`
- [x] Transactional `orderEvent.create` calls (webhook, checkout) retain `$transaction` pattern with a code comment
- [x] No PII in event payloads -- only IDs, codes, and tracking numbers

---

## Suggested implementation steps

1. Create `packages/db/log-event.ts`:
   ```typescript
   import type { ActorType, OrderEventType } from './generated/client'
   import { database } from './database'

   export async function logOrderEvent(
     orderId: string,
     eventType: OrderEventType,
     actorType: ActorType,
     actorId?: string | null,
     payload?: Record<string, unknown> | null,
     ipAddress?: string | null,
   ): Promise<void> {
     try {
       await database.orderEvent.create({
         data: {
           orderId,
           eventType,
           actorType,
           ...(actorId && { actorId }),
           ...(payload && { payload }),
           ...(ipAddress && { ipAddress }),
         },
       })
     } catch (error) {
       console.error('logOrderEvent failed', {
         order_id: orderId,
         event_type: eventType,
         error: error instanceof Error ? error.message : 'unknown',
       })
     }
   }
   ```
2. Add `export { logOrderEvent } from './log-event'` to `packages/db/index.ts`.
3. Create `apps/web/app/api/orders/[id]/events/route.ts`:
   - Validate admin auth via HTTP Basic (or shared admin auth helper)
   - Query `database.orderEvent.findMany({ where: { orderId }, orderBy: { createdAt: 'asc' } })`
   - Return JSON response
4. Refactor `run-sla-check.tsx`: replace standalone `database.orderEvent.create` calls with `logOrderEvent()`. Keep the transactional call in `trySlaAutoRefund` as-is.
5. Test: call `logOrderEvent()` directly, verify event created. Call API, verify response. Intentionally pass bad data, verify no throw.

---

## Handoff notes

- The helper is intentionally fire-and-forget (no throw). Callers should not depend on the return value or await for critical paths. For transactional event creation (e.g., inside `$transaction`), continue using `database.orderEvent.create` directly.
- The events query API is initially for admin use. The `EventTimeline` component in US-05-03 can call this API or query directly in a server component -- either approach works.
- Future stories (US-05-01, US-05-02, US-06-01) should use `logOrderEvent()` for new event creation where they are not inside a transaction.
- The `ActorType` and `OrderEventType` enums are generated by Prisma -- import from `@joe-perks/db` (re-exported via `export * from './generated/client'`).

---

## Revision log

| Version | Date | Notes |
|---------|------|-------|
| 0.1 | 2026-04-01 | Initial story created for Sprint 4 planning. |
| 0.2 | 2026-04-01 | Implemented on `main`; status `Done`. |
| 0.3 | 2026-04-01 | Review follow-up: events API and admin UI now share normalized Basic Auth handling. |

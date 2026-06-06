# Launch Observability Gap Analysis

**Status**: Findings, recommendations, and implementation plan.
**Last reviewed**: 2026-06-06.
**Scope**: Joe Perks v1 go-live observability across the storefront, roaster portal, org portal, admin portal, Stripe webhooks, Inngest jobs, production deploys, and launch rollback controls.

## Executive Summary

Joe Perks already has a solid error and money-path audit foundation: Sentry is wired across the apps, PII scrubbing exists, structured payment logs exist, and durable database audit tables record order, webhook, email, and admin lifecycle events.

The missing layer is workload observability: product and operational events that answer "what actually caused the load or failure?" rather than only "what threw an error?" For v1, the high-risk signals are not generic query invalidations or realtime reconnect storms yet. They are checkout behavior, Stripe webhook retry/dedupe behavior, order-status polling, Inngest job backlog/health, deployment/env drift, and production configuration mistakes.

## Current Findings

### Already Installed Or Implemented

- `@repo/observability` exists and includes Sentry setup, Sentry source-map config, Logtail/BetterStack logging, PII scrubbing, payment logging, and a BetterStack status component.
- Sentry server/client/edge initialization is wired through the apps with `beforeSend: scrubEvent` and `sendDefaultPii: false`.
- `packages/observability/scrub.ts` strips user identity, sensitive headers/cookies/body, stack-frame locals, breadcrumb data, and inline emails.
- `createPaymentLog()` emits canonical payment context keys: `order_id`, `order_number`, `org_id`, and `roaster_id`.
- The Stripe webhook route and payout release job use structured payment logs in the key money-path branches.
- Durable audit models exist in Prisma:
  - `OrderEvent`
  - `StripeEvent`
  - `EmailLog`
  - `AdminActionLog`
- `OrderEvent` already records important lifecycle changes including payment, fulfillment, payout, refund, dispute, and SLA events.
- `StripeEvent` provides webhook dedupe history.
- `EmailLog` provides transactional email dedupe history.
- `AdminActionLog` records platform actions for account lifecycle changes.
- `packages/analytics` installs PostHog, Vercel Analytics, and Google Analytics plumbing.
- `web` and `roaster` mount `AnalyticsProvider`.
- `apps/web/app/api/health/route.ts` provides a basic production health endpoint.
- Inngest jobs exist for `sla-check`, `payout-release`, and `cart-cleanup`.
- `.github/workflows/e2e.yml` provisions an ephemeral Neon branch and runs money-path Playwright tests.
- `.github/workflows/migrate-prod.yml` gives production migrations an audited manual gate.
- `docs/runbooks/observability-setup.md` already defines the BetterStack monitor, heartbeat, status page, log alert, and on-call setup.
- Incident communication templates exist in `docs/runbooks/`.

### Scaffolded But Not Yet Operational

- BetterStack uptime monitors are planned but not confirmed as created.
- BetterStack cron heartbeats are planned but not wired from the Inngest jobs.
- The BetterStack public status page is planned but not confirmed live.
- `Status` from `@repo/observability/status` exists but is not rendered in any footer or shell yet.
- The BetterStack log source token/env name still needs confirmation for the installed `@logtail/next` version.
- The webhook signature failure alert is planned but not confirmed in BetterStack.
- Sentry preview events still need an end-to-end seeded-error verification to prove scrubbing works outside unit tests.
- `admin` and `org` initialize Sentry but do not mount analytics providers.

### Missing Workload Telemetry

- No shared event taxonomy exists for product and ops observability.
- No standard correlation ID is propagated across browser actions, checkout route handlers, Stripe webhooks, Inngest jobs, and logs.
- PostHog is initialized, but there are no meaningful domain captures for:
  - checkout started
  - payment intent created
  - checkout failed
  - order status polled
  - webhook received
  - webhook deduped
  - fulfillment magic link viewed
  - order shipped
  - payout release attempted
  - payout failed
  - SLA warning/breach/critical
- Client workload signals are absent:
  - active tab vs background tab
  - online/offline transitions
  - order-status polling count
  - retry count and delay
  - checkout abandon/restore
- Query lifecycle telemetry is not applicable in the same way as T3 Chat because Joe Perks mostly uses Server Components, route handlers, and server actions rather than a client query cache. The equivalent risk is expensive server reads, `revalidatePath()` fan-out, polling, and repeated webhook/job processing.
- Operational config is not emitted as telemetry:
  - Vercel environment
  - deployment URL / deployment ID
  - git SHA
  - database profile/branch
  - checkout kill-switch state
  - Inngest app/env
  - Stripe mode
  - runtime/resource profile
- Deployment/resource drift is not actively detected. If production runs with the wrong env, resource profile, or integration mode, the observability layer may not flag it automatically.

## Recommendations

### 1. Keep Sentry As Error And Trace Backbone

Sentry should remain the primary error monitoring tool. Before go-live, verify all four app projects receive preview events and that seeded buyer PII is scrubbed in the real Sentry UI.

Required before go-live:

- Seed one controlled error in each app or at least `web` plus one portal.
- Include synthetic PII in the thrown context.
- Confirm the Sentry event contains no raw email, address, phone, cookie, auth header, Stripe signature, or token.
- Confirm source maps resolve readable stack traces in preview.

### 2. Finish BetterStack For Launch Operations

BetterStack should be the beta operational alerting surface because the repo already has a concrete setup plan.

Required before go-live:

- Create uptime monitors for the four production domains.
- Create monitors for the Stripe webhook route and Inngest route.
- Create cron heartbeats for `sla-check`, `payout-release`, and `cart-cleanup`.
- Wire each Inngest job to ping its heartbeat only after successful completion.
- Create the public status page.
- Mount the `Status` component on the storefront footer first.
- Create a log alert: webhook signature failures greater than zero in 10 minutes.
- Route monitor, heartbeat, and webhook-failure alerts to the launch on-call path.

### 3. Add A Safe Event Taxonomy

Create a small typed event layer rather than scattering direct `posthog.capture()` calls. It should emit to PostHog when configured and structured logs when useful.

Minimum event set:

- `checkout_started`
- `checkout_payment_intent_created`
- `checkout_order_created`
- `checkout_failed`
- `order_status_polled`
- `stripe_webhook_received`
- `stripe_webhook_signature_failed`
- `stripe_webhook_deduped`
- `stripe_webhook_processed`
- `fulfillment_link_viewed`
- `order_shipped`
- `inngest_job_started`
- `inngest_job_completed`
- `inngest_job_failed`
- `payout_release_attempted`
- `payout_release_failed`
- `sla_warning_recorded`
- `sla_breach_recorded`
- `deployment_observed`

Every event must be PII-safe. Prefer ids and operational state over emails, names, addresses, or request bodies.

### 4. Standardize Correlation Fields

Every event/log should carry the same safe fields when available:

- `correlation_id`
- `deployment_id`
- `git_sha`
- `vercel_env`
- `route`
- `event_name`
- `order_id`
- `order_number`
- `org_id`
- `roaster_id`
- `campaign_id`
- `stripe_pi_id`
- `stripe_event_id`
- `inngest_function_id`
- `client_state`
- `attempt`

Use a request header or generated UUID for browser/API correlation, then persist it through checkout metadata where safe. For Stripe-originated retries, `stripe_event_id`, `stripe_pi_id`, and `order_id` become the main correlation keys.

### 5. Observe Workload, Control Plane, And Recovery Together

Dashboards should not be generic. They should map directly to launch decisions.

Recommended launch dashboards:

- **Checkout Health**: checkout starts, payment intent creates, failures, order creates, conversion rate, failure reason.
- **Webhook Health**: received, signature failed, deduped, processed, handler failures, event type.
- **Background Jobs**: job start/end, duration, processed count, skipped count, failed count, missed heartbeat.
- **SLA And Payout Risk**: confirmed-unshipped backlog, SLA warnings/breaches/critical, payout eligible count, payout failed count.
- **Operational Profile**: deployment id, git SHA, Vercel env, Stripe mode, checkout kill-switch value, database profile, Inngest env.
- **Client Workload**: active/background tab state during checkout, order-status polling volume, retry attempts, online/offline state.

### 6. Treat Query Lifecycle Rules As Future-Proofing

The T3-style query invalidation rules become more important if Joe Perks later adds realtime dashboards, client-side query caches, background sync, or collaborative views. For v1, implement the analogous events around polling, server mutations, `revalidatePath()`, and job fan-out rather than building a generic query lifecycle system prematurely.

## Implementation Plan

### Phase 0: Go-Live Blockers

These should be completed before a true public beta.

- Finish Sentry preview verification with seeded scrubbed errors.
- Complete BetterStack monitors, status page, heartbeat setup, and on-call routing.
- Wire Inngest heartbeats on successful completion for `sla-check`, `payout-release`, and `cart-cleanup`.
- Confirm structured payment logs are arriving in the log backend with `order_number`, `order_id`, `org_id`, and `roaster_id`.
- Create the webhook signature failure alert.
- Mount the public `Status` pill on the storefront footer.

### Phase 1: Launch-Week Event Layer

These should ship before or during the first beta week.

- Add a typed `trackEvent()` helper in `@repo/analytics` or `@repo/observability`.
- Add a shared event-name union and safe common context type.
- Add server captures for checkout create-intent, Stripe webhook receive/process/dedupe, payout release, and SLA job events.
- Add client captures for checkout start/failure, order-status polling, active/background tab state, and online/offline transitions.
- Mount analytics in `admin` and `org`, or explicitly document why those portals are excluded from product analytics.
- Add correlation id propagation for checkout and order-status flows.

### Phase 2: Operational Drift Detection

These can follow immediately after launch if the beta is small and monitored manually.

- Emit `deployment_observed` on app boot or first request per deployment.
- Include Vercel env, deployment URL/id, git SHA, database profile, Stripe mode, Inngest env, and checkout kill-switch state.
- Add a dashboard row that compares expected vs observed production config.
- Add an alert when production sees missing critical env, test-mode Stripe keys, or checkout disabled unexpectedly.

### Phase 3: Deeper Workload Intelligence

These are future-facing and should wait until there is enough traffic to justify them.

- Instrument server action durations and high-risk `revalidatePath()` call sites.
- Track admin queue sizes and age by workflow.
- Track campaign/storefront traffic bursts per org and roaster.
- Track retry/backoff effectiveness if realtime or polling-heavy features expand.
- Add rate-of-change alerts for webhook bursts, order-status polling bursts, payout failures, and SLA backlog growth.

## Go-Live Review Checklist

Before go-live, answer these questions:

- Can we see whether checkout broke before users report it?
- Can we see whether Stripe is retrying or deduping a webhook storm?
- Can we see whether `payout-release` missed a run?
- Can we see whether SLA backlog is growing faster than roasters are fulfilling?
- Can we prove Sentry is not leaking buyer PII?
- Can we prove production is running the expected deployment, env, Stripe mode, and database profile?
- Can the launch owner open one dashboard and decide whether to freeze checkout, contact pilots, retry jobs, roll back, or keep going?

If the answer to any of these is no, the observability layer is not launch-ready.

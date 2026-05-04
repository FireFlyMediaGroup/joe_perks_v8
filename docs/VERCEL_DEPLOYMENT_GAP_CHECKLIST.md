# Vercel Deployment Gap Checklist

## Purpose
This document tracks what is already configured in Vercel for Joe Perks and what is still missing before preview and production deploys are fully operational.

Use this as the working checklist while completing setup.

## Current Status Snapshot
Status as of `2026-04-04`.

### Already done
- [x] Vercel team exists: `fireflymediagroups-projects`
- [x] Vercel projects created:
  - [x] `joe-perks-web`
  - [x] `joe-perks-roaster`
  - [x] `joe-perks-org`
  - [x] `joe-perks-admin`
- [x] GitHub repo connected to all four Vercel projects
- [x] Project settings patched for all four apps:
  - [x] correct root directory
  - [x] `nextjs` framework
  - [x] `pnpm install`
  - [x] app-specific Turbo build command
  - [x] production branch set to `main`
- [x] Remote `develop` branch created for preview/stage workflow
- [x] Production domains attached in Vercel:
  - [x] `joeperks.com`
  - [x] `www.joeperks.com`
  - [x] `roasters.joeperks.com`
  - [x] `orgs.joeperks.com`
  - [x] `admin.joeperks.com`
- [x] Preview envs uploaded to all four Vercel projects
- [x] Bulk env sync script added: `pnpm vercel:env:sync`

### Still missing overall
- [ ] DNS records added at the domain registrar
- [x] Missing preview env vars filled in
- [ ] All required production env vars uploaded
- [ ] Stage branch domains configured for `develop` if desired
- [ ] Stripe endpoints registered for preview and production
- [ ] Clerk webhooks registered for preview and production
- [ ] Inngest synced for preview and production
- [ ] First successful preview deploy verified
- [ ] First successful production deploy verified

## DNS Checklist
These domains are attached in Vercel but are not yet verified because DNS still points at GoDaddy nameservers.

- [ ] Add `A joeperks.com 76.76.21.21`
- [ ] Add `A www.joeperks.com 76.76.21.21`
- [ ] Add `A roasters.joeperks.com 76.76.21.21`
- [ ] Add `A orgs.joeperks.com 76.76.21.21`
- [ ] Add `A admin.joeperks.com 76.76.21.21`
- [ ] Wait for Vercel domain verification
- [ ] Confirm certificates are issued for all five production domains

Optional stage branch domains for `develop`:

- [ ] `staging.joeperks.com`
- [ ] `staging-roasters.joeperks.com`
- [ ] `staging-orgs.joeperks.com`
- [ ] `staging-admin.joeperks.com`

## Preview Deploy Checklist

### `joe-perks-web` preview
Already present:

- [x] `DATABASE_URL`
- [x] `STRIPE_SECRET_KEY`
- [x] `STRIPE_WEBHOOK_SECRET`
- [x] `RESEND_TOKEN`
- [x] `RESEND_FROM`
- [x] `INNGEST_SIGNING_KEY`
- [x] `INNGEST_EVENT_KEY`
- [x] `UPSTASH_REDIS_REST_URL`
- [x] `UPSTASH_REDIS_REST_TOKEN`
- [x] `SENTRY_AUTH_TOKEN`
- [x] `NEXT_PUBLIC_APP_URL`
- [x] `NEXT_PUBLIC_WEB_URL`
- [x] `NEXT_PUBLIC_API_URL`
- [x] `NEXT_PUBLIC_DOCS_URL`
- [x] `NEXT_PUBLIC_POSTHOG_HOST`
- [x] `ROASTER_APP_ORIGIN`

Still missing:

- [x] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- [x] `NEXT_PUBLIC_POSTHOG_KEY`
- [x] `NEXT_PUBLIC_SENTRY_DSN`
- [x] `PLATFORM_ALERT_EMAIL`

### `joe-perks-roaster` preview
Already present:

- [x] `DATABASE_URL`
- [x] `STRIPE_SECRET_KEY`
- [x] `STRIPE_WEBHOOK_SECRET`
- [x] `RESEND_TOKEN`
- [x] `RESEND_FROM`
- [x] `SENTRY_AUTH_TOKEN`
- [x] `NEXT_PUBLIC_APP_URL`
- [x] `NEXT_PUBLIC_WEB_URL`
- [x] `NEXT_PUBLIC_DOCS_URL`
- [x] `ROASTER_APP_ORIGIN`
- [x] `ORG_APP_ORIGIN`

Still missing:

- [x] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- [x] `CLERK_SECRET_KEY`
- [x] `CLERK_WEBHOOK_SECRET`
- [x] `NEXT_PUBLIC_CLERK_SIGN_IN_URL`
- [x] `NEXT_PUBLIC_CLERK_SIGN_UP_URL`
- [x] `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL`
- [x] `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL`
- [x] `NEXT_PUBLIC_SENTRY_DSN`
- [ ] `UPLOADTHING_TOKEN` if preview uploads should work

### `joe-perks-org` preview
Already present:

- [x] `DATABASE_URL`
- [x] `STRIPE_SECRET_KEY`
- [x] `SENTRY_AUTH_TOKEN`
- [x] `NEXT_PUBLIC_APP_URL`
- [x] `NEXT_PUBLIC_WEB_URL`
- [x] `NEXT_PUBLIC_DOCS_URL`
- [x] `ORG_APP_ORIGIN`

Still missing:

- [x] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- [x] `CLERK_SECRET_KEY`
- [x] `CLERK_WEBHOOK_SECRET`
- [x] `NEXT_PUBLIC_CLERK_SIGN_IN_URL`
- [x] `NEXT_PUBLIC_CLERK_SIGN_UP_URL`
- [x] `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL`
- [x] `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL`
- [x] `NEXT_PUBLIC_SENTRY_DSN`

### `joe-perks-admin` preview
Already present:

- [x] `DATABASE_URL`
- [x] `STRIPE_SECRET_KEY`
- [x] `RESEND_TOKEN`
- [x] `RESEND_FROM`
- [x] `SENTRY_AUTH_TOKEN`
- [x] `ROASTER_APP_ORIGIN`
- [x] `ORG_APP_ORIGIN`

Still missing:

- [x] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- [x] `CLERK_SECRET_KEY`
- [x] `NEXT_PUBLIC_CLERK_SIGN_IN_URL`
- [x] `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL`
- [x] `NEXT_PUBLIC_SENTRY_DSN`

## Production Deploy Checklist
Current state: production envs are empty for all four projects.

### `joe-perks-web` production
- [ ] `DATABASE_URL`
- [ ] `STRIPE_SECRET_KEY`
- [ ] `STRIPE_WEBHOOK_SECRET`
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- [ ] `RESEND_TOKEN`
- [ ] `RESEND_FROM`
- [ ] `INNGEST_SIGNING_KEY`
- [ ] `INNGEST_EVENT_KEY`
- [ ] `UPSTASH_REDIS_REST_URL`
- [ ] `UPSTASH_REDIS_REST_TOKEN`
- [ ] `SENTRY_AUTH_TOKEN`
- [ ] `NEXT_PUBLIC_POSTHOG_KEY`
- [ ] `NEXT_PUBLIC_POSTHOG_HOST`
- [ ] `NEXT_PUBLIC_SENTRY_DSN`
- [ ] `NEXT_PUBLIC_APP_URL`
- [ ] `NEXT_PUBLIC_WEB_URL`
- [ ] `NEXT_PUBLIC_API_URL`
- [ ] `NEXT_PUBLIC_DOCS_URL`
- [ ] `PLATFORM_ALERT_EMAIL`
- [ ] `ROASTER_APP_ORIGIN`

### `joe-perks-roaster` production
- [ ] `DATABASE_URL`
- [ ] `STRIPE_SECRET_KEY`
- [ ] `STRIPE_WEBHOOK_SECRET`
- [ ] `RESEND_TOKEN`
- [ ] `RESEND_FROM`
- [ ] `SENTRY_AUTH_TOKEN`
- [ ] `NEXT_PUBLIC_SENTRY_DSN`
- [ ] `NEXT_PUBLIC_APP_URL`
- [ ] `NEXT_PUBLIC_WEB_URL`
- [ ] `NEXT_PUBLIC_DOCS_URL`
- [ ] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- [ ] `CLERK_SECRET_KEY`
- [ ] `CLERK_WEBHOOK_SECRET`
- [ ] `NEXT_PUBLIC_CLERK_SIGN_IN_URL`
- [ ] `NEXT_PUBLIC_CLERK_SIGN_UP_URL`
- [ ] `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL`
- [ ] `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL`
- [ ] `ROASTER_APP_ORIGIN`
- [ ] `ORG_APP_ORIGIN`
- [ ] `UPLOADTHING_TOKEN` if production uploads should work

### `joe-perks-org` production
- [ ] `DATABASE_URL`
- [ ] `STRIPE_SECRET_KEY`
- [ ] `SENTRY_AUTH_TOKEN`
- [ ] `NEXT_PUBLIC_SENTRY_DSN`
- [ ] `NEXT_PUBLIC_APP_URL`
- [ ] `NEXT_PUBLIC_WEB_URL`
- [ ] `NEXT_PUBLIC_DOCS_URL`
- [ ] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- [ ] `CLERK_SECRET_KEY`
- [ ] `CLERK_WEBHOOK_SECRET`
- [ ] `NEXT_PUBLIC_CLERK_SIGN_IN_URL`
- [ ] `NEXT_PUBLIC_CLERK_SIGN_UP_URL`
- [ ] `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL`
- [ ] `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL`
- [ ] `ORG_APP_ORIGIN`

### `joe-perks-admin` production
- [ ] `DATABASE_URL`
- [ ] `STRIPE_SECRET_KEY`
- [ ] `RESEND_TOKEN`
- [ ] `RESEND_FROM`
- [ ] `SENTRY_AUTH_TOKEN`
- [ ] `NEXT_PUBLIC_SENTRY_DSN`
- [ ] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- [ ] `CLERK_SECRET_KEY`
- [ ] `CLERK_WEBHOOK_SECRET`
- [ ] `NEXT_PUBLIC_CLERK_SIGN_IN_URL`
- [ ] `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL`
- [ ] `ROASTER_APP_ORIGIN`
- [ ] `ORG_APP_ORIGIN`

## Integration Checklist

### Stripe
- [ ] Preview webhook endpoint created and secret stored in `joe-perks-web`
- [ ] Production webhook endpoint created and secret stored in `joe-perks-web`
- [ ] Preview checkout uses test publishable key
- [ ] Production checkout uses live publishable key

### Clerk
- [ ] Preview roaster Clerk webhook points to stage URL
- [ ] Preview org Clerk webhook points to stage URL
- [ ] Production roaster Clerk webhook points to `roasters.joeperks.com`
- [ ] Production org Clerk webhook points to `orgs.joeperks.com`
- [ ] Matching `CLERK_WEBHOOK_SECRET` values stored in the correct Vercel projects

### Inngest
- [ ] Preview Inngest app URL synced
- [ ] Production Inngest app URL synced
- [ ] `sla-check` visible
- [ ] `payout-release` visible
- [ ] `cart-cleanup` visible

## Verification Checklist

### Preview
- [ ] `web` preview deploy succeeds
- [ ] `roaster` preview deploy succeeds
- [ ] `org` preview deploy succeeds
- [ ] `admin` preview deploy succeeds
- [ ] Preview sign-in and admin auth flows work
- [ ] Preview Stripe webhook route returns expected error on invalid signature
- [ ] Preview Inngest route responds

### Production
- [ ] Production DB migrations applied
- [ ] Production deploy succeeds for all four apps
- [ ] Production domains resolve correctly
- [ ] Production Stripe webhook delivery succeeds
- [ ] Production Inngest sync succeeds

## Working Order
Recommended order to complete this checklist:

1. Fill the remaining preview env vars
2. Upload preview envs
3. Add DNS records and wait for verification
4. Register preview Stripe, Clerk, and Inngest endpoints
5. Verify preview deploys
6. Build the production env files
7. Upload production envs
8. Register production Stripe, Clerk, and Inngest endpoints
9. Verify production deploys

## Command Reference
Dry-run preview sync:

```bash
pnpm vercel:env:sync --env preview
```

Apply preview sync:

```bash
pnpm vercel:env:sync --env preview --apply
```

Dry-run production sync:

```bash
pnpm vercel:env:sync --env production
```

Apply production sync:

```bash
pnpm vercel:env:sync --env production --apply
```

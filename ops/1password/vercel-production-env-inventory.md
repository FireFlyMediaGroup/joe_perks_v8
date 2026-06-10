# Joe Perks Vercel Production Env Inventory

Generated from the Vercel production env names for:

- `joe-perks-web`
- `joe-perks-roaster`
- `joe-perks-org`
- `joe-perks-admin`

This file intentionally lists variable names and intended 1Password destinations only.
Do not paste secret values into this document.

## 1Password Items To Create

- `Neon production`
- `Origins production`
- `Clerk roaster production`
- `Clerk org production`
- `Clerk admin production`
- `Stripe production`
- `Resend production`
- `Inngest production`
- `Upstash Redis production`
- `PostHog production`
- `Sentry production`
- `Arcjet production`
- `App secrets production`
- `Ops production`
- `UploadThing production`

## Web Project

Vercel project: `joe-perks-web`

| Vercel variable | 1Password item | 1Password field | Required | Currently in Vercel |
| --- | --- | --- | --- | --- |
| `DATABASE_URL` | `Neon production` | `DATABASE_URL` | Yes | Yes |
| `NEXT_PUBLIC_APP_URL` | `Origins production` | `WEB_NEXT_PUBLIC_APP_URL` | Yes | Yes |
| `NEXT_PUBLIC_WEB_URL` | `Origins production` | `NEXT_PUBLIC_WEB_URL` | Yes | Yes |
| `NEXT_PUBLIC_API_URL` | `Origins production` | `NEXT_PUBLIC_API_URL` | Yes | Yes |
| `NEXT_PUBLIC_DOCS_URL` | `Origins production` | `NEXT_PUBLIC_DOCS_URL` | Yes | Yes |
| `ROASTER_APP_ORIGIN` | `Origins production` | `ROASTER_APP_ORIGIN` | Yes | Yes |
| `STRIPE_SECRET_KEY` | `Stripe production` | `STRIPE_SECRET_KEY` | Yes | No |
| `STRIPE_WEBHOOK_SECRET` | `Stripe production` | `STRIPE_WEBHOOK_SECRET` | Yes | No |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `Stripe production` | `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Yes | No |
| `RESEND_TOKEN` | `Resend production` | `RESEND_TOKEN` | Yes | No |
| `RESEND_FROM` | `Resend production` | `RESEND_FROM` | Yes | No |
| `INNGEST_SIGNING_KEY` | `Inngest production` | `INNGEST_SIGNING_KEY` | Yes | No |
| `INNGEST_EVENT_KEY` | `Inngest production` | `INNGEST_EVENT_KEY` | Yes | No |
| `UPSTASH_REDIS_REST_URL` | `Upstash Redis production` | `UPSTASH_REDIS_REST_URL` | Yes | No |
| `UPSTASH_REDIS_REST_TOKEN` | `Upstash Redis production` | `UPSTASH_REDIS_REST_TOKEN` | Yes | No |
| `NEXT_PUBLIC_POSTHOG_KEY` | `PostHog production` | `NEXT_PUBLIC_POSTHOG_KEY` | Yes | No |
| `NEXT_PUBLIC_POSTHOG_HOST` | `PostHog production` | `NEXT_PUBLIC_POSTHOG_HOST` | Yes | Yes |
| `SENTRY_AUTH_TOKEN` | `Sentry production` | `SENTRY_AUTH_TOKEN` | Yes | Yes |
| `SENTRY_ORG` | `Sentry production` | `SENTRY_ORG` | Yes | No |
| `SENTRY_PROJECT` | `Sentry production` | `WEB_SENTRY_PROJECT` | Yes | No |
| `NEXT_PUBLIC_SENTRY_DSN` | `Sentry production` | `WEB_NEXT_PUBLIC_SENTRY_DSN` | Yes | No |
| `ARCJET_KEY` | `Arcjet production` | `ARCJET_KEY` | Yes | Yes |
| `SESSION_SECRET` | `App secrets production` | `WEB_SESSION_SECRET` | Yes | Yes |
| `FLAGS_SECRET` | `App secrets production` | `FLAGS_SECRET` | Optional | No |
| `PLATFORM_ALERT_EMAIL` | `Ops production` | `PLATFORM_ALERT_EMAIL` | Yes | No |

## Roaster Project

Vercel project: `joe-perks-roaster`

| Vercel variable | 1Password item | 1Password field | Required | Currently in Vercel |
| --- | --- | --- | --- | --- |
| `DATABASE_URL` | `Neon production` | `DATABASE_URL` | Yes | Yes |
| `NEXT_PUBLIC_APP_URL` | `Origins production` | `ROASTER_NEXT_PUBLIC_APP_URL` | Yes | Yes |
| `NEXT_PUBLIC_WEB_URL` | `Origins production` | `NEXT_PUBLIC_WEB_URL` | Yes | Yes |
| `NEXT_PUBLIC_DOCS_URL` | `Origins production` | `NEXT_PUBLIC_DOCS_URL` | Yes | Yes |
| `ROASTER_APP_ORIGIN` | `Origins production` | `ROASTER_APP_ORIGIN` | Yes | Yes |
| `ORG_APP_ORIGIN` | `Origins production` | `ORG_APP_ORIGIN` | Yes | Yes |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `Clerk roaster production` | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | Yes |
| `CLERK_SECRET_KEY` | `Clerk roaster production` | `CLERK_SECRET_KEY` | Yes | Yes |
| `CLERK_WEBHOOK_SECRET` | `Clerk roaster production` | `CLERK_WEBHOOK_SECRET` | Yes | Yes |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `Clerk roaster production` | `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Yes | Yes |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | `Clerk roaster production` | `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Yes | Yes |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | `Clerk roaster production` | `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | Yes | Yes |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | `Clerk roaster production` | `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | Yes | Yes |
| `STRIPE_SECRET_KEY` | `Stripe production` | `STRIPE_SECRET_KEY` | Yes | No |
| `RESEND_TOKEN` | `Resend production` | `RESEND_TOKEN` | Yes | No |
| `RESEND_FROM` | `Resend production` | `RESEND_FROM` | Yes | No |
| `SENTRY_AUTH_TOKEN` | `Sentry production` | `SENTRY_AUTH_TOKEN` | Yes | Yes |
| `SENTRY_ORG` | `Sentry production` | `SENTRY_ORG` | Yes | No |
| `SENTRY_PROJECT` | `Sentry production` | `ROASTER_SENTRY_PROJECT` | Yes | No |
| `NEXT_PUBLIC_SENTRY_DSN` | `Sentry production` | `ROASTER_NEXT_PUBLIC_SENTRY_DSN` | Yes | No |
| `ARCJET_KEY` | `Arcjet production` | `ARCJET_KEY` | Yes | No |
| `FLAGS_SECRET` | `App secrets production` | `FLAGS_SECRET` | Optional | No |
| `UPLOADTHING_TOKEN` | `UploadThing production` | `UPLOADTHING_TOKEN` | Optional | No |

## Org Project

Vercel project: `joe-perks-org`

| Vercel variable | 1Password item | 1Password field | Required | Currently in Vercel |
| --- | --- | --- | --- | --- |
| `DATABASE_URL` | `Neon production` | `DATABASE_URL` | Yes | Yes |
| `NEXT_PUBLIC_APP_URL` | `Origins production` | `ORG_NEXT_PUBLIC_APP_URL` | Yes | Yes |
| `NEXT_PUBLIC_WEB_URL` | `Origins production` | `NEXT_PUBLIC_WEB_URL` | Yes | Yes |
| `NEXT_PUBLIC_DOCS_URL` | `Origins production` | `NEXT_PUBLIC_DOCS_URL` | Yes | Yes |
| `ORG_APP_ORIGIN` | `Origins production` | `ORG_APP_ORIGIN` | Yes | Yes |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `Clerk org production` | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | Yes |
| `CLERK_SECRET_KEY` | `Clerk org production` | `CLERK_SECRET_KEY` | Yes | Yes |
| `CLERK_WEBHOOK_SECRET` | `Clerk org production` | `CLERK_WEBHOOK_SECRET` | Yes | Yes |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `Clerk org production` | `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Yes | Yes |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | `Clerk org production` | `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Yes | Yes |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | `Clerk org production` | `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | Yes | Yes |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | `Clerk org production` | `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | Yes | Yes |
| `STRIPE_SECRET_KEY` | `Stripe production` | `STRIPE_SECRET_KEY` | Yes | No |
| `SENTRY_AUTH_TOKEN` | `Sentry production` | `SENTRY_AUTH_TOKEN` | Yes | Yes |
| `SENTRY_ORG` | `Sentry production` | `SENTRY_ORG` | Yes | No |
| `SENTRY_PROJECT` | `Sentry production` | `ORG_SENTRY_PROJECT` | Yes | No |
| `NEXT_PUBLIC_SENTRY_DSN` | `Sentry production` | `ORG_NEXT_PUBLIC_SENTRY_DSN` | Yes | No |
| `ARCJET_KEY` | `Arcjet production` | `ARCJET_KEY` | Yes | No |

## Admin Project

Vercel project: `joe-perks-admin`

| Vercel variable | 1Password item | 1Password field | Required | Currently in Vercel |
| --- | --- | --- | --- | --- |
| `DATABASE_URL` | `Neon production` | `DATABASE_URL` | Yes | Yes |
| `ROASTER_APP_ORIGIN` | `Origins production` | `ROASTER_APP_ORIGIN` | Yes | Yes |
| `ORG_APP_ORIGIN` | `Origins production` | `ORG_APP_ORIGIN` | Yes | Yes |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `Clerk admin production` | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | Yes |
| `CLERK_SECRET_KEY` | `Clerk admin production` | `CLERK_SECRET_KEY` | Yes | Yes |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `Clerk admin production` | `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Yes | Yes |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | `Clerk admin production` | `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | Yes | Yes |
| `STRIPE_SECRET_KEY` | `Stripe production` | `STRIPE_SECRET_KEY` | Yes | No |
| `RESEND_TOKEN` | `Resend production` | `RESEND_TOKEN` | Yes | No |
| `RESEND_FROM` | `Resend production` | `RESEND_FROM` | Yes | No |
| `SENTRY_AUTH_TOKEN` | `Sentry production` | `SENTRY_AUTH_TOKEN` | Yes | Yes |
| `SENTRY_ORG` | `Sentry production` | `SENTRY_ORG` | Yes | No |
| `SENTRY_PROJECT` | `Sentry production` | `ADMIN_SENTRY_PROJECT` | Yes | No |
| `NEXT_PUBLIC_SENTRY_DSN` | `Sentry production` | `ADMIN_NEXT_PUBLIC_SENTRY_DSN` | Yes | No |
| `ARCJET_KEY` | `Arcjet production` | `ARCJET_KEY` | Yes | No |
| `CLERK_WEBHOOK_SECRET` | `Clerk admin production` | `CLERK_WEBHOOK_SECRET` | Optional | No |

## Vercel-Only Variables Not In The Manifest

These are present in Vercel production but are not currently represented in
`ops/1password/vercel-production-envs.json`.

| Vercel project | Vercel variable | Suggested 1Password item | Suggested field |
| --- | --- | --- | --- |
| `joe-perks-admin` | `ADMIN_EMAIL` | `Ops production` | `ADMIN_EMAIL` |
| `joe-perks-admin` | `ADMIN_PASSWORD` | `Ops production` | `ADMIN_PASSWORD` |

## Summary

- Manifest entries: 83 project-variable mappings.
- Vercel-only entries: 2 project-variable mappings.
- Optional manifest entries: `FLAGS_SECRET`, `UPLOADTHING_TOKEN`, `CLERK_WEBHOOK_SECRET` for admin.

After filling 1Password, validate without writing env files:

```bash
pnpm vercel:env:render:production -- --check-only
```


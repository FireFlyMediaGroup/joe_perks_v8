# Joe Perks Production Missing Values Checklist

Use this sheet to fill the missing production values in the `Joe Perks Production`
1Password vault.

Source: `.vercel/env/1password-production-values.local.md`, section
`Not Present In Current Vercel Pull`.

Instructions:

- Create or open the 1Password item named in each section.
- Add a field with the exact field name shown.
- Fill the value in the blank space before entering it into 1Password.
- Optional fields may be left blank if the integration is not enabled.
- Some fields are used by multiple Vercel projects; fill them once in 1Password.

## Arcjet Production

- [ ] Field: `ARCJET_KEY`
  - Needed by: `joe-perks-admin`, `joe-perks-org`, `joe-perks-roaster`
  - Value:

    ________________________________________________________________

    ________________________________________________________________

## App Secrets Production

- [ ] Field: `FLAGS_SECRET` optional
  - Needed by: `joe-perks-roaster`, `joe-perks-web`
  - Value:

    ________________________________________________________________

    ________________________________________________________________

## Clerk Admin Production

- [ ] Field: `CLERK_WEBHOOK_SECRET` optional
  - Needed by: `joe-perks-admin`
  - Value:

    ________________________________________________________________

    ________________________________________________________________

## Inngest Production

- [ ] Field: `INNGEST_EVENT_KEY`
  - Needed by: `joe-perks-web`
  - Value:

    ________________________________________________________________

    ________________________________________________________________

- [ ] Field: `INNGEST_SIGNING_KEY`
  - Needed by: `joe-perks-web`
  - Value:

    ________________________________________________________________

    ________________________________________________________________

## Ops Production

- [ ] Field: `PLATFORM_ALERT_EMAIL`
  - Needed by: `joe-perks-web`
  - Value:

    ________________________________________________________________

    ________________________________________________________________

## PostHog Production

- [ ] Field: `NEXT_PUBLIC_POSTHOG_KEY`
  - Needed by: `joe-perks-web`
  - Value:

    ________________________________________________________________

    ________________________________________________________________

## Resend Production

- [ ] Field: `RESEND_FROM`
  - Needed by: `joe-perks-admin`, `joe-perks-roaster`, `joe-perks-web`
  - Value:

    ________________________________________________________________

    ________________________________________________________________

- [ ] Field: `RESEND_TOKEN`
  - Needed by: `joe-perks-admin`, `joe-perks-roaster`, `joe-perks-web`
  - Value:

    ________________________________________________________________

    ________________________________________________________________

## Sentry Production

- [ ] Field: `ADMIN_NEXT_PUBLIC_SENTRY_DSN`
  - Needed by: `joe-perks-admin`
  - Value:

    ________________________________________________________________

    ________________________________________________________________

- [ ] Field: `ADMIN_SENTRY_PROJECT`
  - Needed by: `joe-perks-admin`
  - Value:

    ________________________________________________________________

    ________________________________________________________________

- [ ] Field: `ORG_NEXT_PUBLIC_SENTRY_DSN`
  - Needed by: `joe-perks-org`
  - Value:

    ________________________________________________________________

    ________________________________________________________________

- [ ] Field: `ORG_SENTRY_PROJECT`
  - Needed by: `joe-perks-org`
  - Value:

    ________________________________________________________________

    ________________________________________________________________

- [ ] Field: `ROASTER_NEXT_PUBLIC_SENTRY_DSN`
  - Needed by: `joe-perks-roaster`
  - Value:

    ________________________________________________________________

    ________________________________________________________________

- [ ] Field: `ROASTER_SENTRY_PROJECT`
  - Needed by: `joe-perks-roaster`
  - Value:

    ________________________________________________________________

    ________________________________________________________________

- [ ] Field: `SENTRY_ORG`
  - Needed by: `joe-perks-admin`, `joe-perks-org`, `joe-perks-roaster`, `joe-perks-web`
  - Value:

    ________________________________________________________________

    ________________________________________________________________

- [ ] Field: `WEB_NEXT_PUBLIC_SENTRY_DSN`
  - Needed by: `joe-perks-web`
  - Value:

    ________________________________________________________________

    ________________________________________________________________

- [ ] Field: `WEB_SENTRY_PROJECT`
  - Needed by: `joe-perks-web`
  - Value:

    ________________________________________________________________

    ________________________________________________________________

## Stripe Production

- [ ] Field: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
  - Needed by: `joe-perks-web`
  - Value:

    ________________________________________________________________

    ________________________________________________________________

- [ ] Field: `STRIPE_SECRET_KEY`
  - Needed by: `joe-perks-admin`, `joe-perks-org`, `joe-perks-roaster`, `joe-perks-web`
  - Value:

    ________________________________________________________________

    ________________________________________________________________

- [ ] Field: `STRIPE_WEBHOOK_SECRET`
  - Needed by: `joe-perks-web`
  - Value:

    ________________________________________________________________

    ________________________________________________________________

## UploadThing Production

- [ ] Field: `UPLOADTHING_TOKEN` optional
  - Needed by: `joe-perks-roaster`
  - Value:

    ________________________________________________________________

    ________________________________________________________________

## Upstash Redis Production

- [ ] Field: `UPSTASH_REDIS_REST_TOKEN`
  - Needed by: `joe-perks-web`
  - Value:

    ________________________________________________________________

    ________________________________________________________________

- [ ] Field: `UPSTASH_REDIS_REST_URL`
  - Needed by: `joe-perks-web`
  - Value:

    ________________________________________________________________

    ________________________________________________________________


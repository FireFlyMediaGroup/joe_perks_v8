# 1Password -> Vercel Production Env Sync

Production Vercel env values are sourced from the `Joe Perks Production` 1Password vault.

## Items

Fill these items in 1Password before rendering:

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
- `UploadThing production` (optional for `UPLOADTHING_TOKEN`)

Leave unavailable optional fields as `__SET_ME__`; the renderer skips optional placeholders.
Required fields must be real production values before any `.vercel/env/*.production.env`
file is written.

Clerk has three separate production apps. The roaster, org, and admin publishable keys
should all be `pk_live_...` values and should differ from each other.

## Commands

```bash
# Validate all required 1Password fields without writing files.
pnpm vercel:env:render:production -- --check-only

# Render gitignored .vercel/env/*.production.env files from 1Password.
pnpm vercel:env:render:production

# Dry-run the Vercel upload by project/key name only.
pnpm vercel:env:sync -- --env production

# Apply the production env upsert.
pnpm vercel:env:sync -- --env production --apply
```

The sync script uses Vercel `upsert=true`, so it updates or creates listed variables without
removing unrelated variables.

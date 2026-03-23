## Story

Closes #[story-id]

## What changed

## Acceptance criteria

- [ ] AC1:
- [ ] AC2:

## Testing

- [ ] Tested locally against dev DB
- [ ] Deployed to preview and smoke-tested

## Security checklist

- [ ] No PII logged in checkout or webhook routes
- [ ] All money values are integers in cents
- [ ] Tenant scoping on all DB queries (from session, not request body)
- [ ] No direct Stripe imports in app code (use @joe-perks/stripe)
- [ ] No direct Resend calls (use sendEmail() from @joe-perks/email)

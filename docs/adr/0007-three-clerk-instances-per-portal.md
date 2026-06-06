# Three Clerk instances — one per portal

We run **three separate Clerk applications**, one for each authenticated portal —
`apps/roaster`, `apps/org`, and `apps/admin` — rather than a single shared Clerk app with
roles. Each has its own publishable/secret keys, its own webhook endpoint, and (in
production) its own DNS-verified instance. This isolates the user pools so a Roaster, Org, or
Platform admin authenticates only against its own portal's instance, keeps the high-privilege
Platform admin pool fully separate from tenant users, and lets each portal evolve its auth
config (OAuth providers, session/JWT settings, sign-up policy) independently.

The cost we accept: three production instances to provision and three sets of DNS records
(CNAMEs + DKIM under `roasters.`, `orgs.`, `admin.`) at cutover — and no built-in single
sign-on across portals (rare in practice, since these are distinct audiences). A Clerk
**production** instance is also a brand-new instance: users, webhooks, and settings do not
carry over from dev, so the prod cutover is a fresh setup per instance, not a key swap.

## Status

accepted

## Consequences

- Cutover provisions three instances; see [`../runbooks/sandbox-to-production-cutover.md`](../runbooks/sandbox-to-production-cutover.md) §3 and the DNS table §1.
- Sanity check that the three are genuinely distinct apps: their three publishable keys differ.
- The deployment topology diagram's older "Clerk — 2 apps" note is superseded by this (admin gained its own instance).

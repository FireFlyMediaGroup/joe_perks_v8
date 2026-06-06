# Incident comms — Full outage

**Use when:** the app is down or unusable for most users — storefront/portals returning errors or not loading, or a bad deploy / DB outage. If only payments/checkout are broken but the rest works, use [`payments-down.md`](./payments-down.md); if it's slow-but-up, use [`degraded.md`](./degraded.md).

**Severity:** SEV-1 (outage).

---

## Decision checklist (first 5 minutes)

- [ ] Confirm scope: all domains or one? Reproduce from an external network.
- [ ] Assign incident owner + scribe (default owner: on-call Eng lead; scribe: Chris).
- [ ] Open: Sentry, BetterStack, Vercel (deploys + functions), Neon status, Inngest.
- [ ] **Most likely cause = last deploy.** Check the Vercel deploy timeline first.
- [ ] If a recent deploy correlates → **roll back now** (see [`v1-launch-runbook.md`](./v1-launch-runbook.md) → Rollback procedure). Don't debug forward during a SEV-1.
- [ ] Post the status-page update + internal note below within 10 minutes of detection.

---

## Status page update (public)

> **Major outage — investigating**
> Joe Perks is currently unavailable. We detected the issue at *[UTC timestamp]* and are working on it with top priority. Next update within 30 minutes.
> _Posted: [UTC timestamp]_

Follow-ups:

> **Update — mitigating**
> We've identified the likely cause and are *[rolling back the latest deploy / failing over]*. We'll confirm once service is restored.

> **Resolved**
> Service was fully restored at *[UTC timestamp]*. We're sorry for the disruption; a brief post-incident summary will follow.

---

## Pilot / customer note (email to active pilots once mitigating)

> Hi *[name]* — Joe Perks had an outage starting around *[time]*. We're *[rolling back / restoring]* now and expect service back shortly. No order data has been lost. I'll confirm the moment we're green. — *[you]*

(If data loss is *suspected*, do **not** claim "no data lost" — say "we're verifying data integrity now.")

---

## Internal note (team channel)

```
SEV-1 OUTAGE — [scope]
Owner: [name]  Scribe: [name]
Started: [UTC]  Detected: [UTC]
Suspected cause: [last deploy? infra? DB?]
Action: [rolling back deploy <id> / Neon support / ...]
Status page: [posted? link]
Next update: [UTC + 30m]
```

---

## Resolve

- [ ] Confirm all 5 domains green (BetterStack) and error rate normal (Sentry).
- [ ] Run the Phase B.1 smoke check (sign-in + one storefront load + test checkout) before declaring resolved.
- [ ] Post "Resolved" on the status page.
- [ ] File an incident note: `docs/runbooks/incidents/YYYY-MM-DD-<slug>.md` (timeline, cause, fix, follow-ups).
- [ ] If the rollback affected a pilot's trust, reach out personally (runbook "After any rollback").

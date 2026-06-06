# Incident comms — Degraded service

**Use when:** the app is up but slow, flaky, or one non-critical feature is broken (e.g. image uploads failing, dashboard slow, intermittent 5xx < 5% of requests). Checkout and payouts still work.

**Severity:** SEV-3 (degraded). If checkout or payments are affected, use [`payments-down.md`](./payments-down.md). If the whole app is down, use [`outage.md`](./outage.md).

---

## Decision checklist (first 5 minutes)

- [ ] Confirm scope: which domain(s)/feature(s)? (`joeperks.com`, `roasters.`, `orgs.`, `admin.`)
- [ ] Confirm checkout + payouts are unaffected (if affected → escalate to payments-down).
- [ ] Open: Sentry, BetterStack, Vercel deploy log, Inngest dashboard.
- [ ] Assign an incident owner (default: on-call Eng lead).
- [ ] Post the status-page update + internal note below.

---

## Status page update (public)

> **Investigating — degraded performance**
> We're aware that *[feature/area]* is currently *[slow / intermittently failing]*. Ordering and payments are unaffected. We're investigating and will post an update within 30 minutes.
> _Posted: [UTC timestamp]_

Follow-ups:

> **Update — identified**
> We've identified the cause (*[one line]*) and are working on a fix.

> **Resolved**
> *[Feature/area]* is back to normal as of *[UTC timestamp]*. Thanks for your patience.

---

## Pilot / customer note (email or DM, if a pilot is actively affected)

> Hi *[name]* — heads up that *[feature]* may be *[slow/erroring]* right now. Your orders and payouts are not affected. We're on it and I'll let you know the moment it's cleared. — *[you]*

---

## Internal note (team channel)

```
SEV-3 DEGRADED — [feature/area]
Owner: [name]
Started: [UTC]
Impact: [who/what; % of requests if known]
Checkout/payouts: UNAFFECTED
Status page: [posted? link]
Next update: [UTC + 30m]
```

---

## Resolve

- [ ] Confirm metrics back to baseline (BetterStack + Sentry error rate).
- [ ] Post "Resolved" on the status page.
- [ ] File an incident note: `docs/runbooks/incidents/YYYY-MM-DD-<slug>.md`.
- [ ] If a new failure class surfaced, add it to the pre-mortem risk list.

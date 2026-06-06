# Incident comms — Payments down

**Use when:** money movement is broken or untrustworthy — checkout failing, Stripe webhooks erroring/not arriving, Connect onboarding broken, payouts/transfers failing, or webhook signature failures. This is the highest-stakes class because it touches buyer charges and roaster/org money.

**Severity:** SEV-1 (payments). The whole rest of the app may be fine — that does not lower the severity.

> **First move when in doubt: freeze checkout.** It is always safer to stop taking money than to take money you can't correctly process or pay out.

---

## Decision checklist (first 5 minutes)

- [ ] **Freeze new checkouts:** set `FEATURE_CHECKOUT_ENABLED=false` in Vercel **production** env and redeploy/redeliver. `apps/web/app/api/checkout/create-intent/route.ts` returns 503 while frozen. (See [`v1-launch-runbook.md`](./v1-launch-runbook.md) → Rollback.)
- [ ] Open: Stripe Dashboard (Events, Payments, Connect, Webhooks), Sentry, Inngest (payout-release), BetterStack.
- [ ] Classify the failure:
  - Webhook signature failures > 0 → check `STRIPE_WEBHOOK_SECRET` matches the live endpoint.
  - Webhooks not arriving → check the Stripe webhook endpoint URL + recent delivery attempts.
  - Transfers/payouts failing → check Connect account status (`payouts_enabled`) + payout-release logs.
  - Charges failing → check Stripe status + the create-intent error in Sentry.
- [ ] Assign incident owner. Loop in Chris (business/Stripe account holder).
- [ ] Post the status-page update + internal note below.

> **Abort tie-in:** webhook signature failures > 0 in a 10-min window, or a roaster transfer failing/delayed > 10 min, are Phase B.4 abort criteria. During launch these mean **halt the launch**, not just patch.

---

## Status page update (public)

> **Checkout temporarily paused**
> We've paused new orders while we resolve a payments issue. Existing orders are safe and unaffected. We expect to reopen checkout shortly and will update here.
> _Posted: [UTC timestamp]_

Follow-ups:

> **Update**
> The payments issue has been identified (*[one line, no sensitive detail]*) and checkout will reopen once we've confirmed end-to-end.

> **Resolved**
> Checkout is back open as of *[UTC timestamp]*. All orders placed before the pause were processed normally.

---

## Buyer note (only if specific buyers were charged incorrectly)

> Hi *[name]* — we hit a payments issue and want to be upfront: *[what happened to their charge]*. *[What you're doing — e.g. "we've refunded the duplicate charge; it'll appear in 5–10 days."]* We're sorry for the worry. Reply here with any questions. — Joe Perks

## Roaster/org note (if a payout was delayed or reversed)

> Hi *[name]* — a payout for order *[orderNumber]* was *[delayed/failed]* due to a payments issue on our side, not yours. *[What you're doing + expected timing.]* I'll confirm once it's settled. — *[you]*

---

## Internal note (team channel)

```
SEV-1 PAYMENTS — [checkout / webhooks / payouts / connect]
Owner: [name]
Started: [UTC]
Checkout frozen: [YES @ UTC / no — why not]
Symptom: [signature failures / no delivery / transfer fail / charge fail]
Affected orders/roasters: [list orderNumbers / roasterIds if known]
Stripe ref: [event ids / payment intent ids]
Status page: [posted? link]
Next update: [UTC + 30m]
```

---

## Resolve

- [ ] Confirm root cause and that webhooks deliver 200 + transfers settle (Stripe dashboard).
- [ ] Run a single end-to-end test transaction (test card in live mode or a $5 charge + immediate refund) before reopening.
- [ ] Re-enable checkout: set `FEATURE_CHECKOUT_ENABLED` back to `true` (or remove it).
- [ ] **Reconcile:** confirm platform receipts match `platformAmount` sums and that no order was double-charged or paid out twice (runbook C.1).
- [ ] Post "Resolved" on the status page.
- [ ] File an incident note: `docs/runbooks/incidents/YYYY-MM-DD-<slug>.md`.
- [ ] Reach out personally to any buyer/roaster/org whose money was affected.

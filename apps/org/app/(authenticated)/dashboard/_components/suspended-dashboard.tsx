import { ReactivationRequestForm } from "./reactivation-request-form";

interface SuspendedDashboardProps {
  readonly chargesEnabled: boolean;
  readonly latestRequestDate: Date | null;
  readonly orgName: string;
  readonly payoutsEnabled: boolean;
  readonly reasonLabel: string;
  readonly status: string;
  readonly stripeOnboarding: string;
}

export function SuspendedDashboard({
  orgName,
  status,
  stripeOnboarding,
  chargesEnabled,
  payoutsEnabled,
  reasonLabel,
  latestRequestDate,
}: SuspendedDashboardProps) {
  return (
    <main className="mx-auto max-w-3xl p-6 md:p-8">
      <h1 className="font-semibold text-2xl">Account status</h1>
      <div className="mt-6 rounded-xl border border-amber-300 bg-amber-50 p-5">
        <p className="font-semibold text-amber-950 text-lg">
          Your organization account is suspended
        </p>
        <p className="mt-2 text-amber-950 text-sm">
          Reason category: <strong>{reasonLabel}</strong>
        </p>
        <p className="mt-3 text-amber-950 text-sm">
          Your public storefront is unavailable and new campaign activity is
          blocked while the account is under review. Existing confirmed orders
          still continue through fulfillment.
        </p>
        <p className="mt-2 text-amber-950 text-sm">
          Resolve the issue, then submit a reactivation request with the
          remediation details.
        </p>
      </div>

      <section className="mt-6 rounded-xl border p-5">
        <h2 className="font-semibold text-lg">Account snapshot</h2>
        <dl className="mt-4 grid gap-4 text-sm md:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Organization</dt>
            <dd className="font-medium">{orgName}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Status</dt>
            <dd className="font-medium">{status}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Stripe onboarding</dt>
            <dd className="font-medium">{stripeOnboarding}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Charges / payouts</dt>
            <dd className="font-medium">
              {chargesEnabled ? "charges on" : "charges off"} ·{" "}
              {payoutsEnabled ? "payouts on" : "payouts off"}
            </dd>
          </div>
        </dl>
      </section>

      <section className="mt-6 rounded-xl border p-5">
        <h2 className="font-semibold text-lg">Request reactivation</h2>
        <p className="mt-2 text-muted-foreground text-sm">
          Include what changed so the platform team can review faster.
        </p>
        <div className="mt-4">
          <ReactivationRequestForm />
        </div>
        {latestRequestDate ? (
          <p className="mt-4 text-muted-foreground text-sm">
            Latest request: {latestRequestDate.toLocaleString()}
          </p>
        ) : null}
      </section>
    </main>
  );
}

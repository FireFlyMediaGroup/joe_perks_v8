import {
  database,
  getSuspensionReasonCategoryFromAction,
  getSuspensionReasonLabel,
} from "@joe-perks/db";
import { auth } from "@repo/auth/server";

import { ReactivationRequestForm } from "./_components/reactivation-request-form";

export default async function RoasterDashboardPage() {
  const { userId } = await auth();
  const dbUser = userId
    ? await database.user.findUnique({
        where: { externalAuthId: userId },
        select: {
          email: true,
          role: true,
          roaster: {
            include: {
              application: {
                select: { businessName: true },
              },
            },
          },
          roasterId: true,
        },
      })
    : null;

  const roaster = dbUser?.roaster ?? null;

  const [latestSuspension, latestRequest] = roaster
    ? await Promise.all([
        database.adminActionLog.findFirst({
          orderBy: { createdAt: "desc" },
          where: {
            actionType: { in: ["ROASTER_AUTO_SUSPENDED", "ROASTER_SUSPENDED"] },
            targetId: roaster.id,
            targetType: "ROASTER",
          },
        }),
        database.adminActionLog.findFirst({
          orderBy: { createdAt: "desc" },
          where: {
            actionType: "ROASTER_REACTIVATION_REQUESTED",
            targetId: roaster.id,
            targetType: "ROASTER",
          },
        }),
      ])
    : [null, null];

  if (roaster?.status === "SUSPENDED") {
    const reasonLabel = latestSuspension
      ? getSuspensionReasonLabel(
          getSuspensionReasonCategoryFromAction(latestSuspension)
        )
      : "Account review";

    return (
      <main className="mx-auto max-w-3xl p-6">
        <h1 className="font-semibold text-2xl">Account status</h1>
        <div className="mt-6 rounded-xl border border-amber-300 bg-amber-50 p-5">
          <p className="font-semibold text-amber-950 text-lg">
            Your roaster account is suspended
          </p>
          <p className="mt-2 text-amber-950 text-sm">
            Reason category: <strong>{reasonLabel}</strong>
          </p>
          <p className="mt-3 text-amber-950 text-sm">
            New storefront orders, product changes, and shipping updates are
            blocked while this review is open. Existing confirmed orders should
            still be fulfilled.
          </p>
          <p className="mt-2 text-amber-950 text-sm">
            What to do next: resolve the issue, note what changed below, and
            request reactivation for manual review.
          </p>
        </div>

        <section className="mt-6 rounded-xl border p-5">
          <h2 className="font-semibold text-lg">Account snapshot</h2>
          <dl className="mt-4 grid gap-4 text-sm md:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Business</dt>
              <dd className="font-medium">
                {roaster.application.businessName || roaster.email}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Status</dt>
              <dd className="font-medium">{roaster.status}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Stripe onboarding</dt>
              <dd className="font-medium">{roaster.stripeOnboarding}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Charges / payouts</dt>
              <dd className="font-medium">
                {roaster.chargesEnabled ? "charges on" : "charges off"} ·{" "}
                {roaster.payoutsEnabled ? "payouts on" : "payouts off"}
              </dd>
            </div>
          </dl>
        </section>

        <section className="mt-6 rounded-xl border p-5">
          <h2 className="font-semibold text-lg">Request reactivation</h2>
          <p className="mt-2 text-muted-foreground text-sm">
            Include the remediation steps you completed so the platform team can
            review faster.
          </p>
          <div className="mt-4">
            <ReactivationRequestForm />
          </div>
          {latestRequest ? (
            <p className="mt-4 text-muted-foreground text-sm">
              Latest request: {latestRequest.createdAt.toLocaleString()}
            </p>
          ) : null}
        </section>
      </main>
    );
  }

  return (
    <div className="p-6">
      <h1 className="font-semibold text-2xl">Dashboard</h1>
      <p className="mt-2 text-muted-foreground">
        Order queue + metrics — portal queries must scope by{" "}
        <code className="font-mono text-xs">roaster_id</code> from the linked{" "}
        <code className="font-mono text-xs">User</code> row.
      </p>
      <dl className="mt-6 space-y-2 text-sm">
        <div>
          <dt className="text-muted-foreground">Linked roaster_id</dt>
          <dd className="font-mono">{dbUser?.roasterId ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Role</dt>
          <dd className="font-mono">{dbUser?.role ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">User email (DB)</dt>
          <dd className="font-mono">{dbUser?.email ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Account status</dt>
          <dd className="font-mono">{roaster?.status ?? "—"}</dd>
        </div>
      </dl>
    </div>
  );
}

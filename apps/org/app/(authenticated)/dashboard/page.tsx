import {
  database,
  getSuspensionReasonCategoryFromAction,
  getSuspensionReasonLabel,
} from "@joe-perks/db";
import { auth } from "@repo/auth/server";

import { ReactivationRequestForm } from "./_components/reactivation-request-form";

export default async function OrgDashboardPage() {
  const { userId } = await auth();
  const dbUser = userId
    ? await database.user.findUnique({
        where: { externalAuthId: userId },
        select: {
          email: true,
          org: {
            include: {
              application: {
                select: { orgName: true },
              },
            },
          },
          orgId: true,
          role: true,
        },
      })
    : null;

  const org = dbUser?.org ?? null;

  const [latestSuspension, latestRequest] = org
    ? await Promise.all([
        database.adminActionLog.findFirst({
          orderBy: { createdAt: "desc" },
          where: {
            actionType: "ORG_SUSPENDED",
            targetId: org.id,
            targetType: "ORG",
          },
        }),
        database.adminActionLog.findFirst({
          orderBy: { createdAt: "desc" },
          where: {
            actionType: "ORG_REACTIVATION_REQUESTED",
            targetId: org.id,
            targetType: "ORG",
          },
        }),
      ])
    : [null, null];

  if (org?.status === "SUSPENDED") {
    const reasonLabel = latestSuspension
      ? getSuspensionReasonLabel(
          getSuspensionReasonCategoryFromAction(latestSuspension)
        )
      : "Account review";

    return (
      <main className="mx-auto max-w-3xl p-8">
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
              <dd className="font-medium">{org.application.orgName || org.slug}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Status</dt>
              <dd className="font-medium">{org.status}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Stripe onboarding</dt>
              <dd className="font-medium">{org.stripeOnboarding}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Charges / payouts</dt>
              <dd className="font-medium">
                {org.chargesEnabled ? "charges on" : "charges off"} ·{" "}
                {org.payoutsEnabled ? "payouts on" : "payouts off"}
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
    <main className="mx-auto max-w-prose p-8">
      <h1 className="font-semibold text-2xl">Org dashboard</h1>
      <p className="mt-2 text-muted-foreground">
        Campaign overview — queries use tenant scope from the verified session
        (`org_id` from the linked `User` row).
      </p>
      <dl className="mt-6 space-y-2 text-sm">
        <div>
          <dt className="text-muted-foreground">Linked org_id</dt>
          <dd className="font-mono">{dbUser?.orgId ?? "—"}</dd>
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
          <dd className="font-mono">{org?.status ?? "—"}</dd>
        </div>
      </dl>
    </main>
  );
}

import { Separator } from "@repo/design-system/components/ui/separator";

import { NoRoasterProfile } from "../products/_components/no-roaster-profile";
import { requireRoasterId } from "../products/_lib/require-roaster";
import { OrderQueueDashboard } from "./_components/order-queue-dashboard";
import { ReactivationRequestForm } from "./_components/reactivation-request-form";
import { parseOrderQueueView } from "./_lib/order-queue";
import { getRoasterDashboardData } from "./_lib/queries";

interface DashboardPageProperties {
  readonly searchParams: Promise<{
    readonly view?: string;
  }>;
}

export default async function RoasterDashboardPage({
  searchParams,
}: DashboardPageProperties) {
  const session = await requireRoasterId();
  if (!session.ok) {
    if (session.error === "unauthorized") {
      return null;
    }

    return <NoRoasterProfile />;
  }

  const { view: rawView } = await searchParams;
  const view = parseOrderQueueView(rawView);
  const data = await getRoasterDashboardData(session.roasterId, view);

  return (
    <>
      <OrderQueueDashboard
        account={data.account}
        counts={data.counts}
        orders={data.orders}
        view={view}
      />
      {data.account.status === "SUSPENDED" ? (
        <section className="px-6 pb-6">
          <div className="rounded-2xl border bg-card p-5">
            <h2 className="font-semibold text-lg">Request reactivation</h2>
            <p className="mt-2 text-muted-foreground text-sm">
              Include the remediation steps you completed so the platform team can
              review faster.
            </p>
            <Separator className="my-4" />
            <ReactivationRequestForm />
          </div>
        </section>
      ) : null}
    </>
  );
}

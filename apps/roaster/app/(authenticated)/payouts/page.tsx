import { NoRoasterProfile } from "../products/_components/no-roaster-profile";
import { requireRoasterId } from "../products/_lib/require-roaster";
import { PayoutsDashboard } from "./_components/payouts-dashboard";
import { getRoasterPayoutsPageData } from "./_lib/queries";

export default async function PayoutsPage() {
  const session = await requireRoasterId();
  if (!session.ok) {
    if (session.error === "unauthorized") {
      return null;
    }

    return <NoRoasterProfile title="Payouts" />;
  }

  const data = await getRoasterPayoutsPageData(session.roasterId);

  return <PayoutsDashboard data={data} />;
}

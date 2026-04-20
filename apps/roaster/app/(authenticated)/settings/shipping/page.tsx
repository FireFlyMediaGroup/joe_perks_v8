import { database } from "@joe-perks/db";

import { NoRoasterProfile } from "../../products/_components/no-roaster-profile";
import { requireRoasterId } from "../../products/_lib/require-roaster";
import { RateList } from "./_components/rate-list";
import { ShippingGuide } from "./_components/shipping-guide";

export default async function ShippingSettingsPage() {
  const session = await requireRoasterId();
  if (!session.ok) {
    if (session.error === "unauthorized") {
      return null;
    }
    return <NoRoasterProfile title="Shipping settings" />;
  }

  const rates = await database.roasterShippingRate.findMany({
    where: { roasterId: session.roasterId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    select: {
      id: true,
      label: true,
      carrier: true,
      flatRate: true,
      isDefault: true,
    },
  });

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="font-semibold text-2xl">Shipping settings</h1>
        <p className="mt-1 text-muted-foreground text-sm">
          Configure flat-rate shipping options. Shipping is passed through to
          your account at checkout and is not included in fundraiser split
          calculations.
        </p>
      </div>
      <ShippingGuide />
      <RateList
        rates={rates.map((r) => ({
          id: r.id,
          label: r.label,
          carrier: r.carrier,
          flatRate: r.flatRate,
          isDefault: r.isDefault,
        }))}
      />
    </div>
  );
}
